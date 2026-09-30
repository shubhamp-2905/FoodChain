"""
Data validation module with range boundaries, schema validation, and quarantine routing.
"""

from datetime import datetime, timezone
from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np

from data_pipeline.config.pipeline_config import PipelineConfig
from data_pipeline.monitoring.logger import pipeline_logger


class ValidationError(Exception):
    pass


@dataclass
class ValidationSummary:
    total_records: int
    valid_records: int
    invalid_records: int
    duplicate_records: int
    quality_status: str
    failure_reasons_breakdown: Dict[str, int] = field(default_factory=dict)
    validation_timestamp: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "total_records": self.total_records,
            "valid_records": self.valid_records,
            "invalid_records": self.invalid_records,
            "duplicate_records": self.duplicate_records,
            "quality_status": self.quality_status,
            "failure_reasons_breakdown": self.failure_reasons_breakdown,
            "validation_timestamp": self.validation_timestamp,
        }


@dataclass
class ValidationResult:
    valid_df: pd.DataFrame
    quarantined_df: pd.DataFrame
    summary: ValidationSummary


class DataValidator:
    def __init__(self, config: Optional[PipelineConfig] = None):
        self.config = config or PipelineConfig()
        self.t = self.config.thresholds
        self.logger = pipeline_logger

    def validate(self, df: pd.DataFrame) -> ValidationResult:
        total = len(df)
        if total == 0:
            summary = ValidationSummary(
                total_records=0, valid_records=0, invalid_records=0,
                duplicate_records=0, quality_status="FAIL",
            )
            return ValidationResult(pd.DataFrame(), pd.DataFrame(), summary)

        work_df = df.copy()
        failure_reasons: List[List[str]] = [[] for _ in range(total)]
        duplicate_flags: List[bool] = [False] * total

        mandatory_fields = [
            "supplier_id", "ingredient", "price", "latitude", "longitude",
            "delivery_radius_km", "average_delivery_time_min",
        ]
        for field_name in mandatory_fields:
            if field_name in work_df.columns:
                for idx in np.where(work_df[field_name].isna())[0]:
                    failure_reasons[idx].append(f"Missing mandatory field '{field_name}'")

        def numeric_col(col_name: str) -> pd.Series:
            return pd.to_numeric(work_df[col_name], errors="coerce")

        price_s = numeric_col("price")
        lat_s = numeric_col("latitude")
        lon_s = numeric_col("longitude")
        rating_s = numeric_col("rating")
        quality_s = numeric_col("quality_score")
        reliability_s = numeric_col("reliability_score")
        radius_s = numeric_col("delivery_radius_km")
        del_time_s = numeric_col("average_delivery_time_min")
        stock_s = numeric_col("stock_available")
        min_order_s = numeric_col("minimum_order")

        for idx in np.where((price_s <= 0) | price_s.isna())[0]:
            failure_reasons[idx].append("Price must be greater than 0")

        for idx in np.where((stock_s < self.t.min_stock) | stock_s.isna())[0]:
            failure_reasons[idx].append("Stock available must be >= 0")

        for idx in np.where((min_order_s < self.t.min_order) | min_order_s.isna())[0]:
            failure_reasons[idx].append(f"Minimum order must be >= {self.t.min_order}")

        for idx in np.where((lat_s < self.t.min_latitude) | (lat_s > self.t.max_latitude) | lat_s.isna())[0]:
            failure_reasons[idx].append("Latitude out of bounds [-90, 90]")

        for idx in np.where((lon_s < self.t.min_longitude) | (lon_s > self.t.max_longitude) | lon_s.isna())[0]:
            failure_reasons[idx].append("Longitude out of bounds [-180, 180]")

        # Rating, quality_score, and reliability_score are optional (cold-start unrated).
        # When present, they must satisfy canonical valid range boundaries.
        valid_rating_mask = rating_s.notna()
        for idx in np.where(valid_rating_mask & ((rating_s < self.t.min_rating) | (rating_s > self.t.max_rating)))[0]:
            failure_reasons[idx].append("Rating must be between 0 and 5")

        valid_quality_mask = quality_s.notna()
        for idx in np.where(valid_quality_mask & ((quality_s < self.t.min_quality_score) | (quality_s > self.t.max_quality_score)))[0]:
            failure_reasons[idx].append("Quality score must be between 0 and 5")

        valid_rel_mask = reliability_s.notna()
        for idx in np.where(valid_rel_mask & ((reliability_s < self.t.min_reliability_score) | (reliability_s > self.t.max_reliability_score)))[0]:
            failure_reasons[idx].append("Reliability score must be between 0 and 100")

        for idx in np.where((radius_s <= 0) | radius_s.isna())[0]:
            failure_reasons[idx].append("Delivery radius must be > 0 km")

        for idx in np.where((del_time_s <= 0) | del_time_s.isna())[0]:
            failure_reasons[idx].append("Average delivery time must be > 0 min")

        dup_mask = work_df.duplicated(subset=self.config.business_keys, keep="first")
        for idx in np.where(dup_mask)[0]:
            duplicate_flags[idx] = True
            failure_reasons[idx].append(f"Duplicate business key {self.config.business_keys}")

        reasons_breakdown: Dict[str, int] = {}
        quarantine_rows = []
        valid_indices = []
        now_ts = datetime.now(timezone.utc).isoformat()

        for idx in range(total):
            reasons = failure_reasons[idx]
            if not reasons:
                valid_indices.append(idx)
            else:
                row_dict = work_df.iloc[idx].to_dict()
                for r in reasons:
                    reasons_breakdown[r] = reasons_breakdown.get(r, 0) + 1

                quarantine_rows.append({
                    "record_identifier": row_dict.get("raw_record_id", f"REC_{idx}"),
                    "supplier_id": str(row_dict.get("supplier_id", "")),
                    "ingredient": str(row_dict.get("ingredient", "")),
                    "source_type": str(row_dict.get("source_type", self.config.default_source_type.value)),
                    "validation_failure": "; ".join(reasons),
                    "quarantine_timestamp": now_ts,
                    "pipeline_version": self.config.dataset_version,
                })

        valid_df = work_df.iloc[valid_indices].copy().reset_index(drop=True)
        quarantined_df = pd.DataFrame(quarantine_rows)

        valid_count = len(valid_df)
        invalid_count = len(quarantined_df)
        dup_count = sum(duplicate_flags)

        failure_pct = (invalid_count / total) * 100.0 if total > 0 else 0.0
        status = "PASS" if failure_pct <= self.config.validation_failure_threshold_pct else "FAIL"

        summary = ValidationSummary(
            total_records=total,
            valid_records=valid_count,
            invalid_records=invalid_count,
            duplicate_records=dup_count,
            quality_status=status,
            failure_reasons_breakdown=reasons_breakdown,
        )

        if status == "FAIL" and self.config.stop_on_validation_failure:
            raise ValidationError(
                f"Data quality validation failed: {invalid_count} records ({failure_pct:.2f}%) "
                f"exceed threshold of {self.config.validation_failure_threshold_pct}%."
            )

        return ValidationResult(valid_df=valid_df, quarantined_df=quarantined_df, summary=summary)
