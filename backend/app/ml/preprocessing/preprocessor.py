"""
FoodChain AI - Unified ML Feature Preprocessing Pipeline
Phase 8: Consistent Training & Inference Preprocessing

Guarantees:
1. Exact Feature Alignment: Feature matrices are strictly ordered according to canonical specifications.
2. Zero Training-Serving Skew: Unified logic for feature extraction, distance computation, and scaling.
3. Immutability at Inference: FrozenInferenceScaler prevents accidental .fit() or .fit_transform() calls.
4. Completeness & Validation: Strict type checking, non-empty, and NaN validation guarantees.
"""

import math
from typing import Any, Dict, List, Optional, Tuple, Union

import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler

# Canonical feature ordering derived from model artifacts and training specs
CANONICAL_FEATURES: List[str] = [
    "price",
    "distance_km",
    "rating",
    "quality_score",
    "reliability_score",
    "average_delivery_time_min",
]

# Explicit, deterministic neutral cold-start baseline for unrated new suppliers.
# Used exclusively for feature matrix evaluation and ranking scoring without fabricating database records.
COLD_START_NEUTRAL_BASELINE: Dict[str, float] = {
    "rating": 2.5,
    "quality_score": 2.5,
    "reliability_score": 50.0,
}

# Canonical Pune metropolitan reference center
DEFAULT_REFERENCE_LAT: float = 18.5204
DEFAULT_REFERENCE_LON: float = 73.8567


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Computes great-circle distance between two geographic coordinates in kilometers."""
    r = 6371.0  # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2.0) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return r * c


class FrozenInferenceScaler(StandardScaler):
    """
    Read-only subclass of StandardScaler for online inference.

    Architectural Guardrail:
    -----------------------
    Strictly permits `.transform()` and attribute access (`mean_`, `scale_`, etc.).
    Raises RuntimeError if `.fit()`, `.fit_transform()`, or `.partial_fit()` is invoked,
    preventing catastrophic training-serving skew or corrupted weights in memory.
    """

    def __init__(self, base_scaler: StandardScaler):
        if base_scaler is None:
            raise ValueError("base_scaler cannot be None")
        if not hasattr(base_scaler, "mean_") or base_scaler.mean_ is None:
            raise ValueError("Cannot wrap an unfitted StandardScaler for online inference.")

        super().__init__(
            copy=getattr(base_scaler, "copy", True),
            with_mean=getattr(base_scaler, "with_mean", True),
            with_std=getattr(base_scaler, "with_std", True),
        )
        self.mean_ = base_scaler.mean_.copy() if hasattr(base_scaler.mean_, "copy") else base_scaler.mean_
        self.var_ = base_scaler.var_.copy() if hasattr(base_scaler.var_, "copy") else base_scaler.var_
        self.scale_ = base_scaler.scale_.copy() if hasattr(base_scaler.scale_, "copy") else base_scaler.scale_
        self.n_features_in_ = base_scaler.n_features_in_
        self.n_samples_seen_ = getattr(base_scaler, "n_samples_seen_", None)
        if hasattr(base_scaler, "feature_names_in_"):
            self.feature_names_in_ = base_scaler.feature_names_in_
        self._raw_scaler = base_scaler

    @property
    def unwrap(self) -> StandardScaler:
        """Returns the underlying fitted StandardScaler."""
        return self._raw_scaler

    def fit(self, *args, **kwargs):
        raise RuntimeError(
            "Accidental refitting prevented: Scaler is frozen for online inference. "
            "Call fit() only in offline training pipelines."
        )

    def fit_transform(self, *args, **kwargs):
        raise RuntimeError(
            "Accidental refitting prevented: Scaler is frozen for online inference. "
            "Use .transform() with pre-fitted weights."
        )

    def partial_fit(self, *args, **kwargs):
        raise RuntimeError(
            "Accidental refitting prevented: Scaler is frozen for online inference."
        )

    def __repr__(self) -> str:
        return f"FrozenInferenceScaler(n_features={self.n_features_in_})"


class FeaturePreprocessor:
    """
    Unified feature extraction, validation, and transformation engine.
    Shared identically across offline training pipelines and runtime inference services.
    """

    @staticmethod
    def extract_and_align_features(
        df: pd.DataFrame,
        expected_features: Optional[List[str]] = None,
    ) -> pd.DataFrame:
        """
        Validates column existence, enforces numeric dtypes, verifies no NaN values,
        and strictly aligns column ordering to prevent feature transposition skew.

        Args:
            df: Source DataFrame containing candidate supplier offerings.
            expected_features: List of column names in required order (defaults to CANONICAL_FEATURES).

        Returns:
            pd.DataFrame: Sliced and ordered DataFrame matching expected_features with float64 dtypes.
        """
        if expected_features is None:
            expected_features = CANONICAL_FEATURES

        if df.empty:
            return pd.DataFrame(columns=expected_features, dtype=np.float64)

        # 1. Validate column existence
        missing = [f for f in expected_features if f not in df.columns]
        if missing:
            raise ValueError(
                f"Missing required feature columns for ML preprocessing: {missing}"
            )

        # 2. Extract strictly in the designated canonical order
        X = df[expected_features].copy()

        # 3. Validate numeric types and missing values
        for col in expected_features:
            if not pd.api.types.is_numeric_dtype(X[col]):
                try:
                    X[col] = pd.to_numeric(X[col])
                except Exception as e:
                    raise ValueError(
                        f"Feature column '{col}' contains non-numeric data that cannot be coerced: {e}"
                    )

            # Deterministic cold-start baseline: If historical metrics are missing for a new supplier,
            # impute explicit neutral midpoints (rating=2.5, quality=2.5, reliability=50.0) strictly on X.
            if col in COLD_START_NEUTRAL_BASELINE and X[col].isna().any():
                X[col] = X[col].fillna(COLD_START_NEUTRAL_BASELINE[col])

            if X[col].isna().any():
                nan_count = int(X[col].isna().sum())
                raise ValueError(
                    f"Feature column '{col}' contains {nan_count} NaN values. "
                    "Inference requires complete, non-null feature vectors."
                )

        return X.astype(np.float64)

    @classmethod
    def transform_inference(
        cls,
        df_candidates: pd.DataFrame,
        scaler: Union[StandardScaler, FrozenInferenceScaler],
        expected_features: Optional[List[str]] = None,
    ) -> Tuple[pd.DataFrame, np.ndarray]:
        """
        Online inference transformation entrypoint:
        1. Validates and extracts features in canonical column order.
        2. Applies pre-fitted StandardScaler.transform() without re-fitting.

        Returns:
            Tuple[pd.DataFrame, np.ndarray]: (X_aligned_df, X_scaled_array)
        """
        if expected_features is None:
            expected_features = CANONICAL_FEATURES

        X = cls.extract_and_align_features(df_candidates, expected_features)

        if X.empty:
            return X, np.empty((0, len(expected_features)), dtype=np.float64)

        if not hasattr(scaler, "mean_") or scaler.mean_ is None:
            raise ValueError(
                "StandardScaler is not fitted. Cannot execute online inference transform."
            )

        # Apply transform strictly using pre-fitted parameters
        X_scaled = scaler.transform(X)
        return X, X_scaled

    @classmethod
    def fit_and_transform_training(
        cls,
        df_training: pd.DataFrame,
        feature_columns: Optional[List[str]] = None,
    ) -> Tuple[StandardScaler, np.ndarray, pd.DataFrame]:
        """
        Offline training transformation entrypoint:
        Fits a new StandardScaler on curated training records.

        Returns:
            Tuple[StandardScaler, np.ndarray, pd.DataFrame]: (fitted_scaler, X_scaled, X_aligned)
        """
        if feature_columns is None:
            feature_columns = CANONICAL_FEATURES

        X = cls.extract_and_align_features(df_training, feature_columns)
        if X.empty:
            raise ValueError("Cannot fit scaler on an empty DataFrame.")

        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        return scaler, X_scaled, X

    @staticmethod
    def prepare_raw_dataset(
        raw_df: pd.DataFrame,
        ref_lat: float = DEFAULT_REFERENCE_LAT,
        ref_lon: float = DEFAULT_REFERENCE_LON,
        filter_radius: bool = True,
    ) -> pd.DataFrame:
        """
        Computes distance_km from reference coordinates and filters by delivery_radius_km.
        Shared between offline training dataset preparation and benchmark tests.
        """
        df = raw_df.copy()
        required_cols = ["latitude", "longitude", "delivery_radius_km"]
        for col in required_cols:
            if col not in df.columns:
                raise ValueError(f"Required coordinate column '{col}' is missing.")

        df["distance_km"] = df.apply(
            lambda r: haversine_distance(
                ref_lat, ref_lon, float(r["latitude"]), float(r["longitude"])
            ),
            axis=1,
        )

        if filter_radius:
            df = df[df["distance_km"] <= df["delivery_radius_km"]].copy()

        return df
