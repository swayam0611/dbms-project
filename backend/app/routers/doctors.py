from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Doctor, Employee, Department
from app.schemas import DoctorSummaryResponse

router = APIRouter(prefix="/doctors", tags=["Doctors & Staff"])

@router.get("", response_model=List[DoctorSummaryResponse])
def get_doctors(
    department_id: Optional[int] = Query(None, description="Filter by department ID"),
    specialisation: Optional[str] = Query(None, description="Filter by specialisation keyword"),
    min_experience: Optional[int] = Query(None, description="Filter by minimum experience years"),
    search: Optional[str] = Query(None, description="Search doctor name"),
    db: Session = Depends(get_db)
):
    """
    List doctors with multi-criteria filtering: by department, specialisation, or experience.
    """
    query = db.query(
        Doctor.doctor_id,
        Employee.name,
        Employee.email,
        Employee.phone,
        Employee.department_id,
        Department.name.label("department_name"),
        Doctor.license_number,
        Doctor.specialisation,
        Doctor.experience_years,
        Doctor.consultation_fee,
        Employee.shift
    ).join(Employee, Doctor.doctor_id == Employee.employee_id
    ).join(Department, Employee.department_id == Department.department_id)

    if department_id:
        query = query.filter(Employee.department_id == department_id)
    if specialisation:
        query = query.filter(Doctor.specialisation.ilike(f"%{specialisation}%"))
    if min_experience:
        query = query.filter(Doctor.experience_years >= min_experience)
    if search:
        query = query.filter(Employee.name.ilike(f"%{search}%"))

    rows = query.order_by(Doctor.experience_years.desc()).all()
    return [
        DoctorSummaryResponse(
            doctor_id=r.doctor_id,
            name=r.name,
            email=r.email,
            phone=r.phone,
            department_id=r.department_id,
            department_name=r.department_name,
            license_number=r.license_number,
            specialisation=r.specialisation,
            experience_years=r.experience_years,
            consultation_fee=float(r.consultation_fee),
            shift=r.shift
        )
        for r in rows
    ]

@router.get("/{doctor_id}", response_model=DoctorSummaryResponse)
def get_doctor_by_id(doctor_id: int, db: Session = Depends(get_db)):
    doc = db.query(
        Doctor.doctor_id,
        Employee.name,
        Employee.email,
        Employee.phone,
        Employee.department_id,
        Department.name.label("department_name"),
        Doctor.license_number,
        Doctor.specialisation,
        Doctor.experience_years,
        Doctor.consultation_fee,
        Employee.shift
    ).join(Employee, Doctor.doctor_id == Employee.employee_id
    ).join(Department, Employee.department_id == Department.department_id
    ).filter(Doctor.doctor_id == doctor_id).first()

    if not doc:
        raise HTTPException(status_code=404, detail="Doctor not found")

    return DoctorSummaryResponse(
        doctor_id=doc.doctor_id,
        name=doc.name,
        email=doc.email,
        phone=doc.phone,
        department_id=doc.department_id,
        department_name=doc.department_name,
        license_number=doc.license_number,
        specialisation=doc.specialisation,
        experience_years=doc.experience_years,
        consultation_fee=float(doc.consultation_fee),
        shift=doc.shift
    )
