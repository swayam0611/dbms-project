from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum as SQLEnum, func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Pincode(Base):
    __tablename__ = "pincodes"

    pincode = Column(String(10), primary_key=True)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)

    hospitals = relationship("Hospital", back_populates="pincode_rel")
    employees = relationship("Employee", back_populates="pincode_rel")
    patients = relationship("Patient", back_populates="pincode_rel")


class Hospital(Base):
    __tablename__ = "hospitals"

    hospital_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(150), nullable=False)
    contact_no = Column(String(20), nullable=False)
    email = Column(String(100), nullable=False, unique=True)
    establishment_year = Column(Integer, nullable=False)
    street_address = Column(String(255), nullable=False)
    pincode = Column(String(10), ForeignKey("pincodes.pincode", onupdate="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=func.now())

    pincode_rel = relationship("Pincode", back_populates="hospitals")
    departments = relationship("Department", back_populates="hospital", cascade="all, delete-orphan")
    wards = relationship("Ward", back_populates="hospital", cascade="all, delete-orphan")


class Department(Base):
    __tablename__ = "departments"

    department_id = Column(Integer, primary_key=True, autoincrement=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.hospital_id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    location = Column(String(100), nullable=False)
    contact_no = Column(String(20), nullable=False)

    hospital = relationship("Hospital", back_populates="departments")
    employees = relationship("Employee", back_populates="department")


class Ward(Base):
    __tablename__ = "wards"

    ward_id = Column(Integer, primary_key=True, autoincrement=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.hospital_id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False)
    location = Column(String(100), nullable=False)

    hospital = relationship("Hospital", back_populates="wards")
    rooms = relationship("Room", back_populates="ward", cascade="all, delete-orphan")
    assigned_nurses = relationship("Nurse", back_populates="assigned_ward")


class Room(Base):
    __tablename__ = "rooms"

    room_id = Column(Integer, primary_key=True, autoincrement=True)
    ward_id = Column(Integer, ForeignKey("wards.ward_id", ondelete="CASCADE"), nullable=False)
    room_number = Column(String(20), nullable=False)
    floor = Column(Integer, nullable=False)
    room_type = Column(String(50), nullable=False)
    status = Column(SQLEnum('Available', 'Occupied', 'Maintenance', 'Cleaning'), default='Available')

    ward = relationship("Ward", back_populates="rooms")
    beds = relationship("Bed", back_populates="room", cascade="all, delete-orphan")


class Bed(Base):
    __tablename__ = "beds"

    bed_id = Column(Integer, primary_key=True, autoincrement=True)
    room_id = Column(Integer, ForeignKey("rooms.room_id", ondelete="CASCADE"), nullable=False)
    bed_number = Column(String(20), nullable=False)
    bed_type = Column(String(50), nullable=False)
    status = Column(SQLEnum('Available', 'Occupied', 'Maintenance', 'Reserved'), default='Available')

    room = relationship("Room", back_populates="beds")
    admissions = relationship("Admission", back_populates="bed")
