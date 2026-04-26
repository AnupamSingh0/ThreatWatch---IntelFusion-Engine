import os, logging, pickle
from pathlib import Path
import numpy as np

logger = logging.getLogger(__name__)
MODEL_PATH  = Path("ml/anomaly_model.pkl")
MIN_SAMPLES = int(os.getenv("ML_MIN_SAMPLES", "50"))
_model = None
_scaler = None

def _feat(score, reports):
    return [float(score), float(np.log1p(reports))]

def train_model(events):
    global _model, _scaler
    if len(events) < MIN_SAMPLES: return False
    from sklearn.ensemble import IsolationForest
    from sklearn.preprocessing import StandardScaler
    X = np.array([_feat(e["score"], e.get("reports",0)) for e in events])
    scaler = StandardScaler()
    X_s = scaler.fit_transform(X)
    model = IsolationForest(n_estimators=100, contamination=0.05, random_state=42, n_jobs=-1)
    model.fit(X_s)
    _model = model; _scaler = scaler
    MODEL_PATH.parent.mkdir(exist_ok=True)
    with open(MODEL_PATH,"wb") as f: pickle.dump({"model":model,"scaler":scaler},f)
    logger.info(f"[ML] Trained on {len(events)} samples")
    return True

def load_model():
    global _model, _scaler
    if not MODEL_PATH.exists(): return False
    try:
        with open(MODEL_PATH,"rb") as f: s = pickle.load(f)
        _model = s["model"]; _scaler = s["scaler"]; return True
    except: return False

def predict(score, reports):
    if _model is None: load_model()
    if _model is None: return {"anomaly":None,"anomaly_score":None,"confidence":"model_not_ready"}
    X = np.array([_feat(score, reports)])
    X_s = _scaler.transform(X)
    pred = _model.predict(X_s)[0]
    ascore = float(_model.score_samples(X_s)[0])
    is_anom = pred == -1
    conf = "high" if ascore < -0.15 else "medium" if ascore < -0.05 else "low"
    return {"anomaly": is_anom, "anomaly_score": round(ascore,4),
            "confidence": conf if is_anom else "not_anomalous"}

def get_anomalies(events, top_n=20):
    if _model is None: load_model()
    if _model is None or not events: return []
    results = []
    for e in events:
        r = {**e, **predict(e["score"], e.get("reports",0))}
        if r["anomaly"]: results.append(r)
    results.sort(key=lambda x: x.get("anomaly_score",0))
    return results[:top_n]
