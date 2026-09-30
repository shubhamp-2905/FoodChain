"""
Feature engineering module producing analytics, ranking, and ML features.
"""

from datetime import datetime, timezone
from dataclasses import dataclass
from typing import Optional, List
import pandas as pd
import numpy as np

from data_pipeline.config.pipeline_config import PipelineConfig
from data_pipeline.monitoring.logger import pipeline_logger


@dataclass
class FeatureEngineeringResult:
    curated_df: pd.DataFrame
    record_count: int
    features_generated: List[str]
    curated_timestamp: str


class FeatureEngineer:
    def __init__(self, config: Optional[PipelineConfig] = None):
        self.config = config or PipelineConfig()
        self.logger = pipeline_logger

    def engineer_features(self, df: pd.DataFrame) -> FeatureEngineeringResult:
        if df.empty:
            return FeatureEngineeringResult(
                curated_df=pd.DataFrame(),
                record_count=0,
                features_generated=[],
                curated_timestamp=datetime.now(timezone.utc).isoformat(),
            )

        curated = df.copy()

        mean_prices = curated.groupby("ingredient")["price"].transform("mean")
        curated["ingredient_mean_price"] = mean_prices.round(2)
        curated["price_index_ratio"] = (curated["price"] / mean_prices).round(3)

        rating_norm = curated["rating"] / 5.0
        quality_norm = curated["quality_score"] / 5.0
        reliability_norm = curated["reliability_score"] / 100.0
        curated["composite_quality_score"] = (
            0.40 * rating_norm + 0.30 * quality_norm + 0.30 * reliability_norm
        ).round(4)

        curated["reliability_tier"] = pd.cut(
            curated["reliability_score"],
            bins=[-np.inf, 75.0, 90.0, np.inf],
            labels=["Tier 3 (<75)", "Tier 2 (75-90)", "Tier 1 (>90)"],
        ).astype(str)

        curated["delivery_speed_tier"] = pd.cut(
            curated["average_delivery_time_min"],
            bins=[-np.inf, 20, 35, np.inf],
            labels=["Fast (<20m)", "Standard (20-35m)", "Slow (>35m)"],
        ).astype(str)

        curated["is_bulk_supplier"] = curated["minimum_order"] >= 50
        curated["geo_bucket_lat"] = curated["latitude"].round(2)
        curated["geo_bucket_lon"] = curated["longitude"].round(2)

        now_ts = datetime.now(timezone.utc).isoformat()
        curated["curated_timestamp"] = now_ts

        new_features = [
            "ingredient_mean_price",
            "price_index_ratio",
            "composite_quality_score",
            "reliability_tier",
            "delivery_speed_tier",
            "is_bulk_supplier",
            "geo_bucket_lat",
            "geo_bucket_lon",
            "curated_timestamp",
        ]

        return FeatureEngineeringResult(
            curated_df=curated,
            record_count=len(curated),
            features_generated=new_features,
            curated_timestamp=now_ts,
        )
