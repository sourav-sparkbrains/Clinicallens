import requests

from app.core.config import settings
from app.core.exceptions import ModelInferenceError
from app.utils.prompt import SYSTEM_PROMPT


def call_gemma4(prompt: str, encoded_image: str | None = None, system_prompt: str = SYSTEM_PROMPT) -> str:
    """
    Sends the prompt and optional image to Kaggle inference server.
    prompt: formatted prompt string
    encoded_image: optional base64 encoded image string, None for text-only requests
    system_prompt: system prompt to use, defaults to SYSTEM_PROMPT
    returns: raw text response from the model
    raises: ModelInferenceError if request fails
    """
    try:
        url = f"{settings.KAGGLE_INFERENCE_URL}/infer"

        payload = {
            "image_base64": encoded_image,
            "prompt": prompt,
            "system_prompt": system_prompt
        }

        response = requests.post(
            url,
            json=payload,
            timeout=settings.REQUEST_TIMEOUT
        )
        response.raise_for_status()
        return response.json()["result"]

    except requests.Timeout:
        raise ModelInferenceError(detail="Kaggle inference request timed out")

    except requests.HTTPError as e:
        raise ModelInferenceError(detail=f"Kaggle inference error: {str(e)}")

    except Exception as e:
        raise ModelInferenceError(detail=f"Unexpected error: {str(e)}")