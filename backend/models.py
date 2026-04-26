from sqlalchemy import Column, Integer, String, DateTime, Text
from datetime import datetime
from database import Base

class ThreatEvent(Base):
    __tablename__ = "threat_events"
    id            = Column(Integer, primary_key=True, index=True)
    ip_address    = Column(String, index=True, nullable=False)
    abuse_score   = Column(Integer, nullable=False)
    country       = Column(String(10), nullable=True)
    isp           = Column(String, nullable=True)
    usage_type    = Column(String, nullable=True)
    total_reports = Column(Integer, default=0)
    last_reported = Column(String, nullable=True)
    fetched_at    = Column(DateTime, default=datetime.utcnow)

class OTXPulse(Base):
    __tablename__ = "otx_pulses"
    id               = Column(Integer, primary_key=True, index=True)
    pulse_id         = Column(String, unique=True, index=True)
    name             = Column(String, nullable=False)
    description      = Column(Text, nullable=True)
    author           = Column(String, nullable=True)
    tlp              = Column(String, default="white")
    tags             = Column(Text, nullable=True)
    indicator_count  = Column(Integer, default=0)
    malware_families = Column(Text, nullable=True)
    published_at     = Column(DateTime, nullable=True)
    fetched_at       = Column(DateTime, default=datetime.utcnow)
