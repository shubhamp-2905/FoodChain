"""
Real Supplier Onboarding & Inventory Update Service — First-class operational ingestion.
"""

import os
from datetime import datetime, timezone
from dataclasses import dataclass
from typing import Dict, Any, Optional, List
import pandas as pd

from data_pipeline.config.pipeline_config import PipelineConfig, SourceType
from data_pipeline.layers.bronze import BronzeLayer
from data_pipeline.layers.silver import SilverLayer
from data_pipeline.layers.gold import GoldLayer
from data_pipeline.monitoring.logger import pipeline_logger


@dataclass
class OnboardingResult:
    success: bool
    status: str
    supplier_id: str
    ingredient: str
    source_type: str
    record_id: Optional[str]
    error_message: Optional[str] = None
    curated_record: Optional[Dict[str, Any]] = None


class SupplierOnboardingService:
    def __init__(self, config: Optional[PipelineConfig] = None):
        self.config = config or PipelineConfig()
        self.logger = pipeline_logger
        self.bronze_layer = BronzeLayer(self.config)
        self.silver_layer = SilverLayer(self.config)
        self.gold_layer = GoldLayer(self.config)

    def onboard_supplier(
        self,
        payload: Dict[str, Any],
        source_type: SourceType = SourceType.REAL_SUPPLIER_ONBOARDING,
    ) -> OnboardingResult:
        return self._process_payload(payload, source_type=source_type)

    def update_inventory(
        self,
        payload: Dict[str, Any],
    ) -> OnboardingResult:
        return self._process_payload(payload, source_type=SourceType.INVENTORY_UPDATE)

    def _process_payload(
        self,
        payload: Dict[str, Any],
        source_type: SourceType,
    ) -> OnboardingResult:
        supplier_id = str(payload.get("supplier_id", "UNKNOWN"))
        ingredient = str(payload.get("ingredient", "UNKNOWN"))
        batch_id = f"API_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S%f')}"

        try:
            # 1. Bronze Ingestion
            bronze_df = self.bronze_layer.process(
                records=[payload],
                source_type=source_type,
                source_batch_id=batch_id,
            )
            raw_id = bronze_df["raw_record_id"].iloc[0]

            # 2. Silver Validation & Cleaning
            silver_df, quarantined_df, val_summary = self.silver_layer.process(bronze_df)

            if not quarantined_df.empty:
                failure_reason = quarantined_df["validation_failure"].iloc[0]
                self._persist_quarantine(quarantined_df)
                self.logger.warning(f"Onboarding rejected for {supplier_id}: {failure_reason}")
                return OnboardingResult(
                    success=False,
                    status="REJECTED_QUARANTINED",
                    supplier_id=supplier_id,
                    ingredient=ingredient,
                    source_type=source_type.value,
                    record_id=raw_id,
                    error_message=failure_reason,
                )

            # 3. Gold Curation
            gold_df = self.gold_layer.process(silver_df)
            self._append_to_layers(bronze_df, silver_df, gold_df)

            curated_dict = gold_df.iloc[0].to_dict()
            return OnboardingResult(
                success=True,
                status="ACCEPTED_GOLD",
                supplier_id=supplier_id,
                ingredient=ingredient,
                source_type=source_type.value,
                record_id=raw_id,
                curated_record=curated_dict,
            )

        except Exception as e:
            self.logger.error(f"Error onboarding supplier {supplier_id}: {e}", exc_info=True)
            return OnboardingResult(
                success=False,
                status="PROCESSING_ERROR",
                supplier_id=supplier_id,
                ingredient=ingredient,
                source_type=source_type.value,
                record_id=None,
                error_message=str(e),
            )

    def _persist_quarantine(self, quarantined_df: pd.DataFrame) -> None:
        path = self.config.quarantine_output_path
        os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
        header = not os.path.exists(path)
        quarantined_df.to_csv(path, mode="a", header=header, index=False)

    def _append_to_layers(self, bronze_df: pd.DataFrame, silver_df: pd.DataFrame, gold_df: pd.DataFrame) -> None:
        for df, path in [
            (bronze_df, self.config.bronze_output_path),
            (silver_df, self.config.silver_output_path),
            (gold_df, self.config.gold_output_path),
        ]:
            os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
            header = not os.path.exists(path)
            df.to_csv(path, mode="a", header=header, index=False)
