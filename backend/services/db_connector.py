"""
Database connector service – supports PostgreSQL, SQL Server, Snowflake, SQLite.
Each connection is kept in an in-memory registry keyed by a UUID.
Connections are persisted to a JSON cache file for auto-reconnection on restart.
"""
import json
import os
import uuid
from typing import Optional
from urllib.parse import quote_plus
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.engine import Engine
import base64

_ENGINES: dict[str, dict] = {}
_CACHE_FILE = os.path.join(os.path.dirname(__file__), "..", "connections_cache.json")


def _encode_password(password: str) -> str:
    """Simple base64 encoding for password storage."""
    return base64.b64encode(password.encode()).decode()


def _decode_password(encoded: str) -> str:
    """Decode base64 encoded password."""
    return base64.b64decode(encoded.encode()).decode()


def _load_cache() -> dict:
    """Load cached connections from file."""
    if os.path.exists(_CACHE_FILE):
        try:
            with open(_CACHE_FILE, "r") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}


def _save_cache(cache: dict):
    """Save connections cache to file."""
    try:
        with open(_CACHE_FILE, "w") as f:
            json.dump(cache, f, indent=2)
    except Exception as e:
        print(f"Warning: Could not save connections cache: {e}")


def _build_url(db_type: str, cfg: dict) -> str:
    """Return a SQLAlchemy connection URL for the given db type."""
    t = db_type.lower()
    # URL-encode user and password to handle special characters
    user = quote_plus(cfg.get('user', ''))
    password = quote_plus(cfg.get('password', ''))
    
    if t == "postgresql":
        return (
            f"postgresql+psycopg2://{user}:{password}"
            f"@{cfg['host']}:{cfg.get('port', 5432)}/{cfg['database']}"
        )
    if t == "sqlserver":
        return (
            f"mssql+pymssql://{user}:{password}"
            f"@{cfg['host']}:{cfg.get('port', 1433)}/{cfg['database']}"
        )
    if t == "snowflake":
        account = cfg["account"]
        database = cfg["database"]
        warehouse = quote_plus(cfg.get("warehouse", ""))
        schema = cfg.get("schema", "public")
        return (
            f"snowflake://{user}:{password}@{account}/{database}/{schema}"
            f"?warehouse={warehouse}"
        )
    if t == "sqlite":
        return f"sqlite:///{cfg['database']}"
    raise ValueError(f"Unsupported database type: {db_type}")


def create_connection(db_type: str, config: dict, name: Optional[str] = None, conn_id: Optional[str] = None) -> dict:
    """Create a new engine, test it, store it, return connection info."""
    url = _build_url(db_type, config)
    engine = create_engine(url, pool_pre_ping=True)
    # Quick connectivity check
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    
    if conn_id is None:
        conn_id = str(uuid.uuid4())
    
    connection_name = name or f"{db_type}_{conn_id[:8]}"
    
    _ENGINES[conn_id] = {
        "id": conn_id,
        "name": connection_name,
        "db_type": db_type,
        "engine": engine,
        "config": {k: v for k, v in config.items() if k != "password"},
    }
    
    # Save to cache (with encoded password)
    cache = _load_cache()
    cache[conn_id] = {
        "id": conn_id,
        "name": connection_name,
        "db_type": db_type,
        "config": {**config, "password": _encode_password(config.get("password", ""))},
    }
    _save_cache(cache)
    
    return {"id": conn_id, "name": connection_name, "db_type": db_type, "status": "connected"}


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
    
    # Remove from cache
    cache = _load_cache()
    if conn_id in cache:
        del cache[conn_id]
        _save_cache(cache)


def load_cached_connections():
    """Load all cached connections on startup. Called from main.py."""
    cache = _load_cache()
    loaded = 0
    failed = 0
    
    for conn_id, data in cache.items():
        if conn_id in _ENGINES:
            continue  # Already loaded
        
        try:
            # Decode password and reconstruct config
            config = {**data["config"]}
            if "password" in config:
                config["password"] = _decode_password(config["password"])
            
            # Recreate the connection
            url = _build_url(data["db_type"], config)
            engine = create_engine(url, pool_pre_ping=True)
            
            # Test connection
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            
            _ENGINES[conn_id] = {
                "id": conn_id,
                "name": data["name"],
                "db_type": data["db_type"],
                "engine": engine,
                "config": {k: v for k, v in config.items() if k != "password"},
            }
            loaded += 1
            print(f"✓ Restored connection: {data['name']}")
        except Exception as e:
            failed += 1
            print(f"✗ Failed to restore connection {data['name']}: {e}")
    
    if loaded > 0 or failed > 0:
        print(f"Connection cache: {loaded} restored, {failed} failed")


def get_inspector(conn_id: str):
    engine = get_engine(conn_id)
    return inspect(engine)
