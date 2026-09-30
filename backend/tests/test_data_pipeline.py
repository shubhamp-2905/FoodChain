"""
Unit & Integration Tests for Production Data Pipeline, Medallion Layers, and Governance.
"""

import os
import sys
import json
import shutil
import tempfile
import unittest
import pandas as pd

script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(script_dir, "..", ".."))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from data_pipeline.config.pipeline_config import PipelineConfig, SourceType
from data_pipeline.layers.bronze import BronzeLayer
from data_pipeline.layers.silver import SilverLayer
from data_pipeline.layers.gold import GoldLayer
from data_pipeline.pipeline import FoodChainDataPipeline
from data_pipeline.services.onboarding_service import SupplierOnboardingService
from data_pipeline.ml.retraining_policy import RetrainingPolicy


class TestDataPipeline(unittest.TestCase):
    def setUp(self):
        self.test_dir = tempfile.mkdtemp(prefix="foodchain_pipeline_test_")
        self.sample_csv_path = os.path.join(self.test_dir, "sample_suppliers.csv")
        self.output_dir = os.path.join(self.test_dir, "output")

        self.sample_data = pd.DataFrame([
            {
                "supplier_id": "SUPP001",
                "supplier_name": "Sawant Agro Traders",
                "supplier_type": "Vegetable Wholesaler",
                "market": "Shivajinagar Market",
                "area": "Shivajinagar",
                "latitude": 18.5200,
                "longitude": 73.8560,
                "ingredient": "Potato",
                "category": "Vegetable",
                "price": 31.19,
                "unit": "kg",
                "stock_available": 500,
                "minimum_order": 10,
                "quality_score": 4.8,
                "rating": 4.8,
                "reliability_score": 95.0,
                "delivery_radius_km": 5.0,
                "average_delivery_time_min": 18,
            },
            {
                "supplier_id": "SUPP002",
                "supplier_name": "Patil Oil Distributors",
                "supplier_type": "Oil Distributor",
                "market": "Gultekdi",
                "area": "Gultekdi",
                "latitude": 18.5129,
                "longitude": 73.8742,
                "ingredient": "Sunflower Oil",
                "category": "Oil",
                "price": 145.43,
                "unit": "litre",
                "stock_available": 599,
                "minimum_order": 5,
                "quality_score": 4.7,
                "rating": 4.5,
                "reliability_score": 90.3,
                "delivery_radius_km": 7.0,
                "average_delivery_time_min": 20,
            }
        ])
        self.sample_data.to_csv(self.sample_csv_path, index=False)

        self.config = PipelineConfig(
            raw_input_path=self.sample_csv_path,
            output_dir=self.output_dir,
            dataset_version="test-1.0.0",
        )

    def tearDown(self):
        if os.path.exists(self.test_dir):
            shutil.rmtree(self.test_dir, ignore_errors=True)

    def test_bronze_layer_preserves_schema_and_adds_provenance(self):
        bronze_layer = BronzeLayer(self.config)
        bronze_df = bronze_layer.process(self.sample_csv_path)

        self.assertEqual(len(bronze_df), 2)
        for col in self.config.expected_columns:
            self.assertIn(col, bronze_df.columns)
        self.assertIn("ingestion_timestamp", bronze_df.columns)
        self.assertIn("source_version", bronze_df.columns)
        self.assertIn("source_type", bronze_df.columns)
        self.assertIn("source_batch_id", bronze_df.columns)
        self.assertEqual(bronze_df["source_type"].iloc[0], SourceType.SEED_SYNTHETIC.value)

    def test_silver_layer_validates_and_cleans(self):
        bronze_layer = BronzeLayer(self.config)
        bronze_df = bronze_layer.process(self.sample_csv_path)

        silver_layer = SilverLayer(self.config)
        silver_df, quarantined_df, val_summary = silver_layer.process(bronze_df)

        self.assertEqual(len(silver_df), 2)
        self.assertEqual(len(quarantined_df), 0)
        self.assertEqual(val_summary.quality_status, "PASS")
        self.assertEqual(silver_df["source_type"].iloc[0], SourceType.SEED_SYNTHETIC.value)
        self.assertIn("silver_processed_at", silver_df.columns)

    def test_silver_layer_quarantine_rejections(self):
        corrupt_rows = [
            {
                "supplier_id": "SUPP003",
                "supplier_name": "Negative Price Supplier",
                "supplier_type": "Wholesaler",
                "market": "Market",
                "area": "Area",
                "latitude": 18.52,
                "longitude": 73.85,
                "ingredient": "Tomato",
                "category": "Vegetable",
                "price": -10.0,
                "unit": "kg",
                "stock_available": 100,
                "minimum_order": 5,
                "quality_score": 4.0,
                "rating": 4.0,
                "reliability_score": 80.0,
                "delivery_radius_km": 5.0,
                "average_delivery_time_min": 25,
            }
        ]
        dirty_df = pd.concat([self.sample_data, pd.DataFrame(corrupt_rows)], ignore_index=True)
        dirty_df["raw_record_id"] = [f"REC_{i}" for i in range(len(dirty_df))]
        dirty_df["ingestion_timestamp"] = "2026-01-01T00:00:00"
        dirty_df["source_version"] = "1.0.0"
        dirty_df["source_type"] = SourceType.REAL_SUPPLIER_ONBOARDING.value

        silver_layer = SilverLayer(self.config)
        silver_df, quarantined_df, val_summary = silver_layer.process(dirty_df)

        self.assertEqual(len(silver_df), 2)
        self.assertEqual(len(quarantined_df), 1)
        self.assertEqual(quarantined_df["source_type"].iloc[0], SourceType.REAL_SUPPLIER_ONBOARDING.value)
        self.assertIn("Price must be greater than 0", quarantined_df["validation_failure"].iloc[0])

    def test_gold_layer_features(self):
        bronze_layer = BronzeLayer(self.config)
        bronze_df = bronze_layer.process(self.sample_csv_path)

        silver_layer = SilverLayer(self.config)
        silver_df, _, _ = silver_layer.process(bronze_df)

        gold_layer = GoldLayer(self.config)
        gold_df = gold_layer.process(silver_df)

        self.assertEqual(len(gold_df), 2)
        self.assertIn("ingredient_mean_price", gold_df.columns)
        self.assertIn("composite_quality_score", gold_df.columns)
        self.assertIn("source_type", gold_df.columns)
        self.assertEqual(gold_df["source_type"].iloc[0], SourceType.SEED_SYNTHETIC.value)

    def test_end_to_end_medallion_pipeline_execution(self):
        pipeline = FoodChainDataPipeline(self.config)
        res = pipeline.run(self.sample_csv_path)

        self.assertEqual(res.status, "SUCCESS")
        self.assertEqual(res.record_metrics["bronze_records"], 2)
        self.assertTrue(os.path.exists(res.artifacts["bronze_path"]))
        self.assertTrue(os.path.exists(res.artifacts["silver_path"]))
        self.assertTrue(os.path.exists(res.artifacts["gold_path"]))

    def test_real_supplier_onboarding_service_success(self):
        onboarding_service = SupplierOnboardingService(self.config)
        payload = {
            "supplier_id": "REAL_SUPP_101",
            "supplier_name": "Kalyani Fresh Farms",
            "supplier_type": "Direct Farm Supplier",
            "market": "Hadapsar Mandi",
            "area": "Hadapsar",
            "latitude": 18.5089,
            "longitude": 73.9259,
            "ingredient": "Tomato",
            "category": "Vegetable",
            "price": 28.50,
            "unit": "kg",
            "stock_available": 1200,
            "minimum_order": 20,
            "quality_score": 4.9,
            "rating": 4.9,
            "reliability_score": 96.0,
            "delivery_radius_km": 10.0,
            "average_delivery_time_min": 25,
        }

        result = onboarding_service.onboard_supplier(payload)
        self.assertTrue(result.success)
        self.assertEqual(result.status, "ACCEPTED_GOLD")
        self.assertEqual(result.source_type, SourceType.REAL_SUPPLIER_ONBOARDING.value)
        self.assertIsNotNone(result.curated_record)
        self.assertEqual(result.curated_record["supplier_name"], "Kalyani Fresh Farms")
        self.assertEqual(result.curated_record["reliability_tier"], "Tier 1 (>90)")

    def test_real_supplier_onboarding_service_rejected(self):
        onboarding_service = SupplierOnboardingService(self.config)
        bad_payload = {
            "supplier_id": "BAD_SUPP_999",
            "supplier_name": "Bogus Supplier",
            "supplier_type": "Vendor",
            "market": "Market",
            "area": "Area",
            "latitude": 18.52,
            "longitude": 73.85,
            "ingredient": "Potato",
            "category": "Vegetable",
            "price": -50.0,  # Invalid
            "unit": "kg",
            "stock_available": 0,
            "minimum_order": 0,  # Invalid
            "quality_score": 4.0,
            "rating": 4.0,
            "reliability_score": 80.0,
            "delivery_radius_km": 0.0,  # Invalid
            "average_delivery_time_min": 0,  # Invalid
        }

        result = onboarding_service.onboard_supplier(bad_payload)
        self.assertFalse(result.success)
        self.assertEqual(result.status, "REJECTED_QUARANTINED")
        self.assertIn("Price must be greater than 0", result.error_message)

    def test_inventory_update_ingestion(self):
        onboarding_service = SupplierOnboardingService(self.config)
        update_payload = {
            "supplier_id": "REAL_SUPP_101",
            "supplier_name": "Kalyani Fresh Farms",
            "supplier_type": "Direct Farm Supplier",
            "market": "Hadapsar Mandi",
            "area": "Hadapsar",
            "latitude": 18.5089,
            "longitude": 73.9259,
            "ingredient": "Tomato",
            "category": "Vegetable",
            "price": 27.00,  # Price updated
            "unit": "kg",
            "stock_available": 1800,  # Stock replenished
            "minimum_order": 20,
            "quality_score": 4.9,
            "rating": 4.9,
            "reliability_score": 96.0,
            "delivery_radius_km": 10.0,
            "average_delivery_time_min": 25,
        }

        result = onboarding_service.update_inventory(update_payload)
        self.assertTrue(result.success)
        self.assertEqual(result.source_type, SourceType.INVENTORY_UPDATE.value)

    def test_retraining_policy_blocks_on_small_real_data(self):
        policy = RetrainingPolicy(self.config)

        # 50 real records + 10,000 synthetic records
        real_df = pd.DataFrame([{"source_type": SourceType.REAL_SUPPLIER_ONBOARDING.value} for _ in range(50)])
        synthetic_df = pd.DataFrame([{"source_type": SourceType.SEED_SYNTHETIC.value} for _ in range(10000)])
        df = pd.concat([real_df, synthetic_df], ignore_index=True)

        decision = policy.evaluate(df)
        self.assertFalse(decision.should_retrain)
        self.assertEqual(decision.status, "SERVE_COLD_START_MODEL")
        self.assertEqual(decision.real_sample_count, 50)
        self.assertEqual(decision.threshold, 1000)

    def test_retraining_policy_allows_retraining_when_threshold_met(self):
        policy = RetrainingPolicy(self.config)

        # 1,200 real records (>= 1,000)
        real_df = pd.DataFrame([{"source_type": SourceType.REAL_SUPPLIER_ONBOARDING.value} for _ in range(1200)])
        synthetic_df = pd.DataFrame([{"source_type": SourceType.SEED_SYNTHETIC.value} for _ in range(5000)])
        df = pd.concat([real_df, synthetic_df], ignore_index=True)

        decision = policy.evaluate(df)
        self.assertTrue(decision.should_retrain)
        self.assertEqual(decision.status, "READY_FOR_RETRAINING")
        self.assertEqual(decision.real_sample_count, 1200)


if __name__ == "__main__":
    unittest.main()
