import os, logging
from datetime import datetime
from cache import cache

logger = logging.getLogger(__name__)
TELEGRAM_TOKEN   = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")
ALERT_THRESHOLD  = int(os.getenv("ALERT_SCORE_THRESHOLD", "90"))
_telegram_enabled = bool(TELEGRAM_TOKEN and TELEGRAM_CHAT_ID)

async def _send_telegram(message: str) -> bool:
    if not _telegram_enabled:
        return False
    try:
        import httpx
        async with httpx.AsyncClient(timeout=8) as client:
            resp = await client.post(
                f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage",
                json={"chat_id": TELEGRAM_CHAT_ID, "text": message, "parse_mode": "HTML"},
            )
        return resp.status_code == 200
    except Exception as e:
        logger.warning(f"[Alerts] Telegram failed: {e}")
        return False

async def check_and_alert(ip, score, country, isp, reports):
    if score < ALERT_THRESHOLD:
        return
    dedup_key = f"alert_sent:{ip}"
    if cache.exists(dedup_key):
        return
    cache.set(dedup_key, True, ttl=3600)
    label = "🔴 CRITICAL" if score >= 95 else "🟠 HIGH RISK"
    ts = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    msg = (f"<b>⚠ ThreatWatch — {label}</b>\n\n"
           f"<b>IP:</b> <code>{ip}</code>\n"
           f"<b>Score:</b> {score}/100\n"
           f"<b>Country:</b> {country or 'Unknown'}\n"
           f"<b>ISP:</b> {isp or 'Unknown'}\n"
           f"<b>Reports:</b> {reports:,}\n"
           f"<b>Time:</b> {ts}\n\n"
           f"🔗 https://www.abuseipdb.com/check/{ip}")
    await _send_telegram(msg)
