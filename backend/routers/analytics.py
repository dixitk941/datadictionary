"""
Analytics router – provides database-level analytics for dashboard graphs.
Automatically inspects all tables in a connected database and returns:
- Row counts per table
- Column counts per table
- Data type distribution
- Nullable vs non-nullable column ratio
- Table sizes (row-based)
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from services.db_connector import get_engine
from sqlalchemy import inspect as sa_inspect, text

router = APIRouter()


def _safe_row_count(engine, table: str, schema: str = None) -> int:
    """Get row count for a table, return 0 on error."""
    qualified = f'"{schema}"."{table}"' if schema else f'"{table}"'
    try:
        with engine.connect() as conn:
            result = conn.execute(text(f"SELECT COUNT(*) FROM {qualified}"))
            count = result.scalar()
            conn.commit()
            return count or 0
    except Exception:
        return 0


@router.get("/{conn_id}")
async def get_analytics(conn_id: str, schema: Optional[str] = Query(None)):
    """
    Return full analytics for a connected database:
    - tables: list of {name, row_count, column_count, type}
    - type_distribution: {type_name: count}
    - nullable_stats: {nullable: N, non_nullable: N}
    - top_tables_by_rows: sorted desc by row_count (top 15)
    - top_tables_by_columns: sorted desc by column_count (top 15)
    - total_tables, total_columns, total_rows
    """
    try:
        engine = get_engine(conn_id)
    except KeyError:
        raise HTTPException(404, "Connection not found")

    try:
        insp = sa_inspect(engine)
        table_names = insp.get_table_names(schema=schema)
        view_names = insp.get_view_names(schema=schema)
    except Exception as e:
        raise HTTPException(400, f"Failed to inspect database: {e}")

    tables_data = []
    type_distribution = {}
    nullable_count = 0
    non_nullable_count = 0
    total_rows = 0

    # Process tables
    for tname in table_names:
        try:
            cols = insp.get_columns(tname, schema=schema)
        except Exception:
            cols = []

        row_count = _safe_row_count(engine, tname, schema)
        total_rows += row_count

        col_count = len(cols)
        for col in cols:
            raw_type = str(col["type"]).split("(")[0].upper().strip()
            # Normalize common types
            type_name = _normalize_type(raw_type)
            type_distribution[type_name] = type_distribution.get(type_name, 0) + 1
            if col.get("nullable", True):
                nullable_count += 1
            else:
                non_nullable_count += 1

        tables_data.append({
            "name": tname,
            "type": "table",
            "row_count": row_count,
            "column_count": col_count,
        })

    # Process views (column info only, no row counts for speed)
    for vname in view_names:
        try:
            cols = insp.get_columns(vname, schema=schema)
        except Exception:
            cols = []

        col_count = len(cols)
        for col in cols:
            raw_type = str(col["type"]).split("(")[0].upper().strip()
            type_name = _normalize_type(raw_type)
            type_distribution[type_name] = type_distribution.get(type_name, 0) + 1
            if col.get("nullable", True):
                nullable_count += 1
            else:
                non_nullable_count += 1

        tables_data.append({
            "name": vname,
            "type": "view",
            "row_count": 0,
            "column_count": col_count,
        })

    total_columns = sum(t["column_count"] for t in tables_data)

    # Top tables by row count
    top_by_rows = sorted(
        [t for t in tables_data if t["type"] == "table"],
        key=lambda x: x["row_count"],
        reverse=True,
    )[:15]

    # Top tables by column count
    top_by_columns = sorted(
        tables_data,
        key=lambda x: x["column_count"],
        reverse=True,
    )[:15]

    # Type distribution as sorted list for charts
    type_dist_list = sorted(
        [{"type": k, "count": v} for k, v in type_distribution.items()],
        key=lambda x: x["count"],
        reverse=True,
    )

    return {
        "total_tables": len(table_names),
        "total_views": len(view_names),
        "total_columns": total_columns,
        "total_rows": total_rows,
        "tables": tables_data,
        "top_tables_by_rows": top_by_rows,
        "top_tables_by_columns": top_by_columns,
        "type_distribution": type_dist_list,
        "nullable_stats": {
            "nullable": nullable_count,
            "non_nullable": non_nullable_count,
        },
    }


def _normalize_type(raw: str) -> str:
    """Normalize SQL types to friendly categories."""
    raw = raw.upper().strip()

    int_types = {"INTEGER", "INT", "SMALLINT", "BIGINT", "TINYINT", "SERIAL", "BIGSERIAL", "INT4", "INT8", "INT2"}
    float_types = {"FLOAT", "DOUBLE", "REAL", "NUMERIC", "DECIMAL", "DOUBLE PRECISION", "FLOAT8", "FLOAT4", "MONEY"}
    text_types = {"VARCHAR", "TEXT", "CHAR", "CHARACTER VARYING", "NVARCHAR", "NCHAR", "NTEXT", "CLOB", "STRING", "CHARACTER"}
    bool_types = {"BOOLEAN", "BOOL", "BIT"}
    date_types = {"DATE", "DATETIME", "TIMESTAMP", "TIMESTAMPTZ", "TIMESTAMP WITHOUT TIME ZONE", "TIMESTAMP WITH TIME ZONE", "TIME", "TIMETZ", "INTERVAL"}
    json_types = {"JSON", "JSONB"}
    blob_types = {"BLOB", "BYTEA", "BINARY", "VARBINARY", "IMAGE"}
    uuid_types = {"UUID"}

    if raw in int_types:
        return "INTEGER"
    if raw in float_types:
        return "FLOAT"
    if raw in text_types:
        return "TEXT"
    if raw in bool_types:
        return "BOOLEAN"
    if raw in date_types:
        return "DATETIME"
    if raw in json_types:
        return "JSON"
    if raw in blob_types:
        return "BINARY"
    if raw in uuid_types:
        return "UUID"
    return raw
