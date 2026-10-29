import unittest
from datetime import date
from fastapi.testclient import TestClient
from app.main import app

class TestNewFeatures(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_add_doctor(self):
        doc_data = {
            "name": "Dr. Rohit Deshpande",
            "email": "dr.rohit.test@hospital.org",
            "phone": "9876543210",
            "salary": 200000.0,
            "dob": "1984-06-15",
            "gender": "Male",
            "qualification": "MBBS, MS (General Surgery)",
            "shift": "Morning",
            "street_address": "12 Nariman Point",
            "pincode": "400001",
            "department_id": 6,
            "license_number": "MCI-SURG-TEST-9999",
            "specialisation": "General & Laparoscopic Surgery",
            "experience_years": 12,
            "consultation_fee": 1000.0
        }
        res = self.client.post("/api/doctors", json=doc_data)
        self.assertIn(res.status_code, [201, 400]) # 400 if already created in earlier test
        if res.status_code == 201:
            print("Successfully registered doctor:", res.json()["name"])

    def test_add_medicine(self):
        med_data = {
            "name": "Doxycycline Hyclate",
            "strength": "100 mg",
            "form": "Capsule",
            "unit_price": 18.50,
            "manufacturer": "Sun Pharma Ltd",
            "initial_quantity": 250,
            "reorder_level": 30
        }
        res = self.client.post("/api/pharmacy/medicines", json=med_data)
        self.assertIn(res.status_code, [201, 400])
        if res.status_code == 201:
            print("Successfully added medicine:", res.json()["name"])

    def test_pharmacy_billing_and_inventory_deduction(self):
        # 1. Fetch current stock of medicine ID 1
        inv_before = self.client.get("/api/pharmacy/inventory").json()
        item1 = next(i for i in inv_before if i["medicine_id"] == 1)
        initial_stock = item1["quantity_in_stock"]

        # 2. Issue a pharmacy bill dispensing 5 units of medicine 1
        bill_data = {
            "patient_id": 1,
            "doctor_id": 1,
            "items": [
                {"medicine_id": 1, "quantity": 5}
            ],
            "payment_method": "Cash",
            "amount_paid": 50.0
        }
        res = self.client.post("/api/pharmacy/bills", json=bill_data)
        self.assertEqual(res.status_code, 201)
        bill = res.json()
        self.assertGreater(bill["total_amount"], 0)
        self.assertEqual(bill["payment_status"], "Paid")
        print("Issued pharmacy bill ID:", bill["pharmacy_bill_id"], "Total:", bill["total_amount"])

        # 3. Verify that stock was decremented by exactly 5
        inv_after = self.client.get("/api/pharmacy/inventory").json()
        item1_after = next(i for i in inv_after if i["medicine_id"] == 1)
        self.assertEqual(item1_after["quantity_in_stock"], initial_stock - 5)
        print(f"Verified stock deduction: {initial_stock} -> {item1_after['quantity_in_stock']} (-5 units)")

    def test_insufficient_stock_rejection(self):
        # Attempt to dispense 99999 units (exceeding stock)
        bill_data = {
            "patient_id": 1,
            "items": [
                {"medicine_id": 1, "quantity": 999999}
            ]
        }
        res = self.client.post("/api/pharmacy/bills", json=bill_data)
        self.assertEqual(res.status_code, 400)
        self.assertIn("Insufficient stock", res.json()["detail"])
        print("Verified stock safety: Insufficient stock correctly rejected with error:", res.json()["detail"])

    def test_patient_prescriptions(self):
        res = self.client.get("/api/pharmacy/prescriptions/patient/1")
        self.assertEqual(res.status_code, 200)
        print("Fetched patient prescriptions count:", len(res.json()))

if __name__ == "__main__":
    unittest.main()
