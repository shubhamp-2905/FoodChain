"""
Pipeline configuration module with validation thresholds, paths, and source types.
"""

import os
from enum import Enum
from dataclasses import dataclass, field
from typing import List


class SourceType(str, Enum):
    SEED_SYNTHETIC = "SEED_SYNTHETIC"
    REAL_SUPPLIER_ONBOARDING = "REAL_SUPPLIER_ONBOARDING"
    INVENTORY_UPDATE = "INVENTORY_UPDATE"


class ExecutionMode(str, Enum):
    FULL = "FULL"
    INCREMENTAL = "INCREMENTAL"


@dataclass
class ValidationThresholds:
    min_price: float = 0.01
    min_stock: int = 0
    min_order: int = 1
    min_rating: float = 0.0
    max_rating: float = 5.0
    min_quality_score: float = 0.0
    max_quality_score: float = 5.0
    min_reliability_score: float = 0.0
    max_reliability_score: float = 100.0
    min_latitude: float = -90.0
    max_latitude: float = 90.0
    min_longitude: float = -180.0
    max_longitude: float = 180.0
    min_delivery_radius_km: float = 0.1
    min_average_delivery_time_min: int = 1
    # Initial operational safeguard against centroid distortion, not a theoretical K-Means limit
    min_retrain_sample_size: int = 1000


@dataclass
class PipelineConfig:
    raw_input_path: str = os.path.join("data", "pune_supplier_dataset.csv")
    output_dir: str = os.path.join("data", "pipeline_output")

    bronze_dir_name: str = "bronze"
    silver_dir_name: str = "silver"
    gold_dir_name: str = "gold"
    raw_dir_name: str = "raw"
    validation_dir_name: str = "validation"
    cleaned_dir_name: str = "cleaned"
    curated_dir_name: str = "curated"
    quarantine_dir_name: str = "quarantine"
    metadata_dir_name: str = "metadata"

    dataset_version: str = "1.0.0"
    environment: str = "production"
    default_source_type: SourceType = SourceType.SEED_SYNTHETIC
    execution_mode: ExecutionMode = ExecutionMode.INCREMENTAL

    quarantine_invalid_records: bool = True
    stop_on_validation_failure: bool = False
    validation_failure_threshold_pct: float = 10.0

    thresholds: ValidationThresholds = field(default_factory=ValidationThresholds)

    expected_columns: List[str] = field(default_factory=lambda: [
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
    ])

    business_keys: List[str] = field(default_factory=lambda: [
        "supplier_id",
        "ingredient",
    ])

    @property
    def bronze_output_path(self) -> str:
        return os.path.join(self.output_dir, self.bronze_dir_name, "suppliers_bronze.csv")

    @property
    def silver_output_path(self) -> str:
        return os.path.join(self.output_dir, self.silver_dir_name, "suppliers_silver.csv")

    @property
    def gold_output_path(self) -> str:
        return os.path.join(self.output_dir, self.gold_dir_name, "suppliers_gold.csv")

    @property
    def raw_output_path(self) -> str:
        return self.bronze_output_path

    @property
    def cleaned_output_path(self) -> str:
        return self.silver_output_path

    @property
    def curated_output_path(self) -> str:
        return self.gold_output_path

    @property
    def quarantine_output_path(self) -> str:
        return os.path.join(self.output_dir, self.quarantine_dir_name, "quarantined_records.csv")

    @property
    def quality_summary_path(self) -> str:
        return os.path.join(self.output_dir, self.validation_dir_name, "quality_summary.json")

    @property
    def execution_manifest_path(self) -> str:
        return os.path.join(self.output_dir, self.metadata_dir_name, "pipeline_execution_manifest.json")
