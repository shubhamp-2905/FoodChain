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
        for _, row in df.iterrows():
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
                quality_score=float(row["quality_score"]),
                rating=float(row["rating"]),
                reliability_score=float(row["reliability_score"]),
                delivery_radius_km=float(row["delivery_radius_km"]),
                distance_km=float(row["distance_km"]),
                cluster=int(row["cluster"]),
                recommendation_score=rec_score,
                delivery_time=int(row["average_delivery_time_min"]),
                match_score=match_score,
                confidence=confidence,
                reason=str(row.get("reason", "Recommended matching your requirements."))
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
        processing_time_ms: int
    ) -> RecommendationResponse:
        """Constructs the final rich API response payload."""
        recommendations = cls.build_recommendations(ranked_df)
        
        best_supplier = recommendations[0] if recommendations else None
        alternatives = recommendations[1:] if len(recommendations) > 1 else []
        
        metadata = RecommendationMetadata(
            suppliers_checked=suppliers_checked,
            eligible_suppliers=eligible_suppliers,
            processing_time_ms=processing_time_ms,
            model_version="1.0.0"
        )
        
        return RecommendationResponse(
            ingredient=ingredient,
            generated_at=datetime.now(timezone.utc).isoformat(),
            best_supplier=best_supplier,
            alternatives=alternatives,
            metadata=metadata
        )
