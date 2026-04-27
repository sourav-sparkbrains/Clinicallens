from app.services.gemma4_service import call_gemma4
from app.utils.prompt import TRANSLATION_SYSTEM_PROMPT

def translate_text(text: str, language: str) -> str:
    """
    Translates the given text into the requested language using Gemma4.
    text: text to translate
    language: target language e.g. hindi, punjabi, tamil
    returns: translated text string
    """
    prompt = (
        f"Translate the following text into {language}. "
        f"Return only the translated text, no explanations:\n\n{text}"
    )
    return call_gemma4(prompt, system_prompt=TRANSLATION_SYSTEM_PROMPT)