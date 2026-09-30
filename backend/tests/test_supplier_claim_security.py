"""
FoodChain AI - Supplier Account Claim Endpoint Security & Ownership Tests

Tests focused on:
1. Unauthorized claim attempts (unauthenticated or vendor-role users)
2. Malicious / duplicate claim attempts (claiming another user's claimed profile)
3. Reassignment prevention (supplier attempting to switch to a different profile)
4. Idempotency (re-claiming own linked profile succeeds safely)
5. Non-existent profile claim attempts (404 Not Found)
6. Legitimate unclaimed profile claim (200 OK)
7. Normal supplier onboarding flow verification
"""

import unittest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from fastapi import status
from sqlalchemy.orm import Session

import os
import sys
script_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.abspath(os.path.join(script_dir, ".."))
sys.path.insert(0, backend_dir)

from app.main import app
from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.supplier import Supplier
from app.models.product import Product


def create_mock_supplier(supplier_id: int = 10, name: str = "Pune Wholesale Mandi") -> Supplier:
    return Supplier(
        id=supplier_id,
        supplier_id=f"SUP_MOCK_{supplier_id}",
        supplier_name=name,
        supplier_type="Wholesaler",
        market="Market Yard",
        area="Market Yard",
        latitude=18.4900,
        longitude=73.8600,
        rating=4.3,
        quality_score=4.2,
        reliability_score=90.0,
        delivery_radius_km=15.0,
        average_delivery_time_min=30,
    )


class TestSupplierClaimSecurity(unittest.TestCase):
    def setUp(self):
        self.mock_db = MagicMock(spec=Session)
        app.dependency_overrides[get_db] = lambda: self.mock_db
        self.client = TestClient(app)

    def tearDown(self):
        app.dependency_overrides.clear()

    # 1. Unauthenticated attempt -> 401 or 403 Not Authenticated
    def test_claim_unauthenticated_rejected(self):
        """Unauthenticated requests cannot claim any profile."""
        response = self.client.post("/supplier-account/claim/10")
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_claim_invalid_token_rejected_401(self):
        """Requests with an invalid token are rejected with 401."""
        response = self.client.post(
            "/supplier-account/claim/10",
            headers={"Authorization": "Bearer invalid_token_xyz"},
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # 2. Vendor account attempt -> 403 Forbidden
    def test_claim_rejected_for_vendor_role(self):
        """Vendors are forbidden from claiming supplier profiles."""
        vendor_user = User(
            id=1,
            full_name="Vendor Bob",
            email="vendor@foodchain.ai",
            mobile_number="9876543210",
            business_name="Bob Snacks",
            food_type="Street Food",
            role="vendor",
            supplier_profile_id=None,
        )
        app.dependency_overrides[get_current_user] = lambda: vendor_user

        response = self.client.post("/supplier-account/claim/10")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("restricted to supplier accounts", response.json()["detail"])

    # 3. Legitimate unclaimed profile -> 200 OK
    @patch("app.api.supplier_account.SupplierRepository.get_by_id")
    def test_claim_unclaimed_profile_success(self, mock_get_supplier):
        """An unlinked supplier can claim an existing unclaimed profile."""
        supplier_user = User(
            id=2,
            full_name="Supplier Alice",
            email="alice@foodchain.ai",
            mobile_number="9876543211",
            business_name="Alice Trading",
            food_type="Raw Ingredients",
            role="supplier",
            supplier_profile_id=None,
        )
        app.dependency_overrides[get_current_user] = lambda: supplier_user

        target_supplier = create_mock_supplier(supplier_id=10, name="Alice Trading Mandi")
        mock_get_supplier.return_value = target_supplier

        # No other user has claimed supplier_id=10
        mock_query = MagicMock()
        mock_filter = MagicMock()
        mock_filter.first.return_value = None
        mock_query.filter.return_value = mock_filter
        self.mock_db.query.return_value = mock_query

        response = self.client.post("/supplier-account/claim/10")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(supplier_user.supplier_profile_id, 10)
        self.mock_db.commit.assert_called()

    # 4. Profile not found -> 404
    @patch("app.api.supplier_account.SupplierRepository.get_by_id")
    def test_claim_nonexistent_profile_404(self, mock_get_supplier):
        """Attempting to claim a non-existent supplier profile returns 404."""
        supplier_user = User(
            id=2,
            full_name="Supplier Alice",
            email="alice@foodchain.ai",
            mobile_number="9876543211",
            business_name="Alice Trading",
            food_type="Raw Ingredients",
            role="supplier",
            supplier_profile_id=None,
        )
        app.dependency_overrides[get_current_user] = lambda: supplier_user
        mock_get_supplier.return_value = None

        response = self.client.post("/supplier-account/claim/9999")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("Supplier profile not found", response.json()["detail"])

    # 5. Malicious / Duplicate: Target profile already claimed by ANOTHER user -> 409 Conflict
    @patch("app.api.supplier_account.SupplierRepository.get_by_id")
    def test_claim_already_claimed_by_another_supplier_conflict(self, mock_get_supplier):
        """A supplier cannot steal or claim a profile that another user account owns."""
        supplier_user = User(
            id=2,
            full_name="Attacker Supplier",
            email="attacker@foodchain.ai",
            mobile_number="9876543211",
            business_name="Attacker Corp",
            food_type="Raw Ingredients",
            role="supplier",
            supplier_profile_id=None,
        )
        app.dependency_overrides[get_current_user] = lambda: supplier_user

        target_supplier = create_mock_supplier(supplier_id=10, name="Legitimate Owner Mandi")
        mock_get_supplier.return_value = target_supplier

        # Another user (id=99) is already linked to supplier_id=10
        existing_owner = User(
            id=99,
            full_name="Legit Owner",
            email="legit@foodchain.ai",
            mobile_number="9876543299",
            business_name="Legitimate Owner Mandi",
            food_type="Raw Ingredients",
            role="supplier",
            supplier_profile_id=10,
        )
        mock_query = MagicMock()
        mock_filter = MagicMock()
        mock_filter.first.return_value = existing_owner
        mock_query.filter.return_value = mock_filter
        self.mock_db.query.return_value = mock_query

        response = self.client.post("/supplier-account/claim/10")
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertIn("already been claimed by another account", response.json()["detail"])
        # Verify the attacker was NOT linked to the profile
        self.assertIsNone(supplier_user.supplier_profile_id)

    # 6. Reassignment prevention: Caller already has a profile linked -> 409 Conflict
    def test_claim_reassignment_rejected_when_user_already_linked(self):
        """A supplier account with an active profile cannot reassign or switch to another profile."""
        supplier_user = User(
            id=2,
            full_name="Supplier Alice",
            email="alice@foodchain.ai",
            mobile_number="9876543211",
            business_name="Alice Trading",
            food_type="Raw Ingredients",
            role="supplier",
            supplier_profile_id=5,  # Already linked to profile 5
        )
        app.dependency_overrides[get_current_user] = lambda: supplier_user

        response = self.client.post("/supplier-account/claim/20")
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertIn("already linked to a supplier profile", response.json()["detail"])
        self.assertIn("Reassignment is not permitted", response.json()["detail"])
        # Verify user still linked to original profile
        self.assertEqual(supplier_user.supplier_profile_id, 5)

    # 7. Idempotency: Claiming the same profile caller already owns -> 200 OK
    @patch("app.api.supplier_account.SupplierRepository.get_by_id")
    def test_claim_idempotent_for_own_profile(self, mock_get_supplier):
        """Calling claim on the profile already owned by the user succeeds idempotently."""
        supplier_user = User(
            id=2,
            full_name="Supplier Alice",
            email="alice@foodchain.ai",
            mobile_number="9876543211",
            business_name="Alice Trading",
            food_type="Raw Ingredients",
            role="supplier",
            supplier_profile_id=10,  # Already owns 10
        )
        app.dependency_overrides[get_current_user] = lambda: supplier_user

        target_supplier = create_mock_supplier(supplier_id=10, name="Alice Trading Mandi")
        mock_get_supplier.return_value = target_supplier

        response = self.client.post("/supplier-account/claim/10")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["id"], 10)
        self.assertEqual(supplier_user.supplier_profile_id, 10)

    # 8. Normal onboarding flow verification
    @patch("app.api.suppliers.SupplierOnboardingService")
    @patch("app.api.suppliers.ProductRepository")
    @patch("app.api.suppliers.supplier_service")
    def test_normal_supplier_onboarding_binds_profile(
        self, mock_supplier_service, mock_prod_repo, mock_onboarding_class
    ):
        """The standard /suppliers/onboard flow still creates and binds the profile."""
        supplier_user = User(
            id=3,
            full_name="New Supplier",
            email="newsupplier@foodchain.ai",
            mobile_number="9876543213",
            business_name="New Supplier Co",
            food_type="Raw Ingredients",
            role="supplier",
            supplier_profile_id=None,
        )
        app.dependency_overrides[get_current_user] = lambda: supplier_user

        def fake_add(obj):
            if isinstance(obj, Supplier) and getattr(obj, "id", None) is None:
                obj.id = 50
        self.mock_db.add.side_effect = fake_add

        mock_service_instance = MagicMock()
        mock_result = MagicMock()
        mock_result.success = True
        mock_service_instance.onboard_supplier.return_value = mock_result
        mock_onboarding_class.return_value = mock_service_instance

        mock_prod = Product(id=1, ingredient="Onion", category="Vegetables", unit="kg")
        mock_prod_repo.get_by_ingredient.return_value = mock_prod

        mock_created_supplier = Supplier(
            id=50,
            supplier_id="SUP_REAL_ONBOARD1",
            supplier_name="New Supplier Co",
            supplier_type="Wholesaler",
            market="Gultekdi Market Yard",
            area="Market Yard",
            latitude=18.4900,
            longitude=73.8600,
            rating=4.2,
            quality_score=4.1,
            reliability_score=88.0,
            delivery_radius_km=15.0,
            average_delivery_time_min=35,
        )
        mock_supplier_service.get_supplier_by_id.return_value = mock_created_supplier

        payload = {
            "supplier_name": "New Supplier Co",
            "supplier_type": "Wholesaler",
            "market": "Gultekdi Market Yard",
            "area": "Market Yard",
            "latitude": 18.4900,
            "longitude": 73.8600,
            "rating": 4.2,
            "quality_score": 4.1,
            "reliability_score": 88.0,
            "delivery_radius_km": 15.0,
            "average_delivery_time_min": 35,
            "ingredient": "Onion",
            "category": "Vegetables",
            "price": 22.0,
            "unit": "kg",
            "stock_available": 500,
            "minimum_order": 10,
        }

        response = self.client.post("/suppliers/onboard", json=payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # Profile should be bound to the supplier user
        self.assertEqual(supplier_user.supplier_profile_id, 50)


if __name__ == "__main__":
    unittest.main()
