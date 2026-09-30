"""
Pipeline Orchestrator — Coordinates Bronze, Silver, Gold layers, and Incremental Processing.
"""

import os
import json
import time
from datetime import datetime, timezone
from dataclasses import dataclass, field
from typing import Dict, Any, Optional, Union
import pandas as pd

from data_pipeline.config.pipeline_config import PipelineConfig, ExecutionMode
from data_pipeline.layers.bronze import BronzeLayer
from data_pipeline.layers.silver import SilverLayer
from data_pipeline.layers.gold import GoldLayer
from data_pipeline.loading.data_loader import DataLoader
from data_pipeline.monitoring.logger import pipeline_logger, StageTimer
from data_pipeline.incremental.change_detector import ChangeDetector
from data_pipeline.incremental.upsert import SafeUpserter
from data_pipeline.validation.data_validator import ValidationSummary


@dataclass
class PipelineExecutionResult:
    status: str
    pipeline_version: str
    start_time: str
    end_time: str
    total_duration_ms: float
    stage_durations_ms: Dict[str, float]
    record_metrics: Dict[str, int]
    validation_summary: Dict[str, Any]
    artifacts: Dict[str, Optional[str]]
    execution_mode: str = "INCREMENTAL"
    incremental_metrics: Dict[str, int] = field(default_factory=dict)
    error_message: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "status": self.status,
            "pipeline_version": self.pipeline_version,
            "execution_mode": self.execution_mode,
            "start_time": self.start_time,
            "end_time": self.end_time,
            "total_duration_ms": self.total_duration_ms,
            "stage_durations_ms": self.stage_durations_ms,
            "record_metrics": self.record_metrics,
            "incremental_metrics": self.incremental_metrics,
            "validation_summary": self.validation_summary,
            "artifacts": self.artifacts,
            "error_message": self.error_message,
        }


class FoodChainDataPipeline:
    def __init__(self, config: Optional[PipelineConfig] = None):
        self.config = config or PipelineConfig()
        self.logger = pipeline_logger

        self.bronze_layer = BronzeLayer(self.config)
        self.silver_layer = SilverLayer(self.config)
        self.gold_layer = GoldLayer(self.config)
        self.loader = DataLoader(self.config)
        self.upserter = SafeUpserter(self.config.business_keys)
        self.change_detector = ChangeDetector(self.config.business_keys)

    def run(
        self,
        input_path: Optional[str] = None,
        mode: Optional[Union[ExecutionMode, str]] = None,
    ) -> PipelineExecutionResult:
        start_wall = time.perf_counter()
        start_ts = datetime.now(timezone.utc).isoformat()
        stage_timings: Dict[str, float] = {}

        if mode is not None:
            exec_mode = mode if isinstance(mode, ExecutionMode) else ExecutionMode(mode.upper())
        else:
            exec_mode = self.config.execution_mode

        self.logger.info(f"[PIPELINE START] Mode: {exec_mode.value} | FoodChain Pipeline v{self.config.dataset_version}")

        try:
            has_existing = (
                os.path.exists(self.config.bronze_output_path)
                and os.path.exists(self.config.silver_output_path)
                and os.path.exists(self.config.gold_output_path)
            )

            if exec_mode == ExecutionMode.INCREMENTAL and has_existing:
                return self._run_incremental(input_path, start_wall, start_ts)

            return self._run_full(input_path, exec_mode, start_wall, start_ts, is_initial=not has_existing)

        except Exception as e:
            end_wall = time.perf_counter()
            duration_ms = round((end_wall - start_wall) * 1000, 2)
            end_ts = datetime.now(timezone.utc).isoformat()
            self.logger.error(f"[FAILED] Pipeline terminated after {duration_ms}ms: {e}", exc_info=True)

            return PipelineExecutionResult(
                status="FAILED",
                pipeline_version=self.config.dataset_version,
                execution_mode=exec_mode.value,
                start_time=start_ts,
                end_time=end_ts,
                total_duration_ms=duration_ms,
                stage_durations_ms=stage_timings,
                record_metrics={},
                incremental_metrics={},
                validation_summary={},
                artifacts={},
                error_message=str(e),
            )

    def _run_full(
        self,
        input_path: Optional[str],
        exec_mode: ExecutionMode,
        start_wall: float,
        start_ts: str,
        is_initial: bool = False,
    ) -> PipelineExecutionResult:
        stage_timings: Dict[str, float] = {}

        with StageTimer("BRONZE_LAYER", self.logger) as timer:
            bronze_df = self.bronze_layer.process(input_path)
        stage_timings["bronze_layer"] = timer.elapsed_ms

        with StageTimer("SILVER_LAYER", self.logger) as timer:
            silver_df, quarantined_df, val_summary = self.silver_layer.process(bronze_df)
        stage_timings["silver_layer"] = timer.elapsed_ms

        with StageTimer("GOLD_LAYER", self.logger) as timer:
            gold_df = self.gold_layer.process(silver_df)
        stage_timings["gold_layer"] = timer.elapsed_ms

        total_duration_ms = round((time.perf_counter() - start_wall) * 1000, 2)
        end_ts = datetime.now(timezone.utc).isoformat()

        inc_metrics = {
            "new_records": len(bronze_df),
            "modified_records": 0,
            "unchanged_records": 0,
            "reprocessed_records": len(bronze_df),
        }

        manifest_data = {
            "pipeline_version": self.config.dataset_version,
            "environment": self.config.environment,
            "execution_mode": exec_mode.value,
            "is_initial_load": is_initial,
            "execution_timestamp": start_ts,
            "total_duration_ms": total_duration_ms,
            "stage_timings_ms": stage_timings,
            "records": {
                "bronze": len(bronze_df),
                "silver": len(silver_df),
                "quarantined": len(quarantined_df),
                "gold": len(gold_df),
            },
            "incremental_metrics": inc_metrics,
            "status": "SUCCESS",
        }

        with StageTimer("DATA_LOADING", self.logger) as timer:
            load_res = self.loader.load(
                raw_df=bronze_df,
                cleaned_df=silver_df,
                curated_df=gold_df,
                quarantined_df=quarantined_df,
                validation_summary=val_summary,
                manifest_data=manifest_data,
            )
        stage_timings["data_loading"] = timer.elapsed_ms

        final_duration_ms = round((time.perf_counter() - start_wall) * 1000, 2)
        self.logger.info(
            f"[SUCCESS] Full load complete in {final_duration_ms}ms "
            f"(Bronze: {len(bronze_df)}, Silver: {len(silver_df)}, Gold: {len(gold_df)}, Quarantined: {len(quarantined_df)})"
        )

        return PipelineExecutionResult(
            status="SUCCESS",
            pipeline_version=self.config.dataset_version,
            execution_mode=exec_mode.value,
            start_time=start_ts,
            end_time=end_ts,
            total_duration_ms=final_duration_ms,
            stage_durations_ms=stage_timings,
            record_metrics={
                "bronze_records": len(bronze_df),
                "silver_records": len(silver_df),
                "quarantined_records": len(quarantined_df),
                "gold_records": len(gold_df),
                "raw_records": len(bronze_df),
                "valid_records": len(silver_df),
                "curated_records": len(gold_df),
                "duplicate_records": val_summary.duplicate_records,
            },
            incremental_metrics=inc_metrics,
            validation_summary=val_summary.to_dict(),
            artifacts={
                "bronze_path": load_res.bronze_path,
                "silver_path": load_res.silver_path,
                "gold_path": load_res.gold_path,
                "raw_path": load_res.raw_path,
                "cleaned_path": load_res.cleaned_path,
                "curated_path": load_res.curated_path,
                "quarantine_path": load_res.quarantine_path,
                "quality_summary_path": load_res.quality_summary_path,
                "manifest_path": load_res.manifest_path,
            },
        )

    def _run_incremental(
        self,
        input_path: Optional[str],
        start_wall: float,
        start_ts: str,
    ) -> PipelineExecutionResult:
        stage_timings: Dict[str, float] = {}

        existing_bronze = pd.read_csv(self.config.bronze_output_path)
        existing_silver = pd.read_csv(self.config.silver_output_path)
        existing_gold = pd.read_csv(self.config.gold_output_path)

        with StageTimer("BRONZE_LAYER", self.logger) as timer:
            incoming_bronze = self.bronze_layer.process(input_path)
        stage_timings["bronze_layer"] = timer.elapsed_ms

        with StageTimer("CHANGE_DETECTION", self.logger) as timer:
            changes = self.change_detector.detect_changes(incoming_bronze, existing_bronze)
        stage_timings["change_detection"] = timer.elapsed_ms

        self.logger.info(
            f"[INCREMENTAL] Change detection: {changes.new_count} new, "
            f"{changes.modified_count} modified, {changes.unchanged_count} unchanged records."
        )

        if not changes.has_changes:
            self.logger.info("[INCREMENTAL] All records are unchanged. Reprocessing bypassed.")
            total_duration_ms = round((time.perf_counter() - start_wall) * 1000, 2)
            end_ts = datetime.now(timezone.utc).isoformat()

            inc_metrics = {
                "new_records": 0,
                "modified_records": 0,
                "unchanged_records": changes.unchanged_count,
                "reprocessed_records": 0,
            }

            manifest_data = {
                "pipeline_version": self.config.dataset_version,
                "environment": self.config.environment,
                "execution_mode": ExecutionMode.INCREMENTAL.value,
                "is_initial_load": False,
                "execution_timestamp": start_ts,
                "total_duration_ms": total_duration_ms,
                "stage_timings_ms": stage_timings,
                "records": {
                    "bronze": len(existing_bronze),
                    "silver": len(existing_silver),
                    "quarantined": 0,
                    "gold": len(existing_gold),
                },
                "incremental_metrics": inc_metrics,
                "status": "SUCCESS",
            }
            manifest_path = self.config.execution_manifest_path
            with open(manifest_path, "w", encoding="utf-8") as f:
                json.dump(manifest_data, f, indent=2)

            empty_val = ValidationSummary(
                total_records=changes.unchanged_count,
                valid_records=changes.unchanged_count,
                invalid_records=0,
                duplicate_records=0,
                quality_status="PASS",
                failure_reasons_breakdown={},
                validation_timestamp=end_ts,
            )

            return PipelineExecutionResult(
                status="SUCCESS",
                pipeline_version=self.config.dataset_version,
                execution_mode=ExecutionMode.INCREMENTAL.value,
                start_time=start_ts,
                end_time=end_ts,
                total_duration_ms=total_duration_ms,
                stage_durations_ms=stage_timings,
                record_metrics={
                    "bronze_records": len(existing_bronze),
                    "silver_records": len(existing_silver),
                    "quarantined_records": 0,
                    "gold_records": len(existing_gold),
                    "raw_records": len(incoming_bronze),
                    "valid_records": len(existing_silver),
                    "curated_records": len(existing_gold),
                    "duplicate_records": 0,
                },
                incremental_metrics=inc_metrics,
                validation_summary=empty_val.to_dict(),
                artifacts={
                    "bronze_path": os.path.abspath(self.config.bronze_output_path),
                    "silver_path": os.path.abspath(self.config.silver_output_path),
                    "gold_path": os.path.abspath(self.config.gold_output_path),
                    "raw_path": os.path.abspath(self.config.bronze_output_path),
                    "cleaned_path": os.path.abspath(self.config.silver_output_path),
                    "curated_path": os.path.abspath(self.config.gold_output_path),
                    "quarantine_path": None,
                    "quality_summary_path": os.path.abspath(self.config.quality_summary_path),
                    "manifest_path": os.path.abspath(manifest_path),
                },
            )

        delta_bronze = pd.concat([changes.new_df, changes.modified_df], ignore_index=True)
        self.logger.info(f"[INCREMENTAL] Reprocessing delta batch ({len(delta_bronze)} records)")

        with StageTimer("SILVER_LAYER", self.logger) as timer:
            delta_silver, quarantined_df, val_summary = self.silver_layer.process(delta_bronze)
        stage_timings["silver_layer"] = timer.elapsed_ms

        with StageTimer("GOLD_LAYER", self.logger) as timer:
            delta_gold = self.gold_layer.process(delta_silver)
        stage_timings["gold_layer"] = timer.elapsed_ms

        with StageTimer("SAFE_UPSERT", self.logger) as timer:
            merged_bronze = self.upserter.upsert(incoming_bronze, existing_bronze, self.config.dataset_version).merged_df
            merged_silver = self.upserter.upsert(delta_silver, existing_silver, self.config.dataset_version).merged_df
            merged_gold = self.upserter.upsert(delta_gold, existing_gold, self.config.dataset_version).merged_df
        stage_timings["safe_upsert"] = timer.elapsed_ms

        inc_metrics = {
            "new_records": changes.new_count,
            "modified_records": changes.modified_count,
            "unchanged_records": changes.unchanged_count,
            "reprocessed_records": len(delta_bronze),
        }

        total_duration_ms = round((time.perf_counter() - start_wall) * 1000, 2)
        end_ts = datetime.now(timezone.utc).isoformat()

        manifest_data = {
            "pipeline_version": self.config.dataset_version,
            "environment": self.config.environment,
            "execution_mode": ExecutionMode.INCREMENTAL.value,
            "is_initial_load": False,
            "execution_timestamp": start_ts,
            "total_duration_ms": total_duration_ms,
            "stage_timings_ms": stage_timings,
            "records": {
                "bronze": len(merged_bronze),
                "silver": len(merged_silver),
                "quarantined": len(quarantined_df),
                "gold": len(merged_gold),
            },
            "incremental_metrics": inc_metrics,
            "status": "SUCCESS",
        }

        with StageTimer("DATA_LOADING", self.logger) as timer:
            load_res = self.loader.load(
                raw_df=merged_bronze,
                cleaned_df=merged_silver,
                curated_df=merged_gold,
                quarantined_df=quarantined_df,
                validation_summary=val_summary,
                manifest_data=manifest_data,
            )
        stage_timings["data_loading"] = timer.elapsed_ms

        final_duration_ms = round((time.perf_counter() - start_wall) * 1000, 2)
        self.logger.info(
            f"[SUCCESS] Incremental run complete in {final_duration_ms}ms "
            f"(New: {changes.new_count}, Mod: {changes.modified_count}, Unchanged: {changes.unchanged_count})"
        )

        return PipelineExecutionResult(
            status="SUCCESS",
            pipeline_version=self.config.dataset_version,
            execution_mode=ExecutionMode.INCREMENTAL.value,
            start_time=start_ts,
            end_time=end_ts,
            total_duration_ms=final_duration_ms,
            stage_durations_ms=stage_timings,
            record_metrics={
                "bronze_records": len(merged_bronze),
                "silver_records": len(merged_silver),
                "quarantined_records": len(quarantined_df),
                "gold_records": len(merged_gold),
                "raw_records": len(incoming_bronze),
                "valid_records": len(merged_silver),
                "curated_records": len(merged_gold),
                "duplicate_records": val_summary.duplicate_records,
            },
            incremental_metrics=inc_metrics,
            validation_summary=val_summary.to_dict(),
            artifacts={
                "bronze_path": load_res.bronze_path,
                "silver_path": load_res.silver_path,
                "gold_path": load_res.gold_path,
                "raw_path": load_res.raw_path,
                "cleaned_path": load_res.cleaned_path,
                "curated_path": load_res.curated_path,
                "quarantine_path": load_res.quarantine_path,
                "quality_summary_path": load_res.quality_summary_path,
                "manifest_path": load_res.manifest_path,
            },
        )
