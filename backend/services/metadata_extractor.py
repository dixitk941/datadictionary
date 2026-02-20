"""
Metadata extraction service – pulls tables, columns, relationships,
constraints, and indexes from any connected database via SQLAlchemy inspect.
"""
from sqlalchemy import inspect as sa_inspect, text
from services.db_connector import get_engine


def list_schemas(conn_id: str) -> list[str]:
    engine = get_engine(conn_id)
    insp = sa_inspect(engine)
    return insp.get_schema_names()


def list_tables(conn_id: str, schema: str = None) -> list[dict]:
    engine = get_engine(conn_id)
    insp = sa_inspect(engine)
    tables = insp.get_table_names(schema=schema)
    views = insp.get_view_names(schema=schema)
    result = [{"name": t, "type": "table", "schema": schema} for t in tables]
    result += [{"name": v, "type": "view", "schema": schema} for v in views]
    return result


def get_columns(conn_id: str, table: str, schema: str = None) -> list[dict]:
    engine = get_engine(conn_id)
    insp = sa_inspect(engine)
    cols = insp.get_columns(table, schema=schema)
    pk_cols = set()
    try:
        pk = insp.get_pk_constraint(table, schema=schema)
        pk_cols = set(pk.get("constrained_columns", []))
    except Exception:
        pass
    result = []
    for c in cols:
        result.append({
            "name": c["name"],
            "type": str(c["type"]),
            "nullable": c.get("nullable", True),
            "default": str(c.get("default")) if c.get("default") is not None else None,
            "primary_key": c["name"] in pk_cols,
            "comment": c.get("comment"),
        })
    return result


def get_relationships(conn_id: str, table: str, schema: str = None) -> list[dict]:
    engine = get_engine(conn_id)
    insp = sa_inspect(engine)
    fks = insp.get_foreign_keys(table, schema=schema)
    return [
        {
            "name": fk.get("name"),
            "constrained_columns": fk["constrained_columns"],
            "referred_schema": fk.get("referred_schema"),
            "referred_table": fk["referred_table"],
            "referred_columns": fk["referred_columns"],
        }
        for fk in fks
    ]


def get_indexes(conn_id: str, table: str, schema: str = None) -> list[dict]:
    engine = get_engine(conn_id)
    insp = sa_inspect(engine)
    indexes = insp.get_indexes(table, schema=schema)
    return [
        {
            "name": idx.get("name"),
            "columns": idx["column_names"],
            "unique": idx.get("unique", False),
        }
        for idx in indexes
    ]


def get_table_row_count(conn_id: str, table: str, schema: str = None) -> int:
    engine = get_engine(conn_id)
    qualified = f'"{schema}"."{table}"' if schema else f'"{table}"'
    with engine.connect() as conn:
        result = conn.execute(text(f"SELECT COUNT(*) FROM {qualified}"))
        return result.scalar()


def get_full_table_metadata(conn_id: str, table: str, schema: str = None) -> dict:
    """Return a complete metadata bundle for one table."""
    return {
        "table": table,
        "schema": schema,
        "columns": get_columns(conn_id, table, schema),
        "relationships": get_relationships(conn_id, table, schema),
        "indexes": get_indexes(conn_id, table, schema),
        "row_count": get_table_row_count(conn_id, table, schema),
    }
