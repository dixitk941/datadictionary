"""
AI summary generator – uses OpenAI GPT to produce business-friendly
descriptions of tables, columns, and data quality findings.
"""
import json
from openai import OpenAI
from config import settings

_client = None


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(api_key=settings.OPENAI_API_KEY)
    return _client


def generate_table_summary(table_meta: dict, quality_report: dict | None = None) -> str:
    """Generate a business-friendly markdown summary for a single table."""
    client = _get_client()

    prompt_parts = [
        "You are a data documentation expert. Given the following database table metadata, "
        "write a clear, concise, business-friendly summary in Markdown. Include:\n"
        "1. A one-paragraph description of what this table likely stores and its business purpose.\n"
        "2. A brief description for each column explaining what it represents in plain English.\n"
        "3. Key relationships and how this table connects to others.\n"
        "4. Any notable data quality observations if quality data is provided.\n",
        f"\n## Table metadata\n```json\n{json.dumps(table_meta, default=str, indent=2)}\n```\n",
    ]
    if quality_report:
        prompt_parts.append(
            f"\n## Data quality report\n```json\n{json.dumps(quality_report, default=str, indent=2)}\n```\n"
        )

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": "\n".join(prompt_parts)}],
        temperature=0.3,
        max_tokens=2000,
    )
    return response.choices[0].message.content


def chat_about_data(messages: list[dict], context: str = "") -> str:
    """Handle a multi-turn chat conversation about the data dictionary."""
    client = _get_client()

    system_msg = (
        "You are an expert data analyst assistant. You help users understand their "
        "database schemas, data quality, and business meaning of their data. "
        "Answer questions clearly and concisely. When referencing tables or columns, "
        "explain them in business-friendly terms.\n"
    )
    if context:
        system_msg += f"\nHere is the current data context:\n{context}\n"

    chat_messages = [{"role": "system", "content": system_msg}] + messages

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=chat_messages,
        temperature=0.4,
        max_tokens=1500,
    )
    return response.choices[0].message.content
