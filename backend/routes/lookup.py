import asyncio, os, re
from typing import Optional
import httpx
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from ratelimit import limiter

router = APIRouter(prefix="/lookup", tags=["IP Lookup"])
ABUSEIPDB_KEY  = os.getenv("ABUSEIPDB_API_KEY", "")
VIRUSTOTAL_KEY = os.getenv("VIRUSTOTAL_API_KEY", "")

def is_valid_ip(ip):
    if not re.match(r"^(\d{1,3}\.){3}\d{1,3}$", ip): return False
    return all(0 <= int(p) <= 255 for p in ip.split("."))

async def query_abuseipdb(ip):
    if not ABUSEIPDB_KEY: return None
    async with httpx.AsyncClient(timeout=10) as c:
        r = await c.get("https://api.abuseipdb.com/api/v2/check",
            params={"ipAddress": ip, "maxAgeInDays": 90},
            headers={"Key": ABUSEIPDB_KEY, "Accept": "application/json"})
    if r.status_code != 200: return {"error": f"AbuseIPDB {r.status_code}"}
    return r.json().get("data", {})

async def query_virustotal(ip):
    if not VIRUSTOTAL_KEY: return None
    async with httpx.AsyncClient(timeout=10) as c:
        r = await c.get(f"https://www.virustotal.com/api/v3/ip_addresses/{ip}",
            headers={"x-apikey": VIRUSTOTAL_KEY})
    if r.status_code != 200: return {"error": f"VirusTotal {r.status_code}"}
    return r.json().get("data", {}).get("attributes", {})

class LookupResponse(BaseModel):
    ip: str
    abuseipdb: Optional[dict] = None
    virustotal: Optional[dict] = None

@router.get("/{ip}", response_model=LookupResponse)
@limiter.limit("30/minute")
async def lookup_ip(ip: str, request: Request):
    if not is_valid_ip(ip):
        raise HTTPException(status_code=400, detail=f"Invalid IP: {ip}")
    abuse, vt = await asyncio.gather(query_abuseipdb(ip), query_virustotal(ip))
    return LookupResponse(ip=ip, abuseipdb=abuse, virustotal=vt)
