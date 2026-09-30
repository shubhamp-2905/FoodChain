"""
Bronze Layer Processor — Raw source ingestion with lineage and source type tracking.
"""

import os
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any, Union
import pandas as pd

from data_pipeline.config.pipeline_config import PipelineConfig, SourceType
from data_pipeline.ingestion.raw_ingestion import IngestionError


class BronzeLayer:
    def __init__(self, config: Optional[PipelineConfig] = None):
        self.config = config or PipelineConfig()

    def process(
        self,
        input_path: Optional[str] = None,
        records: Optional[List[Dict[str, Any]]] = None,
        source_type: Optional[Union[SourceType, str]] = None,
        source_batch_id: Optional[str] = None,
    ) -> pd.DataFrame:
        st = str(source_type.value if isinstance(source_type, SourceType) else (source_type or self.config.default_source_type.value))
        bid = source_batch_id or f"BATCH_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"

        if records is not None:
            if not records:
                raise IngestionError("Cannot process empty records list in Bronze layer.")
            df = pd.DataFrame(records)
        else:
            source_path = input_path or self.config.raw_input_path
            if not os.path.exists(source_path):
                raise IngestionError(f"Bronze input source file not found: {source_path}")
            df = pd.read_csv(source_path, encoding="utf-8")

        if df.empty:
            raise IngestionError("Bronze input data is empty.")

        missing = [col for col in self.config.expected_columns if col not in df.columns]
        if missing:
            raise IngestionError(f"Missing mandatory Bronze schema columns: {missing}")

        df_bronze = df.copy()
        ingestion_ts = datetime.now(timezone.utc).isoformat()
        df_bronze["source_type"] = st
        df_bronze["source_batch_id"] = bid
        df_bronze["ingestion_timestamp"] = ingestion_ts
        df_bronze["source_version"] = self.config.dataset_version
        if "created_at" not in df_bronze.columns:
            df_bronze["created_at"] = ingestion_ts
        if "updated_at" not in df_bronze.columns:
            df_bronze["updated_at"] = ingestion_ts
        df_bronze["raw_record_id"] = [
            f"BRONZE_{st[:4]}_{self.config.dataset_version}_{i:06d}"
            for i in range(1, len(df_bronze) + 1)
        ]
        from data_pipeline.incremental.hashing import add_record_hashes
        df_bronze = add_record_hashes(df_bronze)
        return df_bronze
