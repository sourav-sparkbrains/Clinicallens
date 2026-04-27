from pydantic import BaseModel
from typing import List


class TriageReport(BaseModel):
    patient_id: str | None
    primary_impression: str
    differentials: List[str]
    urgency: str
    confidence: str
    visual_observation: str
    follow_up_questions: List[str]
    recommendation: str
    treatment_suggestions: List[str]
    referral: dict
    follow_up: dict
    epidemic_alert: str | None
    escalation_warning: str | None
    risk_score: int
    patient_summary: str
    disclaimer: str = (
        "This report is AI-generated and intended to assist "
        "a qualified healthcare worker. It is not a substitute "
        "for professional medical judgment."
    )

class ProgressionReport(BaseModel):
    patient_id: str
    progression: str
    comparison_notes: str
    current_impression: str
    urgency: str
    recommendation: str
    follow_up: dict
    disclaimer: str = (
        "This report is AI-generated and intended to assist "
        "a qualified healthcare worker. It is not a substitute "
        "for professional medical judgment."
    )

class PrescreenReport(BaseModel):
    prescreen_id: str
    suspected_conditions: List[str]
    suggested_image_areas: List[str]
    urgency_hint: str
    questions_for_patient: List[str]

class CaseSummary(BaseModel):
    patient_id: str
    total_visits: int
    first_visit_date: str
    last_visit_date: str
    conditions_over_time: str
    overall_progression: str
    current_status: str
    recommendation_summary: str

class DrugCheckReport(BaseModel):
    patient_id: str
    interactions_found: bool
    flagged_pairs: List[dict]
    safe_treatments: List[str]
    warning: str | None = None
