"""
FIR photo/PDF intake for jail officers: extract -> officer reviews ->
confirm -> saved. NEVER auto-saves a case straight from OCR - a
misread section number could wrongly gate someone's bail eligibility,
so a human always confirms extracted fields before anything touches
the database.

If the confirmed accused_name matches an EXISTING case (case-insensitive),
the new charge is appended to that case instead of creating a duplicate
case_id for the same person.
"""
import re
import subprocess
import tempfile
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, UploadFile, File, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from models import CaseRecord, Offense

router = APIRouter()


def envelope(data=None, error=None):
    return {"success": error is None, "data": data, "error": error}


def run_ocr(file_path: str) -> str:
    result = subprocess.run(
        ["tesseract", file_path, "stdout"],
        capture_output=True, text=True, timeout=30,
    )
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or "tesseract failed")
    return result.stdout


def extract_fields(text: str) -> dict:
    def find(pattern, default=None):
        m = re.search(pattern, text, re.IGNORECASE)
        return m.group(1).strip() if m else default

    return {
        "district": find(r"District:\s*([^\n]+?)\s+State:"),
        "state": find(r"State:\s*([^\n]+)"),
        "police_station": find(r"P\.?S\.?:\s*([^\n]+?)\s+FIR No"),
        "fir_no": find(r"FIR No\.?:\s*([^\s\n]+)"),
        "fir_date": find(r"\bDate:\s*(\d{1,2}/\d{1,2}/\d{4})"),
        "act": find(r"Act\(s\):\s*([^\n]+?)\s+Section"),
        "section": find(r"Section\(s\):\s*([^\n]+)"),
        "accused_name": find(r"Details of Known/Suspected Accused\s*\n\s*Name:\s*([^\n]+)"),
    }


@router.post("/api/v1/eligibility/intake/extract")
async def extract_fir(file: UploadFile = File(...)):
    """Step 1: upload -> return a DRAFT for the officer to review. Nothing is saved yet."""
    suffix = "." + file.filename.split(".")[-1] if file.filename and "." in file.filename else ".png"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        text = run_ocr(tmp_path)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Could not read the document: {exc}")

    fields = extract_fields(text)
    missing = [k for k, v in fields.items() if not v]

    return envelope({
        "draft": fields,
        "fields_extracted": len(fields) - len(missing),
        "fields_total": len(fields),
        "missing_fields": missing,
        "warning": "Review every field before confirming - OCR can misread section numbers.",
    })


@router.post("/api/v1/eligibility/intake/confirm")
def confirm_intake(payload: dict):
    """
    Step 2: officer-confirmed fields -> real CaseRecord (or an appended
    charge on an existing one, if this accused_name already has a case).
    """
    from routes import engine as db_engine  # reuse the same engine routes.py already creates

    accused_name = (payload.get("accused_name") or "").strip()
    act = (payload.get("act") or "").strip()
    section = (payload.get("section") or "").strip()

    if not accused_name or not act or not section:
        return envelope(error={"code": "MISSING_FIELDS",
                                "message": "accused_name, act, and section are required."})

    with Session(db_engine) as session:
        offense = session.get(Offense, (act, section))
        if offense is None:
            return envelope(error={"code": "UNKNOWN_OFFENSE",
                                    "message": f"{act} {section} is not in the offenses reference table."})

        existing = session.scalar(
            select(CaseRecord).where(CaseRecord.prisoner_id.ilike(accused_name))
        )

        if existing:
            if offense not in existing.offense_records:
                existing.offense_records.append(offense)
            existing.charges = [
                {"act": o.act, "section": o.section, "offense_category": o.offense_category,
                 "is_compoundable": o.is_compoundable, "max_sentence_months": o.max_sentence_months}
                for o in existing.offense_records
            ]
            existing.updated_at = datetime.now(timezone.utc)
            existing.version += 1
            session.commit()
            return envelope({
                "action": "charge_appended_to_existing_case",
                "case_id": existing.case_id,
                "accused_name": accused_name,
                "total_charges": len(existing.charges),
            })

        new_case_id = f"case-fir-{uuid.uuid4().hex[:8]}"
        now = datetime.now(timezone.utc)
        case = CaseRecord(
            case_id=new_case_id,
            prisoner_id=accused_name,
            custody_start_date=now,
            is_first_time_offender=True,
            state=payload.get("state") or "",
            district=payload.get("district") or "",
            case_stage="under_trial",
            has_legal_aid=False,
            charges = [{"act": offense.act, "section": offense.section,
              "offense_category": offense.offense_category,
              "is_compoundable": offense.is_compoundable,
              "max_sentence_months": offense.max_sentence_months,
              "is_death_or_life_offense": offense.is_death_or_life_offense}],
            version=0,
            created_at=now, updated_at=now,
        )
        case.offense_records = [offense]
        session.add(case)
        session.commit()
        return envelope({
            "action": "new_case_created",
            "case_id": new_case_id,
            "accused_name": accused_name,
        })
