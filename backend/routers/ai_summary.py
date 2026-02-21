"""
AI summary router.
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from services.metadata_extractor import get_full_table_metadata
from services.quality_analyzer import analyze_table
from services.ai_service import generate_table_summary

router = APIRouter()


@router.get("/{conn_id}/tables/{table}/summary")
async def table_summary(
    conn_id: str, 
    table: str, 
    schema: Optional[str] = Query(None),
    user_profile: str = Query("beginner", description="User's technical level: beginner, business_user, technical, default"),
    industry: Optional[str] = Query(None, description="Industry context (e.g., e-commerce, healthcare, finance)")
):
    """
    Generate a personalized AI summary for a table.
    
    - **user_profile**: Choose explanation style (beginner, business_user, technical, default)
    - **industry**: Add industry-specific context and analogies
    """
    try:
        meta = get_full_table_metadata(conn_id, table, schema)
        quality = analyze_table(conn_id, table, schema)
        summary = generate_table_summary(
            meta, 
            quality, 
            user_profile=user_profile,
            industry_context=industry or ""
        )
        return {
            "table": table, 
            "schema": schema, 
            "summary": summary,
            "profile_used": user_profile
        }
    except KeyError:
        raise HTTPException(404, "Connection not found")
    except Exception as e:
        raise HTTPException(500, str(e))
