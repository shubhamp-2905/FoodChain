import os
import threading
import joblib
from typing import Optional

class ModelManager:
    """
    Thread-safe Singleton Manager to load, cache, and reload ML models
    (KMeans and StandardScaler) in memory.
    """
    _instance = None
    _lock = threading.RLock()
    
    _scaler = None
    _kmeans = None
    
    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            with cls._lock:
                if not cls._instance:
                    cls._instance = super().__new__(cls)
        return cls._instance
        
    def __init__(self, artifacts_dir: Optional[str] = None):
        # We only want to initialize paths once
        if not hasattr(self, "_initialized"):
            with self._lock:
                if not hasattr(self, "_initialized"):
                    if artifacts_dir is None:
                        current_dir = os.path.dirname(os.path.abspath(__file__))
                        self.artifacts_dir = os.path.abspath(os.path.join(current_dir, "..", "artifacts"))
                    else:
                        self.artifacts_dir = artifacts_dir
                    
                    self.scaler_path = os.path.join(self.artifacts_dir, "scaler.pkl")
                    self.kmeans_path = os.path.join(self.artifacts_dir, "kmeans.pkl")
                    self._initialized = True
                    
    def _load_models(self):
        """Loads models if they are not already cached."""
        if ModelManager._scaler is None or ModelManager._kmeans is None:
            with self._lock:
                if ModelManager._scaler is None or ModelManager._kmeans is None:
                    if not os.path.exists(self.scaler_path):
                        raise FileNotFoundError(f"Scaler model not found at {self.scaler_path}")
                    if not os.path.exists(self.kmeans_path):
                        raise FileNotFoundError(f"KMeans model not found at {self.kmeans_path}")
                    
                    # Lazy import to avoid circular dependency
                    from app.utils.logger import logger
                    logger.info(f"Loading ML models from: {self.artifacts_dir}")
                    
                    ModelManager._scaler = joblib.load(self.scaler_path)
                    ModelManager._kmeans = joblib.load(self.kmeans_path)
                    logger.info("Successfully loaded ML models into memory cache.")
                    
    def get_scaler(self):
        """Returns the cached StandardScaler instance."""
        self._load_models()
        return ModelManager._scaler
        
    def get_kmeans(self):
        """Returns the cached KMeans instance."""
        self._load_models()
        return ModelManager._kmeans
        
    def reload_models(self):
        """Forces reloading models from disk."""
        with self._lock:
            ModelManager._scaler = None
            ModelManager._kmeans = None
            self._load_models()
