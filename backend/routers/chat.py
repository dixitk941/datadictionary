"""
Chat router – multi-turn AI chat about the data dictionary.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.ai_service import chat_about_data

router = APIRouter()


class ChatRequest(BaseModel):
    messages: list[dict]  # [{role: "user"|"assistant", content: "..."}]
    context: str = ""     # optional data context string


@router.post("")
async def chat(req: ChatRequest):
    try:
        reply = chat_about_data(req.messages, req.context)
        return {"reply": reply}
    except Exception as e:
        raise HTTPException(500, str(e))
