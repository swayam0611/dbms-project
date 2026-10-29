import unittest
from fastapi.testclient import TestClient
from app.main import app

class TestHospitalAPI(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_health(self):
        res = self.client.get("/health")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "healthy")

    def test_dashboard_metrics(self):
        res = self.client.get("/api/analytics/dashboard")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertGreater(data["total_patients"], 0)
        self.assertGreater(data["total_doctors"], 0)
        self.assertGreater(data["total_beds"], 0)
        print("Dashboard Metrics:", data)

    def test_filter_doctors_by_department(self):
        res = self.client.get("/api/doctors?department_id=1")
        self.assertEqual(res.status_code, 200)
        docs = res.json()
        self.assertTrue(all(d["department_id"] == 1 for d in docs))
        print(f"Found {len(docs)} Cardiology doctors.")

    def test_filter_appointments(self):
        res = self.client.get("/api/appointments?status=Scheduled")
        self.assertEqual(res.status_code, 200)
        appts = res.json()
        self.assertTrue(all(a["status"] == "Scheduled" for a in appts))
        print(f"Found {len(appts)} scheduled appointments.")

    def test_bed_grid(self):
        res = self.client.get("/api/hospitals/beds?status=Available")
        self.assertEqual(res.status_code, 200)
        beds = res.json()
        self.assertTrue(all(b["status"] == "Available" for b in beds))
        print(f"Found {len(beds)} available beds.")

    def test_pharmacy_inventory(self):
        res = self.client.get("/api/pharmacy/inventory")
        self.assertEqual(res.status_code, 200)
        items = res.json()
        self.assertGreater(len(items), 20)
        print(f"Found {len(items)} pharmacy items in stock.")

if __name__ == "__main__":
    unittest.main()
