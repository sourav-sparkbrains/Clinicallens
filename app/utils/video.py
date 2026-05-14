import base64
from app.core.config import settings
from app.core.exceptions import ImageValidationError


def encode_video(video_bytes: bytes) -> str:
    return base64.b64encode(video_bytes).decode("utf-8")


def validate_video(filename: str):
    allowed = {".mp4", ".mov", ".avi", ".mkv", ".webm", ".3gp"}
    ext = "." + filename.rsplit(".", 1)[-1].lower()
    if ext not in allowed:
        raise ImageValidationError(detail=f"Unsupported video format: {ext}")


def check_video_size(video_bytes: bytes):
    max_bytes = settings.MAX_IMAGE_SIZE_MB * 1024 * 1024 * 10
    if len(video_bytes) > max_bytes:
        raise ImageValidationError(
            detail=f"Video file too large. Maximum size is {settings.MAX_IMAGE_SIZE_MB * 10}MB"
        )
    # Minimum size check
    if len(video_bytes) < 10240:
        raise ImageValidationError(
            detail="Video file is too small or empty. Please provide a valid video recording."
        )