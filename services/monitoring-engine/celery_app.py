"""
Automatic scheduled scanning, replacing the on-demand-only /alerts/scan.
Runs scan_all_cases() every 5 minutes via Celery beat, using the same
Redis instance already provisioned in docker-compose.yml.
Start with:
    celery -A celery_app worker --beat --loglevel=info
"""
import os
from celery import Celery
from celery.schedules import timedelta
from scheduler import scan_all_cases
from config import TRUST_SERVICE_URL

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
ALERT_RECIPIENT_EMAIL = os.getenv("ALERT_RECIPIENT_EMAIL", "legalaid@example.org")

celery_app = Celery("monitoring-engine", broker=REDIS_URL, backend=REDIS_URL)
celery_app.conf.beat_schedule = {
    "scan-cases-every-5-minutes": {
        "task": "celery_app.run_scheduled_scan",
        "schedule": timedelta(minutes=5),
    },
}


@celery_app.task(name="celery_app.run_scheduled_scan")
def run_scheduled_scan():
    import sys, os as _os
    sys.path.append(_os.path.join(_os.path.dirname(__file__), "..", "..", "shared_schemas"))
    from audit_client import log_action
    new_alerts = scan_all_cases(ALERT_RECIPIENT_EMAIL)
    for alert in new_alerts:
        log_action(TRUST_SERVICE_URL, alert["case_id"], "system", "system",
                   "alert_sent", alert)
    return {"new_alerts": len(new_alerts)}