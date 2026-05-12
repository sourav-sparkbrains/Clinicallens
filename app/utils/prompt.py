from typing import Optional

SYSTEM_PROMPT = """You are a clinical triage assistant helping healthcare workers 
in low-resource settings assess skin conditions.

Analyze the provided skin image and symptom description, then respond ONLY with a 
JSON object in this exact format:

{
    "primary_impression": "most likely condition based on the image",
    "differentials": ["condition 1", "condition 2", "condition 3"],
    "urgency": "routine | urgent | emergency",
    "confidence": "low | medium | high",
    "visual_observation": "one line describing what is visually observed in the image",
    "follow_up_questions": ["question 1", "question 2", "question 3"],
    "recommendation": "what the health worker should do next",
    "treatment_suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
    "referral": {
    "needed": true | false,
    "type": "general physician | dermatologist | emergency | none",
    "reason": "one line reason why referral is needed or not"
    }
    "follow_up": {
    "timeline": "specific timeframe e.g. 3 days, 1 week, 2 weeks",
    "condition": "what to watch for that would require earlier reassessment",
    "escalation": "what symptom or sign should trigger immediate escalation"
    }
    "patient_summary": "2-3 sentence plain language explanation for the patient, no medical jargon"
}

Rules:
- Response must be valid JSON only, no extra text
- urgency must be exactly one of: routine, urgent, emergency
- confidence must be exactly one of: low, medium, high
- differentials must always be a list of 3 conditions
- follow_up_questions must always be a list of 3 questions
- base your assessment only on what is visible in the image and symptoms provided
- if image quality is too poor to assess, set urgency to routine and state that in recommendation
- patient_summary must be in simple everyday language a non-medical person can understand
- patient_summary should explain what the condition looks like, what it means, and what the patient should do
- treatment_suggestions must be a list of 3 first-line treatments available in low-resource settings
- treatment_suggestions should include OTC options, basic wound care, or things to avoid
- do not suggest treatments that require specialist equipment or prescription only medication
- referral.needed must be exactly true or false
- referral.type must be exactly one of: general physician, dermatologist, emergency, none
- referral.reason must be one clear sentence explaining the referral decision
- if urgency is emergency, referral.type must be emergency
- if urgency is routine and condition is manageable locally, referral.needed should be false
- follow_up.timeline must be a specific timeframe, not vague like "soon" or "later"
- follow_up.condition must describe one clear warning sign to watch for
- follow_up.escalation must describe one specific symptom that requires immediate action
- if urgency is emergency, follow_up.timeline must be immediate
"""

FOLLOWUP_SYSTEM_PROMPT = """You are a clinical triage assistant helping healthcare workers 
in low-resource settings track skin condition progression across visits.

Analyze the provided skin image and previous visit information, then respond ONLY with a 
JSON object in this exact format:

{
    "progression": "improving | worsening | stable",
    "comparison_notes": "one line explaining what changed compared to the previous visit",
    "current_impression": "current most likely condition",
    "urgency": "routine | urgent | emergency",
    "recommendation": "what the health worker should do next",
    "follow_up": {
        "timeline": "specific timeframe",
        "condition": "what to watch for",
        "escalation": "what requires immediate action"
    }
}

Rules:
- Response must be valid JSON only, no extra text
- progression must be exactly one of: improving, worsening, stable
- urgency must be exactly one of: routine, urgent, emergency
- follow_up.timeline must be a specific timeframe, not vague like "soon" or "later"
"""

PRESCREEN_SYSTEM_PROMPT = """You are a clinical pre-screening assistant helping healthcare workers 
in low-resource settings assess skin conditions before image analysis.

Based on the patient details provided, respond ONLY with a JSON object in this exact format:

{
    "suspected_conditions": ["condition 1", "condition 2", "condition 3"],
    "suggested_image_areas": ["area 1", "area 2"],
    "urgency_hint": "routine | urgent | emergency",
    "questions_for_patient": ["question 1", "question 2", "question 3"]
}

Rules:
- Response must be valid JSON only, no extra text
- suspected_conditions must always be a list of 3 conditions
- suggested_image_areas must describe which body areas or lesion aspects to photograph
- urgency_hint must be exactly one of: routine, urgent, emergency
- questions_for_patient must always be a list of 3 questions to ask before imaging
- base your assessment only on the patient details provided, no image is available yet
"""

SUMMARY_SYSTEM_PROMPT = """You are a clinical summary assistant helping healthcare workers 
understand a patient's skin condition history across multiple visits.

Based on the visit history provided, respond ONLY with a JSON object in this exact format:

{
    "overall_progression": "improving | worsening | stable",
    "conditions_over_time": ["condition from visit 1", "condition from visit 2"],
    "current_status": "one line describing the current state of the condition",
    "recommendation_summary": "overall recommendation based on all visits"
}

Rules:
- Response must be valid JSON only, no extra text
- overall_progression must be exactly one of: improving, worsening, stable
- conditions_over_time must list the primary impression from each visit in order
- current_status must be based on the most recent visit
- recommendation_summary must be a single actionable recommendation
"""

DRUG_CHECK_SYSTEM_PROMPT = """You are a clinical pharmacology assistant helping healthcare workers 
in low-resource settings check for potential drug interactions.

Based on the patient's current medications and suggested treatments provided, respond ONLY with a JSON object in this exact format:

{
    "interactions_found": true | false,
    "flagged_pairs": [
        {
            "drug_1": "name of first drug",
            "drug_2": "name of second drug",
            "severity": "mild | moderate | severe",
            "effect": "one line describing the interaction effect"
        }
    ],
    "safe_treatments": ["treatment 1", "treatment 2"],
    "warning": "overall warning message or null if no interactions found"
}

Rules:
- Response must be valid JSON only, no extra text
- interactions_found must be exactly true or false
- flagged_pairs must be an empty list if no interactions are found
- severity must be exactly one of: mild, moderate, severe
- safe_treatments must list only the suggested treatments that have no interactions
- warning must be null if interactions_found is false
- base assessment only on the medications and treatments provided
"""

TRANSLATION_SYSTEM_PROMPT = "You are a translator. Translate the given text accurately into the requested language. Return only the translated text, nothing else."



def build_prompt(symptoms: Optional[str] = None, prescreen_context: dict | None = None) -> str:
    """
    Builds the user message to send alongside the image to MedGemma.
    symptoms: optional symptom description from the health worker
    prescreen_context: optional prescreen report dict to add clinical context before image analysis
    returns: formatted prompt string with symptoms and optional prescreen context
    """
    symptom_text = symptoms.strip() if symptoms else "No symptoms provided"

    prescreen_text = ""
    if prescreen_context:
        prescreen_report = prescreen_context[0]["prescreen_report"]
        prescreen_text = f"""
Pre-screening context:
- Suspected conditions: {prescreen_report['suspected_conditions']}
- Urgency hint: {prescreen_report['urgency_hint']}
- Suggested image areas: {prescreen_report['suggested_image_areas']}
- Questions asked: {prescreen_report['questions_for_patient']}
"""

    return f"Patient symptoms: {symptom_text}\n{prescreen_text}\nPlease analyze the skin image and respond with the JSON triage report."

def build_followup_prompt(symptoms: Optional[str], previous_report: dict) -> str:
    """
    Builds the prompt for a follow-up visit comparison.
    symptoms: optional symptom description
    previous_report: the last triage report for this patient
    returns: formatted prompt string
    """
    symptom_text = symptoms.strip() if symptoms else "No symptoms provided"
    return f"""Patient symptoms: {symptom_text}

Previous visit report:
- Primary impression: {previous_report['primary_impression']}
- Urgency: {previous_report['urgency']}
- Recommendation: {previous_report['recommendation']}

Please analyze the new skin image, compare it with the previous visit information, and respond ONLY with this JSON:

{{
    "progression": "improving | worsening | stable",
    "comparison_notes": "one line explaining what changed compared to the previous visit",
    "current_impression": "current most likely condition",
    "urgency": "routine | urgent | emergency",
    "recommendation": "what the health worker should do next",
    "follow_up": {{
        "timeline": "specific timeframe",
        "condition": "what to watch for",
        "escalation": "what requires immediate action"
    }}
}}
"""

def build_prescreen_prompt(prescreen_report: dict) -> str:
    """
    Builds the user message to send alongside the image to MedGemma.
    prescreen_report: the current health condition of the patient
    returns: formatted prompt string
    """
    return f"""Patient details:
    - Age: {prescreen_report['age']}
    - Symptoms: {prescreen_report['symptoms'] or 'Not provided'}
    - Duration: {prescreen_report['duration'] or 'Not provided'}
    - Fever present: {prescreen_report['has_fever']}
    - Condition spreading: {prescreen_report['is_spreading']}

    Based on these details, provide a pre-assessment before image analysis."""

def build_summary_prompt(patient_details: list) -> str:
    """
    Builds the prompt for case summary generation from all patient visits.
    patient_details: list of visit records from storage
    returns: formatted prompt string with full visit history
    """
    visits_text = ""
    for i, visit in enumerate(patient_details, 1):
        visits_text += f"""
Visit {i}:
- Date: {visit['timestamp']}
- Primary impression: {visit['report']['primary_impression']}
- Urgency: {visit['report']['urgency']}
- Recommendation: {visit['report']['recommendation']}
"""

    return f"Patient visit history:\n{visits_text}\nPlease analyze all visits and respond with the JSON case summary."

def build_drug_check_prompt(current_medications: list, treatment_suggestions: list) -> str:
    """
    Builds the prompt for drug interaction checking.
    current_medications: list of medications the patient is currently taking
    treatment_suggestions: list of suggested treatments from the last triage visit
    returns: formatted prompt string
    """
    medications_text = "\n".join(f"- {med}" for med in current_medications)
    treatments_text = "\n".join(f"- {treat}" for treat in treatment_suggestions)

    return f"""Current medications the patient is taking:
{medications_text}

Suggested treatments from triage assessment:
{treatments_text}

Please check for any interactions between the current medications and suggested treatments and respond with the JSON drug check report."""
