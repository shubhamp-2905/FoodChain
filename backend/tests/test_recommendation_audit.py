"""
Tests for Phase 10: Recommendation Auditability & Tracing.

Verifies:
1. RecommendationAudit schema integrity and constraint enforcement.
2. RecommendationAuditRepository CRUD, unique request_id, and query filtering.
3. End-to-end integration: POST /recommend generates X-Request-ID and persists audit trace.
4. Tracing API endpoints: GET /recommend/audits/{request_id} and GET /recommend/audits.
"""

import os
import sys
import uuid
import unittest
from datetime import datetime, timezone

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from fastapi import status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.main import app
from app.db.session import SessionLocal
from app.api.deps import get_current_user
from app.models.user import User
from app.models.recommendation_audit import RecommendationAudit
from app.repositories.recommendation_audit_repository import RecommendationAuditRepository


class TestRecommendationAuditability(unittest.TestCase):
    def setUp(self):
        self.db: Session = SessionLocal()
        # Find or create a test user
        self.test_user = self.db.query(User).filter(User.email == "audit_test@foodchain.ai").first()
        if not self.test_user:
            self.test_user = User(
                full_name="Audit Test Vendor",
                email="audit_test@foodchain.ai",
                hashed_password="fake_hashed_secret_password_123",
                mobile_number="9998887770",
                business_name="Audit Stall",
                food_type="Street Food",
                latitude=18.5204,
                longitude=73.8567,
                area="Shivajinagar",
                city="Pune",
                state="Maharashtra",
            )
            self.db.add(self.test_user)
            self.db.commit()
            self.db.refresh(self.test_user)

        # Setup test client with authenticated user override
        app.dependency_overrides[get_current_user] = lambda: self.test_user
        self.client = TestClient(app)

    def tearDown(self):
        app.dependency_overrides.clear()
        self.db.rollback()
        self.db.close()

    def test_audit_record_creation_and_retrieval(self):
        """Verify persisting and querying an audit record by request_id."""
        req_id = str(uuid.uuid4())
        audit = RecommendationAudit(
            request_id=req_id,
            user_id=self.test_user.id,
            ingredient="Potato",
            vendor_latitude=18.5204,
            vendor_longitude=73.8567,
            suppliers_checked=150,
            eligible_suppliers=45,
            selected_supplier_id="SUPP00001",
            selected_supplier_name="Premium Agri Wholesaler",
            recommendation_score=0.925,
            match_score=93,
            processing_time_ms=18,
            model_version="1.1.0",
            api_version="v1",
        )

        created = RecommendationAuditRepository.create(self.db, audit)
        self.assertIsNotNone(created.id)

        retrieved = RecommendationAuditRepository.get_by_request_id(self.db, req_id)
        self.assertIsNotNone(retrieved)
        self.assertEqual(retrieved.request_id, req_id)
        self.assertEqual(retrieved.ingredient, "Potato")
        self.assertEqual(retrieved.selected_supplier_id, "SUPP00001")
        self.assertEqual(retrieved.match_score, 93)
        self.assertEqual(retrieved.processing_time_ms, 18)
        self.assertEqual(retrieved.model_version, "1.1.0")

    def test_unique_request_id_constraint(self):
        """Verify that duplicate request_id violates unique constraint."""
        req_id = str(uuid.uuid4())
        audit_1 = RecommendationAudit(
            request_id=req_id,
            user_id=self.test_user.id,
            ingredient="Potato",
            vendor_latitude=18.5204,
            vendor_longitude=73.8567,
            suppliers_checked=10,
            eligible_suppliers=5,
            processing_time_ms=12,
        )
        RecommendationAuditRepository.create(self.db, audit_1)

        # Attempt duplicate request_id
        audit_2 = RecommendationAudit(
            request_id=req_id,
            user_id=self.test_user.id,
            ingredient="Onion",
            vendor_latitude=18.5204,
            vendor_longitude=73.8567,
            suppliers_checked=20,
            eligible_suppliers=8,
            processing_time_ms=15,
        )
        with self.assertRaises(IntegrityError):
            self.db.add(audit_2)
            self.db.commit()

        self.db.rollback()

    def test_check_constraints_lat_and_processing_time(self):
        """Verify check constraints for latitude range and non-negative processing time."""
        # 1. Invalid latitude (> 90.0)
        invalid_lat_audit = RecommendationAudit(
            request_id=str(uuid.uuid4()),
            user_id=self.test_user.id,
            ingredient="Tomato",
            vendor_latitude=95.0,  # Invalid
            vendor_longitude=73.8567,
            suppliers_checked=5,
            eligible_suppliers=2,
            processing_time_ms=10,
        )
        with self.assertRaises(IntegrityError):
            self.db.add(invalid_lat_audit)
            self.db.commit()
        self.db.rollback()

        # 2. Invalid processing time (< 0)
        invalid_time_audit = RecommendationAudit(
            request_id=str(uuid.uuid4()),
            user_id=self.test_user.id,
            ingredient="Tomato",
            vendor_latitude=18.5204,
            vendor_longitude=73.8567,
            suppliers_checked=5,
            eligible_suppliers=2,
            processing_time_ms=-5,  # Invalid
        )
        with self.assertRaises(IntegrityError):
            self.db.add(invalid_time_audit)
            self.db.commit()
        self.db.rollback()

    def test_audit_listing_and_filtering(self):
        """Verify listing and filtering audits by ingredient."""
        ingredient_tag = f"SpecialIng_{uuid.uuid4().hex[:6]}"
        for i in range(3):
            audit = RecommendationAudit(
                request_id=str(uuid.uuid4()),
                user_id=self.test_user.id,
                ingredient=ingredient_tag,
                vendor_latitude=18.5204,
                vendor_longitude=73.8567,
                suppliers_checked=10 + i,
                eligible_suppliers=5 + i,
                processing_time_ms=15,
            )
            RecommendationAuditRepository.create(self.db, audit)

        items = RecommendationAuditRepository.list_audits(
            self.db, ingredient=ingredient_tag, limit=10
        )
        self.assertEqual(len(items), 3)

        count = RecommendationAuditRepository.count_audits(
            self.db, ingredient=ingredient_tag
        )
        self.assertEqual(count, 3)

    def test_end_to_end_recommendation_audit_trace(self):
        """
        Verify that calling POST /recommend:
        1. Returns X-Request-ID header and metadata.request_id.
        2. Automatically logs an audit trace record in recommendation_audits.
        3. Allows querying GET /recommend/audits/{request_id}.
        """
        custom_req_id = f"trace_{uuid.uuid4().hex[:12]}"
        payload = {
            "ingredient": "Potato",
            "latitude": 18.5204,
            "longitude": 73.8567,
        }

        response = self.client.post(
            "/recommend",
            json=payload,
            headers={"X-Request-ID": custom_req_id},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Check response metadata and headers
        self.assertIn("X-Request-ID", response.headers)
        self.assertEqual(response.headers["X-Request-ID"], custom_req_id)
        self.assertEqual(data["metadata"]["request_id"], custom_req_id)
        self.assertEqual(data["metadata"]["api_version"], "v1")

        # Query audit trace endpoint
        trace_resp = self.client.get(f"/recommend/audits/{custom_req_id}")
        self.assertEqual(trace_resp.status_code, status.HTTP_200_OK)
        trace_data = trace_resp.json()

        self.assertEqual(trace_data["request_id"], custom_req_id)
        self.assertEqual(trace_data["ingredient"], "Potato")
        self.assertEqual(trace_data["user_id"], self.test_user.id)
        self.assertEqual(trace_data["model_version"], data["metadata"]["model_version"])
        self.assertEqual(trace_data["suppliers_checked"], data["metadata"]["suppliers_checked"])
        self.assertEqual(trace_data["eligible_suppliers"], data["metadata"]["eligible_suppliers"])

        if data.get("best_supplier"):
            self.assertEqual(trace_data["selected_supplier_id"], data["best_supplier"]["supplier_id"])
            self.assertEqual(trace_data["match_score"], data["best_supplier"]["match_score"])

    def test_get_audit_trace_not_found(self):
        """Verify that querying a non-existent request_id returns 404."""
        unknown_id = f"unknown_{uuid.uuid4().hex}"
        response = self.client.get(f"/recommend/audits/{unknown_id}")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


if __name__ == "__main__":
    unittest.main()
