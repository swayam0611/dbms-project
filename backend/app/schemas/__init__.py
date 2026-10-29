from datetime import date, time, datetime
from typing import Optional, List
from decimal import Decimal
from pydantic import BaseModel, EmailStr, Field

# ------------------------------------------------------------------------------
# Pincode & Infrastructure Schemas
# ------------------------------------------------------------------------------
class PincodeBase(BaseModel):
    pincode: str
    city: str
    state: str

class PincodeResponse(PincodeBase):
    class Config:
        from_attributes = True

class DepartmentResponse(BaseModel):
    department_id: int
    hospital_id: int
    name: str
    location: str
    contact_no: str

    class Config:
        from_attributes = True

class WardResponse(BaseModel):
    ward_id: int
    hospital_id: int
    name: str
    type: str
    location: str

    class Config:
        from_attributes = True

class BedResponse(BaseModel):
    bed_id: int
    room_id: int
    bed_number: str
    bed_type: str
    status: str
    room_number: Optional[str] = None
    ward_name: Optional[str] = None
    floor: Optional[int] = None

    class Config:
        from_attributes = True

# ------------------------------------------------------------------------------
# Employee & Doctor Schemas
# ------------------------------------------------------------------------------
class DoctorCreate(BaseModel):
    name: str
    email: str
    phone: str
    salary: float = 180000.00
    dob: date
    gender: str
    joining_date: Optional[date] = None
    qualification: str
    shift: str = "Morning"
    street_address: str
    pincode: str
    department_id: int
    license_number: str
    specialisation: str
    experience_years: int = 0
    consultation_fee: float = 800.00

class DoctorSummaryResponse(BaseModel):
    doctor_id: int
    name: str
    email: str
    phone: str
    department_id: int
    department_name: str
    license_number: str
    specialisation: str
    experience_years: int
    consultation_fee: float
    shift: str

    class Config:
        from_attributes = True

# ------------------------------------------------------------------------------
# Patient & Medical History Schemas
# ------------------------------------------------------------------------------
class EmergencyContactCreate(BaseModel):
    name: str
    relation: str
    phone: str

class EmergencyContactResponse(EmergencyContactCreate):
    contact_id: int
    class Config:
        from_attributes = True

class AllergyCreate(BaseModel):
    allergen: str
    reaction: str
    severity: str

class AllergyResponse(AllergyCreate):
    allergy_id: int
    class Config:
        from_attributes = True

class PatientCreate(BaseModel):
    name: str
    gender: str
    blood_group: str
    aadhaar_no: str
    dob: date
    email: Optional[str] = None
    phone: str
    street_address: str
    pincode: str
    emergency_contact: Optional[EmergencyContactCreate] = None
    allergies: Optional[List[AllergyCreate]] = []

class PatientResponse(BaseModel):
    patient_id: int
    name: str
    gender: str
    blood_group: str
    aadhaar_no: str
    dob: date
    email: Optional[str] = None
    phone: str
    street_address: str
    pincode: str
    city: Optional[str] = None
    state: Optional[str] = None
    registered_at: datetime

    class Config:
        from_attributes = True

# ------------------------------------------------------------------------------
# Appointment Schemas (with filtering & concurrency protection)
# ------------------------------------------------------------------------------
class AppointmentCreate(BaseModel):
    patient_id: int
    doctor_id: int
    appointment_date: date
    appointment_time: time
    reason_for_visit: str

class AppointmentResponse(BaseModel):
    appointment_id: int
    patient_id: int
    patient_name: str
    patient_phone: str
    doctor_id: int
    doctor_name: str
    specialisation: str
    department_name: str
    appointment_date: date
    appointment_time: str
    reason_for_visit: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# ------------------------------------------------------------------------------
# Admission Schemas (Atomic Bed Allocation & Release)
# ------------------------------------------------------------------------------
class AdmissionCreate(BaseModel):
    patient_id: int
    bed_id: int
    admit_date: Optional[datetime] = None

class AdmissionDischarge(BaseModel):
    discharge_summary: str

class AdmissionResponse(BaseModel):
    admission_id: int
    patient_id: int
    patient_name: str
    bed_id: int
    bed_number: str
    room_number: str
    ward_name: str
    admit_date: datetime
    discharge_date: Optional[datetime] = None
    status: str
    discharge_summary: Optional[str] = None

    class Config:
        from_attributes = True

# ------------------------------------------------------------------------------
# Clinical Consultation, Diagnosis & Prescription Schemas
# ------------------------------------------------------------------------------
class DiagnosisCreate(BaseModel):
    icd_code: str
    severity: str
    remarks: Optional[str] = None

class PrescriptionItemCreate(BaseModel):
    medicine_id: int
    dosage: str
    frequency: str
    duration: str
    instructions: Optional[str] = None

class ConsultationCreate(BaseModel):
    appointment_id: int
    symptoms: str
    clinical_notes: Optional[str] = None
    diagnoses: List[DiagnosisCreate] = []
    prescriptions: Optional[List[PrescriptionItemCreate]] = []

class DiseaseResponse(BaseModel):
    icd_code: str
    disease_name: str
    category: str
    description: Optional[str] = None

    class Config:
        from_attributes = True

# ------------------------------------------------------------------------------
# Pharmacy Inventory & Dispensing Schemas
# ------------------------------------------------------------------------------
class MedicineCreate(BaseModel):
    name: str
    strength: str
    form: str = "Tablet"
    unit_price: float = Field(..., gt=0)
    manufacturer: str
    initial_quantity: int = Field(100, ge=0)
    reorder_level: int = Field(20, ge=1)
    unit_cost: Optional[float] = None

class MedicineResponse(BaseModel):
    medicine_id: int
    name: str
    strength: str
    form: str
    unit_price: float
    manufacturer: str

    class Config:
        from_attributes = True

class PharmacyInventoryResponse(BaseModel):
    inventory_id: int
    medicine_id: int
    name: str
    strength: str
    form: str
    unit_price: float
    quantity_in_stock: int
    reorder_level: int
    unit_cost: float
    is_low_stock: bool
    last_restocked: Optional[datetime] = None

    class Config:
        from_attributes = True

class RestockRequest(BaseModel):
    quantity: int = Field(..., gt=0, description="Quantity to add to inventory")

# ------------------------------------------------------------------------------
# Pharmacy Billing & Dispensing Schemas
# ------------------------------------------------------------------------------
class PharmacyBillItemInput(BaseModel):
    medicine_id: int
    quantity: int = Field(..., gt=0)

class PharmacyBillCreate(BaseModel):
    patient_id: int
    doctor_id: Optional[int] = None
    prescription_id: Optional[int] = None
    items: List[PharmacyBillItemInput]
    payment_method: str = "Cash"
    amount_paid: Optional[float] = None
    reference_number: Optional[str] = None

class PharmacyBillItemDetail(BaseModel):
    bill_item_id: int
    medicine_id: int
    medicine_name: str
    strength: str
    form: str
    quantity: int
    unit_price: float
    total_price: float

    class Config:
        from_attributes = True

class PharmacyBillResponse(BaseModel):
    pharmacy_bill_id: int
    patient_id: int
    patient_name: str
    patient_phone: str
    doctor_id: Optional[int] = None
    doctor_name: Optional[str] = None
    prescription_id: Optional[int] = None
    subtotal: float
    tax_amount: float
    total_amount: float
    payment_status: str
    bill_date: datetime
    items_count: int

    class Config:
        from_attributes = True

class PharmacyBillDetailResponse(PharmacyBillResponse):
    items: List[PharmacyBillItemDetail] = []

class PharmacyPaymentCreate(BaseModel):
    amount_paid: float = Field(..., gt=0)
    payment_method: str
    reference_number: Optional[str] = None

class PharmacyPaymentResponse(BaseModel):
    payment_id: int
    pharmacy_bill_id: int
    payment_time: datetime
    amount_paid: float
    payment_method: str
    reference_number: Optional[str] = None

    class Config:
        from_attributes = True

# ------------------------------------------------------------------------------
# Billing & Payment Schemas
# ------------------------------------------------------------------------------
class BillingResponse(BaseModel):
    billing_id: int
    patient_id: int
    patient_name: str
    appointment_id: Optional[int] = None
    admission_id: Optional[int] = None
    consultation_fee: float
    bed_charges: float
    pharmacy_charges: float
    other_charges: float
    total_amount: float
    payment_status: str
    billing_date: datetime

    class Config:
        from_attributes = True

class PaymentCreate(BaseModel):
    billing_id: int
    amount_paid: float = Field(..., gt=0)
    payment_method: str
    reference_number: Optional[str] = None

class PaymentResponse(BaseModel):
    transaction_id: int
    billing_id: int
    payment_time: datetime
    amount_paid: float
    payment_method: str
    transaction_status: str
    reference_number: Optional[str] = None

    class Config:
        from_attributes = True

# ------------------------------------------------------------------------------
# System Analytics & Dashboard Schemas
# ------------------------------------------------------------------------------
class DashboardStats(BaseModel):
    total_patients: int
    total_doctors: int
    total_beds: int
    occupied_beds: int
    available_beds: int
    bed_occupancy_rate: float
    scheduled_appointments: int
    completed_appointments: int
    low_stock_medicines: int
    total_revenue_collected: float
    pending_revenue: float
