import csv
from pathlib import Path

EXPORTS_DIR = Path("exports")


def generate_export_csv(cases: list) -> str:
    """
    Generates a CSV file from anonymized case records.
    cases: list of anonymized visit records
    returns: path to the generated CSV file as a string
    """
    EXPORTS_DIR.mkdir(parents=True, exist_ok=True)
    csv_path = EXPORTS_DIR / "anonymous_cases.csv"

    fieldnames = ["date", "primary_impression", "urgency", "treatment_suggestions"]

    with open(csv_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(cases)

    return str(csv_path)