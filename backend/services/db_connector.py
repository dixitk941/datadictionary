"""
Database connector service – supports PostgreSQL, SQL Server, Snowflake, SQLite.
Each connection is kept in an in-memory registry keyed by a UUID.
"""
import uuid
from typing import Optional
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.engine import Engine


_ENGINES: dict[str, dict] = {}


def _build_url(db_type: str, cfg: dict) -> str:
    """Return a SQLAlchemy connection URL for the given db type."""
    t = db_type.lower()
    if t == "postgresql":
        return (
            f"postgresql+psycopg2://{cfg['user']}:{cfg['password']}"
            f"@{cfg['host']}:{cfg.get('port', 5432)}/{cfg['database']}"
        )
    if t == "sqlserver":
        return (
            f"mssql+pymssql://{cfg['user']}:{cfg['password']}"
            f"@{cfg['host']}:{cfg.get('port', 1433)}/{cfg['database']}"
        )
    if t == "snowflake":
        account = cfg["account"]
        user = cfg["user"]
        password = cfg["password"]
        database = cfg["database"]
        warehouse = cfg.get("warehouse", "")
        schema = cfg.get("schema", "public")
        return (
            f"snowflake://{user}:{password}@{account}/{database}/{schema}"
            f"?warehouse={warehouse}"
        )
    if t == "sqlite":
        return f"sqlite:///{cfg['database']}"
    raise ValueError(f"Unsupported database type: {db_type}")


def create_connection(db_type: str, config: dict, name: Optional[str] = None) -> dict:
    """Create a new engine, test it, store it, return connection info."""
    url = _build_url(db_type, config)
    engine = create_engine(url, pool_pre_ping=True)
    # Quick connectivity check
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    conn_id = str(uuid.uuid4())
    _ENGINES[conn_id] = {
        "id": conn_id,
        "name": name or f"{db_type}_{conn_id[:8]}",
        "db_type": db_type,
        "engine": engine,
        "config": {k: v for k, v in config.items() if k != "password"},
    }
    return {"id": conn_id, "name": _ENGINES[conn_id]["name"], "db_type": db_type, "status": "connected"}


def get_engine(conn_id: str) -> Engine:
    entry = _ENGINES.get(conn_id)
    if not entry:
        raise KeyError(f"Connection {conn_id} not found")
    return entry["engine"]


def list_connections() -> list[dict]:
    return [
        {"id": v["id"], "name": v["name"], "db_type": v["db_type"], "status": "connected"}
        for v in _ENGINES.values()
    ]


def remove_connection(conn_id: str):
    entry = _ENGINES.pop(conn_id, None)
    if entry:
        entry["engine"].dispose()


def get_inspector(conn_id: str):
    engine = get_engine(conn_id)
    return inspect(engine)
