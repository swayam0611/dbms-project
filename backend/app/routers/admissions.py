from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Admission, Patient, Bed, Room, Ward
from app.schemas import AdmissionCreate, AdmissionDischarge, AdmissionResponse
from app.services.hospital_services import AdmissionService

router = APIRouter(prefix="/admissions", tags=["Inpatient & Admissions"])

@router.get("", response_model=List[AdmissionResponse])
def get_admissions(
    status: Optional[str] = Query(None, description="Filter by status: Admitted, Discharged"),
    patient_id: Optional[int] = Query(None, description="Filter by Patient ID"),
    ward_id: Optional[int] = Query(None, description="Filter by Ward ID"),
    db: Session = Depends(get_db)
):
    """
    List admissions with patient and bed location details.
    """
    query = db.query(
        Admission.admission_id,
        Admission.patient_id,
        Patient.name.label("patient_name"),
        Admission.bed_id,
        Bed.bed_number,
        Room.room_number,
        Ward.name.label("ward_name"),
        Admission.admit_date,
        Admission.discharge_date,
        Admission.status,
        Admission.discharge_summary
    ).join(Patient, Admission.patient_id == Patient.patient_id
    ).join(Bed, Admission.bed_id == Bed.bed_id
    ).join(Room, Bed.room_id == Room.room_id
    ).join(Ward, Room.ward_id == Ward.ward_id)

    if status:
        query = query.filter(Admission.status == status)
    if patient_id:
        query = query.filter(Admission.patient_id == patient_id)
    if ward_id:
        query = query.filter(Ward.ward_id == ward_id)

    rows = query.order_by(Admission.admit_date.desc()).all()
    return [
        AdmissionResponse(
            admission_id=r.admission_id,
            patient_id=r.patient_id,
            patient_name=r.patient_name,
            bed_id=r.bed_id,
            bed_number=r.bed_number,
            room_number=r.room_number,
            ward_name=r.ward_name,
            admit_date=r.admit_date,
            discharge_date=r.discharge_date,
            status=r.status,
            discharge_summary=r.discharge_summary
        )
        for r in rows
    ]

@router.post("", response_model=AdmissionResponse, status_code=status.HTTP_201_CREATED)
def admit_patient(data: AdmissionCreate, db: Session = Depends(get_db)):
    """
    ATOMIC TRANSACTION: Admits patient and acquires exclusive lock on the bed.
    """
    adm = AdmissionService.admit_patient(data, db)
    return get_admission_by_id(adm.admission_id, db)

@router.put("/{admission_id}/discharge", response_model=AdmissionResponse)
def discharge_patient(admission_id: int, data: AdmissionDischarge, db: Session = Depends(get_db)):
    """
    ATOMIC TRANSACTION: Discharges patient and immediately frees bed.
    """
    adm = AdmissionService.discharge_patient(admission_id, data, db)
    return get_admission_by_id(adm.admission_id, db)

@router.get("/{admission_id}", response_model=AdmissionResponse)
def get_admission_by_id(admission_id: int, db: Session = Depends(get_db)):
    r = db.query(
        Admission.admission_id,
        Admission.patient_id,
        Patient.name.label("patient_name"),
        Admission.bed_id,
        Bed.bed_number,
        Room.room_number,
        Ward.name.label("ward_name"),
        Admission.admit_date,
        Admission.discharge_date,
        Admission.status,
        Admission.discharge_summary
    ).join(Patient, Admission.patient_id == Patient.patient_id
    ).join(Bed, Admission.bed_id == Bed.bed_id
    ).join(Room, Bed.room_id == Room.room_id
    ).join(Ward, Room.ward_id == Ward.ward_id
    ).filter(Admission.admission_id == admission_id).first()

    if not r:
        raise HTTPException(status_code=404, detail="Admission not found")

    return AdmissionResponse(
        admission_id=r.admission_id,
        patient_id=r.patient_id,
        patient_name=r.patient_name,
        bed_id=r.bed_id,
        bed_number=r.bed_number,
        room_number=r.room_number,
        ward_name=r.ward_name,
        admit_date=r.admit_date,
        discharge_date=r.discharge_date,
        status=r.status,
        discharge_summary=r.discharge_summary
    )
