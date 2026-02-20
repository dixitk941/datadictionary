"""
Data quality analysis service.
Computes completeness, uniqueness, freshness heuristics, statistical
summaries, and key-health metrics per column / table.
"""
import math
from sqlalchemy import text
from services.db_connector import get_engine


def _q(name: str) -> str:
    return f'"{name}"'


def analyze_table(conn_id: str, table: str, schema: str = None, sample_limit: int = 50000) -> dict:
    """Run a comprehensive quality analysis on a single table."""
    engine = get_engine(conn_id)
    qualified = f'{_q(schema)}.{_q(table)}' if schema else _q(table)

    with engine.connect() as conn:
        # Total rows
        row_count = conn.execute(text(f"SELECT COUNT(*) FROM {qualified}")).scalar()
        if row_count == 0:
            return {"table": table, "schema": schema, "row_count": 0, "columns": [], "overall_score": 0}

        # Get column names & types
        cols_result = conn.execute(text(
            f"SELECT * FROM {qualified} LIMIT 0"
        ))
        col_names = list(cols_result.keys())

        column_reports = []
        total_completeness = 0

        for col in col_names:
            report = _analyze_column(conn, qualified, col, row_count, sample_limit)
            column_reports.append(report)
            total_completeness += report["completeness"]

    overall_completeness = total_completeness / len(col_names) if col_names else 0
    overall_score = round(overall_completeness * 100, 1)

    return {
        "table": table,
        "schema": schema,
        "row_count": row_count,
        "columns": column_reports,
        "overall_score": overall_score,
    }


def _analyze_column(conn, qualified_table: str, col: str, row_count: int, sample_limit: int) -> dict:
    qc = _q(col)
    # Null count
    null_count = conn.execute(
        text(f"SELECT COUNT(*) FROM {qualified_table} WHERE {qc} IS NULL")
    ).scalar()
    completeness = round((row_count - null_count) / row_count, 4) if row_count else 0

    # Distinct count
    distinct_count = conn.execute(
        text(f"SELECT COUNT(DISTINCT {qc}) FROM {qualified_table}")
    ).scalar()
    uniqueness = round(distinct_count / row_count, 4) if row_count else 0

    report = {
        "column": col,
        "null_count": null_count,
        "completeness": completeness,
        "distinct_count": distinct_count,
        "uniqueness": uniqueness,
        "stats": None,
    }

    # Attempt numeric stats
    try:
        stats_row = conn.execute(text(
            f"SELECT "
            f"  MIN({qc})        AS min_val, "
            f"  MAX({qc})        AS max_val, "
            f"  AVG(CAST({qc} AS DOUBLE PRECISION)) AS mean_val, "
            f"  STDDEV(CAST({qc} AS DOUBLE PRECISION)) AS stddev_val "
            f"FROM {qualified_table} "
            f"WHERE {qc} IS NOT NULL"
        )).mappings().first()

        if stats_row and stats_row["mean_val"] is not None:
            mean = float(stats_row["mean_val"])
            stddev = float(stats_row["stddev_val"]) if stats_row["stddev_val"] else 0
            report["stats"] = {
                "min": _safe_number(stats_row["min_val"]),
                "max": _safe_number(stats_row["max_val"]),
                "mean": round(mean, 4),
                "stddev": round(stddev, 4),
                "cv": round(stddev / mean, 4) if mean != 0 else None,
            }
    except Exception:
        pass  # non-numeric column

    # Text-length stats for string-like columns (fallback)
    if report["stats"] is None:
        try:
            len_row = conn.execute(text(
                f"SELECT "
                f"  MIN(LENGTH(CAST({qc} AS VARCHAR))) AS min_len, "
                f"  MAX(LENGTH(CAST({qc} AS VARCHAR))) AS max_len, "
                f"  AVG(LENGTH(CAST({qc} AS VARCHAR))) AS avg_len "
                f"FROM {qualified_table} "
                f"WHERE {qc} IS NOT NULL"
            )).mappings().first()
            if len_row and len_row["avg_len"] is not None:
                report["stats"] = {
                    "type": "text_length",
                    "min_length": int(len_row["min_len"]),
                    "max_length": int(len_row["max_len"]),
                    "avg_length": round(float(len_row["avg_len"]), 2),
                }
        except Exception:
            pass

    return report


def _safe_number(val):
    if val is None:
        return None
    try:
        f = float(val)
        if math.isnan(f) or math.isinf(f):
            return None
        return f
    except (TypeError, ValueError):
        return str(val)
