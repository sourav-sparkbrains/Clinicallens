from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import urllib.request
import os

PDF_DIR = Path("reports")

FONT_URLS = {
    "english": "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf",
    "spanish": "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf",
    "portuguese": "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf",
    "french": "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf",
    "german": "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf",
    "italian": "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf",
    "hindi": "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansDevanagari/NotoSansDevanagari-Regular.ttf",
    "marathi": "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansDevanagari/NotoSansDevanagari-Regular.ttf",
    "nepali": "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansDevanagari/NotoSansDevanagari-Regular.ttf",
    "punjabi": "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansGurmukhi/NotoSansGurmukhi-Regular.ttf",
    "bengali": "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansBengali/NotoSansBengali-Regular.ttf",
    "tamil": "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansTamil/NotoSansTamil-Regular.ttf",
    "telugu": "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansTelugu/NotoSansTelugu-Regular.ttf",
    "kannada": "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansKannada/NotoSansKannada-Regular.ttf",
    "malayalam": "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansMalayalam/NotoSansMalayalam-Regular.ttf",
    "gujarati": "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansGujarati/NotoSansGujarati-Regular.ttf",
    "odia": "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansOriya/NotoSansOriya-Regular.ttf",
    "assamese": "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansBengali/NotoSansBengali-Regular.ttf",
    "urdu": "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansArabic/NotoSansArabic-Regular.ttf",
}


def register_unicode_font(language: str) -> str:
    """
    Downloads and registers the correct Noto font for the given language.
    language: target language string
    returns: registered font name to use in ReportLab
    """
    language = language.lower()
    font_url = FONT_URLS.get(language)

    if not font_url:
        return "Helvetica"

    font_name = f"Noto-{language.title()}"
    font_path = f"/tmp/{font_name}.ttf"

    if not os.path.exists(font_path):
        urllib.request.urlretrieve(font_url, font_path)

    pdfmetrics.registerFont(TTFont(font_name, font_path))
    return font_name

def generate_case_summary_pdf(
    patient_id: str,
    total_visits: int,
    first_visit_date: str,
    last_visit_date: str,
    conditions_over_time: list,
    overall_progression: str,
    current_status: str,
    recommendation_summary: str,
    visits: list,
    translated_summary: str | None = None,
    language: str | None = None
) -> str:
    """
    Generates a PDF case summary report for a patient.
    returns: path to the generated PDF file as a string
    """
    PDF_DIR.mkdir(parents=True, exist_ok=True)
    pdf_path = PDF_DIR / f"case_summary_{patient_id}.pdf"

    doc = SimpleDocTemplate(
        str(pdf_path),
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("title", parent=styles["Heading1"], fontSize=18, spaceAfter=6)
    heading_style = ParagraphStyle("heading", parent=styles["Heading2"], fontSize=13, spaceAfter=4)
    body_style = ParagraphStyle("body", parent=styles["Normal"], fontSize=10, spaceAfter=4)
    muted_style = ParagraphStyle("muted", parent=styles["Normal"], fontSize=9, textColor=colors.grey)

    elements = []

    elements.append(Paragraph("ClinicalLens — Patient Case Summary", title_style))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.grey))
    elements.append(Spacer(1, 0.4*cm))

    elements.append(Paragraph(f"Patient ID: {patient_id}", body_style))
    elements.append(Paragraph(f"Total visits: {total_visits}", body_style))
    elements.append(Paragraph(f"First visit: {first_visit_date}", body_style))
    elements.append(Paragraph(f"Last visit: {last_visit_date}", body_style))
    elements.append(Spacer(1, 0.4*cm))

    elements.append(Paragraph("Overall Assessment", heading_style))
    elements.append(HRFlowable(width="100%", thickness=0.3, color=colors.lightgrey))
    elements.append(Spacer(1, 0.2*cm))
    elements.append(Paragraph(f"Progression: {overall_progression.upper()}", body_style))
    elements.append(Paragraph(f"Current status: {current_status}", body_style))
    elements.append(Paragraph(f"Recommendation: {recommendation_summary}", body_style))
    elements.append(Spacer(1, 0.4*cm))

    elements.append(Paragraph("Conditions Over Time", heading_style))
    elements.append(HRFlowable(width="100%", thickness=0.3, color=colors.lightgrey))
    elements.append(Spacer(1, 0.2*cm))
    for i, condition in enumerate(conditions_over_time, 1):
        elements.append(Paragraph(f"Visit {i}: {condition}", body_style))
    elements.append(Spacer(1, 0.4*cm))

    elements.append(Paragraph("Visit History", heading_style))
    elements.append(HRFlowable(width="100%", thickness=0.3, color=colors.lightgrey))
    elements.append(Spacer(1, 0.2*cm))

    table_data = [["Visit", "Date", "Impression", "Urgency", "Recommendation"]]
    for i, visit in enumerate(visits, 1):
        table_data.append([
            str(i),
            visit["timestamp"][:10],
            visit["report"]["primary_impression"],
            visit["report"]["urgency"],
            visit["report"]["recommendation"][:60] + "..." if len(visit["report"]["recommendation"]) > 60 else visit["report"]["recommendation"]
        ])

    table = Table(table_data, colWidths=[1.2*cm, 2.5*cm, 4*cm, 2*cm, 7*cm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f0f0f0")),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.3, colors.lightgrey),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#fafafa")]),
    ]))
    elements.append(table)
    elements.append(Spacer(1, 0.4*cm))

    if translated_summary and language:
        font_name = register_unicode_font(language)

        translated_style = ParagraphStyle(
            "translated",
            parent=styles["Normal"],
            fontSize=10,
            fontName=font_name,
            spaceAfter=4
        )

        elements.append(Paragraph(f"Patient Summary ({language.title()})", heading_style))
        elements.append(HRFlowable(width="100%", thickness=0.3, color=colors.lightgrey))
        elements.append(Spacer(1, 0.2 * cm))
        elements.append(Paragraph(translated_summary, translated_style))
        elements.append(Spacer(1, 0.4 * cm))

    elements.append(HRFlowable(width="100%", thickness=0.3, color=colors.lightgrey))
    elements.append(Spacer(1, 0.2*cm))
    elements.append(Paragraph(
        "This report is AI-generated and intended to assist a qualified healthcare worker. "
        "It is not a substitute for professional medical judgment.",
        muted_style
    ))

    doc.build(elements)
    return str(pdf_path)