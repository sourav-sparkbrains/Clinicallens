import json
from pathlib import Path
from datetime import datetime, timezone

VISITS_DIR = Path("visits")
PRESCREENS_DIR = Path("prescreens")
NOTES_DIR = Path("notes")


def save_visit(patient_id: str | None, report: dict) -> None:
    """
    Saves a triage report for a patient visit.
    patient_id: unique identifier for the patient
    report: triage report as a dictionary
    """
    VISITS_DIR.mkdir(parents=True, exist_ok=True)
    patient_file = VISITS_DIR / f"{patient_id}.json"

    visits = []
    if patient_file.exists():
        with open(patient_file, "r") as f:
            visits = json.load(f)

    visits.append({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "report": report
    })

    with open(patient_file, "w") as f:
        json.dump(visits, f, indent=2)


def get_visits(patient_id: str) -> list:
    """
    Retrieves all visits for a patient.
    patient_id: unique identifier for the patient
    returns: list of visit records
    """
    patient_file = VISITS_DIR / f"{patient_id}.json"

    if not patient_file.exists():
        return []

    with open(patient_file, "r") as f:
        return json.load(f)


def get_last_visit(patient_id: str) -> dict | None:
    """
    Retrieves the most recent visit for a patient.
    patient_id: unique identifier for the patient
    returns: last visit record or None if no visits exist
    """
    visits = get_visits(patient_id)
    return visits[-1] if visits else None


def save_prescreen_details(prescreen_id: str, prescreen_report: dict) -> None:
    """
    Saves the prescreen data.
    prescreen_id: unique identifier for the prescreen
    prescreen_report: prescreen report as a dictionary
    returns: None
    """
    PRESCREENS_DIR.mkdir(parents=True, exist_ok=True)
    patient_file = PRESCREENS_DIR / f"{prescreen_id}.json"

    prescreen = []
    if patient_file.exists():
        with open(patient_file, "r") as f:
            prescreen = json.load(f)

    prescreen.append({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "prescreen_report": prescreen_report
    })

    with open(patient_file, "w") as f:
        json.dump(prescreen, f, indent=2)

def get_prescreen_details(prescreen_id: str) -> dict | None:
    """
    Retrieves the prescreen data.
    prescreen_id: unique identifier for the prescreen
    return: prescreen record for given prescreen_id or None if no prescreen exists
    """
    patient_file = PRESCREENS_DIR / f"{prescreen_id}.json"

    if not patient_file.exists():
        return None

    with open(patient_file, "r") as f:
        prescreen = json.load(f)

    return prescreen


def save_note(patient_id: str, note: str) -> None:
    """
    Saves a health worker note for a patient.
    patient_id: unique identifier for the patient
    note: free-text note from the health worker
    returns: None
    """
    NOTES_DIR.mkdir(parents=True, exist_ok=True)
    notes_file = NOTES_DIR / f"{patient_id}.json"

    notes = []
    if notes_file.exists():
        with open(notes_file, "r") as f:
            notes = json.load(f)

    notes.append({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "note": note
    })

    with open(notes_file, "w") as f:
        json.dump(notes, f, indent=2)


def get_notes(patient_id: str) -> list:
    """
    Retrieves all health worker notes for a patient.
    patient_id: unique identifier for the patient
    returns: list of notes sorted by timestamp
    """
    notes_file = NOTES_DIR / f"{patient_id}.json"

    if not notes_file.exists():
        return []

    with open(notes_file, "r") as f:
        return json.load(f)


def export_anonymous_cases() -> list:
    """
    Reads all patient visit files and returns anonymized case records.
    Strips patient ID and returns only clinical data.
    returns: list of anonymized visit records
    """
    if not VISITS_DIR.exists():
        return []

    anonymous_cases = []
    for patient_file in VISITS_DIR.iterdir():
        if patient_file.suffix != ".json":
            continue

        with open(patient_file, "r") as f:
            visits = json.load(f)

        for visit in visits:
            anonymous_cases.append({
                "date": visit["timestamp"][:10],
                "primary_impression": visit["report"]["primary_impression"],
                "urgency": visit["report"]["urgency"],
                "treatment_suggestions": ", ".join(visit["report"].get("treatment_suggestions", [])),
            })

    return sorted(anonymous_cases, key=lambda x: x["date"])