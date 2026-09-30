# FoodChain AI — Medallion Data Layers Architecture (Phase 2)

## 1. Overview

FoodChain AI organizes its data platform using the **Medallion Data Architecture** comprising **Bronze**, **Silver**, and **Gold** logical layers. This pattern establishes clear boundaries between raw ingestion, enterprise quality curation, and analytics/ML consumption.

```text
       Raw Data Source (CSV / Partner Feeds)
                         │
                         ▼
        ┌───────────────────────────────────┐
        │           BRONZE LAYER            │
        │   Raw Ingestion & Lineage Tags    │
        └─────────────────┬─────────────────┘
                          │
                          ▼
        ┌───────────────────────────────────┐
        │           SILVER LAYER            │  ────►  [QUARANTINE / REJECTED]
        │   Validation & Canonical Cleaning │         Invalid or duplicate records
        └─────────────────┬─────────────────┘
                          │
                          ▼
        ┌───────────────────────────────────┐
        │            GOLD LAYER             │
        │  Analytics, Ranking & ML Features │
        └─────────────────┬─────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
      FastAPI        K-Means ML      Operational
    Operational     Segmentation      Reporting
```

---

## 2. Layer Specifications

### 2.1 Bronze Layer (Raw Ingestion)

* **Purpose**: Capture raw source data verbatim from upstream sources with zero destructive mutations. It acts as the immutable system of record for provenance and re-playability.
* **Storage Path**: `data/pipeline_output/bronze/suppliers_bronze.csv`
* **Transformations Applied**:
  * Source fields preserved intact without type truncation.
  * Ingestion lineage metadata appended:
    * `ingestion_timestamp`: UTC ISO 8601 timestamp of data ingestion.
    * `source_version`: Pipeline run and schema version (e.g. `1.0.0`).
    * `raw_record_id`: Sequential lineage identifier (e.g. `BRONZE_1.0.0_000001`).
* **Consumers**: Pipeline developers, audit systems, Silver layer ingestion jobs.

### 2.2 Silver Layer (Validated & Cleaned)

* **Purpose**: Provide a trusted, schema-enforced, deduplicated enterprise dataset. Any record violating business constraints is safely routed to quarantine rather than silently dropped.
* **Storage Path**: `data/pipeline_output/silver/suppliers_silver.csv`
* **Transformations Applied**:
  * **Completeness Checks**: Non-null enforcement for `supplier_id`, `ingredient`, `price`, `latitude`, `longitude`, `rating`, `quality_score`, `reliability_score`, `delivery_radius_km`, and `average_delivery_time_min`.
  * **Validity Range Checks**:
    * `price > 0`, `stock_available >= 0`, `minimum_order >= 1`
    * `latitude` $\in [-90, 90]$, `longitude` $\in [-180, 180]$
    * `rating` $\in [0, 5]$, `quality_score` $\in [0, 5]$, `reliability_score` $\in [0, 100]$
    * `delivery_radius_km > 0`, `average_delivery_time_min > 0`
  * **Uniqueness & Deduplication**: Enforces distinct composite keys `(supplier_id, ingredient)`.
  * **Canonical Cleaning**:
    * Whitespace stripped on all string fields.
    * Entity names title-cased (`supplier_name`, `market`, `area`, `ingredient`, `category`).
    * Standardized lowercase measurement units (`unit`).
    * Strict numeric casting and standard precision rounding.
  * **Metadata**: `silver_processed_at` timestamp.
* **Consumers**: PostgreSQL operational database (`suppliers`, `products`, `supplier_inventory`), Gold layer feature engineering.

### 2.3 Quarantine / Dead-Letter Queue

* **Purpose**: Isolate corrupt or invalid records with explicit diagnostic reasons so data quality issues can be investigated without halting operational ingestion.
* **Storage Path**: `data/pipeline_output/quarantine/quarantined_records.csv`
* **Attributes**:
  * `record_identifier`: Lineage ID referencing Bronze record.
  * `supplier_id`, `ingredient`: Identifying business keys.
  * `validation_failure`: Semicolon-delimited list of violated constraints.
  * `quarantine_timestamp`: Capture timestamp.
  * `pipeline_version`: Version identifier.

### 2.4 Gold Layer (Curated Features)

* **Purpose**: Produce high-value, analytics-ready, and ML-ready features for supplier ranking, spatial clustering, and operational reporting.
* **Storage Path**: `data/pipeline_output/gold/suppliers_gold.csv`
* **Features Computed**:

| Category | Feature Name | Description | Formula / Logic |
| :--- | :--- | :--- | :--- |
| **Supplier Ranking** | `ingredient_mean_price` | Average regional price for the ingredient | Group-by mean across market offerings |
| | `price_index_ratio` | Relative price ratio vs regional benchmark | `price / ingredient_mean_price` |
| | `composite_quality_score` | Normalized quality, rating, and reliability index | $0.40 \cdot \frac{\text{rating}}{5} + 0.30 \cdot \frac{\text{quality}}{5} + 0.30 \cdot \frac{\text{reliability}}{100}$ |
| | `reliability_tier` | Categorical supplier dependability tag | `Tier 1 (>90)`, `Tier 2 (75-90)`, `Tier 3 (<75)` |
| **Geospatial Analysis** | `geo_bucket_lat` | Rounded coordinate bucket (~1.1 km grid) | `round(latitude, 2)` |
| | `geo_bucket_lon` | Rounded coordinate bucket (~1.1 km grid) | `round(longitude, 2)` |
| **Reporting & Operations** | `delivery_speed_tier` | Speed classification for street vendors | `Fast (<20m)`, `Standard (20-35m)`, `Slow (>35m)` |
| | `is_bulk_supplier` | Minimum order requirement indicator | `minimum_order >= 50` |
| | `gold_processed_at` | Feature generation timestamp | ISO 8601 UTC timestamp |
| **ML Inference Ready** | Numeric features | Clean features for model scaling | `price`, `rating`, `quality_score`, `reliability_score`, `delivery_radius_km`, `average_delivery_time_min` |

* **Consumers**:
  * FastAPI Recommendation Engine (`POST /recommend`).
  * K-Means clustering segmentation model.
  * Business analytics dashboards and vendor procurement reporting.

---

## 3. Layer Summary Matrix

| Attribute | Bronze Layer | Silver Layer | Gold Layer |
| :--- | :--- | :--- | :--- |
| **Data Nature** | Raw & unvalidated | Cleaned & deduplicated | Feature-engineered & aggregated |
| **Schema Strictness** | Read schema validation | Enforced types & ranges | Enforced analytics schema |
| **Business Logic** | None (lineage tags only) | Integrity & normalization | Domain features, scoring & tiers |
| **File Format** | CSV / Parquet | CSV / Parquet | CSV / Parquet |
| **Idempotency** | Append/partitioned | Upsert / overwrite | Fully reproducible |
