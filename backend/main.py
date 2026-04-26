from contextlib import asynccontextmanager
import asyncio

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from dotenv import load_dotenv

from database import engine, Base
from scheduler import create_scheduler
from ratelimit import limiter

from routes.lookup import router as lookup_router
from routes.feed import router as feed_router, refresh_threat_feed
from routes.pulses import router as pulses_router
from routes.correlate import router as correlate_router
from routes.ml import router as ml_router

# ⚠️ REMOVE this if you deleted attacks route
# from routes.attacks import router as attacks_router

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create DB tables
    Base.metadata.create_all(bind=engine)
    print("✅ Database ready")

    # Load ML model
    from ml.anomaly import load_model
    load_model()
    print("✅ ML model loaded")

    # Start scheduler
    scheduler = create_scheduler()
    scheduler.start()
    print("✅ Scheduler started")

    yield

    scheduler.shutdown()
    print("🛑 Scheduler stopped")


app = FastAPI(
    title="ThreatWatch API",
    version="2.0.0",
    lifespan=lifespan
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(lookup_router)
app.include_router(feed_router)
app.include_router(pulses_router)
app.include_router(correlate_router)
app.include_router(ml_router)

# ❌ ONLY include if file exists
# app.include_router(attacks_router)

@app.get("/")
def root():
    return {
        "status": "ok",
        "message": "ThreatWatch API v2.0 🛡",
        "docs": "/docs"
    }