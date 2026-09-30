"""
Tests for Phase 6: Decoupling ML Segmentation from Business Recommendation Logic.

Verifies:
1. Branch A: ML Segmentation (ClusterService) operates purely as contextual profiling without sorting.
2. Branch B: Business Ranking Engine (RankingService) is 100% deterministic and independent of clusters.
3. Cluster Independence: Changing or reversing cluster assignments does NOT affect supplier rank or match score.
4. Synthesis: Primary ordering is strictly dictated by business scores while cluster metadata is attached as context.
"""

import os
import sys
import unittest
import pandas as pd
import numpy as np

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.ml.core.model_manager import ModelManager
from app.ml.services.cluster_service import ClusterService
from app.ml.services.ranking_service import RankingService
from app.ml.services.recommendation_service import RecommendationService
from app.ml.utils.ranking import compute_ranking_scores


class TestRecommendationLogicSeparation(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.model_manager = ModelManager()
        cls.cluster_service = ClusterService(cls.model_manager)
        cls.ranking_service = RankingService()
        cls.recommend_service = RecommendationService()

        # Create realistic synthetic candidate dataset
        cls.sample_data = pd.DataFrame([
            {
                "id": 1,
                "supplier_id": "SUPP001",
                "supplier_name": "Alpha Wholesaler",
                "supplier_type": "Wholesaler",
                "market": "Market Yard",
                "area": "Gultekdi",
                "latitude": 18.4900,
                "longitude": 73.8600,
                "ingredient": "Potato",
                "category": "Vegetable",
                "unit": "kg",
                "price": 25.0,
                "stock_available": 1000,
                "minimum_order": 5,
                "quality_score": 4.8,
                "rating": 4.9,
                "reliability_score": 96.0,
                "delivery_radius_km": 10.0,
                "distance_km": 1.2,
                "average_delivery_time_min": 20,
            },
            {
                "id": 2,
                "supplier_id": "SUPP002",
                "supplier_name": "Beta Produce",
                "supplier_type": "Wholesaler",
                "market": "Shivajinagar Market",
                "area": "Shivajinagar",
                "latitude": 18.5300,
                "longitude": 73.8500,
                "ingredient": "Potato",
                "category": "Vegetable",
                "unit": "kg",
                "price": 40.0,
                "stock_available": 500,
                "minimum_order": 10,
                "quality_score": 3.9,
                "rating": 3.8,
                "reliability_score": 75.0,
                "delivery_radius_km": 8.0,
                "distance_km": 6.5,
                "average_delivery_time_min": 45,
            },
            {
                "id": 3,
                "supplier_id": "SUPP003",
                "supplier_name": "Gamma Distributors",
                "supplier_type": "Distributor",
                "market": "Kothrud Depot",
                "area": "Kothrud",
                "latitude": 18.5050,
                "longitude": 73.8100,
                "ingredient": "Potato",
                "category": "Vegetable",
                "unit": "kg",
                "price": 28.0,
                "stock_available": 800,
                "minimum_order": 5,
                "quality_score": 4.3,
                "rating": 4.2,
                "reliability_score": 88.0,
                "delivery_radius_km": 7.0,
                "distance_km": 3.0,
                "average_delivery_time_min": 30,
            },
        ])

    def test_branch_a_ml_segmentation_isolation(self):
        """
        Verify that Branch A (ClusterService) provides behavioral segmentation context
        without reordering or modifying business scores.
        """
        X = self.recommend_service._extract_ml_features(self.sample_data)
        clustered_df = self.cluster_service.segment_suppliers(self.sample_data, X)

        # 1. Output must preserve the exact input index and length
        self.assertEqual(len(clustered_df), len(self.sample_data))
        self.assertTrue((clustered_df.index == self.sample_data.index).all())
        self.assertEqual(list(clustered_df["id"]), list(self.sample_data["id"]))

        # 2. Must assign cluster ID and human-readable cluster label
        self.assertIn("cluster", clustered_df.columns)
        self.assertIn("cluster_label", clustered_df.columns)
        self.assertIn("cluster_desc", clustered_df.columns)
        for label in clustered_df["cluster_label"]:
            self.assertIsInstance(label, str)
            self.assertGreater(len(label), 0)

        # 3. Must NOT contain ranking columns
        self.assertNotIn("recommendation_score", clustered_df.columns)
        self.assertNotIn("rank", clustered_df.columns)

    def test_branch_b_business_ranking_isolation(self):
        """
        Verify that Branch B (RankingService) computes business ranking deterministically,
        independent of whether clustering has run.
        """
        # Run ranking on raw candidate data without any cluster columns
        self.assertNotIn("cluster", self.sample_data.columns)
        ranked_df = self.ranking_service.rank_suppliers(self.sample_data)

        # 1. Must assign recommendation_score and 1-indexed rank
        self.assertIn("recommendation_score", ranked_df.columns)
        self.assertIn("rank", ranked_df.columns)
        self.assertEqual(list(ranked_df["rank"]), [1, 2, 3])

        # 2. Scores must be strictly descending
        scores = list(ranked_df["recommendation_score"])
        self.assertGreaterEqual(scores[0], scores[1])
        self.assertGreaterEqual(scores[1], scores[2])

        # 3. Alpha Wholesaler (low price, short distance, top rating) must be Rank 1
        self.assertEqual(ranked_df.iloc[0]["supplier_name"], "Alpha Wholesaler")
        self.assertEqual(ranked_df.iloc[0]["rank"], 1)

    def test_cluster_assignment_does_not_affect_rank_or_score(self):
        """
        Verify the critical rule: K-Means cluster assignment does NOT determine or influence
        the recommendation ranking or score.
        """
        # Create two copies of the same data with opposite/arbitrary cluster IDs
        df_cluster_a = self.sample_data.copy()
        df_cluster_a["cluster"] = [0, 1, 0]

        df_cluster_b = self.sample_data.copy()
        df_cluster_b["cluster"] = [1, 0, 1]

        # Rank both datasets
        ranked_a = self.ranking_service.rank_suppliers(df_cluster_a)
        ranked_b = self.ranking_service.rank_suppliers(df_cluster_b)

        # Verify that recommendation scores and ranks are 100% identical regardless of cluster ID
        np.testing.assert_array_almost_equal(
            ranked_a["recommendation_score"].values,
            ranked_b["recommendation_score"].values,
            decimal=6,
        )
        self.assertEqual(list(ranked_a["supplier_id"]), list(ranked_b["supplier_id"]))
        self.assertEqual(list(ranked_a["rank"]), list(ranked_b["rank"]))

    def test_synthesis_merges_context_without_distorting_rank(self):
        """
        Verify that _synthesize_branches preserves the rank order from Branch B
        while attaching the cluster context from Branch A.
        """
        X = self.recommend_service._extract_ml_features(self.sample_data)
        df_clusters = self.cluster_service.segment_suppliers(self.sample_data, X)
        df_ranked = self.ranking_service.rank_suppliers(self.sample_data)

        df_synthesized = self.recommend_service._synthesize_branches(df_ranked, df_clusters)

        # 1. Row ordering must match df_ranked exactly
        self.assertEqual(list(df_synthesized["supplier_id"]), list(df_ranked["supplier_id"]))
        self.assertEqual(list(df_synthesized["rank"]), list(df_ranked["rank"]))

        # 2. Cluster metadata must be attached from df_clusters
        self.assertIn("cluster", df_synthesized.columns)
        self.assertIn("cluster_label", df_synthesized.columns)
        for _, row in df_synthesized.iterrows():
            orig_cluster = df_clusters.loc[row.name, "cluster"]
            self.assertEqual(row["cluster"], orig_cluster)

    def test_ranking_weights_distribution(self):
        """
        Verify that the business ranking formula strictly respects specified weights:
        Distance 35%, Price 25%, Rating 15%, Quality 10%, Reliability 10%, Delivery 5%.
        """
        scored = compute_ranking_scores(self.sample_data)
        for _, row in scored.iterrows():
            expected = (
                0.35 * row["distance_score"]
                + 0.25 * row["price_score"]
                + 0.15 * row["rating_score"]
                + 0.10 * row["quality_score_norm"]
                + 0.10 * row["reliability_score_norm"]
                + 0.05 * row["delivery_score"]
            )
            self.assertAlmostEqual(row["recommendation_score"], expected, places=5)


if __name__ == "__main__":
    unittest.main()
