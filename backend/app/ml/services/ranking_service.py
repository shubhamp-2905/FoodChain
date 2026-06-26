import pandas as pd
from app.ml.utils.ranking import compute_ranking_scores

class RankingService:
    """Service to handle the business-aware weighted ranking logic."""
    
    @staticmethod
    def rank_suppliers(df: pd.DataFrame) -> pd.DataFrame:
        """
        Applies normalized metrics and business weights to compute the recommendation score.
        Sorts the suppliers descending by their recommendation score.
        """
        if df.empty:
            return df
            
        ranked_df = compute_ranking_scores(df)
        
        # Sort by recommendation_score descending
        sorted_df = ranked_df.sort_values(
            by="recommendation_score",
            ascending=False
        ).copy()
        
        return sorted_df
