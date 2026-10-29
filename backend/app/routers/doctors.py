from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Doctor, Employee, Department, Pincode
from app.schemas import DoctorSummaryResponse, DoctorCreate

router = APIRouter(prefix="/doctors", tags=["Doctors & Staff"])

@router.post("", response_model=DoctorSummaryResponse, status_code=status.HTTP_201_CREATED)
def create_doctor(data: DoctorCreate, db: Session = Depends(get_db)):
    """
    Register a new physician: Atomically inserts Employee base record and Doctor specialization profile.
    """
    # 1. Check existing email
    if db.query(Employee).filter(Employee.email == data.email).first():
        raise HTTPException(status_code=400, detail="Employee with this email address is already registered.")

    # 2. Check license number uniqueness
    if db.query(Doctor).filter(Doctor.license_number == data.license_number).first():
        raise HTTPException(status_code=400, detail="Doctor with this medical council license is already registered.")

    # 3. Verify department exists
    dept = db.query(Department).filter(Department.department_id == data.department_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Selected department not found.")

    # 4. Verify pincode exists
    pin = db.query(Pincode).filter(Pincode.pincode == data.pincode).first()
    if not pin:
        raise HTTPException(status_code=400, detail="Invalid postal pincode.")

    try:
        emp = Employee(
            department_id=data.department_id,
            name=data.name,
            email=data.email,
            phone=data.phone,
            salary=data.salary,
            dob=data.dob,
            gender=data.gender,
            joining_date=data.joining_date or date.today(),
            qualification=data.qualification,
            shift=data.shift,
            role='Doctor',
            street_address=data.street_address,
            pincode=data.pincode
        )
        db.add(emp)
        db.flush()

        doc = Doctor(
            doctor_id=emp.employee_id,
            license_number=data.license_number,
            specialisation=data.specialisation,
            experience_years=data.experience_years,
            consultation_fee=data.consultation_fee
        )
        db.add(doc)
        db.commit()

        return get_doctor_by_id(doc.doctor_id, db)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create doctor profile: {str(e)}")

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
