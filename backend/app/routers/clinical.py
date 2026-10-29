from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Disease, Consultation, Diagnosis, Prescription, PrescriptionItem, Medicine, Appointment, Patient, Doctor, Employee
from app.schemas import DiseaseResponse, ConsultationCreate
from app.services.hospital_services import ClinicalService

router = APIRouter(prefix="/clinical", tags=["Clinical Consultations & Diagnoses"])

@router.get("/diseases", response_model=List[DiseaseResponse])
def get_diseases(
    search: Optional[str] = Query(None, description="Search disease name or ICD code"),
    category: Optional[str] = Query(None, description="Filter by disease category"),
    db: Session = Depends(get_db)
):
    """
    3NF Disease Master: Standardized ICD-10 disease records.
    """
    query = db.query(Disease)
    if search:
        query = query.filter(
            (Disease.disease_name.ilike(f"%{search}%")) |
            (Disease.icd_code.ilike(f"%{search}%"))
        )
    if category:
        query = query.filter(Disease.category.ilike(f"%{category}%"))

    return query.order_by(Disease.disease_name).all()

@router.post("/consultations", status_code=status.HTTP_201_CREATED)
def record_consultation(data: ConsultationCreate, db: Session = Depends(get_db)):
    """
    MULTI-TABLE ATOMIC TRANSACTION:
    Records consultation, links diagnoses, creates prescription items with surrogate PK,
    and deducts pharmacy inventory.
    """
    consult = ClinicalService.record_consultation(data, db)
    return {
        "message": "Consultation, Diagnoses, and Prescriptions recorded successfully",
        "consultation_id": consult.consultation_id,
        "appointment_id": consult.appointment_id
    }

@router.get("/consultations/{appointment_id}")
def get_consultation_details(appointment_id: int, db: Session = Depends(get_db)):
    """
    Fetch full clinical encounter summary: Symptoms, Notes, Diagnoses, and Prescriptions.
    """
    consult = db.query(Consultation).filter(Consultation.appointment_id == appointment_id).first()
    if not consult:
        raise HTTPException(status_code=404, detail="Consultation not found for this appointment")

    # Diagnoses
    diagnoses = db.query(
        Diagnosis.diagnosis_id,
        Diagnosis.icd_code,
        Disease.disease_name,
        Diagnosis.severity,
        Diagnosis.remarks
    ).join(Disease, Diagnosis.icd_code == Disease.icd_code
    ).filter(Diagnosis.consultation_id == consult.consultation_id).all()

    # Prescriptions
    rx_items = db.query(
        PrescriptionItem.prescription_item_id,
        Medicine.medicine_id,
        Medicine.name.label("medicine_name"),
        Medicine.strength,
        Medicine.form,
        PrescriptionItem.dosage,
        PrescriptionItem.frequency,
        PrescriptionItem.duration,
        PrescriptionItem.instructions
    ).join(Prescription, PrescriptionItem.prescription_id == Prescription.prescription_id
    ).join(Medicine, PrescriptionItem.medicine_id == Medicine.medicine_id
    ).filter(Prescription.consultation_id == consult.consultation_id).all()

    return {
        "consultation_id": consult.consultation_id,
        "appointment_id": consult.appointment_id,
        "consultation_date": consult.consultation_date,
        "symptoms": consult.symptoms,
        "clinical_notes": consult.clinical_notes,
        "diagnoses": [
            {
                "diagnosis_id": d.diagnosis_id,
                "icd_code": d.icd_code,
                "disease_name": d.disease_name,
                "severity": d.severity,
                "remarks": d.remarks
            }
            for d in diagnoses
        ],
        "prescriptions": [
            {
                "prescription_item_id": p.prescription_item_id,
                "medicine_id": p.medicine_id,
                "medicine_name": p.medicine_name,
                "strength": p.strength,
                "form": p.form,
                "dosage": p.dosage,
                "frequency": p.frequency,
                "duration": p.duration,
                "instructions": p.instructions
            }
            for p in rx_items
        ]
    }
