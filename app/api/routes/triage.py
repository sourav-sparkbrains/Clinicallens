import json
from datetime import date
from fastapi import APIRouter, HTTPException, UploadFile, Form, File
from fastapi.responses import FileResponse
from typing import Optional

from app.schemas.request import PrescreenRequest, DrugCheckRequest, NoteRequest
from app.schemas.response import (TriageReport, ProgressionReport,
                                  PrescreenReport, CaseSummary, DrugCheckReport)
from app.services.triage_service import (process_triage, process_followup,
                                         process_prescreen, process_case_summary, process_drug_check)
from app.core.exceptions import ResponseParseError, ModelInferenceError, ImageValidationError
from app.utils.appointments import get_upcoming_appointments
from app.utils.storage import save_note, get_notes, export_anonymous_cases, VISITS_DIR
from app.utils.export import generate_export_csv


triage_router = APIRouter(
    prefix="/triage",
    tags=["triage"],
)


@triage_router.post("/", response_model=TriageReport)
async def triage(
    file: UploadFile = File(...),
    audio: Optional[UploadFile] = File(None),
    video: Optional[UploadFile] = File(None),
    patient_id: str = Form(None),
    prescreen_id: str = Form(None),
    symptoms: Optional[str] = Form(None)
) -> TriageReport:
    """
    Accepts a skin image and optional symptom description.
    Returns a structured triage report.
    """
    try:
        return await process_triage(
            file, prescreen_id, patient_id, symptoms,
            audio=audio,
            video=video
        )
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
    file: UploadFile = File(...),
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
    Checks for drug interactions between current medications and suggested treatments.
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
    """
    try:
        return get_notes(patient_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@triage_router.get("/patient-count")
def get_patient_count() -> dict:
    """
    Returns the total number of unique patients (visit files) so frontend can generate sequential IDs.
    """
    try:
        if not VISITS_DIR.exists():
            return {"count": 0}
        count = sum(1 for f in VISITS_DIR.iterdir() if f.suffix == ".json")
        return {"count": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@triage_router.get("/patients")
def get_patients() -> list:
    """
    Returns all patients with their visit summary derived from visit logs.
    """
    try:
        if not VISITS_DIR.exists():
            return []
        patients = []
        for f in sorted(VISITS_DIR.iterdir()):
            if f.suffix != ".json":
                continue
            visits = json.loads(f.read_text())
            if not visits:
                continue
            last = visits[-1]
            patients.append({
                "patient_id": f.stem,
                "last_visit": last["timestamp"][:10],
                "visits": len(visits),
                "complaint": last["report"].get("primary_impression", "—"),
                "urgency": last["report"].get("urgency", "—"),
            })
        return patients
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@triage_router.get("/stats")
def get_stats() -> dict:
    """
    Returns dashboard stats derived from visit logs.
    """
    try:
        cases = export_anonymous_cases()
        today = date.today().isoformat()
        patients_today = sum(1 for c in cases if c["date"] == today)
        pending = sum(1 for c in cases if c["urgency"] in ("High", "Medium"))
        completed = len(cases)
        critical = sum(1 for c in cases if c["urgency"] == "High")
        recent = list(reversed(cases))[:4]
        return {
            "patients_today": patients_today,
            "pending_triage": pending,
            "cases_completed": completed,
            "critical_cases": critical,
            "recent_cases": recent,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@triage_router.get("/export")
def export_cases() -> FileResponse:
    """
    Exports anonymized case data as a downloadable CSV file.
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