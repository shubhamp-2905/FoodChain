"""
Incremental Processing Package
"""

from data_pipeline.incremental.hashing import compute_row_hash, add_record_hashes
from data_pipeline.incremental.change_detector import ChangeDetector, ChangeDetectionResult
from data_pipeline.incremental.upsert import SafeUpserter, UpsertResult

__all__ = [
    "compute_row_hash",
    "add_record_hashes",
    "ChangeDetector",
    "ChangeDetectionResult",
    "SafeUpserter",
    "UpsertResult",
]
