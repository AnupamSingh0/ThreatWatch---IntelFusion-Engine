from fastapi import APIRouter
import random
from geoip import get_geo

router = APIRouter(prefix="/attacks", tags=["Attacks"])

# TEMP: simulate destination IPs
DEST_IPS = [
    "8.8.8.8",
    "1.1.1.1",
    "142.250.183.14"
]

# TEMP: sample malicious IPs
SOURCE_IPS = [
    "185.220.101.45",
    "45.155.205.233",
    "91.92.248.140",
    "198.51.100.96"
]

@router.get("/live")
async def live_attacks():
    events = []

    for _ in range(5):
        src_ip = random.choice(SOURCE_IPS)
        dst_ip = random.choice(DEST_IPS)

        src_geo = await get_geo(src_ip)
        dst_geo = await get_geo(dst_ip)

        if not src_geo or not dst_geo:
            continue

        events.append({
            "src_ip": src_ip,
            "dst_ip": dst_ip,
            "src_lat": src_geo["lat"],
            "src_lon": src_geo["lon"],
            "dst_lat": dst_geo["lat"],
            "dst_lon": dst_geo["lon"],
            "src_country": src_geo["country"],
            "dst_country": dst_geo["country"],
            "score": random.randint(60, 100)
        })

    return events