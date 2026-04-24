#!/usr/bin/env python3
import datetime
import html
import os
import re
from pathlib import Path

from supabase import create_client
from dotenv import load_dotenv
from bs4 import BeautifulSoup


SOURCE_HTML = Path(r"C:/Users/User/Downloads/Telegram Desktop/ChatExport_2026-04-23/messages.html")
GROUP_LINK_PREFIX = "https://t.me/digital_sub_reviews/"


def clean_text(raw: str) -> str:
    text = re.sub(r"<br\s*/?>", "\n", raw)
    text = re.sub(r"<.*?>", "", text, flags=re.S)
    return html.unescape(text).strip()


def parse_rows(source: str):
    rows = []
    soup = BeautifulSoup(source, "html.parser")
    for message in soup.select("div.message.default.clearfix[id^=message]"):
        message_id_raw = message.get("id", "").replace("message", "")
        if not message_id_raw.isdigit():
            continue
        message_id = int(message_id_raw)

        from_el = message.select_one("div.from_name")
        text_el = message.select_one("div.text")
        date_el = message.select_one("div.pull_right.date.details")
        if not from_el or not text_el:
            continue

        author_name = from_el.get_text(" ", strip=True) or "Клиент"
        content = text_el.get_text("\n", strip=True)
        if len(content) < 8:
            continue

        username = None
        if author_name.startswith("@"):
            username = author_name[1:]
        elif re.fullmatch(r"[A-Za-z0-9_]{5,}", author_name):
            username = author_name

        telegram_date = None
        if date_el and date_el.has_attr("title"):
            core = str(date_el["title"]).split(" UTC")[0].strip()
            try:
                telegram_date = datetime.datetime.strptime(core, "%d.%m.%Y %H:%M:%S").isoformat()
            except ValueError:
                telegram_date = None

        rows.append(
            {
                "telegram_message_id": message_id,
                "author_name": author_name,
                "author_username": username,
                "content": content,
                "telegram_date": telegram_date,
                "status": "approved",
                "original_url": f"{GROUP_LINK_PREFIX}{message_id}",
            }
        )
    return rows


def main():
    load_dotenv(".env.local")
    if not SOURCE_HTML.exists():
        raise SystemExit(f"File not found: {SOURCE_HTML}")

    source = SOURCE_HTML.read_text(encoding="utf-8", errors="ignore")
    rows = parse_rows(source)
    print(f"Parsed reviews: {len(rows)}")

    supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL") or os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_SERVICE_KEY")
    if not supabase_url or not supabase_key:
        raise SystemExit("Missing Supabase env vars")

    client = create_client(supabase_url, supabase_key)

    inserted = 0
    for i in range(0, len(rows), 200):
        chunk = rows[i : i + 200]
        client.table("reviews").upsert(chunk, on_conflict="telegram_message_id").execute()
        inserted += len(chunk)

    print(f"Imported reviews: {inserted}")


if __name__ == "__main__":
    main()
