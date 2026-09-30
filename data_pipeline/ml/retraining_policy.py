"""
Model Retraining Policy.

Evaluates sample thresholds as an initial operational safeguard against centroid distortion.
Future retraining decisions should evaluate multi-faceted criteria:
- Feature distribution drift (covariate shift)
- Cluster centroid stability & inertia curve improvements
- Silhouette score gains on real-world verification splits
- Downstream recommendation acceptance and conversion rates
"""

from dataclasses import dataclass
from typing import Dict, Any, Optional
import pandas as pd

from data_pipeline.config.pipeline_config import PipelineConfig, SourceType


@dataclass
class RetrainingDecision:
    should_retrain: bool
    status: str
    real_sample_count: int
    threshold: int
    reason: str
    metrics: Dict[str, Any]


class RetrainingPolicy:
    def __init__(self, config: Optional[PipelineConfig] = None):
        self.config = config or PipelineConfig()
        self.threshold = self.config.thresholds.min_retrain_sample_size

    def evaluate(self, df: pd.DataFrame) -> RetrainingDecision:
        if df.empty:
            return RetrainingDecision(
                should_retrain=False,
                status="NO_DATA",
                real_sample_count=0,
                threshold=self.threshold,
                reason="Dataset is empty. Retraining aborted.",
                metrics={"total_rows": 0, "real_rows": 0},
            )

        total_rows = len(df)
        real_mask = df.get("source_type", "") == SourceType.REAL_SUPPLIER_ONBOARDING.value
        real_count = int(real_mask.sum()) if "source_type" in df.columns else 0
        real_ratio = round(real_count / total_rows, 4) if total_rows > 0 else 0.0

        metrics = {
            "total_rows": total_rows,
            "real_rows": real_count,
            "real_data_ratio": real_ratio,
            "retraining_threshold": self.threshold,
        }

        if real_count < self.threshold:
            return RetrainingDecision(
                should_retrain=False,
                status="SERVE_COLD_START_MODEL",
                real_sample_count=real_count,
                threshold=self.threshold,
                reason=(
                    f"Insufficient real-world sample size ({real_count}/{self.threshold}). "
                    f"Preserving pre-trained reference K-Means model to prevent cluster distortion."
                ),
                metrics=metrics,
            )

        # Sufficient real-world sample size collected
        return RetrainingDecision(
            should_retrain=True,
            status="READY_FOR_RETRAINING",
            real_sample_count=real_count,
            threshold=self.threshold,
            reason=(
                f"Real-world data threshold reached ({real_count} >= {self.threshold}). "
                f"Eligible for scheduled retraining with real supplier data."
            ),
            metrics=metrics,
        )
