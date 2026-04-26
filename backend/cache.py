import json, os, time
from typing import Any, Optional
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
_redis_client = None
try:
    import redis as redis_lib
    _r = redis_lib.from_url(REDIS_URL, decode_responses=True, socket_connect_timeout=2)
    _r.ping()
    _redis_client = _r
    print("✅ Redis connected")
except Exception as e:
    print(f"⚠  Redis unavailable ({e}) — using in-memory cache")

_mem: dict = {}

class Cache:
    def get(self, key):
        if _redis_client:
            raw = _redis_client.get(key)
            return json.loads(raw) if raw else None
        entry = _mem.get(key)
        if entry and time.time() < entry[1]:
            return entry[0]
        return None
    def set(self, key, value, ttl=300):
        s = json.dumps(value, default=str)
        if _redis_client:
            _redis_client.setex(key, ttl, s)
        else:
            _mem[key] = (value, time.time() + ttl)
    def delete(self, key):
        if _redis_client: _redis_client.delete(key)
        elif key in _mem: del _mem[key]
    def exists(self, key):
        return self.get(key) is not None
    def flush_pattern(self, pattern):
        if _redis_client:
            keys = _redis_client.keys(pattern)
            if keys: return _redis_client.delete(*keys)
        return 0

cache = Cache()
