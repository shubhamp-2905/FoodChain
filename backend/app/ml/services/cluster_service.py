import pandas as pd
from typing import Dict, Any, Optional, List
from app.ml.core.model_manager import ModelManager
from app.ml.preprocessing.preprocessor import FeaturePreprocessor


# Canonical definitions of behavioral clusters derived from training centroids
DEFAULT_CLUSTER_PROFILES: Dict[int, Dict[str, str]] = {
    0: {
        "label": "Premium & Rapid Delivery Wholesaler",
        "description": "High reliability score (>90%) with expedited fulfillment under 20 minutes.",
    },
    1: {
        "label": "Cost-Effective Standard Wholesaler",
        "description": "Competitive unit pricing with standard delivery lead times.",
    },
}


class ClusterService:
    """
    ML Behavioral Segmentation Component (Branch A).
    
    Architectural Boundary:
    -----------------------
    ClusterService operates strictly as an unsupervised behavioral segmentation component.
    It does NOT rank, sort, or evaluate recommendation quality.
    
    Its sole responsibility is categorizing eligible suppliers into contextual behavioral
    cohorts using pre-trained StandardScaler and KMeans artifacts.
    """

    def __init__(self, model_manager: ModelManager):
        self.model_manager = model_manager

    @staticmethod
    def get_cluster_label(cluster_id: int) -> str:
        """Returns the semantic label describing the behavioral cohort."""
        profile = DEFAULT_CLUSTER_PROFILES.get(int(cluster_id))
        if profile:
            return profile["label"]
        return f"Supplier Segment {cluster_id}"

    @staticmethod
    def get_cluster_description(cluster_id: int) -> str:
        """Returns the operational description of the behavioral cohort."""
        profile = DEFAULT_CLUSTER_PROFILES.get(int(cluster_id))
        if profile:
            return profile["description"]
        return "Standard supplier cluster segment."

    def segment_suppliers(self, df: pd.DataFrame, X: pd.DataFrame) -> pd.DataFrame:
        """
        Executes unsupervised ML segmentation on candidate suppliers.
        
        Transforms features via pre-fitted FrozenInferenceScaler and assigns cluster labels via KMeans.
        Preserves original DataFrame row ordering and index integrity without sorting.
        
        Returns:
            pd.DataFrame containing 'cluster' (int), 'cluster_label' (str), and 'cluster_desc' (str).
        """
        if df.empty or X.empty:
            empty_df = df.copy()
            empty_df["cluster"] = []
            empty_df["cluster_label"] = []
            empty_df["cluster_desc"] = []
            return empty_df

        scaler = self.model_manager.get_scaler(freeze_for_inference=True)
        kmeans = self.model_manager.get_kmeans()
        expected_features = self.model_manager.get_expected_features()

        # 1. Transform features strictly using unified preprocessor and pre-fitted frozen scaler
        X_aligned, X_scaled = FeaturePreprocessor.transform_inference(
            df_candidates=X,
            scaler=scaler,
            expected_features=expected_features,
        )
        X_scaled_df = pd.DataFrame(X_scaled, columns=X_aligned.columns, index=X_aligned.index)

        # 2. Predict cluster assignments
        cluster_preds = kmeans.predict(X_scaled_df)

        # 3. Assemble segmentation context
        result_df = df.copy()
        result_df["cluster"] = cluster_preds.astype(int)
        result_df["cluster_label"] = [self.get_cluster_label(c) for c in cluster_preds]
        result_df["cluster_desc"] = [self.get_cluster_description(c) for c in cluster_preds]

        return result_df

    def predict_clusters(self, df: pd.DataFrame, X: pd.DataFrame) -> pd.DataFrame:
        """Backward-compatible proxy delegating to segment_suppliers."""
        return self.segment_suppliers(df, X)
