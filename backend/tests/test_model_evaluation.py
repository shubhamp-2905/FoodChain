"""
Tests for Phase 7: ML Evaluation, Versioning, and Reproducibility.

Verifies:
1. Model artifacts (scaler.pkl, kmeans.pkl, model_metadata.json) exist and load correctly.
2. Verified evaluation metrics (inertia, silhouette_score, cluster_distribution) are persisted.
3. ModelManager correctly caches and exposes model metadata.
4. Training reproducibility: same random seed produces identical centroids and metrics.
"""

import os
import sys
import json
import unittest
import numpy as np
import pandas as pd

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.ml.core.model_manager import ModelManager
from scripts.train_recommendation_model import (
    train_and_evaluate,
    CANONICAL_FEATURES,
)


class TestModelEvaluationAndReproducibility(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.manager = ModelManager()
        cls.manager.reload_models()

    def test_artifacts_and_metadata_exist(self):
        """Verify that all required Phase 7 artifacts and metadata exist on disk."""
        artifacts_dir = self.manager.artifacts_dir
        self.assertTrue(
            os.path.exists(os.path.join(artifacts_dir, "scaler.pkl")),
            "scaler.pkl must exist in artifacts dir",
        )
        self.assertTrue(
            os.path.exists(os.path.join(artifacts_dir, "kmeans.pkl")),
            "kmeans.pkl must exist in artifacts dir",
        )
        metadata_file = os.path.join(artifacts_dir, "model_metadata.json")
        self.assertTrue(
            os.path.exists(metadata_file),
            "model_metadata.json must exist in artifacts dir",
        )

    def test_metadata_structure_and_metrics(self):
        """Verify that model_metadata.json contains all required evaluation fields."""
        metadata = self.manager.get_metadata()
        self.assertIsInstance(metadata, dict)

        # Core descriptors
        self.assertIn("model_version", metadata)
        self.assertEqual(metadata["algorithm"], "KMeans")
        self.assertEqual(metadata["n_clusters"], 2)
        self.assertEqual(metadata["feature_columns"], CANONICAL_FEATURES)
        self.assertGreater(metadata["training_rows"], 0)
        self.assertIn("trained_at", metadata)

        # Verified evaluation metrics
        metrics = metadata.get("evaluation_metrics", {})
        self.assertIn("inertia", metrics)
        self.assertIn("silhouette_score", metrics)
        self.assertIn("cluster_distribution", metrics)

        # Inertia must be positive
        self.assertGreater(metrics["inertia"], 0.0)

        # Silhouette score must be in valid [-1, 1] range
        self.assertGreater(metrics["silhouette_score"], 0.0)
        self.assertLessEqual(metrics["silhouette_score"], 1.0)

        # Cluster distribution must sum to 100%
        distribution = metrics["cluster_distribution"]
        self.assertIn("0", distribution)
        self.assertIn("1", distribution)
        total_pct = sum(d["percentage"] for d in distribution.values())
        self.assertAlmostEqual(total_pct, 100.0, delta=0.5)

    def test_model_manager_caching_and_metadata_exposure(self):
        """Verify that ModelManager provides access to cached artifacts and metadata."""
        scaler = self.manager.get_scaler()
        kmeans = self.manager.get_kmeans()
        metadata = self.manager.get_metadata()

        self.assertEqual(scaler.n_features_in_, 6)
        self.assertEqual(kmeans.n_clusters, 2)
        self.assertEqual(metadata["model_version"], "1.1.0")

    def test_training_reproducibility_deterministic(self):
        """
        Verify that training with a fixed random_state produces identical
        centroids, inertia, and silhouette score.
        """
        np.random.seed(42)
        dummy_X = pd.DataFrame(
            np.random.rand(200, 6) * [100, 10, 5, 5, 100, 60],
            columns=CANONICAL_FEATURES,
        )

        run1 = train_and_evaluate(dummy_X, n_clusters=2, random_state=42)
        run2 = train_and_evaluate(dummy_X, n_clusters=2, random_state=42)

        self.assertEqual(run1["inertia"], run2["inertia"])
        self.assertEqual(run1["silhouette_score"], run2["silhouette_score"])
        np.testing.assert_array_almost_equal(
            run1["kmeans"].cluster_centers_, run2["kmeans"].cluster_centers_
        )


if __name__ == "__main__":
    unittest.main()
