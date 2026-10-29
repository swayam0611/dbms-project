from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Medicine, PharmacyInventory
from app.schemas import MedicineResponse, PharmacyInventoryResponse, RestockRequest
from app.services.hospital_services import PharmacyService

router = APIRouter(prefix="/pharmacy", tags=["Pharmacy & Inventory"])

@router.get("/medicines", response_model=List[MedicineResponse])
def get_medicines(
    search: Optional[str] = Query(None, description="Search medicine name or manufacturer"),
    form: Optional[str] = Query(None, description="Filter by form: Tablet, Capsule, Syrup, etc."),
    db: Session = Depends(get_db)
):
    query = db.query(Medicine)
    if search:
        query = query.filter(
            (Medicine.name.ilike(f"%{search}%")) |
            (Medicine.manufacturer.ilike(f"%{search}%"))
        )
    if form:
        query = query.filter(Medicine.form == form)

    rows = query.order_by(Medicine.name).all()
    return [
        MedicineResponse(
            medicine_id=m.medicine_id,
            name=m.name,
            strength=m.strength,
            form=m.form,
            unit_price=float(m.unit_price),
            manufacturer=m.manufacturer
        )
        for m in rows
    ]

@router.get("/inventory", response_model=List[PharmacyInventoryResponse])
def get_inventory(
    low_stock_only: bool = Query(False, description="Filter medicines that are at or below reorder level"),
    db: Session = Depends(get_db)
):
    """
    Pharmacy Stock Grid with low-stock warning indicators.
    """
    query = db.query(
        PharmacyInventory.inventory_id,
        PharmacyInventory.medicine_id,
        Medicine.name,
        Medicine.strength,
        Medicine.form,
        Medicine.unit_price,
        PharmacyInventory.quantity_in_stock,
        PharmacyInventory.reorder_level,
        PharmacyInventory.unit_cost,
        PharmacyInventory.last_restocked
    ).join(Medicine, PharmacyInventory.medicine_id == Medicine.medicine_id)

    if low_stock_only:
        query = query.filter(PharmacyInventory.quantity_in_stock <= PharmacyInventory.reorder_level)

    rows = query.order_by(PharmacyInventory.quantity_in_stock.asc()).all()
    return [
        PharmacyInventoryResponse(
            inventory_id=r.inventory_id,
            medicine_id=r.medicine_id,
            name=r.name,
            strength=r.strength,
            form=r.form,
            unit_price=float(r.unit_price),
            quantity_in_stock=r.quantity_in_stock,
            reorder_level=r.reorder_level,
            unit_cost=float(r.unit_cost),
            is_low_stock=(r.quantity_in_stock <= r.reorder_level),
            last_restocked=r.last_restocked
        )
        for r in rows
    ]

@router.put("/inventory/{medicine_id}/restock", response_model=PharmacyInventoryResponse)
def restock_inventory(medicine_id: int, data: RestockRequest, db: Session = Depends(get_db)):
    """
    ATOMIC TRANSACTION: Safely restocks medicine quantity.
    """
    inv = PharmacyService.restock(medicine_id, data, db)
    med = db.query(Medicine).filter(Medicine.medicine_id == medicine_id).first()
    return PharmacyInventoryResponse(
        inventory_id=inv.inventory_id,
        medicine_id=inv.medicine_id,
        name=med.name,
        strength=med.strength,
        form=med.form,
        unit_price=float(med.unit_price),
        quantity_in_stock=inv.quantity_in_stock,
        reorder_level=inv.reorder_level,
        unit_cost=float(inv.unit_cost),
        is_low_stock=(inv.quantity_in_stock <= inv.reorder_level),
        last_restocked=inv.last_restocked
    )
