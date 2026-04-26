import asyncio, os, re
from typing import Optional
import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database import get_db
from cache import cache
from ratelimit import limiter
import models

router = APIRouter(prefix="/correlate", tags=["Correlation"])
AbuseIPDB_KEY = os.getenv("ABUSEIPDB_API_KEY", "")
VIRUSTOTAL_KEY = os.getenv("VIRUSTOTAL_API_KEY", "")
OTX_KEY        = os.getenv("OTX_API_KEY", "")

async def _vt_resolutions(ip):
    if not VIRUSTOTAL_KEY: return []
    async with httpx.AsyncClient(timeout=10) as c:
        r = await c.get(f"https://www.virustotal.com/api/v3/ip_addresses/{ip}/resolutions",
            params={"limit":10}, headers={"x-apikey": VIRUSTOTAL_KEY})
    if r.status_code != 200: return []
    return [{"hostname": i["attributes"].get("host_name",""),
             "last_resolved": i["attributes"].get("date","")}
            for i in r.json().get("data",[])]

async def _vt_files(ip):
    if not VIRUSTOTAL_KEY: return []
    async with httpx.AsyncClient(timeout=10) as c:
        r = await c.get(f"https://www.virustotal.com/api/v3/ip_addresses/{ip}/communicating_files",
            params={"limit":5}, headers={"x-apikey": VIRUSTOTAL_KEY})
    if r.status_code != 200: return []
    return [{"sha256": i["attributes"].get("sha256",""),
             "name": i["attributes"].get("meaningful_name","Unknown"),
             "malicious": i["attributes"].get("last_analysis_stats",{}).get("malicious",0),
             "type": i["attributes"].get("type_description","")}
            for i in r.json().get("data",[])]

async def _otx_indicators(ip):
    if not OTX_KEY: return []
    async with httpx.AsyncClient(timeout=10) as c:
        r = await c.get(f"https://otx.alienvault.com/api/v1/indicators/IPv4/{ip}/general",
            headers={"X-OTX-API-KEY": OTX_KEY})
    if r.status_code != 200: return []
    return [{"id": p.get("id",""), "name": p.get("name",""),
             "author": p.get("author_name",""), "tags": p.get("tags",[])}
            for p in r.json().get("pulse_info",{}).get("pulses",[])[:10]]

def _related_ips(ip, db):
    src = db.query(models.ThreatEvent).filter(models.ThreatEvent.ip_address==ip).first()
    if not src or not src.isp: return []
    return [{"ip":r.ip_address,"score":r.abuse_score,"country":r.country,"reports":r.total_reports}
            for r in db.query(models.ThreatEvent).filter(
                models.ThreatEvent.isp==src.isp,
                models.ThreatEvent.ip_address!=ip)
            .order_by(models.ThreatEvent.abuse_score.desc()).limit(8).all()]

@router.get("/{ip}")
@limiter.limit("10/minute")
async def correlate_ip(ip: str, request: Request, db: Session=Depends(get_db)):
    if not re.match(r"^(\d{1,3}\.){3}\d{1,3}$", ip):
        raise HTTPException(status_code=400, detail="Invalid IP.")
    cached = cache.get(f"correlate:{ip}")
    if cached: return {**cached, "cached": True}
    resolutions, mal_files, otx = await asyncio.gather(
        _vt_resolutions(ip), _vt_files(ip), _otx_indicators(ip))
    related = _related_ips(ip, db)
    summary = []
    if mal_files: summary.append(f"{len(mal_files)} malware sample(s) linked")
    if otx:       summary.append(f"referenced in {len(otx)} OTX pulse(s)")
    if related:   summary.append(f"{len(related)} co-infrastructure IP(s)")
    result = {"ip": ip, "summary": summary or ["No additional context found"],
              "dns_resolutions": resolutions, "malware_files": mal_files,
              "otx_pulses": otx, "related_ips": related, "cached": False}
    cache.set(f"correlate:{ip}", result, ttl=600)
    return result
