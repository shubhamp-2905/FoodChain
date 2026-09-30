"""
Data Loading & Artifact Persistence Module.
"""

import os
import json
from dataclasses import dataclass
from typing import Dict, Any, Optional
import pandas as pd

from data_pipeline.config.pipeline_config import PipelineConfig
from data_pipeline.validation.data_validator import ValidationSummary
from data_pipeline.monitoring.logger import pipeline_logger


@dataclass
class LoadingResult:
    bronze_path: str
    silver_path: str
    gold_path: str
    quarantine_path: Optional[str]
    quality_summary_path: str
    manifest_path: str

    @property
    def raw_path(self) -> str:
        return self.bronze_path

    @property
    def cleaned_path(self) -> str:
        return self.silver_path

    @property
    def curated_path(self) -> str:
        return self.gold_path


class DataLoader:
    def __init__(self, config: Optional[PipelineConfig] = None):
        self.config = config or PipelineConfig()
        self.logger = pipeline_logger

    def _ensure_dir(self, file_path: str) -> None:
        parent_dir = os.path.dirname(os.path.abspath(file_path))
        os.makedirs(parent_dir, exist_ok=True)

    def load(
        self,
        raw_df: pd.DataFrame,
        cleaned_df: pd.DataFrame,
        curated_df: pd.DataFrame,
        quarantined_df: pd.DataFrame,
        validation_summary: ValidationSummary,
        manifest_data: Dict[str, Any],
    ) -> LoadingResult:
        bronze_path = self.config.bronze_output_path
        self._ensure_dir(bronze_path)
        raw_df.to_csv(bronze_path, index=False)
        self.logger.info(f"Persisted Bronze layer ({len(raw_df)} records) -> {bronze_path}")

        silver_path = self.config.silver_output_path
        self._ensure_dir(silver_path)
        cleaned_df.to_csv(silver_path, index=False)
        self.logger.info(f"Persisted Silver layer ({len(cleaned_df)} records) -> {silver_path}")

        gold_path = self.config.gold_output_path
        self._ensure_dir(gold_path)
        curated_df.to_csv(gold_path, index=False)
        self.logger.info(f"Persisted Gold layer ({len(curated_df)} records) -> {gold_path}")

        quarantine_path = None
        if not quarantined_df.empty:
            quarantine_path = self.config.quarantine_output_path
            self._ensure_dir(quarantine_path)
            if os.path.exists(quarantine_path) and os.path.getsize(quarantine_path) > 0:
                quarantined_df.to_csv(quarantine_path, mode="a", header=False, index=False)
            else:
                quarantined_df.to_csv(quarantine_path, mode="w", header=True, index=False)
            self.logger.info(f"Persisted Quarantine ({len(quarantined_df)} records) -> {quarantine_path}")

        summary_path = self.config.quality_summary_path
        self._ensure_dir(summary_path)
        with open(summary_path, "w", encoding="utf-8") as f:
            json.dump(validation_summary.to_dict(), f, indent=2)

        manifest_path = self.config.execution_manifest_path
        self._ensure_dir(manifest_path)
        with open(manifest_path, "w", encoding="utf-8") as f:
            json.dump(manifest_data, f, indent=2)

        return LoadingResult(
            bronze_path=os.path.abspath(bronze_path),
            silver_path=os.path.abspath(silver_path),
            gold_path=os.path.abspath(gold_path),
            quarantine_path=os.path.abspath(quarantine_path) if quarantine_path else None,
            quality_summary_path=os.path.abspath(summary_path),
            manifest_path=os.path.abspath(manifest_path),
        )
