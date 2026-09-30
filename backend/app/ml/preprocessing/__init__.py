"""
FoodChain AI - ML Feature Preprocessing Package
Phase 8: Consistent Training & Inference Preprocessing
"""

from app.ml.preprocessing.preprocessor import (
    CANONICAL_FEATURES,
    DEFAULT_REFERENCE_LAT,
    DEFAULT_REFERENCE_LON,
    FrozenInferenceScaler,
    FeaturePreprocessor,
    haversine_distance,
)

__all__ = [
    "CANONICAL_FEATURES",
    "DEFAULT_REFERENCE_LAT",
    "DEFAULT_REFERENCE_LON",
    "FrozenInferenceScaler",
    "FeaturePreprocessor",
    "haversine_distance",
]
