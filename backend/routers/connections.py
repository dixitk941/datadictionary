"""
Connections router – create, list, delete database connections.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from services.db_connector import create_connection, list_connections, remove_connection

router = APIRouter()


class ConnectionRequest(BaseModel):
    db_type: str  # postgresql | sqlserver | snowflake | sqlite
    name: Optional[str] = None
    host: Optional[str] = None
    port: Optional[int] = None
    database: str
    user: Optional[str] = None
    password: Optional[str] = None
    # Snowflake-specific
    account: Optional[str] = None
    warehouse: Optional[str] = None
    schema_name: Optional[str] = None


@router.post("")
async def add_connection(req: ConnectionRequest):
    cfg = req.model_dump(exclude_none=True, exclude={"db_type", "name", "schema_name"})
    if req.schema_name:
        cfg["schema"] = req.schema_name
    try:
        result = create_connection(req.db_type, cfg, name=req.name)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("")
async def get_connections():
    return list_connections()


@router.delete("/{conn_id}")
async def delete_connection(conn_id: str):
    remove_connection(conn_id)
    return {"status": "removed"}
