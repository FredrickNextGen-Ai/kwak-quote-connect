import json
import os
import time
from datetime import datetime, timezone

import requests

from app.analytics import (
    fetch_quotations_filtered,
    quotation_value,
)

from app.pdf_reports import (
    generate_quotations_pdf,
)

from app.telegram import (
    TELEGRAM_BOT_TOKEN,
    TELEGRAM_CHAT_ID,
)


TELEGRAM_API = (
    f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}"
)


# =========================================================
# QUOTATION FILTER STATE
# =========================================================

quotation_filters = {}


# =========================================================
# LIVE NOTIFICATION STATE
# =========================================================

STATE_FILE = os.path.join(
    os.path.dirname(__file__),
    "telegram_state.json",
)


def load_notification_state():
    """
    Load the last quotation notification state.

    The state is stored locally so that the bot does not
    repeatedly notify the same quotation after a normal
    restart.
    """

    if not os.path.exists(STATE_FILE):
        return {
            "last_created_at": None,
            "last_quotation_id": None,
        }

    try:

        with open(
            STATE_FILE,
            "r",
            encoding="utf-8",
        ) as file:

            data = json.load(file)

        return {
            "last_created_at": data.get(
                "last_created_at"
            ),
            "last_quotation_id": data.get(
                "last_quotation_id"
            ),
        }

    except Exception as error:

        print(
            f"Could not load Telegram state: {error}"
        )

        return {
            "last_created_at": None,
            "last_quotation_id": None,
        }


def save_notification_state(
    created_at: str | None,
    quotation_id: str | None,
):

    state = {
        "last_created_at": created_at,
        "last_quotation_id": quotation_id,
    }

    try:

        with open(
            STATE_FILE,
            "w",
            encoding="utf-8",
        ) as file:

            json.dump(
                state,
                file,
                indent=2,
            )

    except Exception as error:

        print(
            f"Could not save Telegram state: {error}"
        )


notification_state = load_notification_state()


# =========================================================
# SEND MESSAGE
# =========================================================

def send_message(
    chat_id: str,
    text: str,
    reply_markup: dict | None = None,
):

    payload = {
        "chat_id": chat_id,
        "text": text,
    }

    if reply_markup:
        payload["reply_markup"] = reply_markup

    response = requests.post(
        f"{TELEGRAM_API}/sendMessage",
        json=payload,
        timeout=15,
    )

    response.raise_for_status()


# =========================================================
# EDIT MESSAGE
# =========================================================

def edit_message(
    chat_id: str,
    message_id: int,
    text: str,
    reply_markup: dict | None = None,
):

    payload = {
        "chat_id": chat_id,
        "message_id": message_id,
        "text": text,
    }

    if reply_markup:
        payload["reply_markup"] = reply_markup

    response = requests.post(
        f"{TELEGRAM_API}/editMessageText",
        json=payload,
        timeout=15,
    )

    response.raise_for_status()


# =========================================================
# SEND PDF
# =========================================================

def send_pdf(
    chat_id: str,
    pdf_buffer,
    filename: str,
    caption: str,
):

    pdf_buffer.seek(0)

    response = requests.post(
        f"{TELEGRAM_API}/sendDocument",
        data={
            "chat_id": chat_id,
            "caption": caption,
        },
        files={
            "document": (
                filename,
                pdf_buffer,
                "application/pdf",
            )
        },
        timeout=60,
    )

    response.raise_for_status()

    data = response.json()

    if not data.get("ok"):

        raise RuntimeError(
            data.get(
                "description",
                "Telegram PDF upload failed",
            )
        )

    return data


# =========================================================
# CALLBACK RESPONSE
# =========================================================

def answer_callback(
    callback_query_id: str,
):

    response = requests.post(
        f"{TELEGRAM_API}/answerCallbackQuery",
        json={
            "callback_query_id": callback_query_id,
        },
        timeout=15,
    )

    response.raise_for_status()


# =========================================================
# TELEGRAM UPDATES
# =========================================================

def get_updates(
    offset=None,
):

    params = {
        "timeout": 30,
    }

    if offset is not None:
        params["offset"] = offset

    response = requests.get(
        f"{TELEGRAM_API}/getUpdates",
        params=params,
        timeout=35,
    )

    response.raise_for_status()

    data = response.json()

    if not data.get("ok"):
        return []

    return data.get(
        "result",
        [],
    )


# =========================================================
# FORMATTING
# =========================================================

def format_currency(
    value: float,
) -> str:

    return f"KES {value:,.2f}"


def format_date(
    value: str | None,
) -> str:

    if not value:
        return "Date unavailable"

    try:

        parsed = datetime.fromisoformat(
            value.replace(
                "Z",
                "+00:00",
            )
        )

        return parsed.strftime(
            "%d %b %Y, %I:%M %p"
        )

    except ValueError:

        return str(value)


# =========================================================
# QUOTATION VALUE
# =========================================================

def get_quotation_item_count(
    quotation: dict,
) -> int:

    items = quotation.get(
        "quotation_items"
    )

    if not isinstance(
        items,
        list,
    ):

        return 0

    return len(items)


# =========================================================
# LIVE QUOTATION MESSAGE
# =========================================================

def format_new_quotation_notification(
    quotation: dict,
) -> str:

    quotation_number = (
        quotation.get(
            "quotation_number"
        )
        or "N/A"
    )

    status = (
        quotation.get(
            "status"
        )
        or "Unknown"
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
        or "Unknown customer"
    )

    phone = (
        customer.get(
            "phone"
        )
        or "No phone"
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
        vehicle = "Vehicle not specified"

    item_count = get_quotation_item_count(
        quotation
    )

    value = quotation_value(
        quotation
    )

    created_at = format_date(
        quotation.get(
            "created_at"
        )
    )

    action_message = (
        "⚠️ Action required — "
        "quotation awaiting review."
        if status.lower() == "pending"
        else
        "Please review the quotation."
    )

    return (
        "🔔 NEW QUOTATION\n\n"
        f"Quotation: {quotation_number}\n"
        f"Customer: {customer_name}\n"
        f"Phone: {phone}\n"
        f"Vehicle: {vehicle}\n"
        f"Items: {item_count}\n"
        f"Value: {format_currency(value)}\n"
        f"Status: {status}\n\n"
        f"Received: {created_at}\n\n"
        f"{action_message}\n\n"
        "Use /quotations to review."
    )


# =========================================================
# FIND NEW QUOTATIONS
# =========================================================

def fetch_recent_quotations():

    return fetch_quotations_filtered(
        date_filter="all",
        status_filter="All",
    )


# =========================================================
# CHECK LIVE QUOTATIONS
# =========================================================

def check_for_new_quotations():

    global notification_state

    try:

        quotations = fetch_recent_quotations()

        if not quotations:

            return

        # -------------------------------------------------
        # Sort newest first
        # -------------------------------------------------

        quotations = sorted(
            quotations,
            key=lambda quotation: (
                quotation.get(
                    "created_at"
                )
                or ""
            ),
            reverse=True,
        )

        newest = quotations[0]

        newest_created_at = newest.get(
            "created_at"
        )

        newest_id = newest.get(
            "id"
        )

        # -------------------------------------------------
        # FIRST RUN
        #
        # If no state exists, establish a baseline
        # without sending old quotations as notifications.
        # -------------------------------------------------

        if (
            notification_state.get(
                "last_created_at"
            )
            is None
        ):

            save_notification_state(
                newest_created_at,
                newest_id,
            )

            notification_state = {
                "last_created_at": newest_created_at,
                "last_quotation_id": newest_id,
            }

            print(
                "Telegram notification baseline "
                "initialized."
            )

            return

        last_created_at = notification_state.get(
            "last_created_at"
        )

        last_quotation_id = notification_state.get(
            "last_quotation_id"
        )

        # -------------------------------------------------
        # FIND QUOTATIONS NEWER THAN LAST CHECK
        # -------------------------------------------------

        new_quotations = []

        for quotation in quotations:

            quotation_created_at = quotation.get(
                "created_at"
            )

            quotation_id = quotation.get(
                "id"
            )

            if not quotation_created_at:

                continue

            # Primary comparison: created_at
            if quotation_created_at > last_created_at:

                new_quotations.append(
                    quotation
                )

                continue

            # Same timestamp: use ID to avoid
            # accidentally ignoring another record.
            if (
                quotation_created_at
                == last_created_at
                and quotation_id
                and quotation_id
                != last_quotation_id
            ):

                new_quotations.append(
                    quotation
                )

        # -------------------------------------------------
        # OLDEST FIRST
        #
        # If multiple quotations arrived while the bot
        # was busy, notify them in chronological order.
        # -------------------------------------------------

        new_quotations.sort(
            key=lambda quotation: (
                quotation.get(
                    "created_at"
                )
                or ""
            )
        )

        # -------------------------------------------------
        # SEND NOTIFICATIONS
        # -------------------------------------------------

        for quotation in new_quotations:

            quotation_id = quotation.get(
                "id"
            )

            quotation_created_at = quotation.get(
                "created_at"
            )

            if not quotation_id:

                continue

            message = format_new_quotation_notification(
                quotation
            )

            print(
                "New quotation detected: "
                f"{quotation.get('quotation_number', 'N/A')}"
            )

            send_message(
                str(TELEGRAM_CHAT_ID),
                message,
            )

            # Save state only after successful Telegram
            # delivery so a failed message can be retried.
            save_notification_state(
                quotation_created_at,
                quotation_id,
            )

            notification_state = {
                "last_created_at": quotation_created_at,
                "last_quotation_id": quotation_id,
            }

    except Exception as error:

        print(
            f"Live quotation notification error: {error}"
        )


# =========================================================
# PERIOD LABEL
# =========================================================

def get_period_label(
    date_filter: str,
) -> str:

    labels = {
        "all": "All Dates",
        "today": "Today",
        "7d": "Last 7 Days",
        "30d": "Last 30 Days",
        "month": "This Month",
    }

    return labels.get(
        date_filter,
        "All Dates",
    )


# =========================================================
# QUOTATION FILTER MENU
# =========================================================

def quotations_menu():

    return {
        "inline_keyboard": [
            [
                {
                    "text": "Today",
                    "callback_data": "qdate:today",
                },
                {
                    "text": "Last 7 Days",
                    "callback_data": "qdate:7d",
                },
            ],
            [
                {
                    "text": "Last 30 Days",
                    "callback_data": "qdate:30d",
                },
                {
                    "text": "This Month",
                    "callback_data": "qdate:month",
                },
            ],
            [
                {
                    "text": "All Dates",
                    "callback_data": "qdate:all",
                },
            ],
            [
                {
                    "text": "Pending",
                    "callback_data": "qstatus:Pending",
                },
                {
                    "text": "Reviewing",
                    "callback_data": "qstatus:Reviewing",
                },
            ],
            [
                {
                    "text": "Quoted",
                    "callback_data": "qstatus:Quoted",
                },
                {
                    "text": "Completed",
                    "callback_data": "qstatus:Completed",
                },
            ],
            [
                {
                    "text": "Cancelled",
                    "callback_data": "qstatus:Cancelled",
                },
            ],
        ]
    }


# =========================================================
# QUOTATION RESULT MENU
# =========================================================

def quotation_result_menu():

    return {
        "inline_keyboard": [
            [
                {
                    "text": "Download PDF",
                    "callback_data": "qpdf",
                },
            ],
            [
                {
                    "text": "Change Filters",
                    "callback_data": "qmenu",
                },
            ],
        ]
    }


# =========================================================
# LOAD QUOTATIONS
# =========================================================

def load_quotations(
    date_filter: str = "all",
    status_filter: str = "All",
):

    return fetch_quotations_filtered(
        date_filter=date_filter,
        status_filter=status_filter,
    )


# =========================================================
# FORMAT QUOTATIONS
# =========================================================

def format_quotations(
    quotations: list[dict],
    period: str = "All Dates",
    status: str = "All",
):

    if not quotations:

        return (
            "KWAK AUTO SPARE\n\n"
            "QUOTATIONS\n\n"
            f"Period: {period}\n"
            f"Status: {status}\n\n"
            "No quotations found."
        )

    total_value = sum(
        quotation_value(quotation)
        for quotation in quotations
    )

    lines = [
        "KWAK AUTO SPARE",
        "",
        "QUOTATIONS",
        "",
        f"Period: {period}",
        f"Status: {status}",
        f"Records: {len(quotations)}",
        f"Total Value: {format_currency(total_value)}",
        "",
        "--------------------------------",
        "",
    ]

    for quotation in quotations[:10]:

        quotation_number = (
            quotation.get(
                "quotation_number"
            )
            or "N/A"
        )

        quotation_status = (
            quotation.get(
                "status"
            )
            or "Unknown"
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
            or "Unknown customer"
        )

        phone = (
            customer.get(
                "phone"
            )
            or "No phone"
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
            vehicle = "Vehicle not specified"

        value = quotation_value(
            quotation
        )

        lines.extend(
            [
                f"Quotation: {quotation_number}",
                f"Customer: {customer_name}",
                f"Phone: {phone}",
                f"Vehicle: {vehicle}",
                f"Status: {quotation_status}",
                f"Value: {format_currency(value)}",
                (
                    "Date: "
                    f"{format_date(quotation.get('created_at'))}"
                ),
                "",
            ]
        )

    if len(quotations) > 10:

        lines.extend(
            [
                "--------------------------------",
                (
                    f"Showing 10 of "
                    f"{len(quotations)} records."
                ),
            ]
        )

    return "\n".join(lines)


# =========================================================
# SHOW QUOTATIONS
# =========================================================

def show_quotations(
    chat_id: str,
    date_filter: str = "all",
    status_filter: str = "All",
    message_id: int | None = None,
):

    quotations = load_quotations(
        date_filter=date_filter,
        status_filter=status_filter,
    )

    text = format_quotations(
        quotations,
        period=get_period_label(
            date_filter
        ),
        status=status_filter,
    )

    if message_id is not None:

        edit_message(
            chat_id,
            message_id,
            text,
            quotation_result_menu(),
        )

    else:

        send_message(
            chat_id,
            text,
            quotation_result_menu(),
        )


# =========================================================
# GENERATE AND SEND QUOTATION PDF
# =========================================================

def send_quotation_pdf(
    chat_id: str,
):

    filters = quotation_filters.get(
        chat_id,
        {
            "date": "all",
            "status": "All",
        },
    )

    date_filter = filters["date"]

    status_filter = filters["status"]

    quotations = load_quotations(
        date_filter=date_filter,
        status_filter=status_filter,
    )

    period = get_period_label(
        date_filter
    )

    print(
        "Generating quotation PDF:"
        f" period={period},"
        f" status={status_filter},"
        f" records={len(quotations)}"
    )

    pdf_buffer = generate_quotations_pdf(
        quotations,
        period=period,
        status=status_filter,
    )

    safe_period = (
        period
        .lower()
        .replace(
            " ",
            "_",
        )
    )

    safe_status = (
        status_filter
        .lower()
        .replace(
            " ",
            "_",
        )
    )

    filename = (
        "kwak_quotations_"
        f"{safe_period}_"
        f"{safe_status}.pdf"
    )

    caption = (
        "KWAK AUTO SPARE\n\n"
        "Quotation Report\n\n"
        f"Period: {period}\n"
        f"Status: {status_filter}\n"
        f"Records: {len(quotations)}"
    )

    send_pdf(
        chat_id,
        pdf_buffer,
        filename,
        caption,
    )


# =========================================================
# HANDLE CALLBACK
# =========================================================

def handle_callback(
    callback_query: dict,
):

    callback_id = callback_query["id"]

    message = callback_query.get(
        "message"
    )

    if not message:

        answer_callback(
            callback_id
        )

        return

    chat_id = str(
        message["chat"]["id"]
    )

    if str(chat_id) != str(
        TELEGRAM_CHAT_ID
    ):

        answer_callback(
            callback_id
        )

        return

    data = callback_query.get(
        "data",
        "",
    )

    message_id = message[
        "message_id"
    ]

    answer_callback(
        callback_id
    )

    # -----------------------------------------------------
    # DEFAULT FILTER STATE
    # -----------------------------------------------------

    if chat_id not in quotation_filters:

        quotation_filters[
            chat_id
        ] = {
            "date": "all",
            "status": "All",
        }

    # -----------------------------------------------------
    # DATE FILTER
    # -----------------------------------------------------

    if data.startswith(
        "qdate:"
    ):

        date_filter = data.split(
            ":",
            1,
        )[1]

        quotation_filters[
            chat_id
        ]["date"] = date_filter

        current_status = (
            quotation_filters[
                chat_id
            ]["status"]
        )

        show_quotations(
            chat_id=chat_id,
            date_filter=date_filter,
            status_filter=current_status,
            message_id=message_id,
        )

        return

    # -----------------------------------------------------
    # STATUS FILTER
    # -----------------------------------------------------

    if data.startswith(
        "qstatus:"
    ):

        status_filter = data.split(
            ":",
            1,
        )[1]

        quotation_filters[
            chat_id
        ]["status"] = status_filter

        current_date = (
            quotation_filters[
                chat_id
            ]["date"]
        )

        show_quotations(
            chat_id=chat_id,
            date_filter=current_date,
            status_filter=status_filter,
            message_id=message_id,
        )

        return

    # -----------------------------------------------------
    # FILTER MENU
    # -----------------------------------------------------

    if data == "qmenu":

        edit_message(
            chat_id,
            message_id,
            (
                "KWAK AUTO SPARE\n\n"
                "QUOTATION FILTERS\n\n"
                "Select a period or status:"
            ),
            quotations_menu(),
        )

        return

    # -----------------------------------------------------
    # DOWNLOAD PDF
    # -----------------------------------------------------

    if data == "qpdf":

        try:

            send_quotation_pdf(
                chat_id
            )

            send_message(
                chat_id,
                (
                    "PDF report generated "
                    "successfully."
                ),
            )

        except Exception as error:

            print(
                f"PDF error: {error}"
            )

            send_message(
                chat_id,
                (
                    "I could not generate "
                    "the PDF report.\n\n"
                    "Check the backend terminal "
                    "for the exact error."
                ),
            )

        return


# =========================================================
# HANDLE MESSAGE
# =========================================================

def handle_message(
    chat_id: str,
    text: str,
):

    if str(chat_id) != str(
        TELEGRAM_CHAT_ID
    ):

        send_message(
            chat_id,
            (
                "You are not authorized "
                "to use this bot."
            ),
        )

        return

    command = text.strip().lower()

    # -----------------------------------------------------
    # START
    # -----------------------------------------------------

    if command == "/start":

        send_message(
            chat_id,
            (
                "KWAK AUTO SPARE "
                "Manager Bot\n\n"
                "Welcome.\n\n"
                "Use /help to see "
                "available commands."
            ),
        )

        return

    # -----------------------------------------------------
    # HELP
    # -----------------------------------------------------

    if command == "/help":

        send_message(
            chat_id,
            (
                "KWAK AUTO SPARE\n\n"
                "AVAILABLE COMMANDS\n\n"
                "/summary\n"
                "/quotations\n\n"
                "Use /quotations to open "
                "quotation filters."
            ),
        )

        return

    # -----------------------------------------------------
    # SUMMARY
    # -----------------------------------------------------

    if command == "/summary":

        quotations = load_quotations()

        total = len(
            quotations
        )

        total_value = sum(
            quotation_value(q)
            for q in quotations
        )

        pending = sum(
            1
            for q in quotations
            if q.get(
                "status"
            ) == "Pending"
        )

        completed = sum(
            1
            for q in quotations
            if q.get(
                "status"
            ) == "Completed"
        )

        cancelled = sum(
            1
            for q in quotations
            if q.get(
                "status"
            ) == "Cancelled"
        )

        summary_message = (
            "KWAK AUTO SPARE\n\n"
            "BUSINESS SUMMARY\n\n"
            f"Quotations: {total}\n"
            f"Total Value: "
            f"{format_currency(total_value)}\n"
            f"Pending: {pending}\n"
            f"Completed: {completed}\n"
            f"Cancelled: {cancelled}"
        )

        send_message(
            chat_id,
            summary_message,
        )

        return

    # -----------------------------------------------------
    # QUOTATIONS
    # -----------------------------------------------------

    if command == "/quotations":

        quotation_filters[
            chat_id
        ] = {
            "date": "all",
            "status": "All",
        }

        send_message(
            chat_id,
            (
                "KWAK AUTO SPARE\n\n"
                "QUOTATION FILTERS\n\n"
                "Select a period or status:"
            ),
            quotations_menu(),
        )

        return

    # -----------------------------------------------------
    # UNKNOWN COMMAND
    # -----------------------------------------------------

    send_message(
        chat_id,
        (
            "Unknown command.\n\n"
            "Use /help to see "
            "available commands."
        ),
    )


# =========================================================
# RUN BOT
# =========================================================

def run_bot():

    print(
        "KWAK AUTO SPARE Telegram bot started..."
    )

    # -----------------------------------------------------
    # Initialize notification baseline
    # -----------------------------------------------------

    try:

        check_for_new_quotations()

    except Exception as error:

        print(
            "Initial quotation notification "
            f"check failed: {error}"
        )

    offset = None

    while True:

        try:

            # -------------------------------------------------
            # LIVE QUOTATION CHECK
            #
            # This runs continuously alongside Telegram
            # message polling.
            # -------------------------------------------------

            check_for_new_quotations()

            updates = get_updates(
                offset
            )

            for update in updates:

                offset = (
                    update["update_id"]
                    + 1
                )

                # -----------------------------------------
                # CALLBACK QUERY
                # -----------------------------------------

                callback_query = update.get(
                    "callback_query"
                )

                if callback_query:

                    handle_callback(
                        callback_query
                    )

                    continue

                # -----------------------------------------
                # MESSAGE
                # -----------------------------------------

                message = update.get(
                    "message"
                )

                if not message:

                    continue

                chat_id = str(
                    message["chat"]["id"]
                )

                text = message.get(
                    "text",
                    "",
                )

                if not text:

                    continue

                print(
                    f"Received from "
                    f"{chat_id}: {text}"
                )

                handle_message(
                    chat_id,
                    text,
                )

        except Exception as error:

            print(
                f"Bot error: {error}"
            )

            time.sleep(5)


# =========================================================
# ENTRY POINT
# =========================================================

if __name__ == "__main__":

    run_bot()