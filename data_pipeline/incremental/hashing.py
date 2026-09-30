"""
Cryptographic record hashing for change detection and incremental processing.
"""

import hashlib
from typing import List, Dict, Any, Union
import pandas as pd

HASH_COLUMNS = [
    "supplier_id",
    "supplier_name",
    "supplier_type",
    "market",
    "area",
    "latitude",
    "longitude",
    "ingredient",
    "category",
    "price",
    "unit",
    "stock_available",
    "minimum_order",
    "quality_score",
    "rating",
    "reliability_score",
    "delivery_radius_km",
    "average_delivery_time_min",
]


def compute_row_hash(row: Union[pd.Series, Dict[str, Any]]) -> str:
    components = []
    for col in HASH_COLUMNS:
        val = row.get(col, "") if isinstance(row, dict) else row[col] if col in row else ""
        if pd.isna(val):
            val = ""
        components.append(str(val).strip().lower())
    payload = "|".join(components)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def add_record_hashes(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        df["record_hash"] = []
        return df

    out = df.copy()
    out["record_hash"] = out.apply(compute_row_hash, axis=1)
    return out
