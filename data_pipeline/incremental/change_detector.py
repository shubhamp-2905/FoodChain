"""
Change detection module comparing incoming data against existing state.
"""

from dataclasses import dataclass
from typing import List, Optional
import pandas as pd

from data_pipeline.incremental.hashing import add_record_hashes


@dataclass
class ChangeDetectionResult:
    new_df: pd.DataFrame
    modified_df: pd.DataFrame
    unchanged_df: pd.DataFrame
    new_count: int
    modified_count: int
    unchanged_count: int

    @property
    def has_changes(self) -> bool:
        return (self.new_count + self.modified_count) > 0


class ChangeDetector:
    def __init__(self, business_keys: Optional[List[str]] = None):
        self.business_keys = business_keys or ["supplier_id", "ingredient"]

    def detect_changes(
        self,
        incoming_df: pd.DataFrame,
        existing_df: Optional[pd.DataFrame] = None,
    ) -> ChangeDetectionResult:
        if incoming_df.empty:
            empty = pd.DataFrame()
            return ChangeDetectionResult(empty, empty, empty, 0, 0, 0)

        incoming = add_record_hashes(incoming_df)

        if existing_df is None or existing_df.empty:
            return ChangeDetectionResult(
                new_df=incoming,
                modified_df=pd.DataFrame(),
                unchanged_df=pd.DataFrame(),
                new_count=len(incoming),
                modified_count=0,
                unchanged_count=0,
            )

        existing = add_record_hashes(existing_df)

        def make_composite_key(df: pd.DataFrame) -> pd.Series:
            return df[self.business_keys].astype(str).agg("::".join, axis=1)

        incoming["_key"] = make_composite_key(incoming)
        existing["_key"] = make_composite_key(existing)

        existing_hash_map = dict(zip(existing["_key"], existing["record_hash"]))

        new_mask = ~incoming["_key"].isin(existing_hash_map)
        matched_mask = incoming["_key"].isin(existing_hash_map)

        incoming_matched = incoming[matched_mask].copy()
        incoming_matched["_existing_hash"] = incoming_matched["_key"].map(existing_hash_map)

        modified_mask = incoming_matched["record_hash"] != incoming_matched["_existing_hash"]
        unchanged_mask = incoming_matched["record_hash"] == incoming_matched["_existing_hash"]

        new_df = incoming[new_mask].drop(columns=["_key"], errors="ignore").reset_index(drop=True)
        modified_df = incoming_matched[modified_mask].drop(columns=["_key", "_existing_hash"], errors="ignore").reset_index(drop=True)
        unchanged_df = incoming_matched[unchanged_mask].drop(columns=["_key", "_existing_hash"], errors="ignore").reset_index(drop=True)

        return ChangeDetectionResult(
            new_df=new_df,
            modified_df=modified_df,
            unchanged_df=unchanged_df,
            new_count=len(new_df),
            modified_count=len(modified_df),
            unchanged_count=len(unchanged_df),
        )
