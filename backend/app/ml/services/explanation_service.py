import pandas as pd

class ExplanationService:
    """Service to generate deterministic text explanations for recommendations using business rules."""
    
    @staticmethod
    def generate_explanation(row: pd.Series, min_distance: float, min_price: float) -> str:
        """
        Builds a natural language sentence detailing why this supplier is recommended
        based on location proximity, price competitiveness, rating, quality, and delivery.
        """
        reasons = []
        
        # 1. Distance check
        dist = row["distance_km"]
        if dist == min_distance:
            reasons.append("is the closest supplier")
        elif dist < 1.0:
            reasons.append(f"is only {dist:.2f} km away")
        elif dist < 3.0:
            reasons.append(f"is nearby ({dist:.2f} km)")
            
        # 2. Price check
        price = row["price"]
        if price == min_price:
            reasons.append("offers the lowest price")
        elif "price_score" in row and row["price_score"] > 0.8:
            reasons.append("offers highly competitive pricing")
            
        # 3. Rating & Quality checks
        rating = row["rating"]
        quality = row["quality_score"]
        if rating >= 4.7 and quality >= 4.7:
            reasons.append("has premium quality and top-rated status")
        elif rating >= 4.5:
            reasons.append(f"has a high supplier rating of {rating:.1f}/5")
        elif quality >= 4.5:
            reasons.append("offers premium quality raw materials")
            
        # 4. Delivery speed check
        del_time = row["average_delivery_time_min"]
        if del_time < 20:
            reasons.append("provides rapid delivery under 20 mins")
        elif del_time < 35:
            reasons.append("provides fast delivery times")
            
        # Fallback if no criteria are explicitly met
        if not reasons:
            reasons.append("matches your business parameters")
            
        # Format the list of reasons into a grammatically correct sentence
        if len(reasons) == 1:
            details = reasons[0]
        elif len(reasons) == 2:
            details = f"{reasons[0]} and {reasons[1]}"
        else:
            details = ", ".join(reasons[:-1]) + f", and {reasons[-1]}"
            
        return f"Recommended because it {details}."
        
    @classmethod
    def generate_explanations(cls, df: pd.DataFrame) -> pd.DataFrame:
        """Generates reasons for all rows in a DataFrame."""
        if df.empty:
            return df
            
        result_df = df.copy()
        min_dist = result_df["distance_km"].min()
        min_price = result_df["price"].min()
        
        result_df["reason"] = result_df.apply(
            lambda row: cls.generate_explanation(row, min_dist, min_price),
            axis=1
        )
        return result_df
