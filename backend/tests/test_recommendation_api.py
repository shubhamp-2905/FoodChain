import unittest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from fastapi import status
from sqlalchemy.orm import Session

# Add backend directory to path
import os
import sys
script_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.abspath(os.path.join(script_dir, ".."))
sys.path.insert(0, backend_dir)

from app.main import app
from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.product import Product
from app.models.supplier import Supplier
from app.models.supplier_inventory import SupplierInventory

# Mock authenticated user
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
    state="Maharashtra"
)

# Mock user with no coordinates
mock_user_no_gps = User(
    id=2,
    full_name="No GPS Vendor",
    email="nogps@foodchain.ai",
    mobile_number="1234567890",
    business_name="Test Business",
    food_type="Street Food",
    latitude=None,
    longitude=None,
    area=None,
    city=None,
    state=None
)

class TestRecommendationAPI(unittest.TestCase):
    def setUp(self):
        self.mock_db = MagicMock(spec=Session)
        # Override dependencies
        app.dependency_overrides[get_current_user] = lambda: mock_user
        app.dependency_overrides[get_db] = lambda: self.mock_db
        self.client = TestClient(app)

    def tearDown(self):
        app.dependency_overrides.clear()

    @patch("app.api.recommendation.InventoryRepository.get_offerings_by_ingredient")
    def test_recommend_success(self, mock_get_offerings):
        # Mock database product query (ingredient exists)
        mock_product = Product(id=1, ingredient="Potato", category="Vegetable", unit="kg")
        self.mock_db.query.return_value.filter.return_value.first.return_value = mock_product
        
        # Mock offerings list
        mock_supplier = Supplier(
            id=1,
            supplier_id="SUPP001",
            supplier_name="Sawant Agro Traders",
            supplier_type="Vegetable Wholesaler",
            market="Shivajinagar Market",
            area="Shivajinagar",
            latitude=18.5200,
            longitude=73.8560,
            quality_score=4.8,
            rating=4.8,
            reliability_score=95.0,
            delivery_radius_km=5.0,
            average_delivery_time_min=18
        )
        mock_offering = SupplierInventory(
            id=1,
            supplier_id=1,
            product_id=1,
            price=31.19,
            stock_available=500,
            minimum_order=10,
            supplier=mock_supplier,
            product=mock_product
        )
        mock_get_offerings.return_value = [mock_offering]
        
        # Call endpoint
        response = self.client.post(
            "/recommend",
            json={"ingredient": "Potato", "latitude": 18.5204, "longitude": 73.8567}
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["ingredient"], "Potato")
        self.assertIsNotNone(data["best_supplier"])
        self.assertEqual(data["best_supplier"]["supplier_name"], "Sawant Agro Traders")
        self.assertEqual(data["best_supplier"]["match_score"], 34)
        self.assertEqual(data["metadata"]["eligible_suppliers"], 1)

    @patch("app.api.recommendation.InventoryRepository.get_offerings_by_ingredient")
    def test_recommend_coordinate_fallback(self, mock_get_offerings):
        mock_product = Product(id=1, ingredient="Potato", category="Vegetable", unit="kg")
        self.mock_db.query.return_value.filter.return_value.first.return_value = mock_product
        
        mock_supplier = Supplier(
            id=1,
            supplier_id="SUPP001",
            supplier_name="Sawant Agro Traders",
            supplier_type="Vegetable Wholesaler",
            market="Shivajinagar Market",
            area="Shivajinagar",
            latitude=18.5200,
            longitude=73.8560,
            quality_score=4.8,
            rating=4.8,
            reliability_score=95.0,
            delivery_radius_km=5.0,
            average_delivery_time_min=18
        )
        mock_offering = SupplierInventory(
            id=1,
            supplier_id=1,
            product_id=1,
            price=31.19,
            stock_available=500,
            minimum_order=10,
            supplier=mock_supplier,
            product=mock_product
        )
        mock_get_offerings.return_value = [mock_offering]
        
        # Omit coordinates, fallback to mock_user's (18.5204, 73.8567)
        response = self.client.post("/recommend", json={"ingredient": "Potato"})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["best_supplier"]["supplier_name"], "Sawant Agro Traders")

    def test_recommend_missing_gps_error(self):
        # Override to user with no GPS coordinates
        app.dependency_overrides[get_current_user] = lambda: mock_user_no_gps
        
        # Omit coords, should throw 400 Bad Request
        response = self.client.post("/recommend", json={"ingredient": "Potato"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("coordinates are missing", response.json()["detail"])

    def test_recommend_invalid_coords_error(self):
        # Out of bounds latitude
        response = self.client.post(
            "/recommend",
            json={"ingredient": "Potato", "latitude": 150.0, "longitude": 73.8567}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Invalid coordinates range", response.json()["detail"])

    def test_recommend_ingredient_not_found_error(self):
        # Mock database query to return None (ingredient does not exist)
        self.mock_db.query.return_value.filter.return_value.first.return_value = None
        
        response = self.client.post("/recommend", json={"ingredient": "Nonexistent"})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("is not available in our catalog", response.json()["detail"])

    def test_model_manager_caches_models(self):
        from app.ml.core.model_manager import ModelManager
        manager = ModelManager()
        
        # Reset cache
        manager.reload_models()
        
        # Load models
        scaler1 = manager.get_scaler()
        kmeans1 = manager.get_kmeans()
        
        # Check cache hit
        scaler2 = manager.get_scaler()
        kmeans2 = manager.get_kmeans()
        
        # Verify same instances
        self.assertIs(scaler1, scaler2)
        self.assertIs(kmeans1, kmeans2)

if __name__ == "__main__":
    unittest.main()
