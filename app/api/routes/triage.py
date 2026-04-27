from fastapi import APIRouter, HTTPException, UploadFile, Form
from fastapi.responses import FileResponse
from typing import Optional

from app.schemas.request import PrescreenRequest, DrugCheckRequest, NoteRequest
from app.schemas.response import (TriageReport, ProgressionReport,
                                  PrescreenReport, CaseSummary, DrugCheckReport)
from app.services.triage_service import (process_triage, process_followup,
                                         process_prescreen, process_case_summary, process_drug_check)
from app.core.exceptions import ResponseParseError, ModelInferenceError, ImageValidationError
from app.utils.appointments import get_upcoming_appointments
from app.utils.storage import save_note, get_notes, export_anonymous_cases
from app.utils.export import generate_export_csv


triage_router = APIRouter(
    prefix="/triage",
    tags=["triage"],
)

@triage_router.post("/", response_model=TriageReport)
async def triage(
    file: UploadFile,
    patient_id: str = Form(None),
    prescreen_id: str = Form(None),
    symptoms: Optional[str] = Form(None)
) -> TriageReport:
    """
    Accepts a skin image and optional symptom description.
    Returns a structured triage report.
    """
    try:
        return await process_triage(file, prescreen_id, patient_id, symptoms)
    except ImageValidationError:
        raise
    except ModelInferenceError:
        raise
    except ResponseParseError:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@triage_router.post("/followup", response_model=ProgressionReport)
async def followup(
    file: UploadFile,
    patient_id: str = Form(...),
    symptoms: Optional[str] = Form(None)
) -> ProgressionReport:
    """
    Accepts a follow-up skin image for an existing patient.
    Returns a progression report comparing with the previous visit.
    """
    try:
        return await process_followup(patient_id, file, symptoms)
    except ImageValidationError:
        raise
    except ModelInferenceError:
        raise
    except ResponseParseError:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@triage_router.post("/prescreen", response_model=PrescreenReport)
async def prescreen(prescreen_details: PrescreenRequest) -> PrescreenReport:
    """
    Accepts a prescreen skin image and optional symptom description.
    prescreen_details: Current health condition of the patient
    returns: suggested treatment for the patient
    """
    try:
        prescreen_dict = prescreen_details.model_dump()
        return await process_prescreen(prescreen_dict)
    except ResponseParseError:
        raise
    except ModelInferenceError:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@triage_router.get("/summary/{patient_id}")
async def summary(patient_id: str, language: Optional[str] = None) -> FileResponse:
    """
    Generates and returns a downloadable PDF case summary for a patient.
    patient_id: unique identifier for the patient
    language: optional language for patient summary translation e.g. hindi, punjabi
    returns: downloadable PDF file with full case summary
    """
    try:
        pdf_path = await process_case_summary(patient_id, language)
        return FileResponse(
            path=pdf_path,
            media_type="application/pdf",
            filename=f"case_summary_{patient_id}.pdf"
        )
    except ResponseParseError:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@triage_router.post("/drug-check", response_model=DrugCheckReport)
async def drug_check(drug_details: DrugCheckRequest) -> DrugCheckReport:
    """
    Accepts a skin image and optional symptom description.
    patient_id: optional existing patient ID for returning patients
    prescreen_id: optional prescreen ID to include pre-assessment context
    symptoms: optional symptom description from the health worker
    returns: structured triage report with diagnosis, urgency, and recommendations
    """
    try:
        patient_id = drug_details.patient_id
        current_medications = drug_details.current_medications
        return await process_drug_check(patient_id, current_medications)
    except ResponseParseError:
        raise
    except ModelInferenceError:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@triage_router.get("/appointments")
def appointments() -> list:
    """
    Returns all upcoming patient appointments sorted by nearest date first.
    """
    try:
        return get_upcoming_appointments()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@triage_router.post("/notes/{patient_id}")
def add_note(patient_id: str, note_request: NoteRequest) -> dict:
    """
    Saves a free-text health worker note for a patient.
    patient_id: unique identifier for the patient
    note_request: contains the note text from the health worker
    returns: confirmation message
    """
    try:
        save_note(patient_id, note_request.note)
        return {"message": f"Note saved for patient {patient_id}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@triage_router.get("/notes/{patient_id}")
def get_patient_notes(patient_id: str) -> list:
    """
    Returns all health worker notes for a patient sorted by timestamp.
    patient_id: unique identifier for the patient
    returns: list of notes with timestamps
    """
    try:
        return get_notes(patient_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@triage_router.get("/export")
def export_cases() -> FileResponse:
    """
    Exports anonymized case data as a downloadable CSV file.
    returns: CSV file with anonymized case records
    """
    try:
        cases = export_anonymous_cases()
        if not cases:
            raise HTTPException(status_code=404, detail="No cases found to export")
        csv_path = generate_export_csv(cases)
        return FileResponse(
            path=csv_path,
            media_type="text/csv",
            filename="anonymous_cases.csv"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))