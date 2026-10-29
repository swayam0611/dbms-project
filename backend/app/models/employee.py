from sqlalchemy import Column, Integer, String, Date, Numeric, Boolean, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.core.database import Base

class Employee(Base):
    __tablename__ = "employees"

    employee_id = Column(Integer, primary_key=True, autoincrement=True)
    department_id = Column(Integer, ForeignKey("departments.department_id", onupdate="CASCADE"), nullable=False)
    name = Column(String(120), nullable=False)
    email = Column(String(120), nullable=False, unique=True)
    phone = Column(String(20), nullable=False)
    salary = Column(Numeric(10, 2), nullable=False)
    dob = Column(Date, nullable=False)
    gender = Column(SQLEnum('Male', 'Female', 'Other'), nullable=False)
    joining_date = Column(Date, nullable=False)
    qualification = Column(String(120), nullable=False)
    shift = Column(SQLEnum('Morning', 'Evening', 'Night', 'Rotational'), nullable=False, default='Morning')
    role = Column(SQLEnum('Doctor', 'Nurse', 'Receptionist', 'Staff'), nullable=False)
    street_address = Column(String(255), nullable=False)
    pincode = Column(String(10), ForeignKey("pincodes.pincode", onupdate="CASCADE"), nullable=False)
    is_active = Column(Boolean, default=True)

    department = relationship("Department", back_populates="employees")
    pincode_rel = relationship("Pincode", back_populates="employees")
    doctor_profile = relationship("Doctor", back_populates="employee", uselist=False, cascade="all, delete-orphan")
    nurse_profile = relationship("Nurse", back_populates="employee", uselist=False, cascade="all, delete-orphan")
    receptionist_profile = relationship("Receptionist", back_populates="employee", uselist=False, cascade="all, delete-orphan")


class Doctor(Base):
    __tablename__ = "doctors"

    doctor_id = Column(Integer, ForeignKey("employees.employee_id", ondelete="CASCADE"), primary_key=True)
    license_number = Column(String(50), nullable=False, unique=True)
    specialisation = Column(String(100), nullable=False)
    experience_years = Column(Integer, nullable=False, default=0)
    consultation_fee = Column(Numeric(10, 2), nullable=False, default=500.00)

    employee = relationship("Employee", back_populates="doctor_profile")
    appointments = relationship("Appointment", back_populates="doctor")


class Nurse(Base):
    __tablename__ = "nurses"

    nurse_id = Column(Integer, ForeignKey("employees.employee_id", ondelete="CASCADE"), primary_key=True)
    nursing_council_reg_no = Column(String(50), nullable=False, unique=True)
    assigned_ward_id = Column(Integer, ForeignKey("wards.ward_id", ondelete="SET NULL"), nullable=True)

    employee = relationship("Employee", back_populates="nurse_profile")
    assigned_ward = relationship("Ward", back_populates="assigned_nurses")


class Receptionist(Base):
    __tablename__ = "receptionists"

    receptionist_id = Column(Integer, ForeignKey("employees.employee_id", ondelete="CASCADE"), primary_key=True)
    desk_number = Column(String(20), nullable=False)

    employee = relationship("Employee", back_populates="receptionist_profile")
