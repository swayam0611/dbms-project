from sqlalchemy import Column, Integer, String, Text, Date, Time, DateTime, ForeignKey, Enum as SQLEnum, func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Admission(Base):
    __tablename__ = "admissions"

    admission_id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("patients.patient_id", ondelete="CASCADE"), nullable=False)
    bed_id = Column(Integer, ForeignKey("beds.bed_id", onupdate="CASCADE"), nullable=False)
    admit_date = Column(DateTime, nullable=False, default=func.now())
    discharge_date = Column(DateTime, nullable=True)
    status = Column(SQLEnum('Admitted', 'Discharged', 'Transferred'), default='Admitted')
    discharge_summary = Column(Text, nullable=True)

    patient = relationship("Patient", back_populates="admissions")
    bed = relationship("Bed", back_populates="admissions")
    billings = relationship("Billing", back_populates="admission")


class Appointment(Base):
    __tablename__ = "appointments"

    appointment_id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("patients.patient_id", ondelete="CASCADE"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.doctor_id", ondelete="RESTRICT"), nullable=False)
    appointment_date = Column(Date, nullable=False)
    appointment_time = Column(Time, nullable=False)
    reason_for_visit = Column(String(255), nullable=False)
    status = Column(SQLEnum('Scheduled', 'Completed', 'Cancelled', 'No-Show'), default='Scheduled')
    created_at = Column(DateTime, default=func.now())

    patient = relationship("Patient", back_populates="appointments")
    doctor = relationship("Doctor", back_populates="appointments")
    consultation = relationship("Consultation", back_populates="appointment", uselist=False, cascade="all, delete-orphan")
    billings = relationship("Billing", back_populates="appointment")


class Consultation(Base):
    __tablename__ = "consultations"

    consultation_id = Column(Integer, primary_key=True, autoincrement=True)
    appointment_id = Column(Integer, ForeignKey("appointments.appointment_id", ondelete="CASCADE"), nullable=False, unique=True)
    symptoms = Column(Text, nullable=False)
    clinical_notes = Column(Text, nullable=True)
    consultation_date = Column(DateTime, default=func.now())

    appointment = relationship("Appointment", back_populates="consultation")
    diagnoses = relationship("Diagnosis", back_populates="consultation", cascade="all, delete-orphan")
    prescriptions = relationship("Prescription", back_populates="consultation", cascade="all, delete-orphan")


class Disease(Base):
    __tablename__ = "diseases"

    icd_code = Column(String(20), primary_key=True)
    disease_name = Column(String(150), nullable=False, unique=True)
    category = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)

    diagnoses = relationship("Diagnosis", back_populates="disease")


class Diagnosis(Base):
    __tablename__ = "diagnoses"

    diagnosis_id = Column(Integer, primary_key=True, autoincrement=True)
    consultation_id = Column(Integer, ForeignKey("consultations.consultation_id", ondelete="CASCADE"), nullable=False)
    icd_code = Column(String(20), ForeignKey("diseases.icd_code", onupdate="CASCADE"), nullable=False)
    severity = Column(SQLEnum('Mild', 'Moderate', 'Severe', 'Critical'), nullable=False)
    remarks = Column(String(255), nullable=True)

    consultation = relationship("Consultation", back_populates="diagnoses")
    disease = relationship("Disease", back_populates="diagnoses")
