"""
Chat router – multi-turn AI chat about the data dictionary.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.ai_service import chat_about_data, EXPLANATION_PROFILES

router = APIRouter()


class ChatRequest(BaseModel):
    messages: list[dict]  # [{role: "user"|"assistant", content: "..."}]
    context: str = ""     # optional data context string
    user_profile: str = "beginner"  # beginner, business_user, technical, default
    industry: str = ""    # optional industry context
    custom_instructions: str = ""  # optional custom instructions


@router.post("")
async def chat(req: ChatRequest):
    """
    Personalized AI chat about data dictionary.
    
    - **user_profile**: Choose explanation style (beginner, business_user, technical, default)
    - **industry**: Add industry-specific context
    - **custom_instructions**: Add any special instructions for this session
    """
    try:
        reply = chat_about_data(
            req.messages, 
            req.context,
            user_profile=req.user_profile,
            industry_context=req.industry,
            custom_instructions=req.custom_instructions
        )
        return {
            "reply": reply,
            "profile_used": req.user_profile
        }
    except Exception as e:
        raise HTTPException(500, str(e))


@router.get("/profiles")
async def get_profiles():
    """
    Get available user profiles and their descriptions.
    Helps users choose the right personalization level.
    """
    return {
        "profiles": {
            key: {
                "name": profile["name"],
                "description": profile["description"]
            }
            for key, profile in EXPLANATION_PROFILES.items()
        }
    }
