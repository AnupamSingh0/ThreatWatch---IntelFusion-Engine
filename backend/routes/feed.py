import asyncio, json, os
from datetime import datetime
from typing import Optional
import httpx
from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from database import get_db, SessionLocal
from cache import cache
from ratelimit import limiter
from alerts import check_and_alert
import models

router = APIRouter(prefix="/feed", tags=["Threat Feed"])
ABUSEIPDB_KEY = os.getenv("ABUSEIPDB_API_KEY", "")

async def refresh_threat_feed():
    print("[Feed] Refresh started")

    db = SessionLocal()

    try:
        # -----------------------------
        # 1. TRY ABUSEIPDB
        # -----------------------------
        if ABUSEIPDB_KEY:
            try:
                async with httpx.AsyncClient(timeout=20) as c:
                    r = await c.get(
                        "https://api.abuseipdb.com/api/v2/blacklist",
                        params={"confidenceMinimum": 90, "limit": 100},
                        headers={"Key": ABUSEIPDB_KEY, "Accept": "application/json"}
                    )

                if r.status_code == 200:
                    data = r.json().get("data", [])
                    print(f"[Feed] AbuseIPDB OK: {len(data)} records")

                    for item in data:
                        ip = item.get("ipAddress")
                        score = item.get("abuseConfidenceScore", 0)

                        existing = db.query(models.ThreatEvent).filter(
                            models.ThreatEvent.ip_address == ip
                        ).first()

                        if existing:
                            existing.abuse_score = score
                            existing.total_reports = item.get("totalReports", 0)
                            existing.fetched_at = datetime.utcnow()
                        else:
                            db.add(models.ThreatEvent(
                                ip_address=ip,
                                abuse_score=score,
                                country=item.get("countryCode"),
                                isp=item.get("isp"),
                                usage_type=item.get("usageType"),
                                total_reports=item.get("totalReports", 0),
                                last_reported=item.get("lastReportedAt")
                            ))

                    db.commit()
                    cache.flush_pattern("feed:*")
                    print("[Feed] DB updated from AbuseIPDB")
                    return

                elif r.status_code == 429:
                    print("[Feed] ⚠ AbuseIPDB rate limited — switching to fallback")

                else:
                    print(f"[Feed] ❌ AbuseIPDB error: {r.status_code}")

            except Exception as e:
                print(f"[Feed] ❌ AbuseIPDB failed: {e}")

        # -----------------------------
        # 2. FALLBACK → OTX
        # -----------------------------
        print("[Feed] Trying OTX fallback...")

        try:
            async with httpx.AsyncClient(timeout=20) as c:
                r = await c.get("https://otx.alienvault.com/api/v1/pulses/subscribed")

            if r.status_code == 200:
                pulses = r.json().get("results", [])
                print(f"[Feed] OTX OK: {len(pulses)} pulses")

                for pulse in pulses[:50]:
                    for ind in pulse.get("indicators", []):
                        if ind.get("type") == "IPv4":
                            ip = ind.get("indicator")

                            db.add(models.ThreatEvent(
                                ip_address=ip,
                                abuse_score=75,  # fallback score
                                country="??",
                                isp="OTX",
                                usage_type="threat-intel",
                                total_reports=1,
                                last_reported=datetime.utcnow()
                            ))

                db.commit()
                cache.flush_pattern("feed:*")
                print("[Feed] DB updated from OTX")
                return

        except Exception as e:
            print(f"[Feed] ❌ OTX failed: {e}")

        # -----------------------------
        # 3. LAST RESORT → SYNTHETIC DATA
        # -----------------------------
        print("[Feed] ⚠ Using synthetic fallback data")

        sample_ips = [
            "185.94.111.1", "45.148.10.183", "60.212.0.13",
            "138.197.138.15", "80.94.92.166"
        ]

        for ip in sample_ips:
            db.add(models.ThreatEvent(
                ip_address=ip,
                abuse_score=90,
                country="??",
                isp="Synthetic",
                usage_type="fallback",
                total_reports=1,
                last_reported=datetime.utcnow()
            ))

        db.commit()
        cache.flush_pattern("feed:*")

    except Exception as e:
        print(f"[Feed] ❌ Critical failure: {e}")
        db.rollback()

    finally:
        db.close()
        

@router.get("/threats")
@limiter.limit("60/minute")
def get_threats(request: Request, limit: int=Query(50,ge=1,le=200),
    offset: int=Query(0,ge=0), country: Optional[str]=Query(None),
    min_score: int=Query(0,ge=0,le=100), db: Session=Depends(get_db)):
    key = f"feed:threats:{limit}:{offset}:{country}:{min_score}"
    cached = cache.get(key)
    if cached: return {**cached, "from_cache": True}
    q = db.query(models.ThreatEvent).filter(models.ThreatEvent.abuse_score >= min_score)
    if country: q = q.filter(models.ThreatEvent.country == country.upper())
    total = q.count()
    events = q.order_by(models.ThreatEvent.abuse_score.desc()).offset(offset).limit(limit).all()
    result = {"total": total, "offset": offset, "limit": limit, "from_cache": False,
        "events": [{"ip": e.ip_address, "score": e.abuse_score, "country": e.country,
            "isp": e.isp, "usage_type": e.usage_type, "reports": e.total_reports,
            "last_reported": e.last_reported, "fetched_at": e.fetched_at.isoformat()}
            for e in events]}
    cache.set(key, result, ttl=120)
    return result

@router.get("/stream")
async def stream_threats():
    async def gen():
        db = SessionLocal(); last_id = 0
        try:
            while True:
                evts = db.query(models.ThreatEvent).filter(
                    models.ThreatEvent.id > last_id).order_by(
                    models.ThreatEvent.id.asc()).limit(10).all()
                for e in evts:
                    last_id = e.id
                    yield f"data: {json.dumps({'ip':e.ip_address,'score':e.abuse_score,'country':e.country,'reports':e.total_reports})}\n\n"
                await asyncio.sleep(5)
        except asyncio.CancelledError: pass
        finally: db.close()
    return StreamingResponse(gen(), media_type="text/event-stream",
        headers={"Cache-Control":"no-cache","X-Accel-Buffering":"no"})

@router.get("/refresh")
async def manual_refresh():
    await refresh_threat_feed()
    return {"status": "refreshed"}
