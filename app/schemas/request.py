from pydantic import BaseModel
from typing import Optional


class TriageRequest(BaseModel):
    symptoms: Optional[str] = None


class PrescreenRequest(BaseModel):
    age: int
    duration: str
    has_fever: bool
    is_spreading: bool
    symptoms: str

class DrugCheckRequest(BaseModel):
    patient_id: str
    current_medications: list[str]

class NoteRequest(BaseModel):
    note: str

