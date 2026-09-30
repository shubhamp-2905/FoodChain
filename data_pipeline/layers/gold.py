"""
Gold Layer Processor — Analytics, ML inference, and supplier ranking features.
"""

from datetime import datetime, timezone
from typing import Optional
import numpy as np
import pandas as pd

from data_pipeline.config.pipeline_config import PipelineConfig


class GoldLayer:
    def __init__(self, config: Optional[PipelineConfig] = None):
        self.config = config or PipelineConfig()

    def process(self, silver_df: pd.DataFrame) -> pd.DataFrame:
        if silver_df.empty:
            return pd.DataFrame()

        gold = silver_df.copy()

        # Ranking features
        mean_prices = gold.groupby("ingredient")["price"].transform("mean")
        gold["ingredient_mean_price"] = mean_prices.round(2)
        gold["price_index_ratio"] = (gold["price"] / mean_prices).round(3)

        rating_norm = gold["rating"].fillna(2.5) / 5.0
        quality_norm = gold["quality_score"].fillna(2.5) / 5.0
        reliability_norm = gold["reliability_score"].fillna(50.0) / 100.0
        gold["composite_quality_score"] = (
            0.40 * rating_norm + 0.30 * quality_norm + 0.30 * reliability_norm
        ).round(4)

        gold["reliability_tier"] = pd.cut(
            gold["reliability_score"].fillna(50.0),
            bins=[-np.inf, 75.0, 90.0, np.inf],
            labels=["Tier 3 (<75)", "Tier 2 (75-90)", "Tier 1 (>90)"],
        ).astype(str)

        # Geospatial features
        gold["geo_bucket_lat"] = gold["latitude"].round(2)
        gold["geo_bucket_lon"] = gold["longitude"].round(2)

        # Reporting & operational features
        gold["delivery_speed_tier"] = pd.cut(
            gold["average_delivery_time_min"],
            bins=[-np.inf, 20, 35, np.inf],
            labels=["Fast (<20m)", "Standard (20-35m)", "Slow (>35m)"],
        ).astype(str)
        gold["is_bulk_supplier"] = gold["minimum_order"] >= 50

        gold["gold_processed_at"] = datetime.now(timezone.utc).isoformat()
        return gold
