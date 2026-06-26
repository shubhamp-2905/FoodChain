import pandas as pd
from app.ml.core.model_manager import ModelManager

class ClusterService:
    """Service to handle StandardScaler feature transformation and KMeans clustering predictions."""
    
    def __init__(self, model_manager: ModelManager):
        self.model_manager = model_manager
        
    def predict_clusters(self, df: pd.DataFrame, X: pd.DataFrame) -> pd.DataFrame:
        """
        Scales features using standard scaler, predicts cluster assignments,
        and adds a 'cluster' column to the DataFrame.
        """
        if df.empty:
            return df
            
        scaler = self.model_manager.get_scaler()
        kmeans = self.model_manager.get_kmeans()
        
        # 1. Scale features
        X_scaled = scaler.transform(X)
        X_scaled_df = pd.DataFrame(X_scaled, columns=X.columns)
        
        # 2. Predict clusters and assign to df
        result_df = df.copy()
        result_df["cluster"] = kmeans.predict(X_scaled_df)
        
        return result_df
