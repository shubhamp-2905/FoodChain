import pandas as pd
from app.ml.utils.ranking import compute_ranking_scores


class RankingService:
    """
    Deterministic Business Ranking Engine (Branch B).

    Architectural Boundary:
    -----------------------
    RankingService is solely responsible for evaluating candidate supplier utility
    and determining final recommendation ordering.

    It applies a deterministic, multi-criteria weighted scoring model:
      * Distance:     35% (lower is better)
      * Price:        25% (lower is better)
      * Rating:       15% (higher is better)
      * Quality:      10% (higher is better)
      * Reliability:  10% (higher is better)
      * Delivery:      5% (lower is better)

    Crucial Guarantee:
    K-Means clustering does NOT determine or influence the ranking order.
    Ranking is 100% deterministic and business-driven.
    """

    @staticmethod
    def rank_suppliers(df: pd.DataFrame) -> pd.DataFrame:
        """
        Applies normalized metrics and business weights to compute the recommendation score.
        Sorts the suppliers descending by their recommendation score and assigns an explicit rank.
        """
        if df.empty:
            return df

        # Compute normalized multi-criteria scores
        scored_df = compute_ranking_scores(df)

        # Sort by recommendation_score descending (with ties broken deterministically by rating_score and distance)
        sorted_df = scored_df.sort_values(
            by=["recommendation_score", "rating_score", "distance_km"],
            ascending=[False, False, True],
        ).copy()

        # Assign explicit 1-indexed business rank
        sorted_df["rank"] = range(1, len(sorted_df) + 1)

        return sorted_df
