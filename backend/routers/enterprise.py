"""
Enterprise router – system discovery, cross-DB mapping, ETL,
analytics pipelines, workflow automation, and business insights.
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from services.enterprise_service import (
    discover_systems,
    cross_map_connections,
    etl_preview,
    etl_execute,
    create_pipeline,
    list_pipelines,
    run_pipeline,
    delete_pipeline,
    create_workflow,
    list_workflows,
    run_workflow,
    toggle_workflow,
    delete_workflow,
    generate_business_insights,
)

router = APIRouter()


# ── 1. System Discovery ─────────────────────────────

@router.get("/discover/{conn_id}")
async def api_discover_systems(conn_id: str, schema: Optional[str] = Query(None)):
    """Scan a connected database and classify tables into system categories."""
    try:
        return discover_systems(conn_id, schema)
    except KeyError:
        raise HTTPException(404, "Connection not found")
    except Exception as e:
        raise HTTPException(400, str(e))


# ── 2. Cross-connection mapping ─────────────────────

@router.get("/cross-map")
async def api_cross_map():
    """Find potential cross-DB relationships across all active connections."""
    try:
        return cross_map_connections()
    except Exception as e:
        raise HTTPException(400, str(e))


# ── 3. ETL / Data Transform ─────────────────────────

class ETLPreviewRequest(BaseModel):
    source_conn_id: str
    source_table: str
    target_conn_id: str
    target_table: str
    column_mapping: Optional[dict] = None
    schema: Optional[str] = None


class ETLExecuteRequest(ETLPreviewRequest):
    column_mapping: dict
    batch_size: int = 1000
    limit: Optional[int] = None


@router.post("/etl/preview")
async def api_etl_preview(req: ETLPreviewRequest):
    """Preview a data transform between two tables."""
    try:
        return etl_preview(
            req.source_conn_id, req.source_table,
            req.target_conn_id, req.target_table,
            req.column_mapping, req.schema
        )
    except KeyError:
        raise HTTPException(404, "Connection not found")
    except Exception as e:
        raise HTTPException(400, str(e))


@router.post("/etl/execute")
async def api_etl_execute(req: ETLExecuteRequest):
    """Execute a data transfer between tables."""
    try:
        return etl_execute(
            req.source_conn_id, req.source_table,
            req.target_conn_id, req.target_table,
            req.column_mapping, req.schema,
            req.batch_size, req.limit
        )
    except KeyError:
        raise HTTPException(404, "Connection not found")
    except Exception as e:
        raise HTTPException(400, str(e))


# ── 4. Analytics Pipelines ──────────────────────────

class PipelineRequest(BaseModel):
    name: str
    conn_id: str
    query: str
    description: str = ""
    schedule: str = "manual"


@router.get("/pipelines")
async def api_list_pipelines():
    return list_pipelines()


@router.post("/pipelines")
async def api_create_pipeline(req: PipelineRequest):
    try:
        return create_pipeline(req.name, req.conn_id, req.query, req.description, req.schedule)
    except Exception as e:
        raise HTTPException(400, str(e))


@router.post("/pipelines/{pipeline_id}/run")
async def api_run_pipeline(pipeline_id: str):
    try:
        return run_pipeline(pipeline_id)
    except KeyError:
        raise HTTPException(404, "Pipeline not found")
    except Exception as e:
        raise HTTPException(400, str(e))


@router.delete("/pipelines/{pipeline_id}")
async def api_delete_pipeline(pipeline_id: str):
    delete_pipeline(pipeline_id)
    return {"status": "deleted"}


# ── 5. Workflow Automation ──────────────────────────

class WorkflowAction(BaseModel):
    type: str
    config: dict = {}


class WorkflowRequest(BaseModel):
    name: str
    trigger: str
    actions: list[WorkflowAction]
    description: str = ""


@router.get("/workflows")
async def api_list_workflows():
    return list_workflows()


@router.post("/workflows")
async def api_create_workflow(req: WorkflowRequest):
    actions = [a.model_dump() for a in req.actions]
    try:
        return create_workflow(req.name, req.trigger, actions, req.description)
    except Exception as e:
        raise HTTPException(400, str(e))


@router.post("/workflows/{workflow_id}/run")
async def api_run_workflow(workflow_id: str):
    try:
        return run_workflow(workflow_id)
    except KeyError:
        raise HTTPException(404, "Workflow not found")
    except Exception as e:
        raise HTTPException(400, str(e))


@router.post("/workflows/{workflow_id}/toggle")
async def api_toggle_workflow(workflow_id: str):
    try:
        return toggle_workflow(workflow_id)
    except KeyError:
        raise HTTPException(404, "Workflow not found")


@router.delete("/workflows/{workflow_id}")
async def api_delete_workflow(workflow_id: str):
    delete_workflow(workflow_id)
    return {"status": "deleted"}


# ── 6. Business Insights (AI) ──────────────────────

@router.get("/insights/{conn_id}")
async def api_business_insights(
    conn_id: str,
    schema: Optional[str] = Query(None),
    refresh: bool = Query(False),
):
    """Generate AI-powered business insights for a connected database."""
    try:
        return generate_business_insights(conn_id, schema, refresh)
    except KeyError:
        raise HTTPException(404, "Connection not found")
    except Exception as e:
        raise HTTPException(400, str(e))
