"""
FoodChain AI - Cold-Start Model Unit & Integration Tests
Validates:
1. New suppliers are onboarded without fabricated historical metrics (rating, quality_score, reliability_score remain None).
2. API schemas correctly serialize and deserialize null metrics.
3. ML FeaturePreprocessor imputes explicit neutral cold-start baseline (2.5, 2.5, 50.0) without mutating candidate DataFrames.
4. Recommendation and Ranking engines score unrated suppliers fairly without crashing.
5. ResponseBuilder preserves None in API output for unrated suppliers.
6. Existing synthetic/reference suppliers retain their exact metrics unaffected.
"""

import unittest
import numpy as np
import pandas as pd
from pydantic import ValidationError

from app.models.supplier import Supplier
from app.schemas.supplier import SupplierResponse, SupplierOnboardRequest
from app.ml.schemas.recommendation import SupplierRecommendation
from app.ml.preprocessing.preprocessor import (
    FeaturePreprocessor,
    CANONICAL_FEATURES,
    COLD_START_NEUTRAL_BASELINE,
)
from app.ml.utils.ranking import compute_ranking_scores
from app.ml.services.ranking_service import RankingService
from app.ml.services.response_builder import ResponseBuilder
from app.ml.services.explanation_service import ExplanationService


class TestSupplierColdStart(unittest.TestCase):
    """Test suite ensuring clean, un-fabricated cold start for newly onboarded suppliers."""

    def test_new_supplier_model_has_no_fabricated_metrics(self):
        """Verify Supplier SQLAlchemy model defaults metrics to None and allows None."""
        new_supplier = Supplier(
            supplier_id="SUPP_TEST_COLD",
            supplier_name="Fresh Farms Cold Start",
            supplier_type="Vegetable Wholesaler",
            market="Market Yard",
            area="Gultekdi",
            latitude=18.4900,
            longitude=73.8600,
            delivery_radius_km=15.0,
            average_delivery_time_min=30,
        )
        self.assertIsNone(new_supplier.rating)
        self.assertIsNone(new_supplier.quality_score)
        self.assertIsNone(new_supplier.reliability_score)

    def test_supplier_schemas_accept_null_metrics(self):
        """Verify Supplier schemas correctly allow None and don't inject fabricated defaults."""
        # Onboard request without metrics
        req = SupplierOnboardRequest(
            supplier_name="Test Unrated Supplier",
            supplier_type="Spice Supplier",
            market="Central Market",
            area="Kothrud",
            latitude=18.5074,
            longitude=73.8077,
            delivery_radius_km=10.0,
            average_delivery_time_min=25,
            ingredient="Turmeric Powder",
            category="Spices",
            price=120.0,
            unit="kg",
            stock_available=100,
            minimum_order=5,
        )
        self.assertIsNone(req.rating)
        self.assertIsNone(req.quality_score)
        self.assertIsNone(req.reliability_score)

        # Response serialization with None
        resp = SupplierResponse(
            id=999,
            supplier_id="SUPP99999",
            supplier_name="Test Supplier",
            supplier_type="Vegetables",
            market="Mandai",
            area="Budhwar Peth",
            latitude=18.5150,
            longitude=73.8560,
            delivery_radius_km=12.0,
            average_delivery_time_min=30,
            rating=None,
            quality_score=None,
            reliability_score=None,
        )
        self.assertIsNone(resp.rating)
        self.assertIsNone(resp.quality_score)
        self.assertIsNone(resp.reliability_score)

    def test_ml_preprocessor_imputes_cold_start_neutral_baseline(self):
        """
        Verify FeaturePreprocessor safely extracts feature vectors for candidates with missing
        historical metrics using explicit neutral cold-start baseline (2.5, 2.5, 50.0),
        without mutating the source candidate DataFrame.
        """
        candidate_df = pd.DataFrame([
            {
                "price": 25.0,
                "distance_km": 2.5,
                "rating": None,
                "quality_score": None,
                "reliability_score": None,
                "average_delivery_time_min": 30,
            }
        ])

        X = FeaturePreprocessor.extract_and_align_features(candidate_df, CANONICAL_FEATURES)

        # X matrix must have imputed values
        self.assertEqual(X.loc[0, "rating"], COLD_START_NEUTRAL_BASELINE["rating"])
        self.assertEqual(X.loc[0, "quality_score"], COLD_START_NEUTRAL_BASELINE["quality_score"])
        self.assertEqual(X.loc[0, "reliability_score"], COLD_START_NEUTRAL_BASELINE["reliability_score"])

        # Crucial guarantee: Original candidate DataFrame was NOT mutated
        self.assertTrue(pd.isna(candidate_df.loc[0, "rating"]))
        self.assertTrue(pd.isna(candidate_df.loc[0, "quality_score"]))
        self.assertTrue(pd.isna(candidate_df.loc[0, "reliability_score"]))

    def test_ml_preprocessor_preserves_nan_check_for_mandatory_attributes(self):
        """Verify FeaturePreprocessor STILL rejects NaN values for non-historical fields (price, distance, delivery)."""
        bad_df = pd.DataFrame([
            {
                "price": np.nan,  # Missing price is illegal
                "distance_km": 2.5,
                "rating": None,
                "quality_score": None,
                "reliability_score": None,
                "average_delivery_time_min": 30,
            }
        ])
        with self.assertRaises(ValueError) as ctx:
            FeaturePreprocessor.extract_and_align_features(bad_df, CANONICAL_FEATURES)
        self.assertIn("price", str(ctx.exception))

    def test_ranking_computes_deterministic_neutral_score_for_unrated(self):
        """
        Verify RankingService uses the neutral baseline for missing metrics without crashing
        or zeroing out candidate score.
        """
        cohort_df = pd.DataFrame([
            {
                "id": 1,
                "supplier_id": "SUPP001",
                "supplier_name": "Established Supplier",
                "distance_km": 2.0,
                "price": 20.0,
                "rating": 4.5,
                "quality_score": 4.5,
                "reliability_score": 90.0,
                "average_delivery_time_min": 25,
            },
            {
                "id": 2,
                "supplier_id": "SUPP002",
                "supplier_name": "New Cold-Start Supplier",
                "distance_km": 1.0,  # Closer
                "price": 18.0,       # Cheaper
                "rating": None,      # Unrated
                "quality_score": None,
                "reliability_score": None,
                "average_delivery_time_min": 20,
            },
        ])

        ranked_df = RankingService.rank_suppliers(cohort_df)

        self.assertEqual(len(ranked_df), 2)
        # Both must have valid numeric recommendation scores
        self.assertGreater(ranked_df.loc[ranked_df["id"] == 2, "recommendation_score"].values[0], 0.0)
        # Original columns must NOT have fabricated metrics
        new_supp_row = ranked_df[ranked_df["id"] == 2].iloc[0]
        self.assertTrue(pd.isna(new_supp_row["rating"]))
        self.assertTrue(pd.isna(new_supp_row["quality_score"]))
        self.assertTrue(pd.isna(new_supp_row["reliability_score"]))

    def test_response_builder_preserves_none_in_recommendations(self):
        """Verify ResponseBuilder serializes null metrics as None in SupplierRecommendation."""
        ranked_df = pd.DataFrame([
            {
                "id": 10,
                "supplier_id": "SUPP010",
                "supplier_name": "New Onboarded Supplier",
                "supplier_type": "Vegetable Wholesaler",
                "market": "Market Yard",
                "area": "Gultekdi",
                "latitude": 18.4900,
                "longitude": 73.8600,
                "ingredient": "Onions",
                "category": "Vegetables",
                "price": 22.0,
                "unit": "kg",
                "stock_available": 300,
                "minimum_order": 10,
                "quality_score": None,
                "rating": None,
                "reliability_score": None,
                "delivery_radius_km": 10.0,
                "distance_km": 1.5,
                "cluster": 0,
                "cluster_label": "Local Wholesale",
                "recommendation_score": 0.72,
                "average_delivery_time_min": 25,
                "reason": "Recommended matching your requirements in Gultekdi.",
            }
        ])

        recs = ResponseBuilder.build_recommendations(ranked_df)
        self.assertEqual(len(recs), 1)
        rec = recs[0]
        self.assertIsNone(rec.rating)
        self.assertIsNone(rec.quality_score)
        self.assertIsNone(rec.reliability_score)
        self.assertEqual(rec.match_score, 72)

    def test_explanation_service_handles_unrated_cleanly(self):
        """Verify ExplanationService produces sensible factors and reason for unrated supplier."""
        unrated_row = pd.Series({
            "distance_km": 1.2,
            "price": 25.0,
            "unit": "kg",
            "rating": None,
            "reliability_score": None,
            "average_delivery_time_min": 20,
            "area": "Baner",
        })

        explanation = ExplanationService.generate_explanation(unrated_row)
        self.assertIn("1.20 km away", explanation)
        self.assertIn("₹25.00/kg", explanation)
        self.assertNotIn("rating", explanation)

        factors = ExplanationService.extract_explanation_factors(unrated_row)
        rating_factor = next(f for f in factors if f["factor"] == "rating")
        reliability_factor = next(f for f in factors if f["factor"] == "reliability")
        self.assertEqual(rating_factor["value"], "Not rated")
        self.assertEqual(reliability_factor["value"], "Not available")

    def test_existing_suppliers_retain_exact_historical_metrics(self):
        """Verify existing suppliers with historical metrics are unaffected by cold-start logic."""
        existing_row = pd.DataFrame([
            {
                "id": 100,
                "supplier_id": "SUPP100",
                "supplier_name": "Synthetic Supplier 100",
                "supplier_type": "Vegetable Wholesaler",
                "market": "Market Yard",
                "area": "Gultekdi",
                "latitude": 18.4900,
                "longitude": 73.8600,
                "ingredient": "Potatoes",
                "category": "Vegetables",
                "price": 20.0,
                "unit": "kg",
                "stock_available": 1000,
                "minimum_order": 20,
                "quality_score": 4.6,
                "rating": 4.8,
                "reliability_score": 94.0,
                "delivery_radius_km": 15.0,
                "distance_km": 2.0,
                "cluster": 1,
                "cluster_label": "High Reliability",
                "recommendation_score": 0.88,
                "average_delivery_time_min": 20,
                "reason": "Recommended because it has a top-rated 4.8 rating and 94 reliability score.",
            }
        ])

        recs = ResponseBuilder.build_recommendations(existing_row)
        self.assertEqual(recs[0].rating, 4.8)
        self.assertEqual(recs[0].quality_score, 4.6)
        self.assertEqual(recs[0].reliability_score, 94.0)


if __name__ == "__main__":
    unittest.main()
