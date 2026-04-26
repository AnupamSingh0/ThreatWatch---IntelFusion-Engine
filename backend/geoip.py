import httpx

async def get_geo(ip: str):
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            res = await client.get(f"http://ip-api.com/json/{ip}")
            data = res.json()

            if data["status"] != "success":
                return None

            return {
                "lat": data["lat"],
                "lon": data["lon"],
                "country": data["country"]
            }
    except:
        return None