import pandas as pd
import numpy as np

def compute_ranking_scores(df: pd.DataFrame) -> pd.DataFrame:
    """
    Computes recommendation_score based on normalized metrics and business weights:
    - Distance (35%): lower is better
    - Price (25%): lower is better
    - Rating (15%): higher is better
    - Quality (10%): higher is better
    - Reliability (10%): higher is better
    - Delivery time (5%): lower is better
    """
    if df.empty:
        return df
        
    result = df.copy()
    
    # 1. Distance score (lower is better, normalized by max value)
    max_dist = result["distance_km"].max()
    if pd.isna(max_dist) or max_dist == 0:
        result["distance_score"] = 1.0
    else:
        result["distance_score"] = 1.0 - (result["distance_km"] / max_dist)
        
    # 2. Price score (lower is better, normalized by max value)
    max_price = result["price"].max()
    if pd.isna(max_price) or max_price == 0:
        result["price_score"] = 1.0
    else:
        result["price_score"] = 1.0 - (result["price"] / max_price)
        
    # 3. Rating score (higher is better, out of 5)
    result["rating_score"] = result["rating"] / 5.0
    
    # 4. Quality score (higher is better, out of 5)
    result["quality_score_norm"] = result["quality_score"] / 5.0
    
    # 5. Reliability score (higher is better, out of 100)
    result["reliability_score_norm"] = result["reliability_score"] / 100.0
    
    # 6. Delivery score (lower is better, normalized by max value)
    max_delivery = result["average_delivery_time_min"].max()
    if pd.isna(max_delivery) or max_delivery == 0:
        result["delivery_score"] = 1.0
    else:
        result["delivery_score"] = 1.0 - (result["average_delivery_time_min"] / max_delivery)
        
    # Apply weights
    result["recommendation_score"] = (
        0.35 * result["distance_score"] +
        0.25 * result["price_score"] +
        0.15 * result["rating_score"] +
        0.10 * result["quality_score_norm"] +
        0.10 * result["reliability_score_norm"] +
        0.05 * result["delivery_score"]
    )
    
    # Fill any NaNs in recommendation_score with 0.0
    result["recommendation_score"] = result["recommendation_score"].fillna(0.0)
    
    return result
