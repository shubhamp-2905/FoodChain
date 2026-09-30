# FoodChain AI — Incremental Data Processing & Safe Upsert Architecture (Phase 4)

## 1. Overview

FoodChain AI implements a high-throughput, idempotent incremental data processing framework across its Medallion data architecture (`Bronze` -> `Silver` -> `Gold`).

The incremental engine prevents unnecessary reprocessing of unchanged supplier data, ensures historical timestamp integrity (`created_at` preservation), safely resolves duplicate updates, and provides fault-tolerant recovery semantics.

```text
Incoming Supplier Batch
           │
           ▼
┌────────────────────────┐
│ Cryptographic Hashing  │  Computes SHA-256 over 18 canonical business fields
│   (Row Hash Engine)    │  (Excludes non-deterministic runtime timestamps)
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────┐
│    Change Detector     │  Compares incoming records against existing Bronze state
│ (supplier_id, ingred)  │  using composite business keys
└──────────┬─────────────┘
           │
     ┌─────┴──────────────────────────────┐
     │                                    │
     ▼                                    ▼
[Unchanged Records]             [New & Modified Delta Records]
     │                                    │
     ▼ (Bypass Recomputation)             ▼
Preserve Existing State         ┌─────────────────────────┐
                                │      Silver Layer       │  Schema, Null, Bounds,
                                │  Validation & Cleaning  │  Quarantine Routing
                                └────────────┬────────────┘
                                             │
                                             ▼
                                ┌─────────────────────────┐
                                │       Gold Layer        │  Feature Engineering &
                                │   Feature Derivation    │  Market Relatives
                                └────────────┬────────────┘
                                             │
                                             ▼
                                ┌─────────────────────────┐
                                │      Safe Upserter      │  Preserves created_at,
                                │  Layer-by-Layer Merging │  Updates updated_at
                                └────────────┬────────────┘
                                             │
                                             ▼
                                [Persisted Bronze, Silver, Gold]
```

---

## 2. Ingestion Modes

The pipeline exposes two execution modes through `PipelineConfig` and the CLI runner:

### 2.1 Full Load (`--mode full`)
* **Behavior**: Ingests the entire raw source dataset, runs comprehensive data quality validation, transforms and cleans all rows, generates Gold analytics features from scratch, and replaces existing layer files.
* **Metadata Semantics**:
  * `created_at`: Set to the current execution timestamp.
  * `updated_at`: Set to the current execution timestamp.
  * `ingestion_timestamp`: UTC timestamp of the full run.
  * `source_version`: Configured dataset version (e.g. `1.0.0`).
* **Use Cases**: System cold-start, environment bootstrapping, major schema migrations, or full disaster recovery.

### 2.2 Incremental Load (`--mode incremental`)
* **Behavior**: Compares incoming records against the existing Bronze state using composite business keys `(supplier_id, ingredient)`.
  * If existing layer state is missing, gracefully falls back to an initial full bootstrap.
  * If existing layer state is present, partitions incoming records into `new_df`, `modified_df`, and `unchanged_df`.
* **Optimization**: Records identified as `unchanged` bypass all downstream validation, cleaning, and feature engineering. Only changed records (`new + modified`) flow through Silver and Gold processors.
* **Layer Synchronization**: `SafeUpserter` reconciles the newly processed delta with the existing datasets across Bronze, Silver, and Gold.

---

## 3. Cryptographic Change Detection

Change detection relies on deterministic row hashing implemented in `data_pipeline/incremental/hashing.py`:

```python
HASH_COLUMNS = [
    "supplier_id", "supplier_name", "supplier_type", "market", "area",
    "latitude", "longitude", "ingredient", "category", "price",
    "unit", "stock_available", "minimum_order", "quality_score",
    "rating", "reliability_score", "delivery_radius_km", "average_delivery_time_min"
]
```

* **Deterministic Canonicalization**: Each field value is stripped of surrounding whitespace, converted to lowercase, null-coalesced to empty string, joined by delimiter `|`, and hashed using `SHA-256`.
* **Exclusion of Metadata**: Runtime timestamps (`created_at`, `updated_at`, `ingestion_timestamp`) and execution IDs are explicitly excluded from hashing. A change in timestamp does not produce a false positive change.

---

## 4. Safe Upsert & Metadata Lifecycle

The `SafeUpserter` engine guarantees that record lifecycles remain consistent across multiple incremental batches:

| Scenario | `created_at` | `updated_at` | `source_version` | Description |
| :--- | :--- | :--- | :--- | :--- |
| **New Record** | Current timestamp $T_0$ | Current timestamp $T_0$ | Current batch version | Inserted as a new row. |
| **Modified Record** | Preserved from existing state $T_{-1}$ | Current timestamp $T_0$ | Current batch version | Existing row updated in-place; original creation provenance retained. |
| **Unchanged Record** | Preserved from existing state $T_{-1}$ | Preserved from existing state $T_{-1}$ | Preserved | Row untouched; no CPU/IO recomputation expended. |

---

## 5. Duplicate Handling

Duplicate handling operates at two distinct boundaries:

1. **Intra-Batch Deduplication**:
   * If an incoming payload contains duplicate records with identical composite keys `(supplier_id, ingredient)`, `SafeUpserter` retains the *latest* occurrence (`keep="last"`).
   * In Silver validation, duplicate occurrences within the batch are flagged in the `ValidationSummary` metrics (`duplicate_records`).

2. **Inter-Batch Deduplication**:
   * When an incoming record matches an existing record in the storage layers:
     * If the payload hash is identical, it is marked as `unchanged` and deduplicated against existing state.
     * If the payload hash differs, it is treated as an in-place update (upsert) rather than appending a duplicate row.

---

## 6. Idempotency Guarantees

The pipeline is completely idempotent:

* **Replay Safety**: Executing the pipeline multiple times against identical input data results in identical final states across Bronze, Silver, and Gold layers.
* **Zero Phantom Updates**: If 100% of incoming records match existing state, the pipeline logs an informational message (`All records are unchanged. Reprocessing bypassed.`), writes an updated manifest with `reprocessed_records: 0`, and exits with `SUCCESS` without rewriting or corrupting data layers.

---

## 7. Retry Behavior & Fault Tolerance

* **Atomic Layer Persistence**: Data layers are written to disk only after all transformations in the current batch have succeeded.
* **Persistent Quarantine**: Failed validation records are appended to `quarantined_records.csv` rather than overwriting prior quarantined records. This preserves the operational audit trail across retries.
* **Retry Cleanliness**: If an ingestion failure occurs mid-batch (e.g. malformed CSV or disk exception), previous Bronze, Silver, and Gold layers remain uncorrupted. Upon subsequent retry, change detection accurately determines delta records without manual rollback.

---

## 8. CLI Usage Examples

```bash
# 1. Execute an incremental run (default mode)
python scripts/run_data_pipeline.py --mode incremental

# 2. Force a complete recomputation of all layers
python scripts/run_data_pipeline.py --mode full

# 3. Incremental run on a real supplier onboarding delta file
python scripts/run_data_pipeline.py \
    --input data/real_supplier_batch_01.csv \
    --mode incremental \
    --source-type REAL_SUPPLIER_ONBOARDING
```
