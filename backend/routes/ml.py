from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database import get_db
from ratelimit import limiter
from ml.anomaly import predict, get_anomalies, train_model
import models

router = APIRouter(prefix="/ml", tags=["ML"])

def _events(db):
    return [{"ip":r.ip_address,"score":r.abuse_score,"reports":r.total_reports,"country":r.country}
            for r in db.query(models.ThreatEvent).all()]

@router.get("/anomalies")
@limiter.limit("30/minute")
def list_anomalies(request: Request, db: Session=Depends(get_db)):
    events = _events(db)
    results = get_anomalies(events, top_n=25)
    return {"total_events": len(events), "anomalies_found": len(results), "anomalies": results}

@router.post("/train")
def train(request: Request, db: Session=Depends(get_db)):
    events = _events(db)
    if not train_model(events):
        raise HTTPException(status_code=400, detail=f"Need more data. Got {len(events)} events.")
    return {"message": f"Model trained on {len(events)} events."}

@router.get("/predict/{ip}")
@limiter.limit("20/minute")
def predict_single(ip: str, request: Request, db: Session=Depends(get_db)):
    e = db.query(models.ThreatEvent).filter(models.ThreatEvent.ip_address==ip).first()
    if not e: raise HTTPException(status_code=404, detail="IP not in database.")
    return {"ip": ip, "score": e.abuse_score, "reports": e.total_reports,
            **predict(e.abuse_score, e.total_reports)}
