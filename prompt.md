# FoodChain AI — Production-Oriented Data Engineering Upgrade

You are working on an existing project called **FoodChain AI**, an AI-powered supplier recommendation system for street-food vendors.

The existing system is functional. **Do not rewrite the project from scratch. Do not remove existing functionality unless it is technically incorrect. First inspect the entire repository and understand the current implementation.**

The goal is to evolve the existing project into a stronger **Data Engineering + AI/ML portfolio project**, with architecture and engineering practices aligned with modern enterprise data platforms and suitable for demonstrating skills relevant to a Data Engineering + AI interview.

## 1. Existing System

Current architecture:

```text
Supplier CSV Dataset
        ↓
Python/Pandas
        ↓
PostgreSQL
        ↓
FastAPI
        ↓
Next.js
```

Recommendation pipeline:

```text
Ingredient Filtering
        ↓
Haversine Distance
        ↓
Delivery Radius Filtering
        ↓
StandardScaler
        ↓
K-Means Cluster Assignment
        ↓
Weighted Business Ranking
        ↓
Match Score
        ↓
Deterministic Explanation
        ↓
FastAPI Response
```

Current database entities:

* users
* suppliers
* products
* supplier_inventories

Current ML artifacts:

* StandardScaler
* KMeans

Current backend services:

* recommendation_service.py
* distance_service.py
* cluster_service.py
* ranking_service.py
* explanation_service.py
* model_manager.py

Current API:

```text
POST /recommend
```

Current frontend:

* Next.js
* React Leaflet / OpenStreetMap
* supplier recommendation cards
* supplier details drawer

Current tests:

* recommendation API tests

## 2. Critical Rule

Do NOT falsely represent features as production functionality if they are only conceptual.

When adding new enterprise-oriented capabilities, implement them properly and document them.

The project should clearly distinguish:

1. What was originally implemented.
2. What is newly implemented as an engineering enhancement.
3. What is an architectural/scalability extension.

Do not add technologies merely to make the project look impressive.

Prioritize depth, correctness, maintainability and demonstrability.

---

# PHASE 0 — Repository Audit

Before modifying code:

1. Inspect the complete repository.
2. Understand the current backend architecture.
3. Understand the current database models.
4. Understand the existing ML training pipeline.
5. Understand the recommendation flow.
6. Understand the frontend.
7. Understand existing tests.
8. Identify current deployment configuration.
9. Identify duplicated or unnecessary logic.
10. Identify technical debt.

Create:

```text
docs/ARCHITECTURE_CURRENT.md
docs/UPGRADE_PLAN.md
```

Document:

* current architecture
* current data flow
* current ML flow
* current database model
* current API flow
* current testing strategy
* identified gaps
* proposed architecture

Do not modify application behavior during this phase.

---

# PHASE 1 — Production-Style Data Pipeline

Create a clearly separated data pipeline.

Suggested structure:

```text
data_pipeline/
├── ingestion/
├── validation/
├── transformation/
├── feature_engineering/
├── loading/
├── monitoring/
└── config/
```

Implement a pipeline:

```text
RAW
 ↓
VALIDATION
 ↓
CLEANED
 ↓
CURATED
```

The pipeline must be reusable and executable from the command line.

It should not depend on notebook execution.

Create:

```text
scripts/run_data_pipeline.py
```

The pipeline should provide structured logging and clear execution status.

---

# PHASE 2 — Bronze / Silver / Gold Data Layers

Implement the following logical data layers.

## Bronze

Raw source data with minimal transformation.

Requirements:

* preserve source fields
* add ingestion timestamp
* add dataset/version identifier
* preserve original record information where possible

## Silver

Validated and cleaned data.

Apply:

* schema validation
* null checks
* type validation
* range validation
* duplicate detection
* coordinate validation
* business-rule validation

## Gold

Analytics-ready supplier features.

Include fields required for:

* supplier ranking
* geospatial analysis
* ML inference
* reporting

Document the purpose of each layer.

---

# PHASE 3 — Data Quality Framework

Implement reusable data-quality checks.

Required checks:

### Schema

* required columns exist
* expected data types

### Completeness

* supplier_id
* product_id
* price
* coordinates
* quality/rating fields

### Validity

```text
price > 0
rating between 0 and 5
quality_score between 0 and 5
reliability_score between 0 and 100
latitude between -90 and 90
longitude between -180 and 180
delivery_radius_km > 0
average_delivery_time_min > 0
stock_available >= 0
minimum_order > 0
```

### Uniqueness

Validate supplier/product business keys.

### Referential integrity

Validate supplier and product references.

### Business rules

Validate that records are logically usable for recommendation.

Invalid records must not silently disappear.

Create a quarantine/rejected-record output containing:

* record identifier
* validation failure
* timestamp
* pipeline version

Generate a data-quality summary:

```json
{
  "total_records": 0,
  "valid_records": 0,
  "invalid_records": 0,
  "duplicate_records": 0,
  "quality_status": "PASS"
}
```

Do not hard-code these values.

---

# PHASE 4 — Incremental Data Processing

Introduce support for incremental processing.

Add appropriate metadata such as:

```text
created_at
updated_at
ingestion_timestamp
source_version
```

Implement a safe upsert/incremental-load strategy.

The pipeline should avoid unnecessarily reprocessing unchanged records.

Document:

* full load
* incremental load
* idempotency
* duplicate handling
* retry behavior

---

# PHASE 5 — PostgreSQL Data Engineering Improvements

Keep PostgreSQL as the operational/application database.

Review and improve:

* primary keys
* foreign keys
* unique constraints
* indexes
* check constraints
* query efficiency
* SQLAlchemy relationships

Add indexes based on actual query patterns.

Do not create unnecessary indexes.

Identify and optimize the main query used by:

```text
POST /recommend
```

Measure query execution time before and after optimization.

Document the optimization.

---

# PHASE 6 — Separate ML and Business Recommendation Logic

Make the architecture explicit:

```text
Feature Engineering
       │
       ├───────────────┐
       ▼               ▼
    K-Means       Business Ranking
       │               │
       ▼               ▼
 Cluster Assignment   Weighted Score
       │               │
       └───────┬───────┘
               ▼
       Final Recommendation
```

Important:

K-Means should be treated as a segmentation/context component.

The deterministic weighted ranking engine should remain responsible for business ranking.

Do not imply that K-Means itself determines the final recommendation.

---

# PHASE 7 — ML Evaluation and Reproducibility

Improve the model-training script.

Training must be executable independently:

```bash
python backend/scripts/train_recommendation_model.py
```

Persist:

* scaler
* KMeans model
* model metadata
* training dataset version
* feature list
* training timestamp
* number of clusters
* training row count
* evaluation metrics

Calculate at minimum:

* inertia
* silhouette score
* cluster distribution

Do not invent evaluation values.

Save them from actual training.

Example metadata:

```json
{
  "model_version": "1.1.0",
  "algorithm": "KMeans",
  "n_clusters": 4,
  "feature_columns": [],
  "training_rows": 0,
  "silhouette_score": 0.0,
  "trained_at": ""
}
```

---

# PHASE 8 — Consistent Inference Preprocessing

Ensure that inference uses exactly the same preprocessing assumptions as training.

Requirements:

```text
Training:
Raw Features
 → preprocessing
 → StandardScaler.fit_transform()
 → KMeans.fit()

Inference:
Raw Features
 → SAME preprocessing
 → SAME saved StandardScaler.transform()
 → KMeans.predict()
```

Prevent accidental refitting during inference.

Add tests to guarantee this behavior.

---

# PHASE 9 — Deterministic Explainability

Improve the existing explanation service.

Recommendations should explain actual data-driven reasons.

Example:

Instead of:

```text
Recommended because it is good.
```

Generate explanations from actual values:

```text
Recommended because it is 0.58 km away, has a 4.8 rating,
95 reliability score and 18-minute average delivery time.
```

The explanation must be deterministic.

Do not use an LLM for this feature.

---

# PHASE 10 — Recommendation Auditability

Create recommendation audit records.

Record:

* request_id
* user_id
* ingredient
* request coordinates
* timestamp
* model_version
* number of suppliers checked
* number of eligible suppliers
* selected supplier
* recommendation score
* processing time
* API version

Do not store sensitive information unnecessarily.

Provide a way to trace a recommendation request for debugging.

---

# PHASE 11 — Observability

Add structured logging and metrics around the recommendation pipeline.

Measure at least:

```text
database_query_time
distance_filter_time
feature_processing_time
model_prediction_time
ranking_time
total_request_time
candidate_supplier_count
eligible_supplier_count
error_count
```

Expose useful health information through a safe health endpoint.

Do not expose secrets or sensitive information.

---

# PHASE 12 — Testing

Expand tests into:

```text
tests/
├── unit/
│   ├── test_haversine.py
│   ├── test_distance_service.py
│   ├── test_cluster_service.py
│   ├── test_ranking_service.py
│   └── test_explanation_service.py
│
├── data_quality/
│   ├── test_schema.py
│   ├── test_constraints.py
│   └── test_business_rules.py
│
├── integration/
│   └── test_recommendation_pipeline.py
│
└── api/
    └── test_recommendation_api.py
```

Test:

* valid input
* missing input
* invalid coordinates
* unknown ingredient
* no eligible suppliers
* duplicate suppliers
* corrupted model artifact
* database failure
* invalid supplier data
* ranking correctness
* deterministic explanation
* API authentication

---

# PHASE 13 — CI/CD

Create a GitHub Actions or equivalent CI workflow.

On pull request/push:

```text
Install dependencies
      ↓
Lint
      ↓
Unit Tests
      ↓
Data Quality Tests
      ↓
Integration Tests
      ↓
Build
```

Do not deploy automatically unless the repository already has a safe deployment configuration.

Document the CI/CD pipeline.

---

# PHASE 14 — Docker

Create production-oriented Docker configuration.

Containers should support:

```text
FastAPI
PostgreSQL
```

and optionally the training environment.

Ensure:

* environment variables for secrets
* no hard-coded credentials
* health checks
* reproducible dependency installation

---

# PHASE 15 — PySpark Scalable Pipeline

Do not replace the existing Pandas implementation.

Create a separate scalable implementation:

```text
spark_pipeline/
├── bronze_ingestion.py
├── silver_transformation.py
├── gold_features.py
└── config.py
```

Use PySpark for:

* ingestion
* validation
* cleaning
* transformations
* feature engineering

Document how this version differs from the Pandas implementation.

The goal is to demonstrate how the same pipeline can evolve from:

```text
Pandas → PySpark
```

when data volume grows.

---

# PHASE 16 — Databricks / Delta Lake Extension

Create a Databricks-compatible implementation of the Spark pipeline.

Use the logical architecture:

```text
Bronze
 ↓
Silver
 ↓
Gold
```

Use Delta Lake where available.

Document:

* Delta tables
* schema enforcement
* schema evolution
* MERGE/upsert
* incremental processing
* partitioning
* data quality expectations
* workflow orchestration

Do not claim that the original production application used Databricks if it did not.

Clearly document this as the scalable enterprise extension of the project.

---

# PHASE 17 — Performance Benchmark

Create a benchmark script.

Test the recommendation pipeline and/or data pipeline at multiple data volumes where feasible.

Measure actual:

* ingestion time
* transformation time
* database query time
* recommendation latency
* memory usage

Do not fabricate benchmark values.

Save benchmark results in:

```text
docs/PERFORMANCE_BENCHMARK.md
```

Identify bottlenecks and optimize at least one measurable bottleneck.

---

# PHASE 18 — Architecture Documentation

Create:

```text
docs/
├── ARCHITECTURE.md
├── DATA_PIPELINE.md
├── DATA_QUALITY.md
├── DATA_MODEL.md
├── ML_PIPELINE.md
├── API.md
├── SCALABILITY.md
├── TESTING.md
├── CI_CD.md
└── PERFORMANCE_BENCHMARK.md
```

Architecture documentation must explain:

1. Current system
2. Data flow
3. Database model
4. ML flow
5. Data-quality strategy
6. Production considerations
7. Scalability path
8. Failure handling
9. Monitoring
10. Security

---

# PHASE 19 — Interview Documentation

Create:

```text
docs/INTERVIEW_GUIDE.md
```

Include accurate answers based on the actual implementation.

Sections:

### Project Overview

### Architecture

### Data Engineering

### SQL/PostgreSQL

### Data Quality

### ML/K-Means

### API/FastAPI

### Testing

### CI/CD

### Scalability

### PySpark

### Databricks

### Failure Scenarios

### Design Trade-offs

For every technology, clearly distinguish:

```text
Implemented
vs
Added as extension
vs
Future architecture
```

Do not invent implementation details.

---

# PHASE 20 — Final Acceptance Criteria

The final project should demonstrate the following competencies:

## Data Engineering

* ETL/ELT
* ingestion
* transformation
* validation
* data quality
* incremental processing
* data modeling
* SQL
* PostgreSQL
* pipeline monitoring

## Distributed Data

* PySpark
* scalable transformations
* partitioning concepts
* performance considerations
* Databricks-compatible architecture
* Delta Lake concepts

## Machine Learning

* feature engineering
* StandardScaler
* K-Means
* model persistence
* evaluation
* reproducible inference
* model versioning

## Software Engineering

* FastAPI
* REST
* modular architecture
* testing
* Docker
* Git
* CI/CD
* logging
* error handling

## Production Engineering

* observability
* auditability
* security
* configuration management
* scalability
* failure handling
* documentation

---

# IMPORTANT IMPLEMENTATION RULES

1. Do not rewrite working functionality unnecessarily.
2. Do not introduce technologies only for resume keywords.
3. Do not fabricate benchmark results.
4. Do not fabricate model metrics.
5. Do not fabricate production deployment.
6. Do not claim Databricks was used in the original application if it was not.
7. Preserve the existing recommendation behavior unless an identified bug requires modification.
8. Add automated tests before major refactoring.
9. Keep modules small and maintainable.
10. Use type hints where appropriate.
11. Use structured logging.
12. Keep secrets out of source control.
13. Update documentation whenever architecture changes.
14. Prefer deterministic business logic over unnecessary LLM usage.
15. Preserve the separation between ML segmentation and business ranking.
16. Make every new feature demonstrable through code, tests or documentation.

## Final Deliverable

After implementation, provide a concise engineering report containing:

* what was changed
* why it was changed
* files added
* files modified
* tests added
* test results
* benchmark results
* new architecture
* technologies actually implemented
* technologies represented only as scalable extensions
* known limitations
* recommended next steps

Do not claim completion until the implementation has been tested.
