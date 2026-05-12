import io
import base64
from PIL import Image

from app.core.config import settings
from app.core.exceptions import ImageValidationError


def validate_image(filename: str) -> None:
    """
    Validates the image file extension.
    filename: name of the image file (str)
    raises: ImageValidationError if extension is not supported
    """
    valid_extensions = {'jpg', 'jpeg', 'png', 'bmp'}
    file_extension = filename.split('.')[-1].lower()
    if file_extension not in valid_extensions:
        raise ImageValidationError(
            detail=f"File extension must be one of {valid_extensions}"
        )


def resize_image(image_bytes: bytes, quality: int = 85) -> bytes:
    """
        Resizes the image if it exceeds the max allowed size.
        image_bytes: raw image bytes
        quality: JPEG compression quality (default 85)
        returns: resized image as bytes
    """
    max_bytes = settings.MAX_IMAGE_SIZE_MB * 1024 * 1024

    if len(image_bytes) <= max_bytes:
        return image_bytes

    image = Image.open(io.BytesIO(image_bytes))

    while len(image_bytes) > max_bytes:
        w, h = image.size
        image = image.resize((int(w * 0.9), int(h * 0.9)), Image.LANCZOS)

        buffer = io.BytesIO()
        image.save(buffer, format="JPEG", quality=quality)
        image_bytes = buffer.getvalue()

    return image_bytes


def encode_image(image_bytes: bytes) -> str:
    """
        Encodes image bytes to a base64 string.
        image_bytes: raw image bytes
        returns: base64 encoded string
    """
    return base64.b64encode(image_bytes).decode("utf-8")


def check_image_quality(image_bytes: bytes) -> None:
    """
        Checks if the image is too dark, too bright, or too blurry.
        image_bytes: raw image bytes
        raises: ImageValidationError if image quality is too poor
    """
    image = Image.open(io.BytesIO(image_bytes)).convert("L")
    pixels = list(image.getdata())
    avg_brightness = sum(pixels) / len(pixels)

    if avg_brightness < 40:
        raise ImageValidationError(detail="Image is too dark to assess. Please retake in better lighting.")

    if avg_brightness > 220:
        raise ImageValidationError(detail="Image is too bright or washed out. Please retake without flash.")
