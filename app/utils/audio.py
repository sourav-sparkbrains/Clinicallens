import base64
from app.core.config import settings
from app.core.exceptions import ImageValidationError


def encode_audio(audio_bytes: bytes) -> str:
    return base64.b64encode(audio_bytes).decode("utf-8")


def validate_audio(filename: str):
    allowed = {".wav", ".mp3", ".m4a", ".ogg", ".aac", ".flac", ".webm"}
    ext = "." + filename.rsplit(".", 1)[-1].lower()
    if ext not in allowed:
        raise ImageValidationError(detail=f"Unsupported audio format: {ext}")


def check_audio_size(audio_bytes: bytes):
    max_bytes = settings.MAX_IMAGE_SIZE_MB * 1024 * 1024 * 2
    if len(audio_bytes) > max_bytes:
        raise ImageValidationError(
            detail=f"Audio file too large. Maximum size is {settings.MAX_IMAGE_SIZE_MB * 2}MB"
        )

    if len(audio_bytes) < 1024:
        raise ImageValidationError(
            detail="Audio file is too small or empty. Please provide a valid audio recording."
        )