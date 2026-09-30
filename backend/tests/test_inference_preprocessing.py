"""
Tests for Phase 8: Consistent Training & Inference Preprocessing.

Verifies:
1. Feature column order alignment: Shuffled/extra columns are aligned to canonical order.
2. Zero training-serving skew: Training transform and inference transform produce identical tensors.
3. Immutability guardrail: FrozenInferenceScaler strictly prevents accidental .fit() and .fit_transform().
4. Completeness & Validation: Missing columns, NaN values, and non-numeric inputs raise explicit errors.
5. Metadata contract: Feature order stored in model_metadata.json conforms to preprocessor specification.
6. ClusterService end-to-end parity: Segmenting suppliers uses frozen scaler and preserves index integrity.
"""

import os
import sys
import unittest
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.ml.core.model_manager import ModelManager
from app.ml.preprocessing.preprocessor import (
    FeaturePreprocessor,
    FrozenInferenceScaler,
    CANONICAL_FEATURES,
    DEFAULT_REFERENCE_LAT,
    DEFAULT_REFERENCE_LON,
)
from app.ml.services.cluster_service import ClusterService


class TestInferencePreprocessing(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.manager = ModelManager()
        cls.manager.reload_models()

        # Create realistic synthetic candidate dataset
        np.random.seed(42)
        n_samples = 25
        cls.sample_data = {
            "supplier_id": [f"SUP_{i:03d}" for i in range(n_samples)],
            "price": np.random.uniform(50.0, 300.0, n_samples).round(2),
            "distance_km": np.random.uniform(0.5, 10.0, n_samples).round(2),
            "rating": np.random.uniform(3.0, 5.0, n_samples).round(2),
            "quality_score": np.random.uniform(3.0, 5.0, n_samples).round(2),
            "reliability_score": np.random.uniform(70.0, 100.0, n_samples).round(2),
            "average_delivery_time_min": np.random.uniform(15.0, 60.0, n_samples).round(1),
            "market": ["Market Yard" if i % 2 == 0 else "Swargate" for i in range(n_samples)],
        }
        cls.df_sample = pd.DataFrame(cls.sample_data)

    def test_feature_column_order_alignment(self):
        """
        Verify that features in scrambled order with non-feature metadata columns
        are strictly extracted in the exact CANONICAL_FEATURES order without value corruption.
        """
        scrambled_cols = [
            "market",
            "average_delivery_time_min",
            "supplier_id",
            "reliability_score",
            "rating",
            "price",
            "quality_score",
            "distance_km",
        ]
        df_scrambled = self.df_sample[scrambled_cols].copy()

        aligned_X = FeaturePreprocessor.extract_and_align_features(
            df_scrambled, CANONICAL_FEATURES
        )

        self.assertEqual(list(aligned_X.columns), CANONICAL_FEATURES)
        self.assertEqual(aligned_X.shape, (len(self.df_sample), len(CANONICAL_FEATURES)))

        # Verify values align column-by-column
        for col in CANONICAL_FEATURES:
            np.testing.assert_array_equal(
                aligned_X[col].values,
                self.df_sample[col].values,
                err_msg=f"Values mismatch for aligned feature '{col}'",
            )

    def test_zero_training_serving_skew(self):
        """
        Guarantee zero training-serving skew:
        A fitted StandardScaler used at training must yield identical numerical outputs
        when applied via the inference transformation pipeline on the same inputs.
        """
        # Step 1: Training pipeline fit & transform
        raw_X = self.df_sample[CANONICAL_FEATURES].copy()
        training_scaler, X_train_scaled, _ = FeaturePreprocessor.fit_and_transform_training(
            raw_X, CANONICAL_FEATURES
        )

        # Step 2: Online inference pipeline transform using the trained scaler
        frozen_scaler = FrozenInferenceScaler(training_scaler)
        _, X_infer_scaled = FeaturePreprocessor.transform_inference(
            raw_X, frozen_scaler, CANONICAL_FEATURES
        )

        # Assert bit-for-bit numerical equivalence (tolerating floating precision limit)
        np.testing.assert_allclose(
            X_train_scaled,
            X_infer_scaled,
            rtol=1e-14,
            atol=1e-14,
            err_msg="Training and inference transforms produced skewed feature values!",
        )

        # Assert cluster assignment parity
        kmeans = KMeans(n_clusters=2, random_state=42, n_init=10).fit(X_train_scaled)
        train_clusters = kmeans.predict(X_train_scaled)
        infer_clusters = kmeans.predict(X_infer_scaled)

        np.testing.assert_array_equal(
            train_clusters,
            infer_clusters,
            err_msg="Cluster predictions differed between training and inference preprocessing!",
        )

    def test_accidental_refit_prevention_on_frozen_scaler(self):
        """
        Guardrail test:
        Verify that FrozenInferenceScaler strictly prohibits .fit(), .fit_transform(),
        and .partial_fit() during serving, preventing silent weight corruption in memory.
        """
        scaler = self.manager.get_scaler(freeze_for_inference=True)

        self.assertIsInstance(scaler, FrozenInferenceScaler)
        self.assertIsInstance(scaler, StandardScaler)

        dummy_X = np.random.randn(10, len(CANONICAL_FEATURES))

        with self.assertRaises(RuntimeError) as ctx_fit:
            scaler.fit(dummy_X)
        self.assertIn("Accidental refitting prevented", str(ctx_fit.exception))

        with self.assertRaises(RuntimeError) as ctx_ft:
            scaler.fit_transform(dummy_X)
        self.assertIn("Accidental refitting prevented", str(ctx_ft.exception))

        with self.assertRaises(RuntimeError) as ctx_pf:
            scaler.partial_fit(dummy_X)
        self.assertIn("Accidental refitting prevented", str(ctx_pf.exception))

    def test_unfitted_scaler_rejection(self):
        """Verify that unfitted StandardScaler instances cannot be wrapped or used for inference."""
        unfitted_scaler = StandardScaler()

        with self.assertRaises(ValueError) as ctx_wrap:
            FrozenInferenceScaler(unfitted_scaler)
        self.assertIn("unfitted", str(ctx_wrap.exception).lower())

        with self.assertRaises(ValueError) as ctx_inf:
            FeaturePreprocessor.transform_inference(self.df_sample, unfitted_scaler)
        self.assertIn("not fitted", str(ctx_inf.exception).lower())

    def test_missing_feature_column_raises_error(self):
        """Verify that missing any required canonical feature triggers a clear ValueError."""
        df_incomplete = self.df_sample.drop(columns=["reliability_score"])

        with self.assertRaises(ValueError) as ctx:
            FeaturePreprocessor.extract_and_align_features(df_incomplete, CANONICAL_FEATURES)
        self.assertIn("reliability_score", str(ctx.exception))

    def test_nan_value_detection(self):
        """Verify that candidate records with NaN features are intercepted before scaling."""
        df_nan = self.df_sample.copy()
        df_nan.loc[2, "price"] = np.nan

        with self.assertRaises(ValueError) as ctx:
            FeaturePreprocessor.extract_and_align_features(df_nan, CANONICAL_FEATURES)
        self.assertIn("NaN", str(ctx.exception))

    def test_non_numeric_coercion_and_validation(self):
        """Verify that string numbers are coerced to float64, and non-numeric strings fail."""
        df_strings = self.df_sample.copy()
        df_strings["price"] = df_strings["price"].astype(str)

        # String representations of numbers should be successfully coerced
        X_coerced = FeaturePreprocessor.extract_and_align_features(
            df_strings, CANONICAL_FEATURES
        )
        self.assertEqual(X_coerced["price"].dtype, np.float64)

        # Invalid strings must raise ValueError
        df_invalid = self.df_sample.copy()
        df_invalid.loc[0, "price"] = "unparseable_price"
        with self.assertRaises(ValueError) as ctx:
            FeaturePreprocessor.extract_and_align_features(df_invalid, CANONICAL_FEATURES)
        self.assertIn("non-numeric", str(ctx.exception).lower())

    def test_metadata_feature_contract_conformance(self):
        """Verify that model_metadata.json matches the preprocessor's CANONICAL_FEATURES exactly."""
        metadata = self.manager.get_metadata()
        meta_features = metadata.get("feature_columns")

        self.assertIsNotNone(meta_features, "model_metadata.json must contain 'feature_columns'")
        self.assertEqual(
            meta_features,
            CANONICAL_FEATURES,
            "Feature list in model_metadata.json does not match CANONICAL_FEATURES",
        )
        self.assertEqual(len(meta_features), self.manager.get_scaler().n_features_in_)

    def test_cluster_service_uses_frozen_scaler_and_aligned_features(self):
        """
        Verify that ClusterService.segment_suppliers():
        1. Works with scrambled input columns.
        2. Preserves DataFrame index and row count.
        3. Attaches valid cluster IDs and contextual labels.
        4. Does NOT mutate the cached model manager scaler.
        """
        cluster_service = ClusterService(self.manager)

        # Scramble columns of input DataFrame
        scrambled = self.df_sample.sample(frac=1.0, random_state=42).copy()
        X_scrambled = scrambled[
            ["average_delivery_time_min", "rating", "price", "reliability_score", "quality_score", "distance_km"]
        ].copy()

        df_segmented = cluster_service.segment_suppliers(scrambled, X_scrambled)

        # Assert shape and index preservation
        self.assertEqual(len(df_segmented), len(scrambled))
        pd.testing.assert_index_equal(df_segmented.index, scrambled.index)

        # Assert output columns
        for col in ["cluster", "cluster_label", "cluster_desc"]:
            self.assertIn(col, df_segmented.columns)

        # Assert valid cluster assignments (0 or 1 for K=2)
        valid_clusters = {0, 1}
        self.assertTrue(set(df_segmented["cluster"].unique()).issubset(valid_clusters))

        # Assert scaler in ModelManager remains frozen and unaltered
        cached_scaler = self.manager.get_scaler()
        self.assertIsInstance(cached_scaler, FrozenInferenceScaler)


if __name__ == "__main__":
    unittest.main()
