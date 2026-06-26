import pandas as pd
from typing import List, Dict, Any, Tuple
from app.ml.utils.haversine import haversine_distance

def to_dict(obj: Any) -> Dict[str, Any]:
    """Helper to dynamically convert objects, SQLAlchemy models, or Pydantic models to dicts."""
    if isinstance(obj, dict):
        return obj
    if obj.__class__.__name__ == "SupplierInventory":
        supplier = getattr(obj, "supplier", None)
        product = getattr(obj, "product", None)
        if supplier and product:
            return {
                "id": supplier.id,
                "supplier_id": supplier.supplier_id,
                "supplier_name": supplier.supplier_name,
                "supplier_type": supplier.supplier_type,
                "market": supplier.market,
                "area": supplier.area,
                "latitude": supplier.latitude,
                "longitude": supplier.longitude,
                "quality_score": supplier.quality_score,
                "rating": supplier.rating,
                "reliability_score": supplier.reliability_score,
                "delivery_radius_km": supplier.delivery_radius_km,
                "average_delivery_time_min": supplier.average_delivery_time_min,
                "ingredient": product.ingredient,
                "category": product.category,
                "unit": product.unit,
                "price": obj.price,
                "stock_available": obj.stock_available,
                "minimum_order": obj.minimum_order,
            }
    if hasattr(obj, "model_dump"):
        return obj.model_dump()
    if hasattr(obj, "dict") and callable(getattr(obj, "dict")):
        return obj.dict()
    if hasattr(obj, "__table__"):
        res = {col.name: getattr(obj, col.name) for col in obj.__table__.columns}
        # If it has a related model or properties like product, unpack them
        if hasattr(obj, "product") and obj.product:
            res["ingredient"] = getattr(obj.product, "ingredient", None)
            res["category"] = getattr(obj.product, "category", None)
            res["unit"] = getattr(obj.product, "unit", None)
        if hasattr(obj, "supplier") and obj.supplier:
            for s_col in obj.supplier.__table__.columns.keys():
                if s_col not in res or res[s_col] is None:
                    res[s_col] = getattr(obj.supplier, s_col)
        return res
    if hasattr(obj, "__dict__"):
        return vars(obj)
    return {}

def preprocess_offerings(
    offerings: List[Any],
    vendor_lat: float,
    vendor_lon: float,
    ingredient: str
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Filter offerings by ingredient, calculate distance, filter by delivery radius,
    and output:
    1. The filtered offerings DataFrame.
    2. The ML feature matrix (ready for scaling).
    """
    if not offerings:
        return pd.DataFrame(), pd.DataFrame()
        
    dict_offerings = [to_dict(o) for o in offerings]
    df = pd.DataFrame(dict_offerings)
    
    # 1. Filter by ingredient (case-insensitive)
    if "ingredient" not in df.columns:
        return pd.DataFrame(), pd.DataFrame()
        
    df = df[df["ingredient"].str.lower() == ingredient.lower()].copy()
    if df.empty:
        return pd.DataFrame(), pd.DataFrame()
        
    # 2. Calculate haversine distance
    required_cols = ["latitude", "longitude", "delivery_radius_km"]
    for col in required_cols:
        if col not in df.columns:
            raise ValueError(f"Required coordinate column '{col}' is missing from the offerings data.")
            
    df["distance_km"] = df.apply(
        lambda row: haversine_distance(
            vendor_lat,
            vendor_lon,
            row["latitude"],
            row["longitude"]
        ),
        axis=1
    )
    
    # 3. Filter by delivery radius
    df = df[df["distance_km"] <= df["delivery_radius_km"]].copy()
    if df.empty:
        return pd.DataFrame(), pd.DataFrame()
        
    # 4. Select ML features in the exact order as notebooks
    features = [
        "price",
        "distance_km",
        "rating",
        "quality_score",
        "reliability_score",
        "average_delivery_time_min"
    ]
    
    for feature in features:
        if feature not in df.columns:
            raise ValueError(f"Required ML feature '{feature}' is missing from the offerings data.")
            
    X = df[features].copy()
    return df, X
