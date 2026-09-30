"""
Safe idempotent upsert module managing created_at, updated_at, and record merging.
"""

from datetime import datetime, timezone
from dataclasses import dataclass
from typing import List, Optional
import pandas as pd

from data_pipeline.incremental.change_detector import ChangeDetector
from data_pipeline.incremental.hashing import add_record_hashes


@dataclass
class UpsertResult:
    merged_df: pd.DataFrame
    new_count: int
    modified_count: int
    unchanged_count: int
    upsert_timestamp: str


class SafeUpserter:
    def __init__(self, business_keys: Optional[List[str]] = None):
        self.business_keys = business_keys or ["supplier_id", "ingredient"]
        self.detector = ChangeDetector(self.business_keys)

    def upsert(
        self,
        incoming_df: pd.DataFrame,
        existing_df: Optional[pd.DataFrame] = None,
        source_version: str = "1.0.0",
    ) -> UpsertResult:
        now_ts = datetime.now(timezone.utc).isoformat()

        if incoming_df.empty:
            merged = existing_df.copy() if existing_df is not None else pd.DataFrame()
            return UpsertResult(merged, 0, 0, len(merged), now_ts)

        # Deduplicate incoming records within the batch
        deduped_incoming = incoming_df.drop_duplicates(subset=self.business_keys, keep="last").copy()

        if existing_df is None or existing_df.empty:
            new_df = add_record_hashes(deduped_incoming)
            new_df["created_at"] = now_ts
            new_df["updated_at"] = now_ts
            new_df["source_version"] = source_version
            return UpsertResult(
                merged_df=new_df,
                new_count=len(new_df),
                modified_count=0,
                unchanged_count=0,
                upsert_timestamp=now_ts,
            )

        changes = self.detector.detect_changes(deduped_incoming, existing_df)

        existing = existing_df.copy()
        def make_composite_key(df: pd.DataFrame) -> pd.Series:
            return df[self.business_keys].astype(str).agg("::".join, axis=1)

        existing["_key"] = make_composite_key(existing)
        fallback_created_at = existing["ingestion_timestamp"] if "ingestion_timestamp" in existing.columns else [now_ts] * len(existing)
        created_series = existing["created_at"] if "created_at" in existing.columns else fallback_created_at
        created_at_map = dict(zip(existing["_key"], created_series))

        # Prepare new records
        to_append = []
        if not changes.new_df.empty:
            new_records = changes.new_df.copy()
            new_records["created_at"] = now_ts
            new_records["updated_at"] = now_ts
            new_records["source_version"] = source_version
            to_append.append(new_records)

        # Prepare modified records
        if not changes.modified_df.empty:
            mod_records = changes.modified_df.copy()
            mod_records["_key"] = make_composite_key(mod_records)
            mod_records["created_at"] = mod_records["_key"].map(created_at_map).fillna(now_ts)
            mod_records["updated_at"] = now_ts
            mod_records["source_version"] = source_version
            mod_records = mod_records.drop(columns=["_key"], errors="ignore")
            to_append.append(mod_records)

        # Retain existing records that were not modified
        if changes.modified_count > 0:
            modified_keys = set(make_composite_key(changes.modified_df))
            unmodified_existing = existing[~existing["_key"].isin(modified_keys)].drop(columns=["_key"], errors="ignore")
        else:
            unmodified_existing = existing.drop(columns=["_key"], errors="ignore")

        if "created_at" not in unmodified_existing.columns:
            unmodified_existing["created_at"] = unmodified_existing.get("ingestion_timestamp", now_ts)
        if "updated_at" not in unmodified_existing.columns:
            unmodified_existing["updated_at"] = unmodified_existing["created_at"]

        # Combine unmodified existing with incoming additions & updates
        parts = [unmodified_existing] + to_append
        merged = pd.concat(parts, ignore_index=True)
        merged = add_record_hashes(merged)

        return UpsertResult(
            merged_df=merged,
            new_count=changes.new_count,
            modified_count=changes.modified_count,
            unchanged_count=changes.unchanged_count,
            upsert_timestamp=now_ts,
        )
