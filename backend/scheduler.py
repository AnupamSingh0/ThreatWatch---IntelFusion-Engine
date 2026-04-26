from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
import logging

# Import your feed refresh function
from routes.feed import refresh_threat_feed

logging.basicConfig(level=logging.INFO)

def create_scheduler():
    scheduler = BackgroundScheduler()

    # Run every 10 minutes
    scheduler.add_job(
        refresh_threat_feed,
        trigger=IntervalTrigger(hours=6),  # every 6 hour
        id="refresh_threat_feed",
        name="Refresh Threat Feed",
        replace_existing=True,
        coalesce=True,
        max_instances=1,
    )

    logging.info("✅ Scheduler configured (Threat Feed every 10 min)")

    return scheduler