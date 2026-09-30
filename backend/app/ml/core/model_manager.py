import os
import json
import threading
import joblib
from typing import Optional, Dict, Any


class ModelManager:
    """
    Thread-safe Singleton Manager to load, cache, and reload ML models
    (KMeans, StandardScaler, and model metadata) in memory.
    """

    _instance = None
    _lock = threading.RLock()

    _scaler = None
    _frozen_scaler = None
    _kmeans = None
    _metadata = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            with cls._lock:
                if not cls._instance:
                    cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self, artifacts_dir: Optional[str] = None):
        if not hasattr(self, "_initialized"):
            with self._lock:
                if not hasattr(self, "_initialized"):
                    if artifacts_dir is None:
                        current_dir = os.path.dirname(os.path.abspath(__file__))
                        self.artifacts_dir = os.path.abspath(
                            os.path.join(current_dir, "..", "artifacts")
                        )
                    else:
                        self.artifacts_dir = artifacts_dir

                    self.scaler_path = os.path.join(self.artifacts_dir, "scaler.pkl")
                    self.kmeans_path = os.path.join(self.artifacts_dir, "kmeans.pkl")
                    self.metadata_path = os.path.join(
                        self.artifacts_dir, "model_metadata.json"
                    )
                    self._initialized = True

    def _load_models(self):
        """Loads models and metadata if they are not already cached."""
        if (
            ModelManager._scaler is None
            or ModelManager._kmeans is None
            or ModelManager._metadata is None
        ):
            with self._lock:
                if (
                    ModelManager._scaler is None
                    or ModelManager._kmeans is None
                    or ModelManager._metadata is None
                ):
                    if not os.path.exists(self.scaler_path):
                        raise FileNotFoundError(
                            f"Scaler model not found at {self.scaler_path}"
                        )
                    if not os.path.exists(self.kmeans_path):
                        raise FileNotFoundError(
                            f"KMeans model not found at {self.kmeans_path}"
                        )

                    # Lazy import to avoid circular dependency
                    from app.utils.logger import logger

                    logger.info(f"Loading ML models from: {self.artifacts_dir}")

                    ModelManager._scaler = joblib.load(self.scaler_path)
                    ModelManager._kmeans = joblib.load(self.kmeans_path)

                    # Wrap scaler for safe inference immutability
                    from app.ml.preprocessing.preprocessor import FrozenInferenceScaler
                    ModelManager._frozen_scaler = FrozenInferenceScaler(ModelManager._scaler)

                    # Load metadata JSON if present
                    if os.path.exists(self.metadata_path):
                        with open(self.metadata_path, "r", encoding="utf-8") as f:
                            ModelManager._metadata = json.load(f)
                    else:
                        ModelManager._metadata = {
                            "model_version": "1.0.0",
                            "algorithm": "KMeans",
                            "n_clusters": getattr(ModelManager._kmeans, "n_clusters", 2),
                        }

                    logger.info("Successfully loaded ML models into memory cache.")

    def get_scaler(self, freeze_for_inference: bool = True):
        """
        Returns the cached StandardScaler instance.
        By default (freeze_for_inference=True), returns a FrozenInferenceScaler to guarantee
        immutability and prevent accidental refitting during online serving.
        """
        self._load_models()
        if freeze_for_inference:
            return ModelManager._frozen_scaler
        return ModelManager._scaler

    def get_kmeans(self):
        """Returns the cached KMeans instance."""
        self._load_models()
        return ModelManager._kmeans

    def get_metadata(self) -> Dict[str, Any]:
        """Returns the loaded model metadata dictionary."""
        self._load_models()
        return ModelManager._metadata or {}

    def get_expected_features(self) -> list:
        """Returns the canonical feature column ordering from metadata or default spec."""
        from app.ml.preprocessing.preprocessor import CANONICAL_FEATURES
        metadata = self.get_metadata()
        return metadata.get("feature_columns", CANONICAL_FEATURES)

    def reload_models(self):
        """Forces reloading models and metadata from disk."""
        with self._lock:
            ModelManager._scaler = None
            ModelManager._frozen_scaler = None
            ModelManager._kmeans = None
            ModelManager._metadata = None
            self._load_models()
