"""
FoodChain AI - Deterministic Explainability Service
Phase 9: Deterministic Explainability

Guarantees:
1. 100% Deterministic: Zero hallucinations, zero stochastic heuristics, zero external LLM dependencies.
2. Value-Grounded Rationales: Every clause incorporates exact, verified numerical values
   (e.g., exact distance in km, unit price, rating, reliability score, and delivery lead time).
3. Context-Aware Superlatives: Highlights competitive advantages (e.g., 'closest supplier', 'lowest price')
   relative to the candidate cohort.
4. Natural Compound Grammar: Produces fluent, grammatically cohesive English sentences.
"""

from typing import Any, Dict, List, Optional, Union
import pandas as pd


class ExplanationService:
    """
    Deterministic rule-based explanation engine converting quantitative supplier metrics
    into human-readable, data-backed rationale strings for street-food vendors.
    """

    @staticmethod
    def generate_explanation(
        row: Union[pd.Series, Dict[str, Any]],
        min_distance: Optional[float] = None,
        min_price: Optional[float] = None,
    ) -> str:
        """
        Builds a natural language sentence detailing why this supplier is recommended
        using exact, verified numerical values for distance, price, rating, reliability, and delivery.

        Example output:
        "Recommended because it is 0.58 km away, offers a price of ₹22.50/kg, has a 4.8 rating,
        95 reliability score and 18-minute average delivery time."
        """
        clauses: List[str] = []

        # 1. Proximity Clause
        dist = row.get("distance_km")
        if dist is not None and not pd.isna(dist):
            dist_val = float(dist)
            if min_distance is not None and abs(dist_val - float(min_distance)) < 0.001:
                clauses.append(f"is the closest supplier at {dist_val:.2f} km away")
            elif dist_val < 1.0:
                clauses.append(f"is only {dist_val:.2f} km away")
            else:
                clauses.append(f"is {dist_val:.2f} km away")

        # 2. Price Clause
        price = row.get("price")
        unit = str(row.get("unit", "")).strip() if row.get("unit") else ""
        unit_suffix = f"/{unit}" if unit else ""
        if price is not None and not pd.isna(price):
            price_val = float(price)
            if min_price is not None and abs(price_val - float(min_price)) < 0.001:
                clauses.append(f"offers the lowest price at ₹{price_val:.2f}{unit_suffix}")
            else:
                clauses.append(f"offers a price of ₹{price_val:.2f}{unit_suffix}")

        # 3. Rating & Quality Clause
        rating = row.get("rating")
        if rating is not None and not pd.isna(rating):
            rating_val = float(rating)
            if rating_val >= 4.8:
                clauses.append(f"has a top-rated {rating_val:.1f} rating")
            else:
                clauses.append(f"has a {rating_val:.1f} rating")

        # 4. Reliability Score Clause
        reliability = row.get("reliability_score")
        if reliability is not None and not pd.isna(reliability):
            rel_val = int(round(float(reliability)))
            clauses.append(f"{rel_val} reliability score")

        # 5. Delivery Speed Clause
        delivery_time = row.get("average_delivery_time_min")
        if delivery_time is None:
            delivery_time = row.get("delivery_time")
        if delivery_time is not None and not pd.isna(delivery_time):
            del_val = int(round(float(delivery_time)))
            clauses.append(f"{del_val}-minute average delivery time")

        # Fallback if insufficient data is present
        if not clauses:
            area = row.get("area")
            market = row.get("market")
            loc_str = f" in {area or market}" if (area or market) else ""
            return f"Recommended matching your business requirements{loc_str}."

        # Compound sentence synthesis
        if len(clauses) == 1:
            body = clauses[0]
        elif len(clauses) == 2:
            body = f"{clauses[0]} and {clauses[1]}"
        else:
            body = f"{', '.join(clauses[:-1])} and {clauses[-1]}"

        return f"Recommended because it {body}."

    @staticmethod
    def extract_explanation_factors(
        row: Union[pd.Series, Dict[str, Any]],
        min_distance: Optional[float] = None,
        min_price: Optional[float] = None,
    ) -> List[Dict[str, Any]]:
        """
        Extracts structured key-value factor metrics for detailed inspection or card badges.
        """
        factors = []

        # Distance
        dist = row.get("distance_km")
        if dist is not None and not pd.isna(dist):
            dist_val = float(dist)
            is_best = bool(min_distance is not None and abs(dist_val - float(min_distance)) < 0.001)
            factors.append({
                "factor": "proximity",
                "label": "Distance",
                "value": f"{dist_val:.2f} km",
                "is_best": is_best,
            })

        # Price
        price = row.get("price")
        unit = str(row.get("unit", "")).strip() if row.get("unit") else ""
        unit_suffix = f"/{unit}" if unit else ""
        if price is not None and not pd.isna(price):
            price_val = float(price)
            is_best = bool(min_price is not None and abs(price_val - float(min_price)) < 0.001)
            factors.append({
                "factor": "price",
                "label": "Unit Price",
                "value": f"₹{price_val:.2f}{unit_suffix}",
                "is_best": is_best,
            })

        # Rating
        rating = row.get("rating")
        if rating is not None and not pd.isna(rating):
            factors.append({
                "factor": "rating",
                "label": "Rating",
                "value": f"{float(rating):.1f}/5.0",
                "is_best": float(rating) >= 4.8,
            })
        else:
            factors.append({
                "factor": "rating",
                "label": "Rating",
                "value": "Not rated",
                "is_best": False,
            })

        # Reliability
        rel = row.get("reliability_score")
        if rel is not None and not pd.isna(rel):
            factors.append({
                "factor": "reliability",
                "label": "Reliability Score",
                "value": f"{int(round(float(rel)))}/100",
                "is_best": float(rel) >= 90.0,
            })
        else:
            factors.append({
                "factor": "reliability",
                "label": "Reliability Score",
                "value": "Not available",
                "is_best": False,
            })

        # Delivery Time
        del_time = row.get("average_delivery_time_min") or row.get("delivery_time")
        if del_time is not None and not pd.isna(del_time):
            factors.append({
                "factor": "delivery_time",
                "label": "Fulfillment Speed",
                "value": f"{int(round(float(del_time)))} mins",
                "is_best": float(del_time) <= 20.0,
            })

        return factors

    @classmethod
    def generate_explanations(cls, df: pd.DataFrame) -> pd.DataFrame:
        """Generates deterministic explanations for all rows in a DataFrame."""
        if df.empty:
            return df

        result_df = df.copy()
        min_dist = result_df["distance_km"].min() if "distance_km" in result_df.columns else None
        min_price = result_df["price"].min() if "price" in result_df.columns else None

        result_df["reason"] = result_df.apply(
            lambda row: cls.generate_explanation(row, min_dist, min_price),
            axis=1,
        )
        return result_df
