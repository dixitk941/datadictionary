"""
Metadata router – schemas, tables, columns, relationships, indexes.
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from services.metadata_extractor import (
    list_schemas,
    list_tables,
    get_columns,
    get_relationships,
    get_indexes,
    get_full_table_metadata,
)

router = APIRouter()


@router.get("/{conn_id}/schemas")
async def schemas(conn_id: str):
    try:
        return list_schemas(conn_id)
    except KeyError:
        raise HTTPException(404, "Connection not found")


@router.get("/{conn_id}/tables")
async def tables(conn_id: str, schema: Optional[str] = Query(None)):
    try:
        return list_tables(conn_id, schema)
    except KeyError:
        raise HTTPException(404, "Connection not found")


@router.get("/{conn_id}/tables/{table}")
async def table_detail(conn_id: str, table: str, schema: Optional[str] = Query(None)):
    try:
        return get_full_table_metadata(conn_id, table, schema)
    except KeyError:
        raise HTTPException(404, "Connection not found")
    except Exception as e:
        raise HTTPException(400, str(e))


@router.get("/{conn_id}/tables/{table}/columns")
async def columns(conn_id: str, table: str, schema: Optional[str] = Query(None)):
    try:
        return get_columns(conn_id, table, schema)
    except KeyError:
        raise HTTPException(404, "Connection not found")


@router.get("/{conn_id}/tables/{table}/relationships")
async def relationships(conn_id: str, table: str, schema: Optional[str] = Query(None)):
    try:
        return get_relationships(conn_id, table, schema)
    except KeyError:
        raise HTTPException(404, "Connection not found")


@router.get("/{conn_id}/tables/{table}/indexes")
async def indexes(conn_id: str, table: str, schema: Optional[str] = Query(None)):
    try:
        return get_indexes(conn_id, table, schema)
    except KeyError:
        raise HTTPException(404, "Connection not found")
