from typing import List, Optional
from datetime import date, time
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Appointment, Patient, Doctor, Employee, Department
from app.schemas import AppointmentCreate, AppointmentResponse
from app.services.hospital_services import AppointmentService

router = APIRouter(prefix="/appointments", tags=["Appointments & Booking"])

@router.get("", response_model=List[AppointmentResponse])
def get_appointments(
    doctor_id: Optional[int] = Query(None, description="Filter by Doctor ID"),
    department_id: Optional[int] = Query(None, description="Filter by Department ID"),
    appointment_date: Optional[date] = Query(None, description="Filter by Appointment Date (YYYY-MM-DD)"),
    status: Optional[str] = Query(None, description="Filter by status (Scheduled, Completed, Cancelled)"),
    search: Optional[str] = Query(None, description="Search patient name"),
    db: Session = Depends(get_db)
):
    """
    Search and filter appointments by Doctor, Department, Date, and Status.
    """
    query = db.query(
        Appointment.appointment_id,
        Appointment.patient_id,
        Patient.name.label("patient_name"),
        Patient.phone.label("patient_phone"),
        Appointment.doctor_id,
        Employee.name.label("doctor_name"),
        Doctor.specialisation,
        Department.name.label("department_name"),
        Appointment.appointment_date,
        Appointment.appointment_time,
        Appointment.reason_for_visit,
        Appointment.status,
        Appointment.created_at
    ).join(Patient, Appointment.patient_id == Patient.patient_id
    ).join(Doctor, Appointment.doctor_id == Doctor.doctor_id
    ).join(Employee, Doctor.doctor_id == Employee.employee_id
    ).join(Department, Employee.department_id == Department.department_id)

    if doctor_id:
        query = query.filter(Appointment.doctor_id == doctor_id)
    if department_id:
        query = query.filter(Employee.department_id == department_id)
    if appointment_date:
        query = query.filter(Appointment.appointment_date == appointment_date)
    if status:
        query = query.filter(Appointment.status == status)
    if search:
        query = query.filter(Patient.name.ilike(f"%{search}%"))

    rows = query.order_by(Appointment.appointment_date.desc(), Appointment.appointment_time.desc()).all()
    return [
        AppointmentResponse(
            appointment_id=r.appointment_id,
            patient_id=r.patient_id,
            patient_name=r.patient_name,
            patient_phone=r.patient_phone,
            doctor_id=r.doctor_id,
            doctor_name=r.doctor_name,
            specialisation=r.specialisation,
            department_name=r.department_name,
            appointment_date=r.appointment_date,
            appointment_time=str(r.appointment_time),
            reason_for_visit=r.reason_for_visit,
            status=r.status,
            created_at=r.created_at
        )
        for r in rows
    ]

@router.post("", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
def book_appointment(data: AppointmentCreate, db: Session = Depends(get_db)):
    """
    CONCURRENCY-PROTECTED: Books appointment and prevents double-booking collision.
    """
    appt = AppointmentService.book_appointment(data, db)
    # Return formatted response
    return get_appointment_by_id(appt.appointment_id, db)

@router.get("/{appointment_id}", response_model=AppointmentResponse)
def get_appointment_by_id(appointment_id: int, db: Session = Depends(get_db)):
    r = db.query(
        Appointment.appointment_id,
        Appointment.patient_id,
        Patient.name.label("patient_name"),
        Patient.phone.label("patient_phone"),
        Appointment.doctor_id,
        Employee.name.label("doctor_name"),
        Doctor.specialisation,
        Department.name.label("department_name"),
        Appointment.appointment_date,
        Appointment.appointment_time,
        Appointment.reason_for_visit,
        Appointment.status,
        Appointment.created_at
    ).join(Patient, Appointment.patient_id == Patient.patient_id
    ).join(Doctor, Appointment.doctor_id == Doctor.doctor_id
    ).join(Employee, Doctor.doctor_id == Employee.employee_id
    ).join(Department, Employee.department_id == Department.department_id
    ).filter(Appointment.appointment_id == appointment_id).first()

    if not r:
        raise HTTPException(status_code=404, detail="Appointment not found")

    return AppointmentResponse(
        appointment_id=r.appointment_id,
        patient_id=r.patient_id,
        patient_name=r.patient_name,
        patient_phone=r.patient_phone,
        doctor_id=r.doctor_id,
        doctor_name=r.doctor_name,
        specialisation=r.specialisation,
        department_name=r.department_name,
        appointment_date=r.appointment_date,
        appointment_time=str(r.appointment_time),
        reason_for_visit=r.reason_for_visit,
        status=r.status,
        created_at=r.created_at
    )

@router.put("/{appointment_id}/cancel")
def cancel_appointment(appointment_id: int, db: Session = Depends(get_db)):
    appt = db.query(Appointment).filter(Appointment.appointment_id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    appt.status = 'Cancelled'
    db.commit()
    return {"message": "Appointment cancelled successfully", "appointment_id": appointment_id}
