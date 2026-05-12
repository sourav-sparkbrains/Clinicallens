import requests
from app.core.config import settings
from app.core.exceptions import ModelInferenceError
from app.utils.prompt import SYSTEM_PROMPT


def call_gemma4(
    prompt: str,
    encoded_image: str | None = None,
    encoded_audio: str | None = None,
    encoded_video: str | None = None,
    system_prompt: str = SYSTEM_PROMPT
) -> str:
    try:
        url = f"{settings.KAGGLE_INFERENCE_URL}/infer"

        payload = {
            "image_base64": encoded_image,
            "audio_base64": encoded_audio,
            "video_base64": encoded_video,
            "prompt": prompt,
            "system_prompt": system_prompt
        }

        response = requests.post(
            url,
            json=payload,
            timeout=settings.REQUEST_TIMEOUT
        )
        response.raise_for_status()

        data = response.json()
        result = data.get("result", "").strip()

        if not result:
            raise ModelInferenceError(detail="Kaggle inference returned empty response")

        if result.startswith("ERROR:"):
            raise ModelInferenceError(detail=f"Kaggle model error: {result}")

        return result

    except ModelInferenceError:
        raise
    except requests.Timeout:
        raise ModelInferenceError(detail="Kaggle inference request timed out")
    except requests.HTTPError as e:
        raise ModelInferenceError(detail=f"Kaggle inference error: {str(e)}")
    except Exception as e:
        raise ModelInferenceError(detail=f"Unexpected error: {str(e)}")