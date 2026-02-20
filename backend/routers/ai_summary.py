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
async def table_summary(conn_id: str, table: str, schema: Optional[str] = Query(None)):
    try:
        meta = get_full_table_metadata(conn_id, table, schema)
        quality = analyze_table(conn_id, table, schema)
        summary = generate_table_summary(meta, quality)
        return {"table": table, "schema": schema, "summary": summary}
    except KeyError:
        raise HTTPException(404, "Connection not found")
    except Exception as e:
        raise HTTPException(500, str(e))
