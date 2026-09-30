import time
import pandas as pd
from typing import List, Any, Optional

from app.utils.logger import logger
from app.ml.core.model_manager import ModelManager
from app.ml.utils.preprocessing import to_dict
from app.ml.services.distance_service import DistanceService
from app.ml.services.cluster_service import ClusterService
from app.ml.services.ranking_service import RankingService
from app.ml.services.explanation_service import ExplanationService
from app.ml.services.response_builder import ResponseBuilder
from app.ml.schemas.recommendation import RecommendationResponse
from app.ml.preprocessing.preprocessor import FeaturePreprocessor, CANONICAL_FEATURES

class RecommendationService:
    """
    Decoupled Orchestrator for Supplier Recommendation.

    Explicit Two-Branch Architecture:
    ---------------------------------
          Feature Engineering
                   │
           ┌───────┴───────┐
           ▼               ▼
        K-Means       Business Ranking
           │               │
           ▼               ▼
     Cluster Assignment Weighted Score
           │               │
           └───────┬───────┘
                   ▼
          Final Recommendation

    Key Principles:
    1. K-Means serves strictly as an unsupervised behavioral segmentation component.
       It categorizes suppliers into operational profiles (contextual metadata).
    2. The Deterministic Business Ranking Engine is solely responsible for scoring
       and ranking candidates based on business priorities.
    3. The synthesis step strictly preserves business rank ordering while attaching
       cluster segmentation context.
    """

    ML_FEATURE_COLUMNS = CANONICAL_FEATURES

    def __init__(self, artifacts_dir: Optional[str] = None):
        self.model_manager = ModelManager(artifacts_dir)
        self.cluster_service = ClusterService(self.model_manager)
        self.ranking_service = RankingService()

    @classmethod
    def _extract_ml_features(cls, df: pd.DataFrame) -> pd.DataFrame:
        """Extracts and validates the numerical feature matrix for ML inference using unified preprocessor."""
        expected = cls.ML_FEATURE_COLUMNS
        try:
            return FeaturePreprocessor.extract_and_align_features(df, expected)
        except Exception as e:
            logger.error(f"Feature extraction failed: {e}")
            raise e

    @staticmethod
    def _synthesize_branches(
        df_ranked: pd.DataFrame, df_clusters: pd.DataFrame
    ) -> pd.DataFrame:
        """
        Synthesizes the outputs of Branch A (ML Segmentation) and Branch B (Business Ranking).

        Guarantees:
        * Sort order is 100% determined by Branch B (recommendation_score).
        * Cluster assignments and semantic segment labels are attached as contextual attributes.
        """
        synthesized = df_ranked.copy()
        for col in ["cluster", "cluster_label", "cluster_desc"]:
            if col in df_clusters.columns:
                synthesized[col] = df_clusters.loc[synthesized.index, col]
        return synthesized

    def recommend(
        self,
        offerings: List[Any],
        vendor_lat: float,
        vendor_lon: float,
        ingredient: str,
        top_n: int = 5,
        request_id: Optional[str] = None,
        api_version: str = "v1",
    ) -> RecommendationResponse:
        start_time = time.perf_counter()

        logger.info(
            f"Processing recommendation request [{request_id or 'anon'}] for ingredient: '{ingredient}' "
            f"at coordinates: ({vendor_lat}, {vendor_lon})"
        )

        suppliers_checked = len(offerings)

        # 1. Ingestion & Conversion
        if not offerings:
            logger.warning("Empty offerings list provided. Returning empty recommendation.")
            return ResponseBuilder.build_response(
                ranked_df=pd.DataFrame(),
                ingredient=ingredient,
                suppliers_checked=0,
                eligible_suppliers=0,
                processing_time_ms=0,
                request_id=request_id,
                api_version=api_version,
            )

        dict_offerings = [to_dict(o) for o in offerings]
        df = pd.DataFrame(dict_offerings)

        # 2. Ingredient Catalog Filter
        if "ingredient" not in df.columns:
            logger.warning("Ingredient column not found in offerings. Returning empty recommendation.")
            return ResponseBuilder.build_response(
                ranked_df=pd.DataFrame(),
                ingredient=ingredient,
                suppliers_checked=suppliers_checked,
                eligible_suppliers=0,
                processing_time_ms=0,
                request_id=request_id,
                api_version=api_version,
            )

        df_ingredient = df[df["ingredient"].str.lower() == ingredient.lower()].copy()
        if df_ingredient.empty:
            logger.info(f"No suppliers offer ingredient '{ingredient}'. Returning empty recommendation.")
            return ResponseBuilder.build_response(
                ranked_df=pd.DataFrame(),
                ingredient=ingredient,
                suppliers_checked=suppliers_checked,
                eligible_suppliers=0,
                processing_time_ms=0,
                request_id=request_id,
                api_version=api_version,
            )

        # 3. Spatial Distance Calculation & Delivery Radius Filter
        try:
            df_filtered = DistanceService.calculate_distances_and_filter(
                df_ingredient, vendor_lat, vendor_lon
            )
        except Exception as e:
            logger.error(f"Error during distance calculation and filtering: {e}", exc_info=True)
            raise e

        eligible_suppliers = len(df_filtered)
        if df_filtered.empty:
            logger.info(
                f"No suppliers offering '{ingredient}' are within delivery radius. Returning empty recommendation."
            )
            return ResponseBuilder.build_response(
                ranked_df=pd.DataFrame(),
                ingredient=ingredient,
                suppliers_checked=suppliers_checked,
                eligible_suppliers=0,
                processing_time_ms=0,
                request_id=request_id,
                api_version=api_version,
            )

        # 4. Feature Engineering
        X = self._extract_ml_features(df_filtered)

        # -------------------------------------------------------------
        # BRANCH A: Unsupervised ML Segmentation (Context Component)
        # -------------------------------------------------------------
        # Evaluates multi-dimensional supplier attributes and assigns behavioral cluster.
        # Note: ClusterService does NOT rank or filter.
        try:
            df_clusters = self.cluster_service.segment_suppliers(df_filtered, X)
        except Exception as e:
            logger.error(f"Error during ML segmentation branch: {e}", exc_info=True)
            raise e

        # -------------------------------------------------------------
        # BRANCH B: Deterministic Business Ranking Engine (Decision Component)
        # -------------------------------------------------------------
        # Evaluates normalized business metrics and weights to compute match_score and rank.
        # Note: Solely responsible for recommendation order.
        try:
            df_ranked = self.ranking_service.rank_suppliers(df_filtered)
        except Exception as e:
            logger.error(f"Error during business ranking branch: {e}", exc_info=True)
            raise e

        # -------------------------------------------------------------
        # SYNTHESIS: Merge Segmentation Context into Ranked Recommendations
        # -------------------------------------------------------------
        df_synthesized = self._synthesize_branches(df_ranked, df_clusters)

        # 5. Deterministic Explainability
        try:
            df_explained = ExplanationService.generate_explanations(df_synthesized)
        except Exception as e:
            logger.error(f"Error during explanation generation: {e}", exc_info=True)
            raise e

        # 6. Top N Selection & Latency
        top_ranked = df_explained.head(top_n)

        end_time = time.perf_counter()
        processing_time_ms = int(round((end_time - start_time) * 1000))

        logger.info(
            f"Successfully generated recommendations for '{ingredient}'. "
            f"Checked: {suppliers_checked}, Eligible: {eligible_suppliers}, Latency: {processing_time_ms}ms"
        )

        # 7. Response Building
        return ResponseBuilder.build_response(
            ranked_df=top_ranked,
            ingredient=ingredient,
            suppliers_checked=suppliers_checked,
            eligible_suppliers=eligible_suppliers,
            processing_time_ms=processing_time_ms,
            request_id=request_id,
            api_version=api_version,
        )
