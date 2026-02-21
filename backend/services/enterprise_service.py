"""
Enterprise service – system discovery, cross-DB mapping, ETL preview,
analytics pipelines, workflow automation, and AI-powered business insights.
"""
import json
import time
import uuid
from collections import defaultdict
from sqlalchemy import inspect as sa_inspect, text
from services.db_connector import get_engine, list_connections
from services.metadata_extractor import list_tables, get_columns, get_relationships, get_table_row_count
from services.ai_service import _get_client

# ── In-memory stores ───────────────────────────────────
_pipelines: dict[str, dict] = {}
_workflows: dict[str, dict] = {}
_INSIGHT_CACHE: dict[str, dict] = {}
_INSIGHT_TTL = 600  # 10 min

# ── System classification patterns ─────────────────────
_SYSTEM_PATTERNS = {
    "ERP": {
        "keywords": [
            "order", "invoice", "purchase", "payment", "ledger", "account",
            "inventory", "product", "supplier", "vendor", "shipment", "delivery",
            "warehouse", "stock", "asset", "payroll", "employee", "department",
            "gl_", "ap_", "ar_", "po_", "so_", "journal", "fiscal", "budget",
            "manufacturing", "bom", "routing", "cost_center"
        ],
        "description": "Enterprise Resource Planning – orders, inventory, finance, HR",
        "color": "#3b82f6"
    },
    "CRM": {
        "keywords": [
            "customer", "contact", "lead", "opportunity", "campaign", "deal",
            "prospect", "account", "ticket", "support", "case", "interaction",
            "pipeline", "sales", "engagement", "satisfaction", "feedback",
            "subscription", "renewal", "churn"
        ],
        "description": "Customer Relationship Management – customers, sales, support",
        "color": "#8b5cf6"
    },
    "Analytics": {
        "keywords": [
            "fact_", "dim_", "agg_", "summary", "report", "metric", "kpi",
            "dashboard", "measure", "stat", "snapshot", "history", "log",
            "event", "tracking", "audit", "archive", "warehouse"
        ],
        "description": "Analytics & Reporting – facts, dimensions, metrics",
        "color": "#f59e0b"
    },
    "Auth & Users": {
        "keywords": [
            "user", "role", "permission", "session", "token", "auth",
            "login", "password", "credential", "profile", "preference",
            "setting", "group", "access", "privilege", "oauth"
        ],
        "description": "Authentication & User Management",
        "color": "#ef4444"
    },
    "Content": {
        "keywords": [
            "article", "post", "page", "comment", "category", "tag",
            "media", "file", "image", "document", "attachment", "template",
            "content", "blog", "cms", "publish", "draft"
        ],
        "description": "Content Management – articles, media, documents",
        "color": "#06b6d4"
    },
    "Communication": {
        "keywords": [
            "message", "chat", "email", "notification", "sms", "alert",
            "inbox", "conversation", "thread", "channel", "webhook"
        ],
        "description": "Communication & Messaging",
        "color": "#ec4899"
    },
}


# ── 1. System Discovery ───────────────────────────────

def discover_systems(conn_id: str, schema: str = None) -> dict:
    """
    Scan a connected database and classify tables into system categories.
    Returns classified tables, relationships, and system map.
    """
    engine = get_engine(conn_id)
    insp = sa_inspect(engine)
    tables = insp.get_table_names(schema=schema)
    views = insp.get_view_names(schema=schema)

    classified = defaultdict(list)
    unclassified = []
    table_details = []

    for tname in tables:
        try:
            cols = insp.get_columns(tname, schema=schema)
        except Exception:
            cols = []

        row_count = 0
        try:
            row_count = get_table_row_count(conn_id, tname, schema)
        except Exception:
            pass

        col_names = [c["name"].lower() for c in cols]
        table_lower = tname.lower()

        # Classify by pattern matching
        matched_system = None
        best_score = 0
        for system_name, patterns in _SYSTEM_PATTERNS.items():
            score = 0
            for kw in patterns["keywords"]:
                if kw in table_lower:
                    score += 3
                for cn in col_names:
                    if kw in cn:
                        score += 1
            if score > best_score:
                best_score = score
                matched_system = system_name

        detail = {
            "name": tname,
            "type": "table",
            "columns": len(cols),
            "rows": row_count,
            "system": matched_system if best_score >= 2 else "Other",
            "confidence": min(best_score / 5, 1.0),
        }
        table_details.append(detail)

        if best_score >= 2:
            classified[matched_system].append(detail)
        else:
            unclassified.append(detail)

    # Views
    for vname in views:
        try:
            cols = insp.get_columns(vname, schema=schema)
        except Exception:
            cols = []
        detail = {
            "name": vname,
            "type": "view",
            "columns": len(cols),
            "rows": 0,
            "system": "Analytics",
            "confidence": 0.5,
        }
        table_details.append(detail)
        classified["Analytics"].append(detail)

    # Build system summary
    systems = []
    for sys_name, items in classified.items():
        pattern = _SYSTEM_PATTERNS.get(sys_name, {})
        systems.append({
            "name": sys_name,
            "description": pattern.get("description", sys_name),
            "color": pattern.get("color", "#666"),
            "tables": len(items),
            "total_rows": sum(t["rows"] for t in items),
            "total_columns": sum(t["columns"] for t in items),
            "table_list": [t["name"] for t in items],
        })

    if unclassified:
        systems.append({
            "name": "Other",
            "description": "Unclassified tables",
            "color": "#666666",
            "tables": len(unclassified),
            "total_rows": sum(t["rows"] for t in unclassified),
            "total_columns": sum(t["columns"] for t in unclassified),
            "table_list": [t["name"] for t in unclassified],
        })

    return {
        "total_tables": len(tables),
        "total_views": len(views),
        "systems": sorted(systems, key=lambda s: s["tables"], reverse=True),
        "all_tables": table_details,
    }


# ── 2. Cross-connection mapping ───────────────────────

def cross_map_connections() -> dict:
    """
    Analyze all active connections and find potential cross-DB relationships
    by matching column names and data patterns.
    """
    conns = list_connections()
    if len(conns) < 2:
        return {
            "connections": [c["name"] for c in conns],
            "mappings": [],
            "message": "Need at least 2 active connections to find cross-DB mappings."
        }

    # Gather column signatures per connection
    conn_schemas = {}
    for c in conns:
        try:
            tables = list_tables(c["id"])
            schema_data = []
            for t in tables[:50]:  # Limit to 50 tables per connection
                try:
                    cols = get_columns(c["id"], t["name"], t.get("schema"))
                    schema_data.append({
                        "table": t["name"],
                        "columns": {col["name"].lower(): str(col["type"]) for col in cols}
                    })
                except Exception:
                    pass
            conn_schemas[c["id"]] = {"name": c["name"], "db_type": c["db_type"], "tables": schema_data}
        except Exception:
            pass

    # Find potential mappings (shared column names / FK-like patterns)
    mappings = []
    conn_ids = list(conn_schemas.keys())
    for i in range(len(conn_ids)):
        for j in range(i + 1, len(conn_ids)):
            c1 = conn_schemas[conn_ids[i]]
            c2 = conn_schemas[conn_ids[j]]

            for t1 in c1["tables"]:
                for t2 in c2["tables"]:
                    shared = set(t1["columns"].keys()) & set(t2["columns"].keys())
                    # Filter for meaningful column names (not generic like 'id', 'created_at')
                    meaningful = {col for col in shared if col not in (
                        "id", "created_at", "updated_at", "modified_at", "created_by",
                        "updated_by", "is_active", "is_deleted", "status", "name", "description"
                    )}
                    if meaningful:
                        mappings.append({
                            "source_db": c1["name"],
                            "source_table": t1["table"],
                            "target_db": c2["name"],
                            "target_table": t2["table"],
                            "shared_columns": sorted(meaningful),
                            "confidence": min(len(meaningful) / 3, 1.0),
                        })

    mappings.sort(key=lambda m: m["confidence"], reverse=True)

    return {
        "connections": [{"id": c["id"], "name": c["name"], "db_type": c["db_type"]} for c in conns],
        "mappings": mappings[:50],
        "total_found": len(mappings),
    }


# ── 3. ETL / Data Transform Preview ──────────────────

def etl_preview(
    source_conn_id: str, source_table: str,
    target_conn_id: str, target_table: str,
    column_mapping: dict = None,
    schema: str = None,
    limit: int = 10
) -> dict:
    """
    Preview a data transfer between two tables across connections.
    Shows source sample, mapping, and what the transformed output looks like.
    """
    src_engine = get_engine(source_conn_id)
    tgt_engine = get_engine(target_conn_id)

    # Get source columns
    src_insp = sa_inspect(src_engine)
    tgt_insp = sa_inspect(tgt_engine)

    src_cols = [c["name"] for c in src_insp.get_columns(source_table, schema=schema)]
    try:
        tgt_cols = [c["name"] for c in tgt_insp.get_columns(target_table)]
    except Exception:
        tgt_cols = []

    # Auto-map columns by name if no explicit mapping
    if not column_mapping:
        column_mapping = {}
        src_lower = {c.lower(): c for c in src_cols}
        tgt_lower = {c.lower(): c for c in tgt_cols}
        for sl, sn in src_lower.items():
            if sl in tgt_lower:
                column_mapping[sn] = tgt_lower[sl]

    # Get sample data from source
    qualified = f'"{schema}"."{source_table}"' if schema else f'"{source_table}"'
    sample_data = []
    with src_engine.connect() as conn:
        try:
            result = conn.execute(text(f"SELECT * FROM {qualified} LIMIT {limit}"))
            keys = list(result.keys())
            for row in result:
                sample_data.append(dict(zip(keys, row)))
            conn.commit()
        except Exception as e:
            conn.rollback()
            return {"error": str(e)}

    # Transform preview
    transformed = []
    for row in sample_data:
        new_row = {}
        for src_col, tgt_col in column_mapping.items():
            if src_col in row:
                new_row[tgt_col] = row[src_col]
        transformed.append(new_row)

    return {
        "source_columns": src_cols,
        "target_columns": tgt_cols,
        "column_mapping": column_mapping,
        "unmapped_source": [c for c in src_cols if c not in column_mapping],
        "unmapped_target": [c for c in tgt_cols if c not in column_mapping.values()],
        "sample_source": sample_data[:5],
        "sample_transformed": transformed[:5],
        "total_source_rows": get_table_row_count(source_conn_id, source_table, schema),
    }


def etl_execute(
    source_conn_id: str, source_table: str,
    target_conn_id: str, target_table: str,
    column_mapping: dict,
    schema: str = None,
    batch_size: int = 1000,
    limit: int = None
) -> dict:
    """Execute a data transfer between two tables."""
    src_engine = get_engine(source_conn_id)
    tgt_engine = get_engine(target_conn_id)

    qualified = f'"{schema}"."{source_table}"' if schema else f'"{source_table}"'
    limit_clause = f" LIMIT {limit}" if limit else ""

    src_col_list = ", ".join(f'"{c}"' for c in column_mapping.keys())
    tgt_col_list = ", ".join(f'"{c}"' for c in column_mapping.values())

    rows_transferred = 0
    with src_engine.connect() as src_conn:
        result = src_conn.execute(text(f"SELECT {src_col_list} FROM {qualified}{limit_clause}"))
        batch = []

        for row in result:
            mapped_row = {}
            for i, src_col in enumerate(column_mapping.keys()):
                tgt_col = column_mapping[src_col]
                mapped_row[tgt_col] = row[i]
            batch.append(mapped_row)

            if len(batch) >= batch_size:
                _insert_batch(tgt_engine, target_table, batch)
                rows_transferred += len(batch)
                batch = []

        if batch:
            _insert_batch(tgt_engine, target_table, batch)
            rows_transferred += len(batch)

        src_conn.commit()

    return {
        "status": "completed",
        "rows_transferred": rows_transferred,
        "source": f"{source_table}",
        "target": f"{target_table}",
    }


def _insert_batch(engine, table: str, rows: list[dict]):
    """Insert a batch of rows into a target table."""
    if not rows:
        return
    cols = list(rows[0].keys())
    col_str = ", ".join(f'"{c}"' for c in cols)
    placeholders = ", ".join(f":{c}" for c in cols)
    sql = f'INSERT INTO "{table}" ({col_str}) VALUES ({placeholders})'
    with engine.connect() as conn:
        conn.execute(text(sql), rows)
        conn.commit()


# ── 4. Analytics Pipelines ────────────────────────────

def create_pipeline(name: str, conn_id: str, query_sql: str, description: str = "", schedule: str = "manual") -> dict:
    """Create a saved analytics pipeline (query + visualization config)."""
    pid = str(uuid.uuid4())[:8]
    pipeline = {
        "id": pid,
        "name": name,
        "conn_id": conn_id,
        "query": query_sql,
        "description": description,
        "schedule": schedule,
        "created_at": time.time(),
        "last_run": None,
        "last_result": None,
        "status": "idle",
    }
    _pipelines[pid] = pipeline
    return pipeline


def list_pipelines() -> list[dict]:
    return sorted(_pipelines.values(), key=lambda p: p["created_at"], reverse=True)


def run_pipeline(pipeline_id: str) -> dict:
    """Execute a pipeline query and return results."""
    pipeline = _pipelines.get(pipeline_id)
    if not pipeline:
        raise KeyError("Pipeline not found")

    engine = get_engine(pipeline["conn_id"])
    with engine.connect() as conn:
        try:
            result = conn.execute(text(pipeline["query"]))
            keys = list(result.keys())
            rows = [dict(zip(keys, row)) for row in result.fetchall()]
            conn.commit()
        except Exception as e:
            conn.rollback()
            pipeline["status"] = "error"
            pipeline["last_run"] = time.time()
            raise e

    pipeline["last_run"] = time.time()
    pipeline["status"] = "success"
    pipeline["last_result"] = {
        "columns": keys,
        "rows": rows[:500],
        "total_rows": len(rows),
    }
    return pipeline["last_result"]


def delete_pipeline(pipeline_id: str):
    _pipelines.pop(pipeline_id, None)


# ── 5. Workflow Automation ────────────────────────────

WORKFLOW_TRIGGERS = ["on_connect", "on_schedule", "manual"]
WORKFLOW_ACTIONS = ["quality_scan", "ai_summary", "run_pipeline", "notify"]

def create_workflow(name: str, trigger: str, actions: list[dict], description: str = "") -> dict:
    """Create an automated workflow definition."""
    wid = str(uuid.uuid4())[:8]
    workflow = {
        "id": wid,
        "name": name,
        "trigger": trigger,
        "actions": actions,
        "description": description,
        "enabled": True,
        "created_at": time.time(),
        "last_run": None,
        "run_count": 0,
        "status": "idle",
    }
    _workflows[wid] = workflow
    return workflow


def list_workflows() -> list[dict]:
    return sorted(_workflows.values(), key=lambda w: w["created_at"], reverse=True)


def run_workflow(workflow_id: str, context: dict = None) -> dict:
    """Execute a workflow's action chain."""
    workflow = _workflows.get(workflow_id)
    if not workflow:
        raise KeyError("Workflow not found")

    results = []
    for action in workflow["actions"]:
        action_type = action.get("type")
        action_config = action.get("config", {})

        try:
            if action_type == "quality_scan":
                from services.quality_analyzer import analyze_table
                result = analyze_table(
                    action_config["conn_id"],
                    action_config["table"],
                    action_config.get("schema")
                )
                results.append({"action": "quality_scan", "status": "success", "score": result.get("overall_score")})

            elif action_type == "ai_summary":
                from services.metadata_extractor import get_full_table_metadata
                meta = get_full_table_metadata(
                    action_config["conn_id"],
                    action_config["table"],
                    action_config.get("schema")
                )
                from services.ai_service import generate_table_summary
                summary = generate_table_summary(meta)
                results.append({"action": "ai_summary", "status": "success", "preview": summary[:200]})

            elif action_type == "run_pipeline":
                pid = action_config.get("pipeline_id")
                result = run_pipeline(pid)
                results.append({"action": "run_pipeline", "status": "success", "rows": result["total_rows"]})

            elif action_type == "notify":
                results.append({"action": "notify", "status": "success", "message": action_config.get("message", "Workflow complete")})

            else:
                results.append({"action": action_type, "status": "skipped", "reason": "Unknown action type"})

        except Exception as e:
            results.append({"action": action_type, "status": "error", "error": str(e)})

    workflow["last_run"] = time.time()
    workflow["run_count"] += 1
    workflow["status"] = "completed"

    return {"workflow": workflow["name"], "results": results}


def toggle_workflow(workflow_id: str) -> dict:
    workflow = _workflows.get(workflow_id)
    if not workflow:
        raise KeyError("Workflow not found")
    workflow["enabled"] = not workflow["enabled"]
    return workflow


def delete_workflow(workflow_id: str):
    _workflows.pop(workflow_id, None)


# ── 6. Business Insights (AI) ────────────────────────

def generate_business_insights(conn_id: str, schema: str = None, refresh: bool = False) -> dict:
    """
    Use Mistral AI to analyze the database structure and data patterns,
    and generate actionable business insights.
    """
    cache_key = f"{conn_id}:{schema or '__default__'}"

    if not refresh and cache_key in _INSIGHT_CACHE:
        entry = _INSIGHT_CACHE[cache_key]
        if time.time() - entry["ts"] < _INSIGHT_TTL:
            return {**entry["data"], "cached": True}

    # Gather metadata
    engine = get_engine(conn_id)
    insp = sa_inspect(engine)
    table_names = insp.get_table_names(schema=schema)

    db_summary = []
    for tname in table_names[:30]:  # Limit to avoid excessive token usage
        try:
            cols = insp.get_columns(tname, schema=schema)
            row_count = get_table_row_count(conn_id, tname, schema)
            fks = insp.get_foreign_keys(tname, schema=schema)
            db_summary.append({
                "table": tname,
                "columns": [{"name": c["name"], "type": str(c["type"])} for c in cols],
                "rows": row_count,
                "foreign_keys": [
                    {"from": fk["constrained_columns"], "to": f"{fk['referred_table']}.{fk['referred_columns']}"}
                    for fk in fks
                ]
            })
        except Exception:
            pass

    # Generate insights with AI
    client = _get_client()
    prompt = (
        "You are a senior data analyst and business intelligence expert.\n\n"
        "Analyze the following database schema and generate actionable business insights.\n\n"
        "For each insight, provide:\n"
        "1. **Title** - A short, descriptive title\n"
        "2. **Category** - One of: Revenue, Operations, Customer, Risk, Growth, Efficiency\n"
        "3. **Priority** - high, medium, or low\n"
        "4. **Insight** - What you discovered\n"
        "5. **Recommendation** - Specific action to take\n"
        "6. **SQL** - A sample SQL query that helps investigate or act on this insight\n\n"
        "Generate exactly 6 insights. Return them as a JSON array with keys: "
        "title, category, priority, insight, recommendation, sql\n\n"
        f"Database schema:\n```json\n{json.dumps(db_summary, default=str)}\n```\n\n"
        "Return ONLY the JSON array, no other text."
    )

    response = client.chat.complete(
        model="mistral-small-latest",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.4,
        max_tokens=3000,
    )

    raw = response.choices[0].message.content.strip()

    # Parse JSON from response
    try:
        # Strip markdown code fences if present
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1]
            raw = raw.rsplit("```", 1)[0]
        insights = json.loads(raw)
    except json.JSONDecodeError:
        insights = [{"title": "Analysis Complete", "category": "General",
                      "priority": "medium", "insight": raw,
                      "recommendation": "Review the analysis above.", "sql": ""}]

    result = {
        "conn_id": conn_id,
        "total_tables": len(table_names),
        "tables_analyzed": len(db_summary),
        "insights": insights,
        "generated_at": time.time(),
    }

    _INSIGHT_CACHE[cache_key] = {"data": result, "ts": time.time()}
    return {**result, "cached": False}
