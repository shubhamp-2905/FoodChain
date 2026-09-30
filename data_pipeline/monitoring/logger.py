"""
FoodChain AI — Pipeline Monitoring & Structured Logging
"""

import sys
import time
import json
import logging
from typing import Dict, Any, Optional
from datetime import datetime, timezone


class StructuredJsonFormatter(logging.Formatter):
    """Formats log records as single-line JSON objects."""

    def format(self, record: logging.LogRecord) -> str:
        log_obj = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if hasattr(record, "stage"):
            log_obj["stage"] = record.stage
        if hasattr(record, "metrics"):
            log_obj["metrics"] = record.metrics
        if record.exc_info:
            log_obj["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_obj)


def setup_pipeline_logger(name: str = "foodchain.pipeline", verbose: bool = False) -> logging.Logger:
    """Configures and returns a structured logger for the data pipeline."""
    logger = logging.getLogger(name)
    logger.setLevel(logging.DEBUG if verbose else logging.INFO)

    # Avoid duplicate handlers if already configured
    if not logger.handlers:
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(logging.DEBUG if verbose else logging.INFO)

        # Standard console readable formatting with timestamp
        formatter = logging.Formatter(
            fmt="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)

    return logger


pipeline_logger = setup_pipeline_logger()


class StageTimer:
    """Context manager to measure and log execution duration for pipeline stages."""

    def __init__(self, stage_name: str, logger: Optional[logging.Logger] = None):
        self.stage_name = stage_name
        self.logger = logger or pipeline_logger
        self.start_time: float = 0.0
        self.end_time: float = 0.0
        self.elapsed_ms: float = 0.0

    def __enter__(self):
        self.logger.info(f">> Starting stage: [{self.stage_name}]")
        self.start_time = time.perf_counter()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.end_time = time.perf_counter()
        self.elapsed_ms = round((self.end_time - self.start_time) * 1000, 2)
        if exc_type is not None:
            self.logger.error(
                f"[FAILED] Stage [{self.stage_name}] failed after {self.elapsed_ms}ms: {exc_val}"
            )
        else:
            self.logger.info(
                f"[DONE] Stage [{self.stage_name}] completed in {self.elapsed_ms}ms"
            )
        return False  # Do not suppress exceptions
