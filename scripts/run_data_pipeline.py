#!/usr/bin/env python3
"""
FoodChain AI — Production Data Pipeline CLI Runner
"""

import os
import sys
import argparse
from typing import Optional
import pandas as pd

current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, ".."))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from data_pipeline.config.pipeline_config import PipelineConfig, SourceType, ExecutionMode
from data_pipeline.pipeline import FoodChainDataPipeline, PipelineExecutionResult
from data_pipeline.ml.retraining_policy import RetrainingPolicy
from data_pipeline.monitoring.logger import setup_pipeline_logger


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="FoodChain AI — Production Data Pipeline CLI",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument(
        "-i", "--input",
        dest="input_path",
        default=os.path.join("data", "pune_supplier_dataset.csv"),
        help="Path to the raw supplier dataset CSV file",
    )
    parser.add_argument(
        "-o", "--output-dir",
        dest="output_dir",
        default=os.path.join("data", "pipeline_output"),
        help="Target base directory for pipeline storage layers",
    )
    parser.add_argument(
        "-m", "--mode",
        dest="execution_mode",
        default="incremental",
        choices=["incremental", "full"],
        help="Execution strategy: incremental safe upsert or full dataset rebuild",
    )
    parser.add_argument(
        "-s", "--source-type",
        dest="source_type",
        default="SEED_SYNTHETIC",
        choices=["SEED_SYNTHETIC", "REAL_SUPPLIER_ONBOARDING", "INVENTORY_UPDATE"],
        help="Source category for data lineage and retraining policy tracking",
    )
    parser.add_argument(
        "-v", "--version",
        dest="version",
        default="1.0.0",
        help="Dataset and pipeline run version identifier",
    )
    parser.add_argument(
        "--stop-on-failure",
        dest="stop_on_failure",
        action="store_true",
        help="Raise exception and abort pipeline if validation failure threshold is exceeded",
    )
    parser.add_argument(
        "--threshold-pct",
        dest="threshold_pct",
        type=float,
        default=10.0,
        help="Maximum allowable validation failure percentage before marking status FAIL",
    )
    parser.add_argument(
        "--verbose",
        dest="verbose",
        action="store_true",
        help="Enable verbose debug logging output",
    )
    return parser.parse_args()


def print_summary_table(res: PipelineExecutionResult, retrain_decision=None) -> None:
    print("\n" + "=" * 78)
    print(f"             FOODCHAIN AI PIPELINE EXECUTION REPORT v{res.pipeline_version}")
    print("=" * 78)
    print(f"  Overall Status        : {res.status}")
    print(f"  Execution Mode        : {res.execution_mode}")
    print(f"  Total Duration        : {res.total_duration_ms:.2f} ms")
    print(f"  Execution Window      : {res.start_time} -> {res.end_time}")
    print("-" * 78)
    print("  STAGE TIMINGS BREAKDOWN:")
    for stage, ms in res.stage_durations_ms.items():
        bar = "#" * max(1, int(ms / (res.total_duration_ms or 1) * 30))
        print(f"    * {stage:<22} : {ms:>8.2f} ms  [{bar}]")
    print("-" * 78)
    print("  RECORD METRICS:")
    for metric, count in res.record_metrics.items():
        print(f"    * {metric:<22} : {count:>8,}")
    if res.incremental_metrics:
        print("-" * 78)
        print("  INCREMENTAL DELTA METRICS:")
        for metric, count in res.incremental_metrics.items():
            print(f"    * {metric:<22} : {count:>8,}")
    if retrain_decision:
        print("-" * 78)
        print("  ML RETRAINING POLICY EVALUATION:")
        print(f"    * Governance Status   : {retrain_decision.status}")
        print(f"    * Real Sample Count   : {retrain_decision.real_sample_count} / {retrain_decision.threshold}")
        print(f"    * Policy Recommendation: {retrain_decision.reason}")
    print("-" * 78)
    print("  GENERATED ARTIFACTS:")
    canonical_artifacts = [
        "bronze_path",
        "silver_path",
        "gold_path",
        "quarantine_path",
        "quality_summary_path",
        "manifest_path",
    ]
    for name in canonical_artifacts:
        path = res.artifacts.get(name)
        if path:
            print(f"    * {name:<20} : {path}")
    print("=" * 78 + "\n")


def main() -> int:
    args = parse_arguments()
    setup_pipeline_logger(verbose=args.verbose)

    source_type_enum = SourceType(args.source_type)
    exec_mode_enum = ExecutionMode(args.execution_mode.upper())
    config = PipelineConfig(
        raw_input_path=args.input_path,
        output_dir=args.output_dir,
        dataset_version=args.version,
        default_source_type=source_type_enum,
        execution_mode=exec_mode_enum,
        stop_on_validation_failure=args.stop_on_failure,
        validation_failure_threshold_pct=args.threshold_pct,
    )

    pipeline = FoodChainDataPipeline(config)
    result = pipeline.run(input_path=args.input_path, mode=exec_mode_enum)

    retrain_decision = None
    if result.status == "SUCCESS" and os.path.exists(config.gold_output_path):
        gold_df = pd.read_csv(config.gold_output_path)
        policy = RetrainingPolicy(config)
        retrain_decision = policy.evaluate(gold_df)

    print_summary_table(result, retrain_decision)

    if result.status == "SUCCESS":
        return 0
    else:
        print(f"Pipeline terminated with error: {result.error_message}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
