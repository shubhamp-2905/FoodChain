import os
import sys
import pandas as pd

# Add the backend directory to sys.path so we can import from app
script_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.abspath(os.path.join(script_dir, ".."))
sys.path.insert(0, backend_dir)

from app.ml import RecommendationService

def main():
    print("Initializing RecommendationService...")
    service = RecommendationService()
    
    # Load raw data from pune_supplier_dataset.csv to simulate offerings
    dataset_path = os.path.join(backend_dir, "..", "data", "pune_supplier_dataset.csv")
    print(f"Loading test dataset from {dataset_path}...")
    df = pd.read_csv(dataset_path)
    
    # Convert DataFrame to list of dicts to simulate the database offerings
    offerings = df.to_dict(orient="records")
    print(f"Loaded {len(offerings)} offerings.")
    
    # Run recommendation for Potato at Pune center coordinates
    vendor_lat = 18.5204
    vendor_lon = 73.8567
    ingredient = "Potato"
    
    print(f"Generating recommendations for {ingredient} at lat: {vendor_lat}, lon: {vendor_lon}...")
    response = service.recommend(
        offerings=offerings,
        vendor_lat=vendor_lat,
        vendor_lon=vendor_lon,
        ingredient=ingredient,
        top_n=5
    )
    
    print("\n--- Recommendation Response ---")
    print(f"Ingredient: {response.ingredient}")
    print(f"Generated At: {response.generated_at}")
    print(f"Total Checked: {response.metadata.suppliers_checked}")
    print(f"Total Eligible: {response.metadata.eligible_suppliers}")
    print(f"Processing Time: {response.metadata.processing_time_ms} ms")
    
    recommendations = []
    if response.best_supplier:
        recommendations.append(response.best_supplier)
    recommendations.extend(response.alternatives)
    
    print(f"Top Recommendations returned: {len(recommendations)}")
    
    print("\nTop 5 Recommended Suppliers:")
    print(f"{'Rank':<5} | {'Supplier Name':<25} | {'Area':<15} | {'Price':<6} | {'Distance (km)':<13} | {'Cluster':<7} | {'Match Score':<11} | {'Reason'}")
    print("-" * 120)
    for rank, rec in enumerate(recommendations, 1):
        print(f"{rank:<5} | {rec.supplier_name:<25} | {rec.area:<15} | {rec.price:<6.2f} | {rec.distance_km:<13.2f} | {rec.cluster:<7} | {rec.match_score:<11} | {rec.reason}")
        
    # Verify outputs are sorted by match_score descending
    scores = [rec.match_score for rec in recommendations]
    assert scores == sorted(scores, reverse=True), "Recommendations are not sorted by score descending!"
    print("\nVerification: Scores are correctly sorted descending.")
    print("Success! The ML recommendation module is working perfectly.")

if __name__ == "__main__":
    main()
