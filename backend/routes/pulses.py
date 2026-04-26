import json, os
from datetime import datetime
from typing import Optional
import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from database import get_db, SessionLocal
import models

router = APIRouter(prefix="/pulses", tags=["OTX Pulses"])
OTX_KEY = os.getenv("OTX_API_KEY", "")

async def refresh_otx_pulses():
    if not OTX_KEY: return
    async with httpx.AsyncClient(timeout=20) as c:
        r = await c.get("https://otx.alienvault.com/api/v1/pulses/subscribed",
            params={"limit": 20}, headers={"X-OTX-API-KEY": OTX_KEY})
    if r.status_code != 200: return
    db = SessionLocal()
    try:
        for p in r.json().get("results", []):
            ex = db.query(models.OTXPulse).filter(models.OTXPulse.pulse_id == p["id"]).first()
            pub = None
            try: pub = datetime.fromisoformat(p.get("created","").replace("Z","+00:00"))
            except: pass
            if ex:
                ex.indicator_count = p.get("indicators_count", 0)
                ex.fetched_at = datetime.utcnow()
            else:
                db.add(models.OTXPulse(pulse_id=p["id"], name=p.get("name",""),
                    description=p.get("description",""), author=p.get("author_name",""),
                    tlp=p.get("tlp","white"), tags=json.dumps(p.get("tags",[])),
                    indicator_count=p.get("indicators_count",0),
                    malware_families=json.dumps(p.get("malware_families",[])),
                    published_at=pub))
        db.commit()
    finally: db.close()

@router.get("/")
def list_pulses(request: Request, limit: int=Query(20,ge=1,le=100),
    offset: int=Query(0,ge=0), search: Optional[str]=Query(None),
    db: Session=Depends(get_db)):
    q = db.query(models.OTXPulse)
    if search: q = q.filter(models.OTXPulse.name.ilike(f"%{search}%"))
    total = q.count()
    pulses = q.order_by(models.OTXPulse.fetched_at.desc()).offset(offset).limit(limit).all()
    return {"total": total, "pulses": [
        {"id": p.pulse_id, "name": p.name, "description": p.description,
         "author": p.author, "tlp": p.tlp,
         "tags": json.loads(p.tags) if p.tags else [],
         "indicator_count": p.indicator_count,
         "malware_families": json.loads(p.malware_families) if p.malware_families else [],
         "published_at": p.published_at.isoformat() if p.published_at else None}
        for p in pulses]}

@router.post("/refresh")
async def manual_refresh():
    await refresh_otx_pulses()
    return {"message": "OTX pulses refreshed."}

@router.get("/indicators/{pulse_id}")
async def get_indicators(pulse_id: str):
    if not OTX_KEY:
        raise HTTPException(status_code=503, detail="OTX key not configured.")
    async with httpx.AsyncClient(timeout=15) as c:
        r = await c.get(f"https://otx.alienvault.com/api/v1/pulses/{pulse_id}/indicators",
            headers={"X-OTX-API-KEY": OTX_KEY})
    if r.status_code == 404: raise HTTPException(status_code=404, detail="Pulse not found.")
    if r.status_code != 200: raise HTTPException(status_code=502, detail=f"OTX error {r.status_code}")
    return r.json()
