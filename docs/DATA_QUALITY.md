# FoodChain AI — Data Quality Framework & Ingestion Governance (Phase 3)

## 1. Overview

The **FoodChain AI Data Quality Framework** guarantees that supplier and product offering data remains valid, consistent, and traceable across both offline benchmark datasets and real-time operational onboarding.

The production system decouples ingestion from synthetic static CSV files:
* **Seed Reference Data**: 16,530 historical records (`data/pune_supplier_dataset.csv`) act as baseline reference data for initial clustering, pricing benchmarks, and cold-start serving.
* **Real Operational Ingestion**: Real supplier onboarding events and live inventory updates flow as first-class citizens through the exact same lineage, validation, Bronze/Silver/Gold layers, and quarantine routing.

```text
  [Seed Synthetic CSV]    [Real Supplier Onboarding]    [Live Inventory Updates]
           │                          │                            │
           └──────────────────────────┼────────────────────────────┘
                                      ▼
                        ┌───────────────────────────┐
                        │       BRONZE LAYER        │
                        │   Multi-Source Lineage    │
                        │ (source_type & batch_id)  │
                        └─────────────┬─────────────┘
                                      │
                                      ▼
                        ┌───────────────────────────┐
                        │   DATA QUALITY ENGINE     │  ───►  [QUARANTINE QUEUE]
                        │ 6 Multi-Dimensional Rules │        Invalid records isolated
                        └─────────────┬─────────────┘
                                      │ (Valid Only)
                                      ▼
                        ┌───────────────────────────┐
                        │       SILVER LAYER        │
                        │   Canonical Clean Data    │
                        └─────────────┬─────────────┘
                                      │
                                      ▼
                        ┌───────────────────────────┐
                        │        GOLD LAYER         │
                        │ Analytics & ML Features   │
                        └─────────────┬─────────────┘
                                      │
                   ┌──────────────────┴──────────────────┐
                   ▼                                     ▼
        [FastAPI Recommendation]              [ML Retraining Governance]
       (Served via Cold-Start Model)         (Evaluates Real Sample Size >= 1000)
```

---

## 2. Ingestion Source Lineage Tracking

Every record in the platform carries provenance metadata indicating its origin:

| Metadata Field | Type | Description |
| :--- | :--- | :--- |
| `source_type` | `String` | Origin category: `SEED_SYNTHETIC`, `REAL_SUPPLIER_ONBOARDING`, or `INVENTORY_UPDATE`. |
| `source_batch_id` | `String` | Unique batch, API request, or partner file identifier (e.g. `API_20260925121555`). |
| `ingestion_timestamp`| `ISO 8601 UTC` | Exact timestamp when data entered the Bronze layer. |
| `source_version` | `String` | Pipeline / schema version (e.g. `1.0.0`). |
| `raw_record_id` | `String` | Deterministic record identifier (e.g. `BRONZE_REAL_1.0.0_000001`). |

---

## 3. Data Quality Rule Specifications

The `DataValidator` evaluates records across 6 multi-dimensional categories:

### 3.1 Schema & Data Type Integrity
* Required columns must exist in the payload/file.
* Numeric columns (`price`, `latitude`, `longitude`, `stock_available`, `minimum_order`, `rating`, `quality_score`, `reliability_score`, `delivery_radius_km`, `average_delivery_time_min`) must be parsable without corruption.

### 3.2 Completeness (Null Checks)
* Non-null enforcement on primary operational attributes: `supplier_id`, `ingredient`, `price`, `latitude`, `longitude`, `rating`, `quality_score`, `reliability_score`, `delivery_radius_km`, and `average_delivery_time_min`.

### 3.3 Validity & Range Checks
* **Economic Constraints**:
  * $\text{price} > 0$
  * $\text{stock\_available} \ge 0$
  * $\text{minimum\_order} \ge 1$
* **Geographic Constraints**:
  * $-90.0 \le \text{latitude} \le 90.0$
  * $-180.0 \le \text{longitude} \le 180.0$
  * $\text{delivery\_radius\_km} > 0$
* **Performance & Reliability Bounds**:
  * $0.0 \le \text{rating} \le 5.0$
  * $0.0 \le \text{quality\_score} \le 5.0$
  * $0.0 \le \text{reliability\_score} \le 100.0$
  * $\text{average\_delivery\_time\_min} \ge 1$

### 3.4 Uniqueness
* Enforces unique composite business key `(supplier_id, ingredient)` per batch, preventing duplicate product catalog offerings from the same supplier.

### 3.5 Referential Integrity
* Verifies that product categories and measurement units are recognized, standard, and non-empty.

### 3.6 Business Usability
* Verifies that supplier offerings are logically eligible for customer recommendation (e.g. valid delivery parameters and viable pricing).

---

## 4. Quarantine & Dead-Letter Queue

Records failing any quality rule are immediately routed to the quarantine store rather than silently dropped or permitted into the Silver layer.

* **Storage Path**: `data/pipeline_output/quarantine/quarantined_records.csv`
* **Quarantine Record Schema**:
  ```text
  record_identifier,supplier_id,ingredient,source_type,validation_failure,quarantine_timestamp,pipeline_version
  ```
* **Quality Summary Output**: Dynamically computed and stored at `data/pipeline_output/validation/quality_summary.json`:
  ```json
  {
    "total_records": 16530,
    "valid_records": 16530,
    "invalid_records": 0,
    "duplicate_records": 0,
    "quality_status": "PASS",
    "failure_reasons_breakdown": {},
    "validation_timestamp": "2026-09-25T06:30:25.456943+00:00"
  }
  ```

---

## 5. Machine Learning Retraining & Governance Policy

### Problem: Cold Start & Model Drift from Tiny Samples
Retraining K-Means clustering on tiny real-world samples (e.g., 5 to 50 newly onboarded suppliers) introduces severe centroid instability, high variance, and degraded recommendations for street vendors.

### Governance Strategy
The system implements a formal `RetrainingPolicy` governed by sample size thresholds as an **initial operational safeguard**, rather than a scientifically established mathematical requirement of K-Means.

```text
Real-World Supplier Records Collected
                   │
                   ▼
       Is N_real >= 1,000 records?
        ├── NO  ──► Status: SERVE_COLD_START_MODEL
        │           Serve inference using pre-trained reference K-Means model.
        │           Preserve cluster consistency & existing recommendation behavior.
        │
        └── YES ──► Status: READY_FOR_RETRAINING
                    Trigger scheduled model retraining with real-world supplier data.
                    Validate Silhouette score and inertia before promoting new artifact.
```

> **Operational Safeguard Note**: The 1,000-record threshold is a heuristic guardrail designed to prevent early centroid distortion caused by fitting unsupervised clustering on small sample sizes. It is not an intrinsic constraint of the K-Means algorithm itself. Future automated retraining pipelines should evaluate a multi-faceted decision framework including:
> 1. **Data Distribution Drift**: Detect feature distribution divergence (e.g. population stability index or Wasserstein distance on price and delivery metrics) between reference and real data.
> 2. **Cluster Stability**: Measure cluster centroid drift and cluster membership reassignment variance.
> 3. **Validation Scores**: Require verifiable improvements in Silhouette score and Elbow Inertia on cross-validation splits prior to promoting new model artifacts.
> 4. **Business Performance**: Measure downstream vendor engagement, recommendation acceptance rate, and order fulfillment conversions.

### Preserving Existing Recommendation Behavior
1. **Zero Disruption to Recommendation Runtime**: The FastAPI `POST /recommend` endpoint continues to serve vendors with the stable pre-trained `KMeans` and `StandardScaler` artifacts.
2. **Immediate Visibility for Real Suppliers**: Newly onboarded real suppliers pass into the operational database and Gold feature layer immediately, making them instantly recommendable by the deterministic ranking engine without waiting for model retraining.

