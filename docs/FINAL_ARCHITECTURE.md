# FoodChain AI — Final Architecture (Phases 1–10 Complete & Frozen)

## 1. System Architecture Overview

FoodChain AI is an end-to-end Data Engineering + Analytics + ML supplier recommendation platform designed for street food vendors in Pune, India. The architecture combines a production-grade Medallion Data Engineering Pipeline with a Two-Branch Decision Architecture (K-Means behavioral clustering + 6-factor deterministic weighted business ranking), deterministic explainability, and auditable decision provenance.

```text
                    DATA SOURCES
                         │
          ┌──────────────┼──────────────┐
          │              │              │
       Seed CSV      Supplier       Inventory
                    Onboarding        Updates
          │              │              │
          └──────────────┼──────────────┘
                         ▼
                     BRONZE
                         │
                    Validation
                         │
                 ┌───────┴───────┐
                 │               │
               SILVER       Quarantine
                 │
                 ▼
                GOLD
                 │
                 ▼
            PostgreSQL
                 │
          Feature Engineering
                 │
       ┌─────────┴─────────┐
       ▼                   ▼
    K-Means           Business Ranking
       │                   │
       │             Weighted Score
       │                   │
       └─────────┬─────────┘
                 ▼
        Recommendation API
                 │
       ┌─────────┴─────────┐
       ▼                   ▼
  Explanation         Audit Record
       │                   │
       └─────────┬─────────┘
                 ▼
              Frontend
```

> **Core Architectural Invariant**:
> **K-Means provides behavioral/contextual segmentation only.** The deterministic weighted ranking engine is solely responsible for recommendation ordering.

---

## 2. Layer Breakdown

### A. Data Sources & Ingestion (Phases 1, 2, 3 & 4)
- **Data Sources**:
  - `Seed Synthetic Dataset`: Baseline Pune supplier catalog (`data/pune_supplier_dataset.csv`, 16,530 rows).
  - `Real Supplier Onboarding`: Operational ingestion via `POST /suppliers/onboard`.
  - `Inventory Updates`: Live stock and pricing updates via `POST /suppliers/{id}/inventory`.
- **Medallion Layers**:
  - **Bronze**: Raw data preservation with lineage metadata (`raw_record_id`, `ingested_at`, `source_batch_id`, `source_type`).
  - **Silver**: Cleansed and standardized data passing schema and quality constraints. Malformed records are diverted to Quarantine with explicit violation logs.
  - **Gold**: Curated, business-ready and analytics-ready datasets.
- **Incremental Processing**: Uses deterministic `business_key` + `row_hash` to classify records as `NEW`, `MODIFIED`, or `UNCHANGED`. Only new/modified records are reprocessed, preventing redundant pipeline compute.

### B. Storage & PostgreSQL Optimization (Phase 5)
- **Storage Layer**: PostgreSQL relational database with normalized 3NF schema:
  - `suppliers`: Supplier master profile with geolocation and operational metrics.
  - `products`: Canonical ingredient catalog with unique indexes.
  - `supplier_inventory`: Supplier offerings with pricing, stock, and minimum order quantities.
  - `recommendation_audits`: Immutable provenance traces for recommendation requests.
- **Query Optimization**:
  - Eliminated N+1 query cascades using eager loading (`joinedload`/`selectinload`).
  - Added composite and functional indexes (`ix_suppliers_lat_lon`, `ix_products_ingredient_lower`).
  - Benchmark performance: DB queries dropped from **376 → 2**, latency reduced from **~342 ms → ~18 ms** (P95: **~503 ms → ~20 ms**) with **100% data parity**.

### C. ML & Recommendation Engine (Phases 6, 7, 8, 9 & 10)
- **Two-Branch Decision Architecture**:
  - **Branch A — Behavioral Context (K-Means)**: Segments suppliers into meaningful operational cohorts (e.g., *"Premium & Rapid Delivery Wholesaler"*, *"Budget Mandi Trader"*, *"Standard Regional Supplier"*). K-Means does **NOT** determine recommendation ranking.
  - **Branch B — Authoritative Ranking (Business Weighted Score)**: Deterministic multi-factor scoring formula:
    - Distance: **35%**
    - Price: **25%**
    - Rating: **15%**
    - Quality Score: **10%**
    - Reliability Score: **10%**
    - Delivery Time: **5%**
- **Consistent Preprocessing (Phase 8)**: Frozen inference scaler loaded from disk (`FrozenInferenceScaler`); guaranteed zero training-serving skew with identical transform pipeline.
- **Offline ML Training & Artifacts (Phase 7)**: Model training is offline (`backend/scripts/train_recommendation_model.py`); inference strictly uses serialized artifacts (`kmeans_model.joblib`, `scaler.joblib`, `cluster_profiles.json`, `model_metadata.json`).
- **Deterministic Explainability (Phase 9)**: Zero LLM hallucinations; rationales are value-grounded and generated from concrete numerical metrics (exact distance in km, price in ₹/unit, rating, reliability score, and delivery minutes).
- **Decision Auditability (Phase 10)**: End-to-end request tracing via `X-Request-ID` / `metadata.request_id`. Every recommendation request persists an immutable audit trace in `recommendation_audits`.

### D. User Interface (Next.js 16 + TailwindCSS)
- **Vendor Procurement Console**:
  - Ingredient autocomplete & search history.
  - Geolocation detection & Pune coordinate fallback.
  - Interactive Leaflet map displaying candidate supplier cluster pins.
  - Transparent rank display (`Rank #1 Best Match`, `Rank #2 Alternative`).
  - Explicit Two-Branch breakdown in supplier details drawer (Business Score vs. Behavioral Context Persona).
  - Trace ID copy & in-app Decision Audit Provenance Inspector.
- **Supplier Onboarding & Inventory Directory**:
  - Live search and multi-attribute filtering (area, category, supplier type).
  - Modal onboarding form validating entries directly through the Medallion Data Pipeline into PostgreSQL.

---

## 3. Technology Boundaries & Freeze Status

To maintain production stability and interview readiness, the architecture is **frozen**:
- **NO** Docker or Kubernetes container orchestration.
- **NO** Distributed message brokers (Kafka, RabbitMQ).
- **NO** Distributed query engines (Spark, Databricks, Snowflake).
- **NO** In-memory caches (Redis) or full-text search clusters (Elasticsearch).
- **NO** Non-deterministic LLM-based recommendation wrappers.
- The platform runs locally and deterministically using Python 3.13, FastAPI, SQLAlchemy, PostgreSQL, and Next.js.
