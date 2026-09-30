"""
Silver Layer Processor — Validated, deduplicated, and canonically cleaned data.
"""

from datetime import datetime, timezone
from typing import Optional, Tuple
import pandas as pd

from data_pipeline.config.pipeline_config import PipelineConfig
from data_pipeline.validation.data_validator import DataValidator, ValidationSummary
from data_pipeline.transformation.data_cleaner import DataCleaner


class SilverLayer:
    def __init__(self, config: Optional[PipelineConfig] = None):
        self.config = config or PipelineConfig()
        self.validator = DataValidator(self.config)
        self.cleaner = DataCleaner(self.config)

    def process(self, bronze_df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.DataFrame, ValidationSummary]:
        val_result = self.validator.validate(bronze_df)
        clean_result = self.cleaner.clean(val_result.valid_df)

        silver_df = clean_result.cleaned_df.copy()
        if not silver_df.empty:
            silver_df["silver_processed_at"] = datetime.now(timezone.utc).isoformat()

        return silver_df, val_result.quarantined_df, val_result.summary
