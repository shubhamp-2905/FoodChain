"""
Raw ingestion module with provenance tagging and multi-source support.
"""

import os
from datetime import datetime, timezone
from dataclasses import dataclass
from typing import Optional, List, Dict, Any, Union
import pandas as pd

from data_pipeline.config.pipeline_config import PipelineConfig, SourceType
from data_pipeline.monitoring.logger import pipeline_logger


class IngestionError(Exception):
    pass


@dataclass
class RawIngestionResult:
    df: pd.DataFrame
    record_count: int
    source_path: str
    source_type: str
    ingestion_timestamp: str
    dataset_version: str


class RawIngestor:
    def __init__(self, config: Optional[PipelineConfig] = None):
        self.config = config or PipelineConfig()
        self.logger = pipeline_logger

    def ingest(
        self,
        input_path: Optional[str] = None,
        source_type: Optional[Union[SourceType, str]] = None,
        source_batch_id: Optional[str] = None,
    ) -> RawIngestionResult:
        source_path = input_path or self.config.raw_input_path
        st = str(source_type.value if isinstance(source_type, SourceType) else (source_type or self.config.default_source_type.value))

        if not os.path.exists(source_path):
            raise IngestionError(f"Raw source file does not exist at: {source_path}")

        try:
            df = pd.read_csv(source_path, encoding="utf-8")
        except Exception as e:
            raise IngestionError(f"Failed to read CSV at {source_path}: {e}") from e

        if df.empty:
            raise IngestionError(f"Source file at {source_path} is empty.")

        missing_cols = [col for col in self.config.expected_columns if col not in df.columns]
        if missing_cols:
            raise IngestionError(f"Source dataset missing required columns: {missing_cols}")

        return self._enrich(df, source_path=source_path, source_type=st, batch_id=source_batch_id)

    def ingest_records(
        self,
        records: List[Dict[str, Any]],
        source_type: Union[SourceType, str] = SourceType.REAL_SUPPLIER_ONBOARDING,
        source_batch_id: Optional[str] = None,
    ) -> RawIngestionResult:
        if not records:
            raise IngestionError("Cannot ingest empty records list.")

        df = pd.DataFrame(records)
        missing_cols = [col for col in self.config.expected_columns if col not in df.columns]
        if missing_cols:
            raise IngestionError(f"Payload records missing required columns: {missing_cols}")

        st = str(source_type.value if isinstance(source_type, SourceType) else source_type)
        return self._enrich(df, source_path="payload://in_memory", source_type=st, batch_id=source_batch_id)

    def _enrich(
        self,
        df: pd.DataFrame,
        source_path: str,
        source_type: str,
        batch_id: Optional[str] = None,
    ) -> RawIngestionResult:
        ingestion_ts = datetime.now(timezone.utc).isoformat()
        bid = batch_id or f"BATCH_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"

        df_raw = df.copy()
        df_raw["source_type"] = source_type
        df_raw["source_batch_id"] = bid
        df_raw["ingestion_timestamp"] = ingestion_ts
        df_raw["source_version"] = self.config.dataset_version
        df_raw["raw_record_id"] = [
            f"REC_{source_type[:4]}_{self.config.dataset_version}_{i:06d}"
            for i in range(1, len(df_raw) + 1)
        ]

        return RawIngestionResult(
            df=df_raw,
            record_count=len(df_raw),
            source_path=source_path,
            source_type=source_type,
            ingestion_timestamp=ingestion_ts,
            dataset_version=self.config.dataset_version,
        )
