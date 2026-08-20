import uuid
import requests
from datetime import datetime
from config import ELIGIBILITY_SERVICE_URL
from notify import send_email_notification
from database import SessionLocal
from models import Alert
from sqlalchemy import select


def scan_all_cases(recipient_email: str) -> list[dict]:
    new_alerts = []
    try:
        resp = requests.get(f"{ELIGIBILITY_SERVICE_URL}/api/v1/eligibility/cases", timeout=5)
        all_cases = resp.json().get("data", [])
        case_ids = [c["case_id"] for c in all_cases]
    except Exception:
        return new_alerts

    with SessionLocal() as session:
        for case_id in case_ids:
            try:
                resp = requests.post(f"{ELIGIBILITY_SERVICE_URL}/api/v1/eligibility/check",
                                      json={"case_id": case_id}, timeout=5)
                result = resp.json()["data"]
            except Exception:
                continue
            if result["eligibility_status"] in ("eligible_now", "eligible_first_time_offender_rule"):
                already_flagged = session.scalar(select(Alert).where(Alert.case_id == case_id))
                if already_flagged is None:
                    reason = f"eligibility_status changed to {result['eligibility_status']}"
                    alert_row = Alert(
                        alert_id=str(uuid.uuid4()), case_id=case_id,
                        triggered_at=datetime.utcnow(), reason=reason, is_acknowledged=False,
                    )
                    session.add(alert_row)
                    session.commit()
                    alert = {"case_id": case_id, "triggered_at": alert_row.triggered_at.isoformat() + "Z",
                              "reason": reason, "is_acknowledged": False}
                    new_alerts.append(alert)
                    send_email_notification(case_id, recipient_email, reason)
    return new_alerts