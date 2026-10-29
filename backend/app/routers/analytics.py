from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models import (
    Patient, Doctor, Bed, Admission, Appointment,
    PharmacyInventory, Billing, Payment, Department, Employee
)
from app.schemas import DashboardStats

router = APIRouter(prefix="/analytics", tags=["Analytics & System Metrics"])

@router.get("/dashboard", response_model=DashboardStats)
def get_dashboard_metrics(db: Session = Depends(get_db)):
    """
    High-level aggregation metrics computed directly via SQL aggregate functions.
    """
    total_patients = db.query(func.count(Patient.patient_id)).scalar() or 0
    total_doctors = db.query(func.count(Doctor.doctor_id)).scalar() or 0

    total_beds = db.query(func.count(Bed.bed_id)).scalar() or 0
    occupied_beds = db.query(func.count(Bed.bed_id)).filter(Bed.status == 'Occupied').scalar() or 0
    available_beds = db.query(func.count(Bed.bed_id)).filter(Bed.status == 'Available').scalar() or 0

    occupancy_rate = round((occupied_beds / total_beds * 100), 2) if total_beds > 0 else 0.0

    scheduled_appts = db.query(func.count(Appointment.appointment_id)).filter(
        Appointment.status == 'Scheduled'
    ).scalar() or 0

    completed_appts = db.query(func.count(Appointment.appointment_id)).filter(
        Appointment.status == 'Completed'
    ).scalar() or 0

    low_stock = db.query(func.count(PharmacyInventory.inventory_id)).filter(
        PharmacyInventory.quantity_in_stock <= PharmacyInventory.reorder_level
    ).scalar() or 0

    revenue_collected = db.query(
        func.coalesce(func.sum(Payment.amount_paid), 0)
    ).filter(Payment.transaction_status == 'Success').scalar() or 0

    total_billed = db.query(
        func.coalesce(func.sum(Billing.total_amount), 0)
    ).scalar() or 0

    pending_revenue = max(0.0, float(total_billed) - float(revenue_collected))

    return DashboardStats(
        total_patients=total_patients,
        total_doctors=total_doctors,
        total_beds=total_beds,
        occupied_beds=occupied_beds,
        available_beds=available_beds,
        bed_occupancy_rate=occupancy_rate,
        scheduled_appointments=scheduled_appts,
        completed_appointments=completed_appts,
        low_stock_medicines=low_stock,
        total_revenue_collected=float(revenue_collected),
        pending_revenue=round(pending_revenue, 2)
    )

@router.get("/department-distribution")
def get_department_distribution(db: Session = Depends(get_db)):
    """
    Doctor count distribution per department for charting.
    """
    rows = db.query(
        Department.name,
        func.count(Doctor.doctor_id).label("doctor_count")
    ).join(Employee, Department.department_id == Employee.department_id
    ).join(Doctor, Employee.employee_id == Doctor.doctor_id
    ).group_by(Department.name).all()

    return [{"department": r.name, "count": r.doctor_count} for r in rows]
