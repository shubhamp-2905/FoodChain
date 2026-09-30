"""
FoodChain AI - Standalone Model Training & Evaluation Pipeline
Phase 7: ML Evaluation and Reproducibility

Trains the KMeans clustering model and StandardScaler on curated supplier features.
Evaluates clustering quality (Inertia, Silhouette Score, Centroid Profiles, Distribution).
Persists model artifacts and versioned metadata to disk without notebook dependencies.

Usage:
    python backend/scripts/train_recommendation_model.py
    python backend/scripts/train_recommendation_model.py --k 2 --model-version 1.1.0
    python backend/scripts/train_recommendation_model.py --auto-k
"""

import os
import sys
import json
import math
import argparse
import shutil
from datetime import datetime, timezone
from typing import Dict, Any, Tuple

import pandas as pd
import numpy as np
import joblib
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score

# Ensure backend root is on sys.path for unified imports
script_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.abspath(os.path.join(script_dir, ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.ml.preprocessing.preprocessor import (
    FeaturePreprocessor,
    CANONICAL_FEATURES,
    DEFAULT_REFERENCE_LAT,
    DEFAULT_REFERENCE_LON,
    haversine_distance,
)


def load_and_preprocess_data(
    data_path: str,
    ref_lat: float = DEFAULT_REFERENCE_LAT,
    ref_lon: float = DEFAULT_REFERENCE_LON,
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Loads raw supplier data, calculates reference distance, filters within delivery radius,
    and extracts the canonical feature matrix using unified FeaturePreprocessor.
    """
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Training dataset not found at: {data_path}")

    print(f">> Loading training dataset from: {data_path}")
    raw_df = pd.read_csv(data_path)
    total_rows = len(raw_df)

    # Use unified dataset preparation
    filtered_df = FeaturePreprocessor.prepare_raw_dataset(
        raw_df, ref_lat=ref_lat, ref_lon=ref_lon, filter_radius=True
    )
    filtered_rows = len(filtered_df)

    print(f"   Total source records:    {total_rows:,}")
    print(f"   Within delivery radius:  {filtered_rows:,} ({(filtered_rows / total_rows) * 100:.1f}%)")

    # Use unified feature extraction and canonical alignment
    X = FeaturePreprocessor.extract_and_align_features(filtered_df, CANONICAL_FEATURES)
    return filtered_df, X


def find_optimal_k(
    X_scaled: np.ndarray,
    k_min: int = 2,
    k_max: int = 6,
    random_state: int = 42,
) -> Tuple[int, Dict[int, Dict[str, float]]]:
    """Evaluates candidate cluster counts via Silhouette Score and Inertia."""
    print(f">> Evaluating cluster counts from K={k_min} to K={k_max}...")
    results = {}
    best_k = k_min
    best_score = -1.0

    for k in range(k_min, k_max + 1):
        km = KMeans(n_clusters=k, random_state=random_state, n_init=10)
        labels = km.fit_predict(X_scaled)
        inertia = float(km.inertia_)
        score = float(silhouette_score(X_scaled, labels))
        results[k] = {"inertia": round(inertia, 2), "silhouette": round(score, 4)}
        print(f"   K={k:<2} | Inertia: {inertia:>10.2f} | Silhouette Score: {score:>7.4f}")
        if score > best_score:
            best_score = score
            best_k = k

    print(f"   Optimal K determined by Silhouette Score: K={best_k} (Score: {best_score:.4f})")
    return best_k, results


def train_and_evaluate(
    X: pd.DataFrame,
    n_clusters: int = 2,
    random_state: int = 42,
) -> Dict[str, Any]:
    """Fits StandardScaler and KMeans, and computes verified evaluation metrics."""
    print(f">> Training StandardScaler and KMeans (K={n_clusters}, random_state={random_state})...")

    # 1. Feature Scaling using unified FeaturePreprocessor
    scaler, X_scaled, X_aligned = FeaturePreprocessor.fit_and_transform_training(
        X, feature_columns=CANONICAL_FEATURES
    )
    X_scaled_df = pd.DataFrame(X_scaled, columns=X_aligned.columns, index=X_aligned.index)

    # 2. KMeans Model Fitting (with canonical feature names preserved)
    kmeans = KMeans(n_clusters=n_clusters, random_state=random_state, n_init=10)
    labels = kmeans.fit_predict(X_scaled_df)

    # 3. Verified Evaluation Metrics
    inertia = float(kmeans.inertia_)
    silhouette = float(silhouette_score(X_scaled, labels))

    # Cluster distribution
    counts = pd.Series(labels).value_counts().sort_index()
    distribution = {
        str(cluster_id): {
            "count": int(count),
            "percentage": round(float(count / len(labels) * 100), 2),
        }
        for cluster_id, count in counts.items()
    }

    # Inverse transform centroids for interpretable profile inspection
    unscaled_centroids = scaler.inverse_transform(kmeans.cluster_centers_)
    centroids_dict = {}
    for cluster_id, center in enumerate(unscaled_centroids):
        centroids_dict[str(cluster_id)] = {
            feat: round(float(center[idx]), 3)
            for idx, feat in enumerate(CANONICAL_FEATURES)
        }

    return {
        "scaler": scaler,
        "kmeans": kmeans,
        "n_clusters": n_clusters,
        "inertia": round(inertia, 2),
        "silhouette_score": round(silhouette, 4),
        "distribution": distribution,
        "centroids": centroids_dict,
    }


def persist_artifacts(
    scaler: StandardScaler,
    kmeans: KMeans,
    metadata: Dict[str, Any],
    output_dir: str,
    models_root_dir: str,
) -> None:
    """Persists scaler, kmeans, and metadata to backend artifacts and project models dir."""
    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(models_root_dir, exist_ok=True)

    # Target paths
    scaler_artifact = os.path.join(output_dir, "scaler.pkl")
    kmeans_artifact = os.path.join(output_dir, "kmeans.pkl")
    metadata_artifact = os.path.join(output_dir, "model_metadata.json")

    # Persist primary backend artifacts
    print(f">> Persisting artifacts to {output_dir}...")
    joblib.dump(scaler, scaler_artifact)
    joblib.dump(kmeans, kmeans_artifact)
    with open(metadata_artifact, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print(f"   [OK] Scaler:   {scaler_artifact}")
    print(f"   [OK] KMeans:   {kmeans_artifact}")
    print(f"   [OK] Metadata: {metadata_artifact}")

    # Mirror to models/ directory for root backward compatibility
    shutil.copy(scaler_artifact, os.path.join(models_root_dir, "scaler.pkl"))
    shutil.copy(kmeans_artifact, os.path.join(models_root_dir, "kmeans_model.pkl"))
    shutil.copy(metadata_artifact, os.path.join(models_root_dir, "model_metadata.json"))
    print(f"   [OK] Mirrored to root {models_root_dir}/")


def main():
    parser = argparse.ArgumentParser(
        description="FoodChain AI - Standalone Recommendation Model Trainer"
    )
    parser.add_argument(
        "--data-path",
        type=str,
        default="data/pune_supplier_dataset.csv",
        help="Path to supplier dataset CSV",
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default="backend/app/ml/artifacts",
        help="Directory to save backend ML artifacts",
    )
    parser.add_argument(
        "--models-dir",
        type=str,
        default="models",
        help="Root directory for mirrored models",
    )
    parser.add_argument(
        "--k",
        type=int,
        default=2,
        help="Number of clusters (default: 2)",
    )
    parser.add_argument(
        "--auto-k",
        action="store_true",
        help="Automatically evaluate K=2..6 and select optimal K by Silhouette Score",
    )
    parser.add_argument(
        "--model-version",
        type=str,
        default="1.1.0",
        help="Semantic model version identifier",
    )
    parser.add_argument(
        "--random-state",
        type=int,
        default=42,
        help="Random seed for reproducibility",
    )

    args = parser.parse_args()

    # Resolve paths relative to project root
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, "..", ".."))

    data_path = (
        args.data_path
        if os.path.isabs(args.data_path)
        else os.path.join(project_root, args.data_path)
    )
    output_dir = (
        args.output_dir
        if os.path.isabs(args.output_dir)
        else os.path.join(project_root, args.output_dir)
    )
    models_dir = (
        args.models_dir
        if os.path.isabs(args.models_dir)
        else os.path.join(project_root, args.models_dir)
    )

    print("=" * 70)
    print("  FOODCHAIN AI - RECOMMENDATION MODEL TRAINING & EVALUATION")
    print(f"  Version: {args.model_version} | Seed: {args.random_state}")
    print("=" * 70)

    # 1. Load and prepare feature matrix
    filtered_df, X = load_and_preprocess_data(data_path)

    # 2. Select cluster count
    n_clusters = args.k
    eval_curve = None
    if args.auto_k:
        scaler_temp = StandardScaler()
        X_scaled_temp = scaler_temp.fit_transform(X)
        n_clusters, eval_curve = find_optimal_k(
            X_scaled_temp, k_min=2, k_max=6, random_state=args.random_state
        )

    # 3. Train and calculate real metrics
    results = train_and_evaluate(
        X, n_clusters=n_clusters, random_state=args.random_state
    )

    # 4. Construct comprehensive metadata
    now_iso = datetime.now(timezone.utc).isoformat()
    metadata = {
        "model_version": args.model_version,
        "algorithm": "KMeans",
        "n_clusters": results["n_clusters"],
        "random_state": args.random_state,
        "feature_columns": CANONICAL_FEATURES,
        "training_rows": len(filtered_df),
        "total_source_rows": len(pd.read_csv(data_path)),
        "evaluation_metrics": {
            "inertia": results["inertia"],
            "silhouette_score": results["silhouette_score"],
            "cluster_distribution": results["distribution"],
        },
        "cluster_centroids": results["centroids"],
        "training_dataset": os.path.basename(data_path),
        "trained_at": now_iso,
    }

    if eval_curve:
        metadata["evaluation_metrics"]["k_evaluation_curve"] = eval_curve

    # 5. Persist artifacts and metadata
    persist_artifacts(
        scaler=results["scaler"],
        kmeans=results["kmeans"],
        metadata=metadata,
        output_dir=output_dir,
        models_root_dir=models_dir,
    )

    print("\n" + "=" * 70)
    print("  TRAINING & EVALUATION SUMMARY")
    print("=" * 70)
    print(f"  Model Version:         {metadata['model_version']}")
    print(f"  Algorithm:             {metadata['algorithm']} (K={results['n_clusters']})")
    print(f"  Training Rows:         {metadata['training_rows']:,}")
    print(f"  Inertia:               {results['inertia']:,}")
    print(f"  Silhouette Score:      {results['silhouette_score']:.4f}")
    print(f"  Cluster Distribution:  {results['distribution']}")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    main()
