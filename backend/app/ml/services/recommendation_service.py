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

class RecommendationService:
    """
    Orchestrator for the Supplier Recommendation pipeline.
    Coordinates:
    Distance Service -> Preprocessing -> Cluster Service -> Ranking Service -> Explanation Service -> Response Builder
    """
    def __init__(self, artifacts_dir: Optional[str] = None):
        self.model_manager = ModelManager(artifacts_dir)
        self.cluster_service = ClusterService(self.model_manager)
        
    def recommend(
        self,
        offerings: List[Any],
        vendor_lat: float,
        vendor_lon: float,
        ingredient: str,
        top_n: int = 5
    ) -> RecommendationResponse:
        start_time = time.perf_counter()
        
        # Log structured request details
        logger.info(
            f"Processing recommendation request for ingredient: '{ingredient}' "
            f"at coordinates: ({vendor_lat}, {vendor_lon})"
        )
        
        suppliers_checked = len(offerings)
        
        # 1. Convert to DataFrame
        if not offerings:
            logger.warning("Empty offerings list provided. Returning empty recommendation.")
            return ResponseBuilder.build_response(
                ranked_df=pd.DataFrame(),
                ingredient=ingredient,
                suppliers_checked=0,
                eligible_suppliers=0,
                processing_time_ms=0
            )
            
        dict_offerings = [to_dict(o) for o in offerings]
        df = pd.DataFrame(dict_offerings)
        
        # 2. Preprocessing - Filter by ingredient
        if "ingredient" not in df.columns:
            logger.warning("Ingredient column not found in offerings. Returning empty recommendation.")
            return ResponseBuilder.build_response(
                ranked_df=pd.DataFrame(),
                ingredient=ingredient,
                suppliers_checked=suppliers_checked,
                eligible_suppliers=0,
                processing_time_ms=0
            )
            
        df_ingredient = df[df["ingredient"].str.lower() == ingredient.lower()].copy()
        if df_ingredient.empty:
            logger.info(f"No suppliers offer ingredient '{ingredient}'. Returning empty recommendation.")
            return ResponseBuilder.build_response(
                ranked_df=pd.DataFrame(),
                ingredient=ingredient,
                suppliers_checked=suppliers_checked,
                eligible_suppliers=0,
                processing_time_ms=0
            )
            
        # 3. Distance Service - Calculate distances & filter by radius
        try:
            df_filtered = DistanceService.calculate_distances_and_filter(
                df_ingredient,
                vendor_lat,
                vendor_lon
            )
        except Exception as e:
            logger.error(f"Error during distance calculation and filtering: {e}", exc_info=True)
            raise e
            
        eligible_suppliers = len(df_filtered)
        if df_filtered.empty:
            logger.info(f"No suppliers offering '{ingredient}' are within delivery radius. Returning empty recommendation.")
            return ResponseBuilder.build_response(
                ranked_df=pd.DataFrame(),
                ingredient=ingredient,
                suppliers_checked=suppliers_checked,
                eligible_suppliers=0,
                processing_time_ms=0
            )
            
        # 4. Feature Selection for Clustering
        features = [
            "price",
            "distance_km",
            "rating",
            "quality_score",
            "reliability_score",
            "average_delivery_time_min"
        ]
        for feature in features:
            if feature not in df_filtered.columns:
                err_msg = f"Required ML feature '{feature}' is missing from the preprocessed data."
                logger.error(err_msg)
                raise ValueError(err_msg)
                
        X = df_filtered[features].copy()
        
        # 5. Cluster Service - StandardScaler scale & KMeans prediction
        try:
            df_clustered = self.cluster_service.predict_clusters(df_filtered, X)
        except Exception as e:
            logger.error(f"Error during clustering prediction: {e}", exc_info=True)
            raise e
            
        # 6. Ranking Service - Business weight scoring
        try:
            df_ranked = RankingService.rank_suppliers(df_clustered)
        except Exception as e:
            logger.error(f"Error during supplier ranking: {e}", exc_info=True)
            raise e
            
        # 7. Explanation Service - Generate deterministic reasons
        try:
            df_explained = ExplanationService.generate_explanations(df_ranked)
        except Exception as e:
            logger.error(f"Error during explanation generation: {e}", exc_info=True)
            raise e
            
        # 8. Filter top N
        top_ranked = df_explained.head(top_n)
        
        # Calculate latency
        end_time = time.perf_counter()
        processing_time_ms = int(round((end_time - start_time) * 1000))
        
        logger.info(
            f"Successfully generated recommendations for '{ingredient}'. "
            f"Checked: {suppliers_checked}, Eligible: {eligible_suppliers}, Latency: {processing_time_ms}ms"
        )
        
        # 9. Response Builder - Convert to Pydantic responses
        return ResponseBuilder.build_response(
            ranked_df=top_ranked,
            ingredient=ingredient,
            suppliers_checked=suppliers_checked,
            eligible_suppliers=eligible_suppliers,
            processing_time_ms=processing_time_ms
        )
