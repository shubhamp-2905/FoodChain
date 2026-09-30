# FoodChain AI — Recommendation Auditability & Tracing (Phase 10)

## 1. Executive Summary

Phase 10 introduces enterprise-grade **recommendation auditability and trace logging** into the FoodChain AI platform.

Prior to Phase 10, recommendation requests were ephemeral: once a request completed, no persistent record remained of which suppliers were evaluated, which model version was active, why a specific supplier was chosen, or how long each calculation took. In production enterprise data platforms, auditability is essential for:
* **Production Debugging & Support**: Investigating vendor complaints or unexpected rankings with precise request replays.
* **Model Governance & Compliance**: Tracking which model versions (`model_version`) and scoring weights were active for every historical decision.
* **Fulfillment Diagnostics**: Monitoring the candidate funnel (total suppliers checked vs. eligible within delivery radius).
* **Privacy by Design**: Ensuring **zero raw PII** (passwords, tokens, phone numbers) is recorded in audit logs.

---

## 2. Relational Audit Schema

### 2.1 Table: `recommendation_audits`
Created via Alembic migration [`003_recommendation_audit.py`](file:///d:/Projects/Foodchain/backend/alembic/versions/003_recommendation_audit.py):

```sql
CREATE TABLE recommendation_audits (
    id SERIAL PRIMARY KEY,
    request_id VARCHAR(64) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    ingredient VARCHAR(100) NOT NULL,
    vendor_latitude FLOAT NOT NULL,
    vendor_longitude FLOAT NOT NULL,
    suppliers_checked INTEGER NOT NULL DEFAULT 0,
    eligible_suppliers INTEGER NOT NULL DEFAULT 0,
    selected_supplier_id VARCHAR(50),
    selected_supplier_name VARCHAR(200),
    recommendation_score FLOAT,
    match_score INTEGER,
    processing_time_ms INTEGER NOT NULL DEFAULT 0,
    model_version VARCHAR(50) NOT NULL DEFAULT '1.1.0',
    api_version VARCHAR(20) NOT NULL DEFAULT 'v1',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT ck_rec_audit_lat_range CHECK (vendor_latitude >= -90.0 AND vendor_latitude <= 90.0),
    CONSTRAINT ck_rec_audit_lon_range CHECK (vendor_longitude >= -180.0 AND vendor_longitude <= 180.0),
    CONSTRAINT ck_rec_audit_proc_time_non_negative CHECK (processing_time_ms >= 0),
    CONSTRAINT ck_rec_audit_suppliers_checked_non_negative CHECK (suppliers_checked >= 0),
    CONSTRAINT ck_rec_audit_eligible_suppliers_non_negative CHECK (eligible_suppliers >= 0)
);

CREATE UNIQUE INDEX ix_recommendation_audits_request_id ON recommendation_audits (request_id);
CREATE INDEX ix_recommendation_audits_ingredient ON recommendation_audits (ingredient);
CREATE INDEX ix_recommendation_audits_created_at ON recommendation_audits (created_at);
CREATE INDEX ix_rec_audit_user_created ON recommendation_audits (user_id, created_at);
CREATE INDEX ix_rec_audit_ingredient_created ON recommendation_audits (ingredient, created_at);
```

### 2.2 SQLAlchemy Declarative Model
Implemented in [`RecommendationAudit`](file:///d:/Projects/Foodchain/backend/app/models/recommendation_audit.py) and registered in [`backend/app/models/__init__.py`](file:///d:/Projects/Foodchain/backend/app/models/__init__.py).

---

## 3. End-to-End Tracing Flow

```mermaid
flowchart TD
    Client["Client / Frontend"] -->|POST /recommend\n(optional X-Request-ID header)| Endpoint["FastAPI: POST /recommend"]
    
    subgraph Execution["Recommendation Execution"]
        Endpoint --> GenReqId["Propagate / Generate UUID: request_id"]
        GenReqId --> RecService["RecommendationService.recommend(..., request_id)"]
        RecService --> EagerDB["Fetch Joined Offerings (N+1 free)"]
        EagerDB --> ML["Branch A: ML Segmentation (KMeans)"]
        EagerDB --> Rank["Branch B: Deterministic Ranking Engine"]
        ML --> Synthesize["Synthesize Context & Rank"]
        Rank --> Synthesize
        Synthesize --> ResponseObj["RecommendationResponse (with metadata.request_id)"]
    end
    
    subgraph AuditLog["Audit Logging (Non-Blocking Failure Boundary)"]
        ResponseObj --> AuditRecord["Build RecommendationAudit:\n- request_id\n- user_id\n- ingredient\n- vendor_latitude/longitude\n- candidate counts\n- selected_supplier_id\n- match_score\n- processing_time_ms\n- model_version"]
        AuditRecord --> Repo["RecommendationAuditRepository.create()"]
        Repo --> PG[(PostgreSQL: recommendation_audits)]
    end
    
    ResponseObj --> ClientResponse["HTTP 200 Response:\nHeader: X-Request-ID\nBody: metadata.request_id"]
    ClientResponse --> Client
```

---

## 4. API Endpoints for Tracing & Auditing

### 4.1 `POST /recommend`
* **Request Header**: Optional `X-Request-ID: <custom_uuid>`. If omitted, an authoritative UUID is generated automatically.
* **Response Header**: `X-Request-ID: <trace_uuid>`.
* **Response Body**:
  ```json
  {
    "ingredient": "Potato",
    "generated_at": "2026-09-26T00:15:30.123456+00:00",
    "best_supplier": { ... },
    "alternatives": [ ... ],
    "metadata": {
      "suppliers_checked": 374,
      "eligible_suppliers": 45,
      "processing_time_ms": 18,
      "model_version": "1.1.0",
      "request_id": "trace_a1b2c3d4e5f6",
      "api_version": "v1"
    }
  }
  ```

### 4.2 `GET /recommend/audits/{request_id}`
Retrieves the exact audit record for any historical recommendation request:
```json
{
  "id": 1,
  "request_id": "trace_a1b2c3d4e5f6",
  "user_id": 16,
  "ingredient": "Potato",
  "vendor_latitude": 18.5204,
  "vendor_longitude": 73.8567,
  "suppliers_checked": 374,
  "eligible_suppliers": 45,
  "selected_supplier_id": "SUPP00001",
  "selected_supplier_name": "Premium Agri Wholesaler",
  "recommendation_score": 0.925,
  "match_score": 93,
  "processing_time_ms": 18,
  "model_version": "1.1.0",
  "api_version": "v1",
  "created_at": "2026-09-26T00:15:30.150000+00:00"
}
```

### 4.3 `GET /recommend/audits`
Paginated audit query endpoint supporting `ingredient`, `limit`, and `offset` filtering for operations and debugging.

---

## 5. Automated Verification & Testing

The dedicated test suite [`backend/tests/test_recommendation_audit.py`](file:///d:/Projects/Foodchain/backend/tests/test_recommendation_audit.py) verifies:

| Test Case | Description | Result |
| :--- | :--- | :---: |
| `test_audit_record_creation_and_retrieval` | Persisting and querying an audit by `request_id`. | **PASS** |
| `test_unique_request_id_constraint` | Enforces that duplicate request IDs violate DB uniqueness constraints. | **PASS** |
| `test_check_constraints_lat_and_processing_time` | Verifies coordinates range and non-negative processing time checks. | **PASS** |
| `test_audit_listing_and_filtering` | Validates filtering by ingredient and pagination count. | **PASS** |
| `test_end_to_end_recommendation_audit_trace` | Full end-to-end trace from `POST /recommend` to audit retrieval via `GET /recommend/audits/{request_id}`. | **PASS** |
| `test_get_audit_trace_not_found` | Returns 404 for unknown request IDs. | **PASS** |

### Test Suite Execution Summary
```bash
pytest backend/tests/test_recommendation_audit.py
# 6 passed in 5.36s

pytest backend/tests
# 59 passed in 5.52s (100% passing across all 9 test suites)
```
