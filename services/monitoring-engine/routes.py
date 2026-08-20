from fastapi import APIRouter
from sqlalchemy import select
from scheduler import scan_all_cases
from database import SessionLocal
from models import Alert
import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'shared_schemas'))
from audit_client import log_action
from config import TRUST_SERVICE_URL

router = APIRouter()


@router.post("/api/v1/alerts/config")
def alerts_config(payload: dict):
    return {"success": True, "data": payload, "error": None}


@router.get("/api/v1/alerts/pending")
def alerts_pending():
    with SessionLocal() as session:
        rows = session.scalars(select(Alert).where(Alert.is_acknowledged == False)).all()
        data = [{"case_id": r.case_id, "triggered_at": r.triggered_at.isoformat() + "Z",
                  "reason": r.reason, "is_acknowledged": r.is_acknowledged} for r in rows]
    return {"success": True, "data": data, "error": None}


@router.get("/api/v1/alerts/scan")
def trigger_scan():
    new_alerts = scan_all_cases("legalaid@example.org")
    for alert in new_alerts:
        log_action(TRUST_SERVICE_URL, alert["case_id"], "system", "system",
                   "alert_sent", alert)
    return {"success": True, "data": {"new_alerts": len(new_alerts)}, "error": None}