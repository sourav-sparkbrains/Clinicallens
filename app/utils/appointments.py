import json
from pathlib import Path
from datetime import datetime, timedelta

APPOINTMENTS_FILE = Path("appointments/appointments.json")

def get_appointment_date(timeline: str) -> datetime:
    """
    Utility function to get appointment date from timeline
    timeline: given timeline
    return: appointment date
    """
    date_map = {'day': 1, 'days': 1, 'week': 7, 'weeks': 7, 'month': 30, 'months': 30}
    date_prefix = []
    date_suffix = []

    for c in timeline:
        if c.isnumeric():
            date_prefix.append(int(c))

    for i in timeline.split():
        if i in ('day', 'days', 'week', 'weeks', 'month', 'months'):
            date_suffix.append(date_map.get(i))

    days = 0
    i = 0
    j = 0
    while i < len(date_prefix) and j < len(date_suffix):
        days += (date_prefix[i] * date_suffix[j])
        i += 1
        j += 1

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
    Retrieves all upcoming appointments sorted by appointment date.
    returns: list of upcoming appointments sorted by nearest date first
    """
    if not APPOINTMENTS_FILE.exists():
        return []

    with open(APPOINTMENTS_FILE, "r") as f:
        appointments = json.load(f)

    now = datetime.now()
    upcoming = [
        a for a in appointments
        if datetime.fromisoformat(a["appointment_date"]) >= now
    ]

    return sorted(upcoming, key=lambda x: x["appointment_date"])