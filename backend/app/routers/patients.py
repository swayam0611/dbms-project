from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Patient, Pincode, EmergencyContact, Allergy
from app.schemas import PatientCreate, PatientResponse, EmergencyContactResponse, AllergyResponse

router = APIRouter(prefix="/patients", tags=["Patients"])

@router.get("", response_model=List[PatientResponse])
def get_patients(
    search: Optional[str] = Query(None, description="Search by name, phone, or Aadhaar"),
    gender: Optional[str] = Query(None, description="Filter by gender"),
    blood_group: Optional[str] = Query(None, description="Filter by blood group"),
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """
    List patients with search and demographic filters.
    """
    query = db.query(
        Patient,
        Pincode.city,
        Pincode.state
    ).outerjoin(Pincode, Patient.pincode == Pincode.pincode)

    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            (Patient.name.ilike(search_fmt)) |
            (Patient.phone.like(search_fmt)) |
            (Patient.aadhaar_no.like(search_fmt))
        )
    if gender:
        query = query.filter(Patient.gender == gender)
    if blood_group:
        query = query.filter(Patient.blood_group == blood_group)

    rows = query.order_by(Patient.patient_id.desc()).offset(offset).limit(limit).all()
    return [
        PatientResponse(
            patient_id=p.Patient.patient_id,
            name=p.Patient.name,
            gender=p.Patient.gender,
            blood_group=p.Patient.blood_group,
            aadhaar_no=p.Patient.aadhaar_no,
            dob=p.Patient.dob,
            email=p.Patient.email,
            phone=p.Patient.phone,
            street_address=p.Patient.street_address,
            pincode=p.Patient.pincode,
            city=p.city,
            state=p.state,
            registered_at=p.Patient.registered_at
        )
        for p in rows
    ]

@router.post("", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def create_patient(data: PatientCreate, db: Session = Depends(get_db)):
    """
    Register a new patient with 3NF pincode mapping, emergency contact, and allergies.
    """
    # Check Aadhaar uniqueness
    if db.query(Patient).filter(Patient.aadhaar_no == data.aadhaar_no).first():
        raise HTTPException(status_code=400, detail="Patient with this Aadhaar number is already registered")

    # Verify pincode exists in master
    pin = db.query(Pincode).filter(Pincode.pincode == data.pincode).first()
    if not pin:
        raise HTTPException(status_code=400, detail=f"Invalid Pincode: {data.pincode}. Must exist in postal master.")

    patient = Patient(
        name=data.name,
        gender=data.gender,
        blood_group=data.blood_group,
        aadhaar_no=data.aadhaar_no,
        dob=data.dob,
        email=data.email,
        phone=data.phone,
        street_address=data.street_address,
        pincode=data.pincode
    )
    db.add(patient)
    db.flush()

    if data.emergency_contact:
        ec = EmergencyContact(
            patient_id=patient.patient_id,
            name=data.emergency_contact.name,
            relation=data.emergency_contact.relation,
            phone=data.emergency_contact.phone
        )
        db.add(ec)

    if data.allergies:
        for al in data.allergies:
            db_al = Allergy(
                patient_id=patient.patient_id,
                allergen=al.allergen,
                reaction=al.reaction,
                severity=al.severity
            )
            db.add(db_al)

    db.commit()
    db.refresh(patient)

    return PatientResponse(
        patient_id=patient.patient_id,
        name=patient.name,
        gender=patient.gender,
        blood_group=patient.blood_group,
        aadhaar_no=patient.aadhaar_no,
        dob=patient.dob,
        email=patient.email,
        phone=patient.phone,
        street_address=patient.street_address,
        pincode=patient.pincode,
        city=pin.city,
        state=pin.state,
        registered_at=patient.registered_at
    )

@router.get("/{patient_id}/allergies", response_model=List[AllergyResponse])
def get_patient_allergies(patient_id: int, db: Session = Depends(get_db)):
    return db.query(Allergy).filter(Allergy.patient_id == patient_id).all()

@router.get("/{patient_id}/emergency-contacts", response_model=List[EmergencyContactResponse])
def get_patient_emergency_contacts(patient_id: int, db: Session = Depends(get_db)):
    return db.query(EmergencyContact).filter(EmergencyContact.patient_id == patient_id).all()
