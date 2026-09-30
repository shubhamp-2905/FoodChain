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
from app.models.supplier_inventory import SupplierInventory

mock_user = User(
    id=1,
    full_name="Test Vendor",
    email="test@foodchain.ai",
    mobile_number="1234567890",
    business_name="Test Business",
    food_type="Street Food",
    latitude=18.5204,
    longitude=73.8567,
    area="Shivajinagar",
    city="Pune",
    state="Maharashtra",
)


class TestSupplierOnboardingAPI(unittest.TestCase):
    def setUp(self):
        self.mock_db = MagicMock(spec=Session)
        app.dependency_overrides[get_current_user] = lambda: mock_user
        app.dependency_overrides[get_db] = lambda: self.mock_db
        self.client = TestClient(app)

    def tearDown(self):
        app.dependency_overrides.clear()

    @patch("app.api.suppliers.SupplierOnboardingService")
    @patch("app.api.suppliers.ProductRepository")
    @patch("app.api.suppliers.supplier_service")
    def test_onboard_supplier_success(self, mock_supplier_service, mock_prod_repo, mock_onboarding_class):
        mock_service_instance = MagicMock()
        mock_result = MagicMock()
        mock_result.success = True
        mock_service_instance.onboard_supplier.return_value = mock_result
        mock_onboarding_class.return_value = mock_service_instance

        mock_prod = Product(id=1, ingredient="Fresh Tomatoes", category="Vegetables", unit="kg")
        mock_prod_repo.get_by_ingredient.return_value = mock_prod

        mock_created_supplier = Supplier(
            id=101,
            supplier_id="SUP_REAL_TEST01",
            supplier_name="Shree Ram Trading",
            supplier_type="Wholesaler",
            market="Gultekdi Market Yard",
            area="Market Yard",
            latitude=18.4900,
            longitude=73.8600,
            rating=4.5,
            quality_score=4.3,
            reliability_score=92.0,
            delivery_radius_km=15.0,
            average_delivery_time_min=35,
        )
        mock_supplier_service.get_supplier_by_id.return_value = mock_created_supplier

        payload = {
            "supplier_name": "Shree Ram Trading",
            "supplier_type": "Wholesaler",
            "market": "Gultekdi Market Yard",
            "area": "Market Yard",
            "latitude": 18.4900,
            "longitude": 73.8600,
            "rating": 4.5,
            "quality_score": 4.3,
            "reliability_score": 92.0,
            "delivery_radius_km": 15.0,
            "average_delivery_time_min": 35,
            "ingredient": "Fresh Tomatoes",
            "category": "Vegetables",
            "price": 28.5,
            "unit": "kg",
            "stock_available": 600,
            "minimum_order": 15,
        }

        response = self.client.post("/suppliers/onboard", json=payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        self.assertEqual(data["supplier_name"], "Shree Ram Trading")
        self.assertEqual(data["area"], "Market Yard")

    @patch("app.api.suppliers.SupplierOnboardingService")
    def test_onboard_supplier_quality_rejection(self, mock_onboarding_class):
        mock_service_instance = MagicMock()
        mock_result = MagicMock()
        mock_result.success = False
        mock_result.error_message = "Price must be greater than 0"
        mock_service_instance.onboard_supplier.return_value = mock_result
        mock_onboarding_class.return_value = mock_service_instance

        payload = {
            "supplier_name": "Bad Data Supplier",
            "supplier_type": "Wholesaler",
            "market": "Market Yard",
            "area": "Market Yard",
            "latitude": 18.4900,
            "longitude": 73.8600,
            "rating": 4.0,
            "quality_score": 4.0,
            "reliability_score": 85.0,
            "delivery_radius_km": 15.0,
            "average_delivery_time_min": 45,
            "ingredient": "Potato",
            "category": "Vegetables",
            "price": 20.0,
            "unit": "kg",
            "stock_available": 100,
            "minimum_order": 5,
        }

        response = self.client.post("/suppliers/onboard", json=payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Supplier onboarding rejected by data quality pipeline", response.json()["detail"])


if __name__ == "__main__":
    unittest.main()
