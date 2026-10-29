from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, Enum as SQLEnum, func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Billing(Base):
    __tablename__ = "billings"

    billing_id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("patients.patient_id", ondelete="CASCADE"), nullable=False)
    appointment_id = Column(Integer, ForeignKey("appointments.appointment_id", ondelete="SET NULL"), nullable=True)
    admission_id = Column(Integer, ForeignKey("admissions.admission_id", ondelete="SET NULL"), nullable=True)
    consultation_fee = Column(Numeric(10, 2), default=0.00)
    bed_charges = Column(Numeric(10, 2), default=0.00)
    pharmacy_charges = Column(Numeric(10, 2), default=0.00)
    other_charges = Column(Numeric(10, 2), default=0.00)
    # total_amount is a stored generated column in MySQL, mapped here as Column for read/write
    total_amount = Column(Numeric(10, 2))
    payment_status = Column(SQLEnum('Pending', 'Partially_Paid', 'Paid', 'Refunded'), default='Pending')
    billing_date = Column(DateTime, default=func.now())

    patient = relationship("Patient", back_populates="billings")
    appointment = relationship("Appointment", back_populates="billings")
    admission = relationship("Admission", back_populates="billings")
    payments = relationship("Payment", back_populates="billing", cascade="all, delete-orphan")


class Payment(Base):
    __tablename__ = "payments"

    transaction_id = Column(Integer, primary_key=True, autoincrement=True)
    billing_id = Column(Integer, ForeignKey("billings.billing_id", ondelete="CASCADE"), nullable=False)
    payment_time = Column(DateTime, default=func.now())
    amount_paid = Column(Numeric(10, 2), nullable=False)
    payment_method = Column(SQLEnum('Cash', 'UPI', 'Credit Card', 'Debit Card', 'Insurance', 'Net Banking'), nullable=False)
    transaction_status = Column(SQLEnum('Success', 'Failed', 'Pending', 'Reversed'), default='Success')
    reference_number = Column(String(100), nullable=True)

    billing = relationship("Billing", back_populates="payments")
