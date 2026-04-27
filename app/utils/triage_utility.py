def calculate_risk_score(urgency: str, confidence: str, referral_needed: bool) -> int:
    """
    Utility function to calculate the risk score based on the urgency and confidence
    urgency: is there any urgency needed (True or False)
    confidence: how much the AI is confident (low, medium, high)
    referral_needed: is referral needed (True or False)
    return: A risk score
    """
    risk_score = 0
    if urgency == "routine":
        risk_score += 20
    elif urgency == "urgent":
        risk_score += 60
    else:
        risk_score += 90

    if confidence == "low":
        risk_score += 10
    elif confidence == "medium":
        risk_score += 0
    else:
        risk_score -= 10

    if referral_needed:
        risk_score += 10
    else:
        risk_score += 0

    return min(100, risk_score)