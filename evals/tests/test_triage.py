import json
import pytest
import httpx

from deepeval import assert_test
from deepeval.test_case import LLMTestCase
from deepeval.metrics import (
    AnswerRelevancyMetric,
    FaithfulnessMetric,
    HallucinationMetric,
)
from evals.metrics.custom_metrics import (
    get_medical_safety_metric,
    get_urgency_metric,
    get_no_overdiagnosis_metric,
)
from evals.llm import GroqLangChainModel
from app.core.config import settings

# ─────────────────────────────────────────────
# CONFIG — pulled from your settings
# ─────────────────────────────────────────────
BASE_URL = settings.BASE_URL
IMAGES_PATH = settings.IMAGE_PATH
GOLDENS_PATH = settings.GOLDENS_PATH

# ─────────────────────────────────────────────
# SHARED MODEL & GOLDENS
# ─────────────────────────────────────────────
groq_model = GroqLangChainModel(model_name="llama-3.3-70b-versatile")

with open(GOLDENS_PATH) as f:
    GOLDENS = json.load(f)

URGENT_GOLDENS = [g for g in GOLDENS if g.get("urgency") == "urgent"]
NORMAL_GOLDENS = [g for g in GOLDENS if g.get("condition") == "normal"]


# ─────────────────────────────────────────────
# HELPER
# ─────────────────────────────────────────────
def call_triage_api(golden: dict) -> tuple:
    image_path = IMAGES_PATH + golden["image_file"]

    with httpx.Client(
            base_url=BASE_URL,
            timeout=httpx.Timeout(
                connect=10.0,
                read=300.0,
                write=60.0,
                pool=10.0
            )
    ) as client:
        with open(image_path, "rb") as img:
            response = client.post(
                "/triage/",
                data={"symptoms": golden["input"]},
                files={"file": (golden["image_file"], img, "image/jpeg")}
            )
            response.raise_for_status()
            data = response.json()

    actual_output = f"""
Primary Impression: {data.get('primary_impression', '')}
Differentials: {', '.join(data.get('differentials', []))}
Urgency: {data.get('urgency', '')}
Confidence: {data.get('confidence', '')}
Visual Observation: {data.get('visual_observation', '')}
Recommendation: {data.get('recommendation', '')}
Treatment Suggestions: {', '.join(data.get('treatment_suggestions', []))}
Escalation Warning: {data.get('escalation_warning') or 'None'}
Epidemic Alert: {data.get('epidemic_alert') or 'None'}
Patient Summary: {data.get('patient_summary', '')}
Disclaimer: {data.get('disclaimer', '')}
    """.strip()

    return actual_output, data


# ─────────────────────────────────────────────
# TEST 1 — Full eval on all 6 goldens
# ─────────────────────────────────────────────
@pytest.mark.parametrize("golden", GOLDENS)
def test_triage_full_eval(golden):
    actual_output, _ = call_triage_api(golden)

    test_case = LLMTestCase(
        input=golden["input"],
        actual_output=actual_output,
        expected_output=golden["expected_output"],
        context=golden["context"],
        retrieval_context=golden["context"],
    )

    assert_test(test_case, [
        AnswerRelevancyMetric(threshold=0.7, model=groq_model),
        FaithfulnessMetric(threshold=0.7, model=groq_model),
        HallucinationMetric(threshold=0.5, model=groq_model),
        get_medical_safety_metric(groq_model),
    ])

# ─────────────────────────────────────────────
# TEST 2 — Urgent cases must be flagged clearly
# ─────────────────────────────────────────────
@pytest.mark.parametrize("golden", URGENT_GOLDENS)
def test_urgent_cases_flagged(golden):
    actual_output, data = call_triage_api(golden)

    api_urgency = data.get("urgency", "").lower()
    assert api_urgency not in ["low", "minimal", "routine"], (
        f"Expected urgent urgency for '{golden['condition']}' "
        f"but API returned: '{api_urgency}'"
    )

    test_case = LLMTestCase(
        input=golden["input"],
        actual_output=actual_output,
        expected_output=golden["expected_output"],
        context=golden["context"],
    )
    assert_test(test_case, [get_urgency_metric(groq_model)])


# ─────────────────────────────────────────────
# TEST 3 — Normal skin must not be over-diagnosed
# ─────────────────────────────────────────────
@pytest.mark.parametrize("golden", NORMAL_GOLDENS)
def test_normal_skin_no_overdiagnosis(golden):
    actual_output, _ = call_triage_api(golden)

    test_case = LLMTestCase(
        input=golden["input"],
        actual_output=actual_output,
        expected_output=golden["expected_output"],
        context=golden["context"],
    )
    assert_test(test_case, [
        HallucinationMetric(threshold=0.3, model=groq_model),
        get_no_overdiagnosis_metric(groq_model),
    ])


# ─────────────────────────────────────────────
# TEST 4 — Disclaimer must always be present
# ─────────────────────────────────────────────
@pytest.mark.parametrize("golden", GOLDENS)
def test_disclaimer_always_present(golden):
    _, data = call_triage_api(golden)
    disclaimer = data.get("disclaimer", "")
    assert disclaimer, f"Disclaimer missing for: {golden['image_file']}"
    assert len(disclaimer) > 20, f"Disclaimer too short for: {golden['image_file']}"


# ─────────────────────────────────────────────
# TEST 5 — Risk score must be 0–100
# ─────────────────────────────────────────────
@pytest.mark.parametrize("golden", GOLDENS)
def test_risk_score_valid_range(golden):
    _, data = call_triage_api(golden)
    risk_score = data.get("risk_score")
    assert risk_score is not None, f"risk_score missing for: {golden['image_file']}"
    assert 0 <= risk_score <= 100, (
        f"risk_score out of range for {golden['image_file']}: got {risk_score}"
    )