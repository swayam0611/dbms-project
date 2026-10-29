from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Enum as SQLEnum, func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Patient(Base):
    __tablename__ = "patients"

    patient_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(120), nullable=False)
    gender = Column(SQLEnum('Male', 'Female', 'Other'), nullable=False)
    blood_group = Column(SQLEnum('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'), nullable=False)
    aadhaar_no = Column(String(16), nullable=False, unique=True)
    dob = Column(Date, nullable=False)
    email = Column(String(120), nullable=True)
    phone = Column(String(20), nullable=False)
    street_address = Column(String(255), nullable=False)
    pincode = Column(String(10), ForeignKey("pincodes.pincode", onupdate="CASCADE"), nullable=False)
    registered_at = Column(DateTime, default=func.now())

    pincode_rel = relationship("Pincode", back_populates="patients")
    emergency_contacts = relationship("EmergencyContact", back_populates="patient", cascade="all, delete-orphan")
    allergies = relationship("Allergy", back_populates="patient", cascade="all, delete-orphan")
    admissions = relationship("Admission", back_populates="patient", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="patient", cascade="all, delete-orphan")
    billings = relationship("Billing", back_populates="patient", cascade="all, delete-orphan")


class EmergencyContact(Base):
    __tablename__ = "emergency_contacts"

    contact_id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("patients.patient_id", ondelete="CASCADE"), nullable=False)
    name = Column(String(120), nullable=False)
    relation = Column(String(50), nullable=False)
    phone = Column(String(20), nullable=False)

    patient = relationship("Patient", back_populates="emergency_contacts")


class Allergy(Base):
    __tablename__ = "allergies"

    allergy_id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("patients.patient_id", ondelete="CASCADE"), nullable=False)
    allergen = Column(String(100), nullable=False)
    reaction = Column(String(255), nullable=False)
    severity = Column(SQLEnum('Mild', 'Moderate', 'Severe', 'Life-Threatening'), nullable=False)

    patient = relationship("Patient", back_populates="allergies")
