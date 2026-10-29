from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Hospital, Department, Ward, Room, Bed, Pincode
from app.schemas import DepartmentResponse, WardResponse, BedResponse, PincodeResponse

router = APIRouter(prefix="/hospitals", tags=["Hospital Infrastructure"])

@router.get("/pincodes", response_model=List[PincodeResponse])
def get_pincodes(db: Session = Depends(get_db)):
    """Fetch 3NF decomposed postal code master."""
    return db.query(Pincode).order_by(Pincode.city).all()

@router.get("/departments", response_model=List[DepartmentResponse])
def get_departments(db: Session = Depends(get_db)):
    """Fetch all hospital departments."""
    return db.query(Department).order_by(Department.name).all()

@router.get("/wards", response_model=List[WardResponse])
def get_wards(
    type: Optional[str] = Query(None, description="Filter wards by type (e.g. ICU, General, Pediatric)"),
    db: Session = Depends(get_db)
):
    """Fetch all wards with optional type filter."""
    query = db.query(Ward)
    if type:
        query = query.filter(Ward.type.ilike(f"%{type}%"))
    return query.order_by(Ward.name).all()

@router.get("/beds", response_model=List[BedResponse])
def get_beds(
    ward_id: Optional[int] = Query(None, description="Filter beds by ward"),
    status: Optional[str] = Query(None, description="Filter by status: Available, Occupied, Maintenance"),
    db: Session = Depends(get_db)
):
    """
    Live Bed Availability Grid with Ward, Room, and Floor information.
    """
    query = db.query(
        Bed.bed_id,
        Bed.room_id,
        Bed.bed_number,
        Bed.bed_type,
        Bed.status,
        Room.room_number,
        Room.floor,
        Ward.name.label("ward_name")
    ).join(Room, Bed.room_id == Room.room_id).join(Ward, Room.ward_id == Ward.ward_id)

    if ward_id:
        query = query.filter(Ward.ward_id == ward_id)
    if status:
        query = query.filter(Bed.status == status)

    rows = query.order_by(Ward.ward_id, Room.room_number, Bed.bed_number).all()
    return [
        BedResponse(
            bed_id=r.bed_id,
            room_id=r.room_id,
            bed_number=r.bed_number,
            bed_type=r.bed_type,
            status=r.status,
            room_number=r.room_number,
            ward_name=r.ward_name,
            floor=r.floor
        )
        for r in rows
    ]
