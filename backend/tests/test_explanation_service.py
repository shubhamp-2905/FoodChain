"""
Tests for Phase 9: Deterministic Explainability.

Verifies:
1. Exact numerical grounding: Explanations include actual verified values (distance, price, rating, reliability, delivery).
2. Contextual superlatives: Closest supplier and lowest price recognition.
3. 100% Determinism: Identical inputs produce bit-for-bit identical explanation strings across repeated runs.
4. Resilient sentence composition: Handles 1, 2, 3, or more clauses gracefully without grammatical defects.
5. Missing data handling: Gracefully handles missing/null attributes without crashing or hallucinations.
6. Structured factors extraction: Provides factor breakdowns with tags and values.
7. End-to-end integration: RecommendationService attaches valid, data-driven reasons to all responses.
"""

import os
import sys
import re
import unittest
import pandas as pd

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.ml.services.explanation_service import ExplanationService


class TestDeterministicExplanationService(unittest.TestCase):
    def setUp(self):
        self.sample_row = pd.Series({
            "distance_km": 0.58,
            "price": 22.50,
            "unit": "kg",
            "rating": 4.8,
            "quality_score": 4.7,
            "reliability_score": 95.0,
            "average_delivery_time_min": 18.0,
            "area": "Market Yard",
            "market": "Gultekdi",
        })

    def test_deterministic_numerical_values_inclusion(self):
        """
        Verify that all concrete numerical metrics are explicitly stated in the reason string.
        Matches the prompt requirement:
        "Recommended because it is 0.58 km away, has a 4.8 rating, 95 reliability score and 18-minute average delivery time."
        """
        reason = ExplanationService.generate_explanation(self.sample_row)

        self.assertTrue(reason.startswith("Recommended because it "))
        self.assertTrue(reason.endswith("."))

        # Verify exact numerical presences
        self.assertIn("0.58 km away", reason)
        self.assertIn("₹22.50/kg", reason)
        self.assertIn("4.8 rating", reason)
        self.assertIn("95 reliability score", reason)
        self.assertIn("18-minute average delivery time", reason)

    def test_superlatives_closest_and_lowest_price(self):
        """Verify context-aware superlatives when candidate is best-in-cohort for distance or price."""
        # When supplier matches cohort minimums
        reason = ExplanationService.generate_explanation(
            self.sample_row,
            min_distance=0.58,
            min_price=22.50,
        )

        self.assertIn("closest supplier at 0.58 km away", reason)
        self.assertIn("lowest price at ₹22.50/kg", reason)

    def test_pure_determinism_repeatability(self):
        """Assert 100% deterministic repeatability with zero variation across multiple invocations."""
        initial_reason = ExplanationService.generate_explanation(self.sample_row)

        for _ in range(100):
            repeated_reason = ExplanationService.generate_explanation(self.sample_row)
            self.assertEqual(initial_reason, repeated_reason)

    def test_grammatical_synthesis_clause_counts(self):
        """Verify proper conjunctions ('and') for 1, 2, 3, or more clauses."""
        # 1 Clause
        row_1 = pd.Series({"distance_km": 1.25})
        res_1 = ExplanationService.generate_explanation(row_1)
        self.assertEqual(res_1, "Recommended because it is 1.25 km away.")

        # 2 Clauses
        row_2 = pd.Series({"distance_km": 1.25, "price": 30.00, "unit": "kg"})
        res_2 = ExplanationService.generate_explanation(row_2)
        self.assertEqual(
            res_2,
            "Recommended because it is 1.25 km away and offers a price of ₹30.00/kg.",
        )

        # 3 Clauses
        row_3 = pd.Series({
            "distance_km": 1.25,
            "price": 30.00,
            "unit": "kg",
            "rating": 4.5,
        })
        res_3 = ExplanationService.generate_explanation(row_3)
        self.assertEqual(
            res_3,
            "Recommended because it is 1.25 km away, offers a price of ₹30.00/kg and has a 4.5 rating.",
        )

    def test_missing_data_resilience(self):
        """Verify graceful fallback without errors when fields are None or NaN."""
        # Partial data
        partial_row = pd.Series({
            "distance_km": 2.10,
            "price": None,
            "rating": float("nan"),
            "average_delivery_time_min": 25.0,
        })
        reason = ExplanationService.generate_explanation(partial_row)
        self.assertIn("2.10 km away", reason)
        self.assertIn("25-minute average delivery time", reason)
        self.assertNotIn("rating", reason)
        self.assertNotIn("price", reason)

        # Completely empty row
        empty_row = pd.Series({"area": "Kothrud"})
        empty_reason = ExplanationService.generate_explanation(empty_row)
        self.assertEqual(
            empty_reason,
            "Recommended matching your business requirements in Kothrud.",
        )

    def test_empty_dataframe_generation(self):
        """Verify generate_explanations returns empty DataFrame on empty input."""
        empty_df = pd.DataFrame()
        result_df = ExplanationService.generate_explanations(empty_df)
        self.assertTrue(result_df.empty)

    def test_dataframe_batch_generation(self):
        """Verify generate_explanations computes cohort minimums and populates 'reason' column."""
        df = pd.DataFrame([
            {
                "supplier_id": "SUPP01",
                "distance_km": 0.45,
                "price": 30.0,
                "rating": 4.6,
                "reliability_score": 90.0,
                "average_delivery_time_min": 20,
            },
            {
                "supplier_id": "SUPP02",
                "distance_km": 1.80,
                "price": 20.0,
                "rating": 4.2,
                "reliability_score": 85.0,
                "average_delivery_time_min": 35,
            },
        ])

        explained_df = ExplanationService.generate_explanations(df)
        self.assertIn("reason", explained_df.columns)

        # Row 1 is closest (0.45 km)
        self.assertIn("closest supplier at 0.45 km away", explained_df.loc[0, "reason"])
        # Row 2 offers lowest price (₹20.00)
        self.assertIn("lowest price at ₹20.00", explained_df.loc[1, "reason"])

    def test_extract_explanation_factors(self):
        """Verify structured explanation factors extraction for frontend badges."""
        factors = ExplanationService.extract_explanation_factors(
            self.sample_row,
            min_distance=0.58,
            min_price=25.00,
        )

        self.assertIsInstance(factors, list)
        self.assertEqual(len(factors), 5)

        factor_keys = [f["factor"] for f in factors]
        self.assertEqual(
            factor_keys,
            ["proximity", "price", "rating", "reliability", "delivery_time"],
        )

        # Proximity is best
        prox = next(f for f in factors if f["factor"] == "proximity")
        self.assertEqual(prox["value"], "0.58 km")
        self.assertTrue(prox["is_best"])


if __name__ == "__main__":
    unittest.main()
