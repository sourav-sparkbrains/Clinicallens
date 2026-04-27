import json
from datetime import datetime, timedelta
from pathlib import Path
from collections import Counter


LOG_FILE = Path("logs/triage_log.jsonl")

def log_triage_request(
    primary_impression: str,
    urgency: str,
    confidence: str,
    symptoms_provided: bool
) -> None:
    """
    Logs triage request metadata to a JSONL file.
    No image or patient data is stored.
    """
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)

    record = {
        "timestamp": datetime.utcnow().isoformat(),
        "primary_impression": primary_impression,
        "urgency": urgency,
        "confidence": confidence,
        "symptoms_provided": symptoms_provided
    }

    with open(LOG_FILE, "a") as f:
        f.write(json.dumps(record) + "\n")

def check_epidemic_pattern() -> str | None:
    """
    Based on the logs check if there is an epidemic pattern or not.
    returns: warning string or None
    """
    if not LOG_FILE.exists():
        return None

    today = datetime.utcnow()
    past_seven_days = today - timedelta(days=7)

    primary_impressions = []
    with open(LOG_FILE, "r") as f:
        for line in f:
            record = json.loads(line)
            timestamp = datetime.fromisoformat(record["timestamp"])
            if past_seven_days < timestamp <= today:
                primary_impressions.append(record["primary_impression"])

    if not primary_impressions:
        return None

    counts = Counter(primary_impressions)
    primary_impression, primary_impression_count = counts.most_common(1)[0]

    if primary_impression_count >= 3:
        return (
            f"Potential outbreak detected: {primary_impression}. "
            f"{primary_impression_count} cases reported in the last 7 days."
        )

    return None



