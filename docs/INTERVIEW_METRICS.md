# FoodChain AI — Verified Interview Metrics

This document records the empirical benchmarks, data scales, and test counts measured directly on the FoodChain AI platform.

---

## 1. Dataset Scale & Volume

| Metric | Measured Value | Source / Benchmark Context |
| :--- | :--- | :--- |
| **Total Inventory Records** | **16,530** | Pune wholesale market dataset (`pune_supplier_dataset.csv`) |
| **Unique Suppliers** | **3,742** | Normalization across 20+ Pune administrative localities |
| **Unique Ingredients** | **33** | Perishable produce, grains, spices, oils, dairy |
| **Operational Attributes** | **18 columns** | Geolocation, pricing, ratings, reliability, delivery radius, speed |

---

## 2. Medallion Pipeline Execution Performance

Measured on the 16,530-record Pune supplier dataset:

| Pipeline Stage | Timing (ms) | Description |
| :--- | :--- | :--- |
| **Raw Ingestion (Bronze)** | ~110 ms | Preserves source schema with lineage UUIDs |
| **Validation & Cleaning (Silver)** | ~310 ms | Enforces type constraints, range checks, and quarantine routing |
| **Curated Feature Prep (Gold)** | ~220 ms | Standardizes features for analytics and serving |
| **Artifact Persistence** | ~90 ms | Atomically writes CSV layers, quality summaries, and manifests |
| **Total Full Execution** | **~730 – 810 ms** | End-to-end full execution across all layers |

> **Incremental Efficiency**: When running in incremental mode with row hashing, unchanged records bypass validation and transformation, executing in **< 120 ms**.

---

## 3. Database Optimization Benchmarks (Phase 5)

Measured on 50 consecutive recommendation queries comparing the naive ORM implementation against the repository pattern with eager loading:

| Metric | Baseline (Unoptimized) | Optimized (Current) | Improvement Factor |
| :--- | :--- | :--- | :--- |
| **Database Queries** | **376 queries** (N+1 cascade) | **2 queries** (eager join) | **188x reduction (99.5%)** |
| **Mean Latency** | **~342.1 ms** | **~18.4 ms** | **18.6x faster** |
| **Median Latency (P50)** | **~315.0 ms** | **~16.8 ms** | **18.8x faster** |
| **P95 Latency** | **~503.2 ms** | **~20.1 ms** | **25.0x faster** |
| **P99 Latency** | **~548.7 ms** | **~23.4 ms** | **23.4x faster** |
| **Data Parity** | **100.0%** | **100.0%** | **Zero regression (identical results)** |

---

## 4. Machine Learning & Recommendation Metrics

| Dimension | Specification / Metric | Description |
| :--- | :--- | :--- |
| **Clustering Model** | K-Means ($k=4$) | Unsupervised behavioral segmentation; silhouette score: **0.42** |
| **Ranking Mechanism** | Deterministic Weighted Score | Distance (35%), Price (25%), Rating (15%), Quality (10%), Reliability (10%), Delivery (5%) |
| **Feature Dimension** | 6 continuous features | `price`, `distance_km`, `rating`, `quality_score`, `reliability_score`, `average_delivery_time_min` |
| **Pre-inference Latency** | **< 35 ms** | End-to-end query, filtering, scoring, and response formatting |
| **Explainability** | **100% Deterministic** | Concrete numerical grounding; zero LLM token consumption |

---

## 5. Automated Test Suite Metrics

| Test Suite | Passing Tests | Test File |
| :--- | :--- | :--- |
| **Data Pipeline & Medallion Layers** | 10 | `backend/tests/test_data_pipeline.py` |
| **Database Optimization & N+1 Prevention** | 7 | `backend/tests/test_database_optimization.py` |
| **Deterministic Explainability Service** | 8 | `backend/tests/test_explanation_service.py` |
| **Incremental Processing & Hash Upsert** | 4 | `backend/tests/test_incremental_processing.py` |
| **Frozen Inference Preprocessing & Skew** | 9 | `backend/tests/test_inference_preprocessing.py` |
| **Model Evaluation & Offline Artifacts** | 4 | `backend/tests/test_model_evaluation.py` |
| **Recommendation Engine API** | 6 | `backend/tests/test_recommendation_api.py` |
| **Recommendation Auditability & Tracing** | 6 | `backend/tests/test_recommendation_audit.py` |
| **Two-Branch Logic Separation** | 5 | `backend/tests/test_recommendation_logic_separation.py` |
| **Supplier Onboarding & Ingestion API** | 2 | `backend/tests/test_supplier_onboarding_api.py` |
| **Total Backend Test Count** | **61 passing** | **0 failures, 100% pass rate** |
| **Frontend Production Build** | **Success** | Next.js 16 (Turbopack), 12/12 static pages, 0 TS errors |
