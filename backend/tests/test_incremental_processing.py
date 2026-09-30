"""
Tests for Incremental Data Processing, Change Detection, and Safe Upsert.
"""

import os
import shutil
import tempfile
import unittest
import pandas as pd

from data_pipeline.config.pipeline_config import PipelineConfig, ExecutionMode
from data_pipeline.incremental.hashing import compute_row_hash, add_record_hashes
from data_pipeline.incremental.change_detector import ChangeDetector
from data_pipeline.incremental.upsert import SafeUpserter
from data_pipeline.pipeline import FoodChainDataPipeline


class TestIncrementalProcessing(unittest.TestCase):
    def setUp(self):
        self.test_dir = tempfile.mkdtemp(prefix="foodchain_inc_test_")
        self.input_file = os.path.join(self.test_dir, "input.csv")
        self.output_dir = os.path.join(self.test_dir, "output")

        self.sample_rows = [
            {
                "supplier_id": "SUP001",
                "supplier_name": "Test Supplier A",
                "supplier_type": "Wholesaler",
                "market": "Market Yard",
                "area": "Gultekdi",
                "latitude": 18.4900,
                "longitude": 73.8600,
                "ingredient": "Onion",
                "category": "Vegetable",
                "price": 25.0,
                "unit": "kg",
                "stock_available": 500,
                "minimum_order": 10,
                "quality_score": 4.5,
                "rating": 4.2,
                "reliability_score": 88.0,
                "delivery_radius_km": 15.0,
                "average_delivery_time_min": 30,
            },
            {
                "supplier_id": "SUP002",
                "supplier_name": "Test Supplier B",
                "supplier_type": "Retailer",
                "market": "Shivajinagar",
                "area": "Shivajinagar",
                "latitude": 18.5300,
                "longitude": 73.8500,
                "ingredient": "Tomato",
                "category": "Vegetable",
                "price": 30.0,
                "unit": "kg",
                "stock_available": 300,
                "minimum_order": 5,
                "quality_score": 4.0,
                "rating": 4.0,
                "reliability_score": 80.0,
                "delivery_radius_km": 10.0,
                "average_delivery_time_min": 25,
            },
        ]
        pd.DataFrame(self.sample_rows).to_csv(self.input_file, index=False)

    def tearDown(self):
        shutil.rmtree(self.test_dir, ignore_errors=True)

    def test_row_hashing_consistency_and_sensitivity(self):
        row1 = self.sample_rows[0].copy()
        row2 = self.sample_rows[0].copy()
        hash1 = compute_row_hash(row1)
        hash2 = compute_row_hash(row2)
        self.assertEqual(hash1, hash2)

        # Modifying a business field must change hash
        row2["price"] = 28.5
        hash_modified = compute_row_hash(row2)
        self.assertNotEqual(hash1, hash_modified)

        # Adding timestamps must NOT affect hash
        row1["created_at"] = "2026-01-01T00:00:00"
        row1["updated_at"] = "2026-02-01T00:00:00"
        self.assertEqual(compute_row_hash(row1), hash1)

    def test_change_detector_identifies_new_modified_unchanged(self):
        df_existing = pd.DataFrame(self.sample_rows)
        detector = ChangeDetector(["supplier_id", "ingredient"])

        # Identical incoming data
        res_unchanged = detector.detect_changes(df_existing, df_existing)
        self.assertEqual(res_unchanged.new_count, 0)
        self.assertEqual(res_unchanged.modified_count, 0)
        self.assertEqual(res_unchanged.unchanged_count, 2)
        self.assertFalse(res_unchanged.has_changes)

        # Incoming with 1 modified and 1 new record
        incoming_rows = [
            dict(self.sample_rows[0], price=99.0),  # modified price
            {
                "supplier_id": "SUP003",
                "supplier_name": "Test Supplier C",
                "supplier_type": "Wholesaler",
                "market": "Kothrud",
                "area": "Kothrud",
                "latitude": 18.5000,
                "longitude": 73.8000,
                "ingredient": "Potato",
                "category": "Vegetable",
                "price": 20.0,
                "unit": "kg",
                "stock_available": 1000,
                "minimum_order": 20,
                "quality_score": 4.8,
                "rating": 4.6,
                "reliability_score": 92.0,
                "delivery_radius_km": 12.0,
                "average_delivery_time_min": 20,
            },
        ]
        df_incoming = pd.DataFrame(incoming_rows)
        res_delta = detector.detect_changes(df_incoming, df_existing)
        self.assertEqual(res_delta.new_count, 1)
        self.assertEqual(res_delta.modified_count, 1)
        self.assertTrue(res_delta.has_changes)

    def test_safe_upsert_preserves_created_at_and_updates_updated_at(self):
        upserter = SafeUpserter(["supplier_id", "ingredient"])
        df_initial = pd.DataFrame(self.sample_rows)

        # Initial upsert
        initial_res = upserter.upsert(df_initial, existing_df=None)
        self.assertEqual(initial_res.new_count, 2)
        self.assertIn("created_at", initial_res.merged_df.columns)
        self.assertIn("updated_at", initial_res.merged_df.columns)

        initial_state = initial_res.merged_df.copy()
        sup1_created_at = initial_state.loc[initial_state["supplier_id"] == "SUP001", "created_at"].iloc[0]

        # Update SUP001
        updated_rows = [dict(self.sample_rows[0], price=35.0)]
        df_update = pd.DataFrame(updated_rows)

        update_res = upserter.upsert(df_update, existing_df=initial_state)
        self.assertEqual(update_res.modified_count, 1)
        self.assertEqual(update_res.new_count, 0)

        merged = update_res.merged_df
        sup1_row = merged[merged["supplier_id"] == "SUP001"].iloc[0]
        self.assertEqual(sup1_row["price"], 35.0)
        self.assertEqual(sup1_row["created_at"], sup1_created_at)
        self.assertGreaterEqual(sup1_row["updated_at"], sup1_created_at)

    def test_pipeline_incremental_idempotency_and_bypass(self):
        config = PipelineConfig(
            raw_input_path=self.input_file,
            output_dir=self.output_dir,
            dataset_version="test-1.0.0",
            execution_mode=ExecutionMode.INCREMENTAL,
        )
        pipeline = FoodChainDataPipeline(config)

        # Run 1: Initial full load in incremental mode
        res1 = pipeline.run(input_path=self.input_file)
        self.assertEqual(res1.status, "SUCCESS")
        self.assertEqual(res1.record_metrics["raw_records"], 2)

        # Run 2: Replay identical file -> should bypass recomputation
        res2 = pipeline.run(input_path=self.input_file)
        self.assertEqual(res2.status, "SUCCESS")
        self.assertEqual(res2.incremental_metrics["unchanged_records"], 2)
        self.assertEqual(res2.incremental_metrics["new_records"], 0)
        self.assertEqual(res2.incremental_metrics["modified_records"], 0)
        self.assertEqual(res2.incremental_metrics["reprocessed_records"], 0)


if __name__ == "__main__":
    unittest.main()
