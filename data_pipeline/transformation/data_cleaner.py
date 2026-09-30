"""
Data transformation module for canonical type casting and string normalization.
"""

from datetime import datetime, timezone
from dataclasses import dataclass
from typing import Optional
import pandas as pd

from data_pipeline.config.pipeline_config import PipelineConfig
from data_pipeline.monitoring.logger import pipeline_logger


@dataclass
class TransformationResult:
    cleaned_df: pd.DataFrame
    record_count: int
    cleaned_timestamp: str
    modifications_count: int


class DataCleaner:
    def __init__(self, config: Optional[PipelineConfig] = None):
        self.config = config or PipelineConfig()
        self.logger = pipeline_logger

    def clean(self, df: pd.DataFrame) -> TransformationResult:
        if df.empty:
            return TransformationResult(
                cleaned_df=pd.DataFrame(),
                record_count=0,
                cleaned_timestamp=datetime.now(timezone.utc).isoformat(),
                modifications_count=0,
            )

        cleaned = df.copy()

        string_cols = [
            "supplier_id", "supplier_name", "supplier_type",
            "market", "area", "ingredient", "category", "unit",
        ]
        for col in string_cols:
            if col in cleaned.columns:
                cleaned[col] = cleaned[col].astype(str).str.strip()

        for col in ["supplier_name", "market", "area", "ingredient", "category", "supplier_type"]:
            if col in cleaned.columns:
                cleaned[col] = cleaned[col].str.title()

        if "unit" in cleaned.columns:
            cleaned["unit"] = cleaned["unit"].str.lower()

        cleaned["price"] = cleaned["price"].astype(float).round(2)
        cleaned["latitude"] = cleaned["latitude"].astype(float).round(6)
        cleaned["longitude"] = cleaned["longitude"].astype(float).round(6)
        cleaned["quality_score"] = pd.to_numeric(cleaned["quality_score"], errors="coerce").round(2)
        cleaned["rating"] = pd.to_numeric(cleaned["rating"], errors="coerce").round(2)
        cleaned["reliability_score"] = pd.to_numeric(cleaned["reliability_score"], errors="coerce").round(2)
        cleaned["delivery_radius_km"] = cleaned["delivery_radius_km"].astype(float).round(2)
        cleaned["stock_available"] = cleaned["stock_available"].astype(int)
        cleaned["minimum_order"] = cleaned["minimum_order"].astype(int)
        cleaned["average_delivery_time_min"] = cleaned["average_delivery_time_min"].astype(int)

        now_ts = datetime.now(timezone.utc).isoformat()
        cleaned["cleaned_timestamp"] = now_ts

        return TransformationResult(
            cleaned_df=cleaned,
            record_count=len(cleaned),
            cleaned_timestamp=now_ts,
            modifications_count=len(cleaned),
        )
