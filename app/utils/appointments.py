import json
from pathlib import Path
from datetime import datetime, timedelta

APPOINTMENTS_FILE = Path("appointments/appointments.json")

def get_appointment_date(timeline: str) -> datetime:
    date_map = {'hour': 1/24, 'hours': 1/24, 'day': 1, 'days': 1, 'week': 7, 'weeks': 7, 'month': 30, 'months': 30}
    parts = timeline.lower().split()
    days = 0.0
    for i, part in enumerate(parts):
        if part.replace('.', '').isnumeric() and i + 1 < len(parts):
            unit = parts[i + 1].rstrip('s') + 's' if not parts[i + 1].endswith('s') else parts[i + 1]
            multiplier = date_map.get(parts[i + 1], date_map.get(unit, 0))
            days += float(part) * multiplier
    if days == 0:
        days = 1
    return datetime.now() + timedelta(days=days)

def save_appointments(patient_id: str, timeline: str) -> None:
    """
    Saves appointment data for a patient to a single shared appointments file.
    patient_id: unique identifier for the patient
    timeline: follow-up timeline string e.g. '1 week', '3 days'
    returns: None
    """
    APPOINTMENTS_FILE.parent.mkdir(parents=True, exist_ok=True)

    appointments = []
    if APPOINTMENTS_FILE.exists():
        with open(APPOINTMENTS_FILE, "r") as f:
            appointments = json.load(f)

    appointment_date = get_appointment_date(timeline)

    appointments.append({
        "patient_id": patient_id,
        "appointment_date": appointment_date.isoformat(),
        "timeline": timeline,
        "created_at": datetime.now().isoformat()
    })

    with open(APPOINTMENTS_FILE, "w") as f:
        json.dump(appointments, f, indent=2, default=str)


def get_upcoming_appointments() -> list:
    """
    Retrieves all appointments sorted by appointment date.
    returns: list of all appointments sorted by nearest date first
    """
    if not APPOINTMENTS_FILE.exists():
        return []

    with open(APPOINTMENTS_FILE, "r") as f:
        appointments = json.load(f)

    return sorted(appointments, key=lambda x: x["appointment_date"])