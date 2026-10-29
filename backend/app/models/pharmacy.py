from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime, ForeignKey, Enum as SQLEnum, func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Medicine(Base):
    __tablename__ = "medicines"

    medicine_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(120), nullable=False)
    strength = Column(String(50), nullable=False)
    form = Column(SQLEnum('Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Inhaler'), default='Tablet')
    unit_price = Column(Numeric(10, 2), default=10.00)
    manufacturer = Column(String(120), nullable=False)

    inventory = relationship("PharmacyInventory", back_populates="medicine", uselist=False, cascade="all, delete-orphan")
    prescription_items = relationship("PrescriptionItem", back_populates="medicine")


class PharmacyInventory(Base):
    __tablename__ = "pharmacy_inventory"

    inventory_id = Column(Integer, primary_key=True, autoincrement=True)
    medicine_id = Column(Integer, ForeignKey("medicines.medicine_id", ondelete="CASCADE"), nullable=False, unique=True)
    quantity_in_stock = Column(Integer, nullable=False, default=0)
    reorder_level = Column(Integer, nullable=False, default=20)
    unit_cost = Column(Numeric(10, 2), default=5.00)
    last_restocked = Column(DateTime, default=func.now(), onupdate=func.now())

    medicine = relationship("Medicine", back_populates="inventory")


class Prescription(Base):
    __tablename__ = "prescriptions"

    prescription_id = Column(Integer, primary_key=True, autoincrement=True)
    consultation_id = Column(Integer, ForeignKey("consultations.consultation_id", ondelete="CASCADE"), nullable=False)
    issue_date = Column(DateTime, default=func.now())
    instructions = Column(Text, nullable=True)

    consultation = relationship("Consultation", back_populates="prescriptions")
    items = relationship("PrescriptionItem", back_populates="prescription", cascade="all, delete-orphan")


class PrescriptionItem(Base):
    __tablename__ = "prescription_items"

    prescription_item_id = Column(Integer, primary_key=True, autoincrement=True)
    prescription_id = Column(Integer, ForeignKey("prescriptions.prescription_id", ondelete="CASCADE"), nullable=False)
    medicine_id = Column(Integer, ForeignKey("medicines.medicine_id", ondelete="RESTRICT"), nullable=False)
    dosage = Column(String(50), nullable=False)
    frequency = Column(String(50), nullable=False)
    duration = Column(String(50), nullable=False)
    instructions = Column(String(255), nullable=True)

    prescription = relationship("Prescription", back_populates="items")
    medicine = relationship("Medicine", back_populates="prescription_items")
