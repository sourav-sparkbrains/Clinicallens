
import json
import uuid
from fastapi import UploadFile

from app.core.exceptions import ResponseParseError, ImageValidationError
from app.schemas.response import TriageReport, ProgressionReport, PrescreenReport, CaseSummary, DrugCheckReport
from app.services.gemma4_service import call_gemma4
from app.utils.image import validate_image, resize_image, encode_image, check_image_quality
from app.utils.prompt import (build_prompt, build_followup_prompt,
                              build_prescreen_prompt, PRESCREEN_SYSTEM_PROMPT,
                              build_summary_prompt, SUMMARY_SYSTEM_PROMPT,
                              build_drug_check_prompt, DRUG_CHECK_SYSTEM_PROMPT)
from app.utils.req_logs import log_triage_request, check_epidemic_pattern
from app.utils.storage import (save_visit, get_last_visit,
                               save_prescreen_details, get_prescreen_details,
                               get_visits)
from app.utils.pdf import generate_case_summary_pdf
from app.utils.translation import translate_text
from app.utils.triage_utility import calculate_risk_score
from app.utils.appointments import save_appointments


async def process_triage(image: UploadFile, prescreen_id: str | None = None,
                         patient_id: str | None = None,
                         symptoms: str | None = None) -> TriageReport:
    """
        Orchestrates the full triage flow from image input to TriageReport output.
        image: uploaded image file
        prescreen_id: unique identifier for the prescreen
        symptoms: optional symptom description
        returns: TriageReport
        raises: ResponseParseError if model response cannot be parsed
    """
    if not image.filename:
        raise ImageValidationError(detail="No filename provided")

    if patient_id is None:
        patient_id = str(uuid.uuid4())

    validate_image(image.filename)
    image_bytes = await image.read()
    image_bytes = resize_image(image_bytes)
    check_image_quality(image_bytes)
    encoded_image = encode_image(image_bytes)

    prescreen_context = None
    if prescreen_id is not None:
        prescreen_context = get_prescreen_details(prescreen_id)

    prompt = build_prompt(symptoms, prescreen_context)
    raw_response = call_gemma4(prompt, encoded_image)

    cleaned = raw_response.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("```")[1]
        if cleaned.startswith("json"):
            cleaned = cleaned[4:]
    cleaned = cleaned.strip()

    try:
        data = json.loads(cleaned)

        escalation_warning = None
        if data["confidence"] == "low" and data["urgency"] in ("urgent", "emergency"):
            escalation_warning = (
                "AI confidence is low for this assessment. "
                "Do not rely on this report alone. "
                "Refer the patient to a qualified medical professional immediately."
            )

        urgency = data["urgency"]
        confidence = data["confidence"]
        referral = data["referral"]
        risk_score = calculate_risk_score(urgency, confidence, referral["needed"])

        report = TriageReport(
            patient_id = patient_id,
            primary_impression=data["primary_impression"],
            differentials=data["differentials"],
            urgency=urgency,
            confidence=confidence,
            visual_observation=data["visual_observation"],
            follow_up_questions=data["follow_up_questions"],
            recommendation=data["recommendation"],
            treatment_suggestions=data["treatment_suggestions"],
            referral=referral,
            follow_up=data["follow_up"],
            epidemic_alert=None,
            escalation_warning=escalation_warning,
            risk_score=risk_score,
            patient_summary=data["patient_summary"]
        )

        save_visit(patient_id, {
            "primary_impression": report.primary_impression,
            "urgency": report.urgency,
            "treatment_suggestions": report.treatment_suggestions,
            "recommendation": report.recommendation
        })

        epidemic_warning = check_epidemic_pattern()
        report.epidemic_alert = epidemic_warning

        log_triage_request(
            primary_impression=report.primary_impression,
            urgency=report.urgency,
            confidence=report.confidence,
            symptoms_provided=symptoms is not None
        )

        if patient_id is not None:
            save_appointments(patient_id, report.follow_up["timeline"])

        return report
    except (json.JSONDecodeError, KeyError) as e:
        raise ResponseParseError(
            detail=f"Failed to parse model response: {str(e)}"
        )

async def process_followup(
    patient_id: str,
    image: UploadFile,
    symptoms: str | None = None
) -> ProgressionReport:
    """
        Processes a follow-up visit and compares with previous visit.
        patient_id: unique identifier for the patient
        image: uploaded image file
        symptoms: optional symptom description
        returns: ProgressionReport
        raises: ResponseParseError if model response cannot be parsed
    """
    if not image.filename:
        raise ImageValidationError(detail="No filename provided")

    validate_image(image.filename)
    image_bytes = await image.read()
    image_bytes = resize_image(image_bytes)
    check_image_quality(image_bytes)
    encoded_image = encode_image(image_bytes)

    last_visit = get_last_visit(patient_id)
    if not last_visit:
        raise ResponseParseError(detail=f"No previous visit found for patient {patient_id}")

    prompt = build_followup_prompt(symptoms, last_visit["report"])
    raw_response = call_gemma4(prompt, encoded_image)

    cleaned = raw_response.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("```")[1]
        if cleaned.startswith("json"):
            cleaned = cleaned[4:]
    cleaned = cleaned.strip()

    try:
        data = json.loads(cleaned)
        return ProgressionReport(
            patient_id=patient_id,
            progression=data["progression"],
            comparison_notes=data["comparison_notes"],
            current_impression=data["current_impression"],
            urgency=data["urgency"],
            recommendation=data["recommendation"],
            follow_up=data["follow_up"]
        )
    except (json.JSONDecodeError, KeyError) as e:
        raise ResponseParseError(detail=f"Failed to parse model response: {str(e)}")

async def process_prescreen(
    prescreen_details: dict
) -> PrescreenReport:
    """

    """
    if not prescreen_details:
        raise ResponseParseError(detail="No prescreen details provided")

    prescreen_id = str(uuid.uuid4())

    prompt = build_prescreen_prompt(prescreen_details)
    raw_response = call_gemma4(prompt, system_prompt=PRESCREEN_SYSTEM_PROMPT)

    cleaned = raw_response.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("```")[1]
        if cleaned.startswith("json"):
            cleaned = cleaned[4:]
    cleaned = cleaned.strip()

    try:
        data = json.loads(cleaned)
        prescreen_report = PrescreenReport(
            prescreen_id=prescreen_id,
            suspected_conditions=data["suspected_conditions"],
            suggested_image_areas=data["suggested_image_areas"],
            urgency_hint=data["urgency_hint"],
            questions_for_patient=data["questions_for_patient"]
        )
        save_prescreen_details(prescreen_id,data)
        return prescreen_report
    except (json.JSONDecodeError, KeyError) as e:
        raise ResponseParseError(detail=f"Failed to parse model response: {str(e)}")


async def process_case_summary(patient_id: str, language: str | None = None) -> str:
    """
    Generates a downloadable PDF case summary for a patient based on all visits.
    patient_id: unique identifier for the patient
    language: optional language to translate the patient summary into
    returns: path to the generated PDF file
    raises: ResponseParseError if no visits found or model response cannot be parsed
    """
    patient_details = get_visits(patient_id)
    if not patient_details:
        raise ResponseParseError(detail=f"No visits found for patient {patient_id}")

    prompt = build_summary_prompt(patient_details)
    raw_response = call_gemma4(prompt, system_prompt=SUMMARY_SYSTEM_PROMPT)

    cleaned = raw_response.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("```")[1]
        if cleaned.startswith("json"):
            cleaned = cleaned[4:]
    cleaned = cleaned.strip()

    try:
        data = json.loads(cleaned)

        translated_summary = None
        if language:
            translated_summary = translate_text(
                text=data["recommendation_summary"],
                language=language
            )

        pdf_path = generate_case_summary_pdf(
            patient_id=patient_id,
            total_visits=len(patient_details),
            first_visit_date=patient_details[0]["timestamp"],
            last_visit_date=patient_details[-1]["timestamp"],
            conditions_over_time=data["conditions_over_time"],
            overall_progression=data["overall_progression"],
            current_status=data["current_status"],
            recommendation_summary=data["recommendation_summary"],
            visits=patient_details,
            translated_summary=translated_summary,
            language=language
        )

        return pdf_path

    except (json.JSONDecodeError, KeyError) as e:
        raise ResponseParseError(detail=f"Failed to parse model response: {str(e)}")

async def process_drug_check(patient_id: str, current_medications: list[str]) -> DrugCheckReport:
    """
    Checks for drug interactions between current medications and suggested treatments.
    patient_id: unique identifier for the patient to retrieve last visit treatments
    current_medications: list of medications the patient is currently taking
    returns: DrugCheckReport with flagged interactions and safe treatments
    raises: ResponseParseError if no previous visit found or model response cannot be parsed
    """
    if not patient_id:
        raise ResponseParseError(detail="No patient id provided")

    last_visit = get_last_visit(patient_id)
    if not last_visit:
        raise ResponseParseError(detail=f"No previous visit found for patient {patient_id}")

    treatment_suggestions = last_visit["report"]["treatment_suggestions"]
    prompt = build_drug_check_prompt(current_medications,treatment_suggestions)
    raw_response = call_gemma4(prompt, system_prompt=DRUG_CHECK_SYSTEM_PROMPT)

    cleaned = raw_response.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("```")[1]
        if cleaned.startswith("json"):
            cleaned = cleaned[4:]
    cleaned = cleaned.strip()

    try:
        data = json.loads(cleaned)
        return DrugCheckReport(
            patient_id=patient_id,
            interactions_found=data["interactions_found"],
            flagged_pairs=data["flagged_pairs"],
            safe_treatments=data["safe_treatments"],
            warning=data["warning"],
        )
    except (json.JSONDecodeError, KeyError) as e:
        raise ResponseParseError(detail=f"Failed to parse model response: {str(e)}")

