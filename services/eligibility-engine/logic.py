from datetime import datetime, date, timedelta, timezone


def compute_days_served(custody_start_date: str, delay_days_attributable_to_accused: int = 0) -> int:
    start = date.fromisoformat(custody_start_date[:10])
    raw_days = (date.today() - start).days
    return max(0, raw_days - max(0, delay_days_attributable_to_accused))


def compute_threshold_days(max_sentence_months: int, is_first_time_offender: bool) -> tuple[int, str]:
    total_days = max_sentence_months * 30
    if is_first_time_offender:
        return int(total_days / 3), "one_third_first_time"
    return int(total_days / 2), "half_term"


def binding_charge(charges: list[dict]) -> dict:
    """Multiple charges: use the one with the longest max sentence.
    NOTE: this rule is an assumption pending legal validation -
    see docs/LEGAL_VALIDATION_QUESTIONS.md."""
    return max(charges, key=lambda c: c["max_sentence_months"])


def determine_eligibility(case_id: str, custody_start_date: str,
                           is_first_time_offender: bool, charges: list[dict],
                           delay_days_attributable_to_accused: int = 0) -> dict:
    if not custody_start_date or not charges:
        return {
            "case_id": case_id, "eligibility_status": "insufficient_data",
            "days_served": 0, "days_required": 0, "threshold_rule_applied": "none",
            "eligible_since_date": None,
            "computed_at": datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"),
        }

    charge = binding_charge(charges)

    if any(c.get("is_death_or_life_offense") for c in charges):
        return {
            "case_id": case_id, "eligibility_status": "not_eligible_statutory_exclusion",
            "days_served": compute_days_served(custody_start_date, delay_days_attributable_to_accused),
            "days_required": None, "threshold_rule_applied": "death_or_life_imprisonment_excluded",
            "eligible_since_date": None,
            "computed_at": datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"),
        }

    days_served = compute_days_served(custody_start_date, delay_days_attributable_to_accused)
    days_required, rule = compute_threshold_days(charge["max_sentence_months"], is_first_time_offender)
    status = "eligible_now" if days_served >= days_required else "not_yet_eligible"
    if status == "eligible_now" and rule == "one_third_first_time":
        status = "eligible_first_time_offender_rule"
    eligible_since = None
    if status in {"eligible_now", "eligible_first_time_offender_rule"}:
        eligible_since = (date.today() - timedelta(days=days_served - days_required)).isoformat()
    return {
        "case_id": case_id, "eligibility_status": status,
        "days_served": days_served, "days_required": days_required,
        "threshold_rule_applied": rule,
        "computed_at": datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"),
        "eligible_since_date": eligible_since,
    }