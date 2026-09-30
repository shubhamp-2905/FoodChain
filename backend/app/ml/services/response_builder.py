import pandas as pd
from datetime import datetime, timezone
from typing import List, Optional
from app.ml.schemas.recommendation import RecommendationResponse, SupplierRecommendation, RecommendationMetadata

class ResponseBuilder:
    """Service to transform ranked DataFrames into Pydantic API response models."""
    
    @staticmethod
    def build_recommendations(df: pd.DataFrame) -> List[SupplierRecommendation]:
        """Converts rows of a DataFrame into a list of SupplierRecommendation Pydantic models."""
        recommendations = []
        for idx, (_, row) in enumerate(df.iterrows()):
            # Get integer ID or fall back to extracting digits from supplier_id string (e.g. SUPP00001 -> 1)
            rec_id = row.get("id")
            if pd.isna(rec_id) or rec_id is None:
                supp_id_str = str(row.get("supplier_id", ""))
                digits = "".join([c for c in supp_id_str if c.isdigit()])
                rec_id = int(digits) if digits else 0
            else:
                rec_id = int(rec_id)

            # Calculate match_score from recommendation_score
            rec_score = float(row.get("recommendation_score", 0.0))
            match_score = int(round(rec_score * 100))
            match_score = max(0, min(100, match_score))
            
            # Classify confidence
            if match_score >= 80:
                confidence = "High"
            elif match_score >= 50:
                confidence = "Medium"
            else:
                confidence = "Low"
                
            # Extract cluster and semantic label
            cluster_val = int(row.get("cluster", 0))
            cluster_label = row.get("cluster_label")
            if pd.isna(cluster_label) or not cluster_label:
                cluster_label = f"Cluster {cluster_val}"

            explanation_text = str(row.get("reason", "Recommended matching your requirements."))
            rec = SupplierRecommendation(
                id=rec_id,
                supplier_id=str(row["supplier_id"]),
                supplier_name=str(row["supplier_name"]),
                supplier_type=str(row["supplier_type"]),
                market=str(row["market"]),
                area=str(row["area"]),
                latitude=float(row["latitude"]),
                longitude=float(row["longitude"]),
                ingredient=str(row["ingredient"]),
                category=str(row["category"]),
                price=float(row["price"]),
                unit=str(row["unit"]),
                stock_available=int(row["stock_available"]),
                minimum_order=int(row["minimum_order"]),
                quality_score=(
                    float(row["quality_score"])
                    if pd.notna(row.get("quality_score")) and row.get("quality_score") is not None
                    else None
                ),
                rating=(
                    float(row["rating"])
                    if pd.notna(row.get("rating")) and row.get("rating") is not None
                    else None
                ),
                reliability_score=(
                    float(row["reliability_score"])
                    if pd.notna(row.get("reliability_score")) and row.get("reliability_score") is not None
                    else None
                ),
                delivery_radius_km=float(row["delivery_radius_km"]),
                distance_km=float(row["distance_km"]),
                cluster=cluster_val,
                cluster_label=str(cluster_label),
                recommendation_score=rec_score,
                rank=idx + 1,
                delivery_time=int(row["average_delivery_time_min"]),
                match_score=match_score,
                confidence=confidence,
                reason=explanation_text,
                explanation=explanation_text,
            )
            recommendations.append(rec)
        return recommendations


    @classmethod
    def build_response(
        cls,
        ranked_df: pd.DataFrame,
        ingredient: str,
        suppliers_checked: int,
        eligible_suppliers: int,
        processing_time_ms: int,
        model_version: Optional[str] = None,
        request_id: Optional[str] = None,
        api_version: str = "v1",
    ) -> RecommendationResponse:
        """Constructs the final rich API response payload."""
        recommendations = cls.build_recommendations(ranked_df)

        best_supplier = recommendations[0] if recommendations else None
        alternatives = recommendations[1:] if len(recommendations) > 1 else []

        if not model_version:
            from app.ml.core.model_manager import ModelManager

            model_version = ModelManager().get_metadata().get("model_version", "1.1.0")

        metadata = RecommendationMetadata(
            suppliers_checked=suppliers_checked,
            eligible_suppliers=eligible_suppliers,
            processing_time_ms=processing_time_ms,
            model_version=model_version,
            request_id=request_id,
            api_version=api_version,
        )
        
        return RecommendationResponse(
            ingredient=ingredient,
            generated_at=datetime.now(timezone.utc).isoformat(),
            best_supplier=best_supplier,
            alternatives=alternatives,
            metadata=metadata
        )
