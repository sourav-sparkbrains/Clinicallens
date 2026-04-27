# ClinicalLens

A FastAPI backend that triages skin conditions using Google's **Gemma 4 (`gemma-4-e4b-it`)** model.
Designed for healthcare workers in low-resource clinical settings where specialist access is limited and privacy is non-negotiable.

Built for the **Gemma 4 Impact Challenge**.

---

## Problem

Community health workers in rural clinics encounter patients with skin conditions daily but often lack access to dermatologists. Without structured diagnostic support, they must rely on judgment calls, which can lead to:

* Missed diagnoses
* Unnecessary referrals

This tool provides a fast, structured second opinion powered by a medically capable vision-language model.

---

## Architecture

The backend runs locally, while model inference is handled remotely on a GPU-enabled Kaggle notebook exposed via ngrok.

```text
Health Worker → FastAPI Backend → Kaggle Inference Server (Gemma 4) → Structured Report
```

---

## Model Used

**google/gemma-4-e4b-it**

Used for:

* Triage
* Pre-screening
* Drug interaction checking
* Case summarization
* Translation

---

## Features

### Core Triage

* Upload a skin image with optional symptom description
* Returns:

  * Primary impression
  * Differential diagnoses
  * Urgency level
  * Confidence score
  * Visual observations
  * Treatment suggestions
  * Referral decision
  * Follow-up timeline
  * Patient-friendly summary
* Automatic risk scoring
* Confidence-based escalation warnings
* Epidemic pattern detection from logs

---

### Patient Tracking

* Unique patient ID generation
* Follow-up comparison with previous visits
* Tracks severity progression:

  * Improving
  * Worsening
  * Stable

---

### Pre-Screening

* Symptom-based assessment before image capture
* Suggests:

  * Possible conditions
  * Recommended image capture areas
* Context feeds into main triage

---

### Drug Interaction Checker

* Validates current medications against suggested treatments
* Flags:

  * Interaction severity
  * Safer alternatives

---

### Case Summary

* Generates downloadable PDF with full visit history
* Supports multilingual summaries:

  * Indian languages
  * Latin-script international languages

---

### Supporting Features

* Health worker notes
* Anonymous CSV export for research
* Appointment scheduling based on follow-ups

---

## Project Structure

```bash
clinicallens/
├── app/
│   ├── api/
│   │   └── routes/
│   │       ├── health.py
│   │       └── triage.py
│   ├── core/
│   │   ├── config.py
│   │   └── exceptions.py
│   ├── schemas/
│   │   ├── request.py
│   │   └── response.py
│   ├── services/
│   │   ├── medgemma.py
│   │   └── triage_service.py
│   ├── utils/
│   │   ├── appointments.py
│   │   ├── export.py
│   │   ├── image.py
│   │   ├── pdf.py
│   │   ├── prompt.py
│   │   ├── req_logs.py
│   │   ├── storage.py
│   │   └── translation.py
│   └── main.py
├── sample_images/
├── .env.example
├── requirements.txt
└── README.md
```

---

## API Endpoints

| Method | Endpoint                       | Description                 |
| ------ | ------------------------------ | --------------------------- |
| GET    | `/health`                      | Health check                |
| POST   | `/triage/`                     | Submit skin image           |
| POST   | `/triage/followup`             | Submit follow-up image      |
| POST   | `/triage/prescreen`            | Symptom-based pre-screening |
| GET    | `/triage/summary/{patient_id}` | Download case summary PDF   |
| POST   | `/triage/drug-check`           | Check drug interactions     |
| GET    | `/triage/appointments`         | View appointments           |
| POST   | `/triage/notes/{patient_id}`   | Add notes                   |
| GET    | `/triage/notes/{patient_id}`   | Retrieve notes              |
| GET    | `/triage/export`               | Export anonymized CSV       |

---

## Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-username/clinicallens.git
cd clinicallens
```

### 2. Create Virtual Environment

```bash
python -m venv clinical_env
source clinical_env/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment

```bash
cp .env.example .env
```

Update `.env`:

```env
HF_TOKEN=your_huggingface_token
KAGGLE_INFERENCE_URL=your_kaggle_ngrok_url
REQUEST_TIMEOUT=120
MAX_IMAGE_SIZE_MB=5
```

---

### 5. Setup Kaggle Inference Server

* Open your Kaggle notebook
* Enable **T4 GPU**
* Run all cells
* Copy ngrok public URL into `.env`

---

### 6. Run Server

```bash
python -m uvicorn app.main:app --reload
```

Access API docs:

```
http://localhost:8000/docs
```

---

## Inference Server

Runs on Kaggle using **Gemma 4** with a T4 GPU.

* Exposes `/infer` endpoint
* Accepts image + text input
* Returns structured response

> Add your Kaggle notebook link here

---

## Requirements

* Python 3.12
* Kaggle account with GPU
* HuggingFace access to Gemma 4

---

## Disclaimer

This is an AI-assisted tool intended for **qualified healthcare workers**.
It is **not a replacement for clinical judgment**. All outputs must be reviewed before making medical decisions.

---

## License

MIT