from io import BytesIO
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import (
    getSampleStyleSheet,
    ParagraphStyle,
)
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
)

from app.analytics import quotation_value


# ---------------------------------------------------------
# FORMATTING
# ---------------------------------------------------------

def format_currency(value: float) -> str:
    return f"KES {value:,.2f}"


def format_date(value: str | None) -> str:

    if not value:
        return "N/A"

    try:

        parsed = datetime.fromisoformat(
            value.replace("Z", "+00:00")
        )

        return parsed.strftime(
            "%d %b %Y, %I:%M %p"
        )

    except ValueError:

        return str(value)


# ---------------------------------------------------------
# PDF HEADER / FOOTER
# ---------------------------------------------------------

def add_page_number(
    canvas,
    document,
):

    canvas.saveState()

    canvas.setFont(
        "Helvetica",
        8,
    )

    canvas.drawString(
        20 * mm,
        12 * mm,
        "KWAK AUTO SPARE",
    )

    canvas.drawRightString(
        A4[0] - 20 * mm,
        12 * mm,
        f"Page {document.page}",
    )

    canvas.restoreState()


# ---------------------------------------------------------
# GENERATE QUOTATIONS PDF
# ---------------------------------------------------------

def generate_quotations_pdf(
    quotations: list[dict],
    period: str = "All Dates",
    status: str = "All",
) -> BytesIO:

    buffer = BytesIO()

    document = SimpleDocTemplate(

        buffer,

        pagesize=A4,

        rightMargin=15 * mm,

        leftMargin=15 * mm,

        topMargin=18 * mm,

        bottomMargin=18 * mm,

        title="KWAK AUTO SPARE Quotations Report",

        author="KWAK AUTO SPARE",
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(

        "KwakTitle",

        parent=styles["Title"],

        fontName="Helvetica-Bold",

        fontSize=18,

        leading=22,

        alignment=TA_CENTER,

        spaceAfter=6,
    )

    subtitle_style = ParagraphStyle(

        "KwakSubtitle",

        parent=styles["Normal"],

        fontName="Helvetica",

        fontSize=9,

        leading=12,

        alignment=TA_CENTER,

        spaceAfter=14,
    )

    section_style = ParagraphStyle(

        "KwakSection",

        parent=styles["Heading2"],

        fontName="Helvetica-Bold",

        fontSize=11,

        leading=14,

        spaceBefore=8,

        spaceAfter=6,
    )

    normal_style = ParagraphStyle(

        "KwakNormal",

        parent=styles["Normal"],

        fontName="Helvetica",

        fontSize=9,

        leading=12,
    )

    small_style = ParagraphStyle(

        "KwakSmall",

        parent=styles["Normal"],

        fontName="Helvetica",

        fontSize=8,

        leading=10,
    )

    story = []

    # -----------------------------------------------------
    # TITLE
    # -----------------------------------------------------

    story.append(
        Paragraph(
            "KWAK AUTO SPARE",
            title_style,
        )
    )

    story.append(
        Paragraph(
            "Quotation Report",
            subtitle_style,
        )
    )

    # -----------------------------------------------------
    # REPORT INFORMATION
    # -----------------------------------------------------

    generated_at = datetime.now().strftime(
        "%d %b %Y, %I:%M %p"
    )

    total_value = sum(
        quotation_value(
            quotation
        )
        for quotation in quotations
    )

    summary_data = [

        [
            Paragraph(
                "<b>Period</b>",
                normal_style,
            ),

            Paragraph(
                period,
                normal_style,
            ),
        ],

        [
            Paragraph(
                "<b>Status</b>",
                normal_style,
            ),

            Paragraph(
                status,
                normal_style,
            ),
        ],

        [
            Paragraph(
                "<b>Records</b>",
                normal_style,
            ),

            Paragraph(
                str(len(quotations)),
                normal_style,
            ),
        ],

        [
            Paragraph(
                "<b>Total Value</b>",
                normal_style,
            ),

            Paragraph(
                format_currency(
                    total_value
                ),
                normal_style,
            ),
        ],

        [
            Paragraph(
                "<b>Generated</b>",
                normal_style,
            ),

            Paragraph(
                generated_at,
                normal_style,
            ),
        ],
    ]

    summary_table = Table(

        summary_data,

        colWidths=[
            45 * mm,
            125 * mm,
        ],
    )

    summary_table.setStyle(

        TableStyle(

            [
                (
                    "GRID",
                    (0, 0),
                    (-1, -1),
                    0.5,
                    colors.grey,
                ),

                (
                    "BACKGROUND",
                    (0, 0),
                    (0, -1),
                    colors.whitesmoke,
                ),

                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "MIDDLE",
                ),

                (
                    "LEFTPADDING",
                    (0, 0),
                    (-1, -1),
                    6,
                ),

                (
                    "RIGHTPADDING",
                    (0, 0),
                    (-1, -1),
                    6,
                ),

                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    5,
                ),

                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    5,
                ),
            ]
        )
    )

    story.append(
        summary_table
    )

    story.append(
        Spacer(
            1,
            10,
        )
    )

    # -----------------------------------------------------
    # NO DATA
    # -----------------------------------------------------

    if not quotations:

        story.append(
            Paragraph(
                "No quotations were found for the selected filters.",
                section_style,
            )
        )

        document.build(

            story,

            onFirstPage=add_page_number,

            onLaterPages=add_page_number,
        )

        buffer.seek(0)

        return buffer

    # -----------------------------------------------------
    # QUOTATIONS
    # -----------------------------------------------------

    story.append(
        Paragraph(
            "Quotation Records",
            section_style,
        )
    )

    table_data = [

        [
            Paragraph(
                "<b>Quotation</b>",
                small_style,
            ),

            Paragraph(
                "<b>Customer</b>",
                small_style,
            ),

            Paragraph(
                "<b>Vehicle</b>",
                small_style,
            ),

            Paragraph(
                "<b>Status</b>",
                small_style,
            ),

            Paragraph(
                "<b>Value</b>",
                small_style,
            ),

            Paragraph(
                "<b>Date</b>",
                small_style,
            ),
        ]
    ]

    for quotation in quotations:

        quotation_number = (
            quotation.get(
                "quotation_number"
            )
            or "N/A"
        )

        customer = (
            quotation.get(
                "customers"
            )
            or {}
        )

        customer_name = (
            customer.get(
                "full_name"
            )
            or "Unknown"
        )

        vehicle_parts = [

            quotation.get(
                "vehicle_make"
            ),

            quotation.get(
                "vehicle_model"
            ),

            quotation.get(
                "vehicle_year"
            ),
        ]

        vehicle = " ".join(

            str(part)

            for part in vehicle_parts

            if part
        )

        if not vehicle:

            vehicle = "N/A"

        quotation_status = (
            quotation.get(
                "status"
            )
            or "Unknown"
        )

        value = quotation_value(
            quotation
        )

        created_at = format_date(
            quotation.get(
                "created_at"
            )
        )

        table_data.append(

            [

                Paragraph(
                    quotation_number,
                    small_style,
                ),

                Paragraph(
                    customer_name,
                    small_style,
                ),

                Paragraph(
                    vehicle,
                    small_style,
                ),

                Paragraph(
                    quotation_status,
                    small_style,
                ),

                Paragraph(
                    format_currency(
                        value
                    ),
                    small_style,
                ),

                Paragraph(
                    created_at,
                    small_style,
                ),
            ]
        )

    quotations_table = Table(

        table_data,

        colWidths=[

            28 * mm,

            32 * mm,

            31 * mm,

            24 * mm,

            27 * mm,

            31 * mm,
        ],

        repeatRows=1,
    )

    quotations_table.setStyle(

        TableStyle(

            [

                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, 0),
                    colors.HexColor(
                        "#E5E7EB"
                    ),
                ),

                (
                    "TEXTCOLOR",
                    (0, 0),
                    (-1, 0),
                    colors.black,
                ),

                (
                    "GRID",
                    (0, 0),
                    (-1, -1),
                    0.4,
                    colors.grey,
                ),

                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "TOP",
                ),

                (
                    "LEFTPADDING",
                    (0, 0),
                    (-1, -1),
                    4,
                ),

                (
                    "RIGHTPADDING",
                    (0, 0),
                    (-1, -1),
                    4,
                ),

                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    5,
                ),

                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    5,
                ),
            ]
        )
    )

    story.append(
        quotations_table
    )

    # -----------------------------------------------------
    # BUILD PDF
    # -----------------------------------------------------

    document.build(

        story,

        onFirstPage=add_page_number,

        onLaterPages=add_page_number,
    )

    buffer.seek(0)

    return buffer