from fastapi import FastAPI
from pydantic import BaseModel

from app.analytics import (
    analyze_quotations,
    fetch_quotations,
)
from app.telegram import send_telegram_message


app = FastAPI(
    title="KWAK AUTO SPARE API",
    version="1.0.0",
)


class TelegramTestRequest(BaseModel):
    message: str


@app.get("/")
def root():
    return {
        "app": "KWAK AUTO SPARE API",
        "status": "running",
    }


@app.post("/telegram/test")
def telegram_test(request: TelegramTestRequest):
    result = send_telegram_message(request.message)

    return {
        "success": True,
        "telegram": result,
    }


@app.get("/analytics")
def analytics():
    quotations = fetch_quotations()

    return analyze_quotations(quotations)cd "C:\Users\My PC\Downloads\Projects\kwak-quote-connect"

Remove-Item -Recurse -Force node_modules\.vite -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .tanstack -ErrorAction SilentlyContinue