from typing import List, Optional
from datetime import datetime
from decimal import Decimal
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.models import (
    Medicine, PharmacyInventory, PharmacyBill, PharmacyBillItem,
    PharmacyPayment, Patient, Doctor, Employee, Prescription, PrescriptionItem,
    Consultation, Appointment
)
from app.schemas import (
    MedicineResponse, MedicineCreate, PharmacyInventoryResponse, RestockRequest,
    PharmacyBillCreate, PharmacyBillResponse, PharmacyBillDetailResponse,
    PharmacyBillItemDetail, PharmacyPaymentCreate, PharmacyPaymentResponse
)
from app.services.hospital_services import PharmacyService, PharmacyBillingService

router = APIRouter(prefix="/pharmacy", tags=["Pharmacy & Dispensary"])

@router.get("/medicines", response_model=List[MedicineResponse])
def get_medicines(
    search: Optional[str] = Query(None, description="Search medicine name or manufacturer"),
    form: Optional[str] = Query(None, description="Filter by form: Tablet, Capsule, Syrup, etc."),
    db: Session = Depends(get_db)
):
    query = db.query(Medicine)
    if search:
        query = query.filter(
            (Medicine.name.ilike(f"%{search}%")) |
            (Medicine.manufacturer.ilike(f"%{search}%"))
        )
    if form:
        query = query.filter(Medicine.form == form)

    rows = query.order_by(Medicine.name).all()
    return [
        MedicineResponse(
            medicine_id=m.medicine_id,
            name=m.name,
            strength=m.strength,
            form=m.form,
            unit_price=float(m.unit_price),
            manufacturer=m.manufacturer
        )
        for m in rows
    ]

@router.post("/medicines", response_model=MedicineResponse, status_code=status.HTTP_201_CREATED)
def add_new_medicine(data: MedicineCreate, db: Session = Depends(get_db)):
    """
    Add a new pharmaceutical product and initialize its dispensary inventory.
    """
    # Check duplicate
    existing = db.query(Medicine).filter(
        Medicine.name == data.name,
        Medicine.strength == data.strength
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Medicine '{data.name} ({data.strength})' already exists in formulary.")

    try:
        med = Medicine(
            name=data.name,
            strength=data.strength,
            form=data.form,
            unit_price=Decimal(str(data.unit_price)),
            manufacturer=data.manufacturer
        )
        db.add(med)
        db.flush()

        unit_cost = Decimal(str(data.unit_cost)) if data.unit_cost else round(Decimal(str(data.unit_price)) * Decimal('0.60'), 2)

        inv = PharmacyInventory(
            medicine_id=med.medicine_id,
            quantity_in_stock=data.initial_quantity,
            reorder_level=data.reorder_level,
            unit_cost=unit_cost,
            last_restocked=datetime.now()
        )
        db.add(inv)
        db.commit()
        db.refresh(med)

        return MedicineResponse(
            medicine_id=med.medicine_id,
            name=med.name,
            strength=med.strength,
            form=med.form,
            unit_price=float(med.unit_price),
            manufacturer=med.manufacturer
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to add medicine: {str(e)}")

@router.get("/inventory", response_model=List[PharmacyInventoryResponse])
def get_inventory(
    low_stock_only: bool = Query(False, description="Filter medicines that are at or below reorder level"),
    db: Session = Depends(get_db)
):
    """
    Pharmacy Stock Grid with low-stock warning indicators.
    """
    query = db.query(
        PharmacyInventory.inventory_id,
        PharmacyInventory.medicine_id,
        Medicine.name,
        Medicine.strength,
        Medicine.form,
        Medicine.unit_price,
        PharmacyInventory.quantity_in_stock,
        PharmacyInventory.reorder_level,
        PharmacyInventory.unit_cost,
        PharmacyInventory.last_restocked
    ).join(Medicine, PharmacyInventory.medicine_id == Medicine.medicine_id)

    if low_stock_only:
        query = query.filter(PharmacyInventory.quantity_in_stock <= PharmacyInventory.reorder_level)

    rows = query.order_by(PharmacyInventory.quantity_in_stock.asc()).all()
    return [
        PharmacyInventoryResponse(
            inventory_id=r.inventory_id,
            medicine_id=r.medicine_id,
            name=r.name,
            strength=r.strength,
            form=r.form,
            unit_price=float(r.unit_price),
            quantity_in_stock=r.quantity_in_stock,
            reorder_level=r.reorder_level,
            unit_cost=float(r.unit_cost),
            is_low_stock=(r.quantity_in_stock <= r.reorder_level),
            last_restocked=r.last_restocked
        )
        for r in rows
    ]

@router.put("/inventory/{medicine_id}/restock", response_model=PharmacyInventoryResponse)
def restock_inventory(medicine_id: int, data: RestockRequest, db: Session = Depends(get_db)):
    """
    ATOMIC TRANSACTION: Safely restocks medicine quantity.
    """
    inv = PharmacyService.restock(medicine_id, data, db)
    med = db.query(Medicine).filter(Medicine.medicine_id == medicine_id).first()
    return PharmacyInventoryResponse(
        inventory_id=inv.inventory_id,
        medicine_id=inv.medicine_id,
        name=med.name,
        strength=med.strength,
        form=med.form,
        unit_price=float(med.unit_price),
        quantity_in_stock=inv.quantity_in_stock,
        reorder_level=inv.reorder_level,
        unit_cost=float(inv.unit_cost),
        is_low_stock=(inv.quantity_in_stock <= inv.reorder_level),
        last_restocked=inv.last_restocked
    )

# ------------------------------------------------------------------------------
# Dedicated Pharmacy Dispensing & Billing Endpoints
# ------------------------------------------------------------------------------
@router.post("/bills", response_model=PharmacyBillResponse, status_code=status.HTTP_201_CREATED)
def create_pharmacy_bill(data: PharmacyBillCreate, db: Session = Depends(get_db)):
    """
    Issue a new pharmacy bill: Atomically verifies stock, deducts dispensed quantities,
    computes line items, and records invoice.
    """
    bill = PharmacyBillingService.create_bill(data, db)
    return get_pharmacy_bill_by_id(bill.pharmacy_bill_id, db)

@router.get("/bills", response_model=List[PharmacyBillResponse])
def get_pharmacy_bills(
    patient_id: Optional[int] = Query(None, description="Filter by Patient ID"),
    payment_status: Optional[str] = Query(None, description="Filter by status (Paid, Pending)"),
    db: Session = Depends(get_db)
):
    """
    List pharmacy dispensing bills with item counts and patient details.
    """
    query = db.query(
        PharmacyBill.pharmacy_bill_id,
        PharmacyBill.patient_id,
        Patient.name.label("patient_name"),
        Patient.phone.label("patient_phone"),
        PharmacyBill.doctor_id,
        Employee.name.label("doctor_name"),
        PharmacyBill.prescription_id,
        PharmacyBill.subtotal,
        PharmacyBill.tax_amount,
        PharmacyBill.total_amount,
        PharmacyBill.payment_status,
        PharmacyBill.bill_date,
        func.count(PharmacyBillItem.bill_item_id).label("items_count")
    ).join(Patient, PharmacyBill.patient_id == Patient.patient_id
    ).outerjoin(Doctor, PharmacyBill.doctor_id == Doctor.doctor_id
    ).outerjoin(Employee, Doctor.doctor_id == Employee.employee_id
    ).outerjoin(PharmacyBillItem, PharmacyBill.pharmacy_bill_id == PharmacyBillItem.pharmacy_bill_id
    ).group_by(PharmacyBill.pharmacy_bill_id)

    if patient_id:
        query = query.filter(PharmacyBill.patient_id == patient_id)
    if payment_status:
        query = query.filter(PharmacyBill.payment_status == payment_status)

    rows = query.order_by(PharmacyBill.bill_date.desc()).all()
    return [
        PharmacyBillResponse(
            pharmacy_bill_id=r.pharmacy_bill_id,
            patient_id=r.patient_id,
            patient_name=r.patient_name,
            patient_phone=r.patient_phone,
            doctor_id=r.doctor_id,
            doctor_name=r.doctor_name,
            prescription_id=r.prescription_id,
            subtotal=float(r.subtotal),
            tax_amount=float(r.tax_amount),
            total_amount=float(r.total_amount),
            payment_status=r.payment_status,
            bill_date=r.bill_date,
            items_count=r.items_count
        )
        for r in rows
    ]

@router.get("/bills/{bill_id}", response_model=PharmacyBillDetailResponse)
def get_pharmacy_bill_by_id(bill_id: int, db: Session = Depends(get_db)):
    """
    Get full pharmacy invoice breakdown including line items and medicines.
    """
    b = db.query(
        PharmacyBill.pharmacy_bill_id,
        PharmacyBill.patient_id,
        Patient.name.label("patient_name"),
        Patient.phone.label("patient_phone"),
        PharmacyBill.doctor_id,
        Employee.name.label("doctor_name"),
        PharmacyBill.prescription_id,
        PharmacyBill.subtotal,
        PharmacyBill.tax_amount,
        PharmacyBill.total_amount,
        PharmacyBill.payment_status,
        PharmacyBill.bill_date
    ).join(Patient, PharmacyBill.patient_id == Patient.patient_id
    ).outerjoin(Doctor, PharmacyBill.doctor_id == Doctor.doctor_id
    ).outerjoin(Employee, Doctor.doctor_id == Employee.employee_id
    ).filter(PharmacyBill.pharmacy_bill_id == bill_id).first()

    if not b:
        raise HTTPException(status_code=404, detail="Pharmacy invoice not found")

    items_rows = db.query(
        PharmacyBillItem.bill_item_id,
        PharmacyBillItem.medicine_id,
        Medicine.name.label("medicine_name"),
        Medicine.strength,
        Medicine.form,
        PharmacyBillItem.quantity,
        PharmacyBillItem.unit_price,
        PharmacyBillItem.total_price
    ).join(Medicine, PharmacyBillItem.medicine_id == Medicine.medicine_id
    ).filter(PharmacyBillItem.pharmacy_bill_id == bill_id).all()

    items = [
        PharmacyBillItemDetail(
            bill_item_id=it.bill_item_id,
            medicine_id=it.medicine_id,
            medicine_name=it.medicine_name,
            strength=it.strength,
            form=it.form,
            quantity=it.quantity,
            unit_price=float(it.unit_price),
            total_price=float(it.total_price)
        )
        for it in items_rows
    ]

    return PharmacyBillDetailResponse(
        pharmacy_bill_id=b.pharmacy_bill_id,
        patient_id=b.patient_id,
        patient_name=b.patient_name,
        patient_phone=b.patient_phone,
        doctor_id=b.doctor_id,
        doctor_name=b.doctor_name,
        prescription_id=b.prescription_id,
        subtotal=float(b.subtotal),
        tax_amount=float(b.tax_amount),
        total_amount=float(b.total_amount),
        payment_status=b.payment_status,
        bill_date=b.bill_date,
        items_count=len(items),
        items=items
    )

@router.get("/prescriptions/patient/{patient_id}")
def get_patient_prescriptions(patient_id: int, db: Session = Depends(get_db)):
    """
    Fetch active prescriptions for a patient to autofill into pharmacy billing.
    """
    prescriptions = db.query(
        Prescription.prescription_id,
        Prescription.issue_date,
        Prescription.instructions,
        Appointment.appointment_id,
        Appointment.doctor_id,
        Employee.name.label("doctor_name")
    ).join(Consultation, Prescription.consultation_id == Consultation.consultation_id
    ).join(Appointment, Consultation.appointment_id == Appointment.appointment_id
    ).join(Doctor, Appointment.doctor_id == Doctor.doctor_id
    ).join(Employee, Doctor.doctor_id == Employee.employee_id
    ).filter(Appointment.patient_id == patient_id
    ).order_by(Prescription.issue_date.desc()).all()

    result = []
    for rx in prescriptions:
        items = db.query(
            PrescriptionItem.prescription_item_id,
            PrescriptionItem.medicine_id,
            Medicine.name.label("medicine_name"),
            Medicine.strength,
            Medicine.form,
            Medicine.unit_price,
            PrescriptionItem.dosage,
            PrescriptionItem.frequency,
            PrescriptionItem.duration,
            PharmacyInventory.quantity_in_stock
        ).join(Medicine, PrescriptionItem.medicine_id == Medicine.medicine_id
        ).outerjoin(PharmacyInventory, Medicine.medicine_id == PharmacyInventory.medicine_id
        ).filter(PrescriptionItem.prescription_id == rx.prescription_id).all()

        result.append({
            "prescription_id": rx.prescription_id,
            "issue_date": rx.issue_date,
            "instructions": rx.instructions,
            "doctor_id": rx.doctor_id,
            "doctor_name": rx.doctor_name,
            "items": [
                {
                    "prescription_item_id": it.prescription_item_id,
                    "medicine_id": it.medicine_id,
                    "medicine_name": it.medicine_name,
                    "strength": it.strength,
                    "form": it.form,
                    "unit_price": float(it.unit_price),
                    "dosage": it.dosage,
                    "frequency": it.frequency,
                    "duration": it.duration,
                    "quantity_in_stock": it.quantity_in_stock or 0
                }
                for it in items
            ]
        })

    return result
