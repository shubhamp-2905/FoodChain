import pandas as pd
from app.ml.utils.haversine import haversine_distance

class DistanceService:
    """Service to handle Haversine calculations and distance filtering."""
    
    @staticmethod
    def calculate_distances_and_filter(
        df: pd.DataFrame,
        vendor_lat: float,
        vendor_lon: float
    ) -> pd.DataFrame:
        """
        Calculates distance_km between the vendor and each supplier,
        and filters out suppliers whose distance exceeds their delivery radius.
        """
        if df.empty:
            return df
            
        required_cols = ["latitude", "longitude", "delivery_radius_km"]
        for col in required_cols:
            if col not in df.columns:
                raise ValueError(f"Required column '{col}' is missing from DataFrame.")
                
        # Calculate Haversine distance
        df["distance_km"] = df.apply(
            lambda row: haversine_distance(
                vendor_lat,
                vendor_lon,
                row["latitude"],
                row["longitude"]
            ),
            axis=1
        )
        
        # Filter suppliers within their delivery radius
        filtered_df = df[df["distance_km"] <= df["delivery_radius_km"]].copy()
        
        return filtered_df
