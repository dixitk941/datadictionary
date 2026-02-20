"""
Data quality router.
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from services.quality_analyzer import analyze_table

router = APIRouter()


@router.get("/{conn_id}/tables/{table}")
async def quality_report(conn_id: str, table: str, schema: Optional[str] = Query(None)):
    try:
        return analyze_table(conn_id, table, schema)
    except KeyError:
        raise HTTPException(404, "Connection not found")
    except Exception as e:
        raise HTTPException(400, str(e))
