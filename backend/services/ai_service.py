"""
AI service – uses Mistral AI to produce business-friendly
descriptions of tables, columns, and data quality findings,
and powers the interactive chat.
"""
import json
from mistralai import Mistral
from config import settings

_client = None

# Personalization profiles for different user types
EXPLANATION_PROFILES = {
    "beginner": {
        "name": "Complete Beginner",
        "description": "No technical background, needs maximum simplification",
        "instruction": (
            "Explain everything in the simplest possible terms. "
            "Use lots of everyday analogies (filing cabinets, recipe cards, phone books). "
            "Avoid ALL technical terms. If you must use one, explain it like you're talking to a 10-year-old. "
            "Use very short sentences and break everything into small steps."
        ),
        "examples": [
            {
                "question": "What is a primary key?",
                "answer": "Think of it like a unique receipt number. Every row in your table gets its own special number so you can find it again later, just like how every receipt has a unique number to track your purchase."
            }
        ]
    },
    "business_user": {
        "name": "Business User",
        "description": "Business professional with basic tech familiarity",
        "instruction": (
            "Use business-friendly language with some light technical terms when necessary. "
            "Focus on business value and practical implications. "
            "Use workplace analogies (customer records, invoices, inventory). "
            "Explain 'why it matters' for business decisions."
        ),
        "examples": [
            {
                "question": "What is a foreign key?",
                "answer": "It's a connection between two tables, like how an invoice references a customer ID. This lets you link information together - for example, seeing all orders from a specific customer without duplicating their name and address on every order."
            }
        ]
    },
    "technical": {
        "name": "Technical User",
        "description": "Some technical background, can handle proper terminology",
        "instruction": (
            "Use proper technical terminology but keep explanations clear and practical. "
            "Focus on implementation details and best practices. "
            "You can use terms like 'schema', 'foreign key', 'index', 'NULL' but still explain the business implications."
        ),
        "examples": [
            {
                "question": "What is an index?",
                "answer": "An index is a data structure that speeds up data retrieval operations. Think of it like a book's index - instead of reading every page to find a topic, you look it up in the index and jump directly to the right page. This makes queries faster but requires extra storage space."
            }
        ]
    },
    "default": {
        "name": "Default",
        "description": "Balanced approach for general audience",
        "instruction": (
            "Use friendly, accessible language that anyone can understand. "
            "Avoid jargon when possible, but explain technical terms clearly when needed. "
            "Use helpful analogies and focus on practical understanding."
        ),
        "examples": []
    }
}


def _get_client() -> Mistral:
    global _client
    if _client is None:
        _client = Mistral(api_key=settings.MISTRAL_API_KEY)
    return _client


def generate_table_summary(
    table_meta: dict, 
    quality_report: dict | None = None,
    user_profile: str = "beginner",
    industry_context: str = ""
) -> str:
    """
    Generate a personalized markdown summary for a single table.
    
    Args:
        table_meta: Table metadata dictionary
        quality_report: Optional data quality report
        user_profile: User's technical level (beginner, business_user, technical, default)
        industry_context: Optional industry-specific context (e.g., "e-commerce", "healthcare", "finance")
    """
    client = _get_client()
    profile = EXPLANATION_PROFILES.get(user_profile, EXPLANATION_PROFILES["default"])

    # Build personalized prompt
    prompt_parts = [
        f"You are a friendly data expert who explains databases to {profile['name']} users. ",
        profile['instruction'],
        "\n\n"
        "Given the following table information, write a clear, easy-to-read summary in Markdown.\n\n"
        "Include:\n"
        "1. What this table stores and why a business would need it.\n"
        "2. For each column, explain what information it holds.\n"
        "3. How this table connects to other tables.\n"
        "4. If there are any data quality issues, explain what they mean in practical terms.\n\n"
    ]
    
    # Add industry context if provided
    if industry_context:
        prompt_parts.append(
            f"Context: This is a {industry_context} business. "
            f"Use examples and analogies relevant to the {industry_context} industry.\n\n"
        )
    
    # Add few-shot examples if available
    if profile.get("examples"):
        prompt_parts.append("Here are examples of the explanation style to use:\n")
        for ex in profile["examples"]:
            prompt_parts.append(f"Q: {ex['question']}\nA: {ex['answer']}\n\n")
    
    prompt_parts.append(
        f"\n## Table metadata\n```json\n{json.dumps(table_meta, default=str, indent=2)}\n```\n"
    )
    if quality_report:
        prompt_parts.append(
            f"\n## Data quality report\n```json\n{json.dumps(quality_report, default=str, indent=2)}\n```\n"
        )

    response = client.chat.complete(
        model="mistral-small-latest",
        messages=[{"role": "user", "content": "\n".join(prompt_parts)}],
        temperature=0.3,
        max_tokens=2000,
    )
    return response.choices[0].message.content


def chat_about_data(
    messages: list[dict], 
    context: str = "",
    user_profile: str = "beginner",
    industry_context: str = "",
    custom_instructions: str = ""
) -> str:
    """
    Handle a personalized multi-turn chat conversation about the data dictionary.
    
    Args:
        messages: Chat message history
        context: Current data context
        user_profile: User's technical level (beginner, business_user, technical, default)
        industry_context: Optional industry-specific context
        custom_instructions: Optional custom instructions for this user/session
    """
    client = _get_client()
    profile = EXPLANATION_PROFILES.get(user_profile, EXPLANATION_PROFILES["default"])

    # Build personalized system message
    system_msg = (
        f"You are a friendly data expert who explains databases to {profile['name']} users. "
        "Your job is to help people understand their data.\n\n"
        f"{profile['instruction']}\n\n"
        "Guidelines for your responses:\n"
        "- Focus on WHY something matters, not just WHAT it is\n"
        "- When suggesting improvements, explain the practical benefits\n"
        "- Be conversational and friendly\n"
        "- Break down complex concepts into bite-sized pieces\n\n"
    )
    
    # Add industry-specific guidance
    if industry_context:
        system_msg += (
            f"Industry Context: This user works in {industry_context}. "
            f"Use examples, analogies, and terminology familiar to the {industry_context} industry.\n\n"
        )
    
    # Add custom instructions if provided
    if custom_instructions:
        system_msg += f"Special Instructions: {custom_instructions}\n\n"
    
    # Add few-shot examples
    if profile.get("examples"):
        system_msg += "Example responses in the style you should use:\n"
        for ex in profile["examples"]:
            system_msg += f"Q: {ex['question']}\nA: {ex['answer']}\n\n"
    
    if context:
        system_msg += f"\nHere is the current data context:\n{context}\n"

    chat_messages = [{"role": "system", "content": system_msg}] + messages

    response = client.chat.complete(
        model="mistral-small-latest",
        messages=chat_messages,
        temperature=0.4,
        max_tokens=1500,
    )
    return response.choices[0].message.content
