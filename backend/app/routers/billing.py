from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Billing, Payment, Patient
from app.schemas import BillingResponse, PaymentCreate, PaymentResponse
from app.services.hospital_services import BillingService

router = APIRouter(prefix="/billing", tags=["Billing & Payments"])

@router.get("", response_model=List[BillingResponse])
def get_bills(
    patient_id: Optional[int] = Query(None, description="Filter by patient ID"),
    payment_status: Optional[str] = Query(None, description="Filter by status: Pending, Partially_Paid, Paid"),
    db: Session = Depends(get_db)
):
    query = db.query(
        Billing.billing_id,
        Billing.patient_id,
        Patient.name.label("patient_name"),
        Billing.appointment_id,
        Billing.admission_id,
        Billing.consultation_fee,
        Billing.bed_charges,
        Billing.pharmacy_charges,
        Billing.other_charges,
        Billing.total_amount,
        Billing.payment_status,
        Billing.billing_date
    ).join(Patient, Billing.patient_id == Patient.patient_id)

    if patient_id:
        query = query.filter(Billing.patient_id == patient_id)
    if payment_status:
        query = query.filter(Billing.payment_status == payment_status)

    rows = query.order_by(Billing.billing_date.desc()).all()
    return [
        BillingResponse(
            billing_id=r.billing_id,
            patient_id=r.patient_id,
            patient_name=r.patient_name,
            appointment_id=r.appointment_id,
            admission_id=r.admission_id,
            consultation_fee=float(r.consultation_fee),
            bed_charges=float(r.bed_charges),
            pharmacy_charges=float(r.pharmacy_charges),
            other_charges=float(r.other_charges),
            total_amount=float(r.total_amount),
            payment_status=r.payment_status,
            billing_date=r.billing_date
        )
        for r in rows
    ]

@router.get("/payments", response_model=List[PaymentResponse])
def get_payments(
    billing_id: Optional[int] = Query(None, description="Filter payments by billing ID"),
    db: Session = Depends(get_db)
):
    query = db.query(Payment)
    if billing_id:
        query = query.filter(Payment.billing_id == billing_id)
    rows = query.order_by(Payment.payment_time.desc()).all()
    return [
        PaymentResponse(
            transaction_id=p.transaction_id,
            billing_id=p.billing_id,
            payment_time=p.payment_time,
            amount_paid=float(p.amount_paid),
            payment_method=p.payment_method,
            transaction_status=p.transaction_status,
            reference_number=p.reference_number
        )
        for p in rows
    ]

@router.post("/payments", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def record_payment(data: PaymentCreate, db: Session = Depends(get_db)):
    """
    AUDITED FINANCIAL TRANSACTION:
    Records payment and automatically updates billing payment_status (Paid / Partially_Paid).
    """
    pmt = BillingService.process_payment(data, db)
    return PaymentResponse(
        transaction_id=pmt.transaction_id,
        billing_id=pmt.billing_id,
        payment_time=pmt.payment_time,
        amount_paid=float(pmt.amount_paid),
        payment_method=pmt.payment_method,
        transaction_status=pmt.transaction_status,
        reference_number=pmt.reference_number
    )
