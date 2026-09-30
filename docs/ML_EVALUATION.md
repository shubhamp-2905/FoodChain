# FoodChain AI — ML Evaluation, Versioning & Reproducibility (Phase 7)

## 1. Executive Summary

Phase 7 replaces the legacy Jupyter notebook execution (`exec()` in training scripts) with an independent, production-grade model training and evaluation script.

Prior to Phase 7, model artifacts were generated via cell-by-cell execution of notebooks with mocked dependencies, and evaluation metrics were not versioned alongside serialized weights. Phase 7 introduces:
* **Standalone CLI Training Pipeline** ([`train_recommendation_model.py`](file:///d:/Projects/Foodchain/backend/scripts/train_recommendation_model.py)): A pure Python training script with zero notebook dependencies.
* **Empirical Evaluation Metrics**: Real inertia, silhouette score, cluster distribution, and unscaled centroid profiling calculated directly from training data.
* **Versioned Metadata Persistence** ([`model_metadata.json`](file:///d:/Projects/Foodchain/backend/app/ml/artifacts/model_metadata.json)): Persists training parameters, dataset provenance, feature column order, and evaluation metrics.
* **Runtime Integration** ([`model_manager.py`](file:///d:/Projects/Foodchain/backend/app/ml/core/model_manager.py)): Thread-safe loading, caching, and serving of model metadata to runtime API endpoints.

---

## 2. Standalone Training Pipeline

The training script is executable from the command line:

```bash
# Standard training (default K=2, version 1.1.0)
python backend/scripts/train_recommendation_model.py

# Auto-evaluation of cluster space (evaluates K=2..6 by Silhouette Score)
python backend/scripts/train_recommendation_model.py --auto-k

# Custom parameter configuration
python backend/scripts/train_recommendation_model.py --k 2 --model-version 1.1.0 --random-state 42
```

### CLI Arguments:
| Argument | Type | Default | Description |
| :--- | :---: | :--- | :--- |
| `--data-path` | `str` | `data/pune_supplier_dataset.csv` | Path to source supplier dataset CSV |
| `--output-dir` | `str` | `backend/app/ml/artifacts` | Output directory for primary backend artifacts |
| `--models-dir` | `str` | `models` | Output directory for mirrored root model artifacts |
| `--k` | `int` | `2` | Number of clusters |
| `--auto-k` | `flag` | `False` | Evaluates $K \in [2, 6]$ and automatically picks optimal $K$ by Silhouette Score |
| `--model-version` | `str` | `1.1.0` | Semantic version string |
| `--random-state` | `int` | `42` | Random seed for deterministic reproducibility |

---

## 3. Empirical Evaluation Results (Actual Values)

Evaluated on the Pune supplier dataset ($N = 16,530$ raw records; $9,944$ within spatial delivery radius):

### 3.1 Cluster Evaluation Curve ($K = 2 \dots 6$)

| Clusters ($K$) | Inertia (Sum of Squared Distances) | Silhouette Score | Evaluation Assessment |
| :---: | :---: | :---: | :--- |
| **$K = 2$** | **38,776.94** | **0.3322** | **Optimal Configuration (Max Silhouette Score)** |
| $K = 3$ | 31,662.50 | 0.2555 | Cluster dispersion increases |
| $K = 4$ | 26,956.35 | 0.2761 | Over-segmentation of standard providers |
| $K = 5$ | 23,729.44 | 0.2483 | Sub-cluster fragmentation |
| $K = 6$ | 21,520.22 | 0.2563 | Marginal inertia drop; poor cluster cohesion |

*Result*: $K = 2$ provides the highest mathematical cohesion and separation (Silhouette Score = $0.3322$), capturing the macro split between premium rapid-delivery providers and cost-effective bulk wholesalers.

### 3.2 Cluster Distribution ($K = 2$)

| Cluster ID | Record Count | Percentage | Profile Classification |
| :---: | :---: | :---: | :--- |
| **Cluster 0** | 2,858 | 28.74% | **Premium & Rapid Delivery Wholesaler** |
| **Cluster 1** | 7,086 | 71.26% | **Cost-Effective Standard Wholesaler** |

### 3.3 Unscaled Centroid Profiles

Centroids inverse-transformed to physical operational units:

| Dimension | Cluster 0 (Premium Rapid) | Cluster 1 (Cost-Effective Standard) | Delta / Business Interpretation |
| :--- | :---: | :---: | :--- |
| **Unit Price** | 169.11 INR | **138.60 INR** | Cluster 1 offers ~18% lower raw material costs. |
| **Delivery Radius Distance** | 5.29 km | 4.47 km | Both clusters service realistic local urban hubs. |
| **Vendor Rating** | **4.61 / 5.0** | 4.03 / 5.0 | Cluster 0 demonstrates superior customer satisfaction. |
| **Quality Score** | **4.62 / 5.0** | 4.04 / 5.0 | Cluster 0 provides Grade-A curated produce. |
| **Reliability Score** | **94.49%** | 83.60% | Cluster 0 has exceptional on-time fulfillment rates. |
| **Average Delivery Time** | **18.67 min** | 36.03 min | Cluster 0 delivers in half the time (< 20 minutes). |

---

## 4. Persisted Metadata Schema

The generated [`model_metadata.json`](file:///d:/Projects/Foodchain/backend/app/ml/artifacts/model_metadata.json) provides complete auditability:

```json
{
  "model_version": "1.1.0",
  "algorithm": "KMeans",
  "n_clusters": 2,
  "random_state": 42,
  "feature_columns": [
    "price",
    "distance_km",
    "rating",
    "quality_score",
    "reliability_score",
    "average_delivery_time_min"
  ],
  "training_rows": 9944,
  "total_source_rows": 16530,
  "evaluation_metrics": {
    "inertia": 38776.94,
    "silhouette_score": 0.3322,
    "cluster_distribution": {
      "0": {
        "count": 2858,
        "percentage": 28.74
      },
      "1": {
        "count": 7086,
        "percentage": 71.26
      }
    }
  },
  "cluster_centroids": {
    "0": {
      "price": 169.107,
      "distance_km": 5.293,
      "rating": 4.607,
      "quality_score": 4.62,
      "reliability_score": 94.486,
      "average_delivery_time_min": 18.668
    },
    "1": {
      "price": 138.599,
      "distance_km": 4.467,
      "rating": 4.033,
      "quality_score": 4.036,
      "reliability_score": 83.597,
      "average_delivery_time_min": 36.027
    }
  },
  "training_dataset": "pune_supplier_dataset.csv",
  "trained_at": "2026-09-25T12:51:53.799862+00:00"
}
```

---

## 5. Automated Verification & Testing

Implemented in [`backend/tests/test_model_evaluation.py`](file:///d:/Projects/Foodchain/backend/tests/test_model_evaluation.py):
1. **`test_artifacts_and_metadata_exist`**: Asserts that `scaler.pkl`, `kmeans.pkl`, and `model_metadata.json` are present in the artifacts directory.
2. **`test_metadata_structure_and_metrics`**: Validates metadata schema completeness, positive inertia, silhouette score in $(0, 1]$, and 100% distribution sum.
3. **`test_model_manager_caching_and_metadata_exposure`**: Asserts that `ModelManager.get_metadata()` exposes the active model version (`1.1.0`) and cached artifacts.
4. **`test_training_reproducibility_deterministic`**: Verifies that re-running training with identical random seed yields identical centroids, inertia, and silhouette score.

**Test Suite Status**: **36/36 tests passing** across the backend.
