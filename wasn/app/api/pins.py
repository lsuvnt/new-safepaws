from typing import List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import select, delete, desc
from app.db.session import get_db
from app.db.models import Cat, CatLocation, AdoptionListing
router = APIRouter(prefix="/pins", tags=["pins"])
class PinIn(BaseModel):
    cat_id: int = Field(..., ge=1)
    latitude: float = Field(..., ge=16, le=33)
    longitude: float = Field(..., ge=34, le=56)

class PinOut(BaseModel):
    location_id: int
    cat_id: int
    latitude: float
    longitude: float
    created_at: str | None = None
    condition: str | None = None
@router.get("/", response_model=List[PinOut])
def list_pins(db: Session = Depends(get_db)):
    # Query with condition field
    stmt = (
        select(
            CatLocation.location_id,
            CatLocation.cat_id,
            CatLocation.latitude,
            CatLocation.longitude,
            CatLocation.created_at,
            CatLocation.condition,
        )
        .order_by(desc(CatLocation.location_id))
        .limit(100)
    )
    
    try:
        rows = db.execute(stmt).all()
        result = []
        for r in rows:
            # Access condition directly from row - SQLAlchemy Row supports attribute access
            # If condition is None or empty string, default to NORMAL
            condition_value = getattr(r, 'condition', None)
            if not condition_value or condition_value.strip() == '':
                condition_value = "NORMAL"
            
            result.append(
                PinOut(
                    location_id=r.location_id,
                    cat_id=r.cat_id,
                    latitude=float(r.latitude),
                    longitude=float(r.longitude),
                    created_at=str(r.created_at) if r.created_at is not None else None,
                    condition=condition_value,
                )
            )
        return result
    except Exception as e:
        # If query fails (e.g., condition column doesn't exist), fallback to query without it
        stmt = (
            select(
                CatLocation.location_id,
                CatLocation.cat_id,
                CatLocation.latitude,
                CatLocation.longitude,
                CatLocation.created_at,
            )
            .order_by(desc(CatLocation.location_id))
            .limit(100)
        )
        rows = db.execute(stmt).all()
        return [
            PinOut(
                location_id=r.location_id,
                cat_id=r.cat_id,
                latitude=float(r.latitude),
                longitude=float(r.longitude),
                created_at=str(r.created_at) if r.created_at is not None else None,
                condition="NORMAL",  # Default condition
            )
            for r in rows
        ]
@router.post("/", response_model=PinOut, status_code=201)
def create_pin(payload: PinIn, db: Session = Depends(get_db)):

    # Check cat exists
    cat_exists = db.scalar(select(Cat.cat_id).where(Cat.cat_id == payload.cat_id))
    if not cat_exists:
        raise HTTPException(status_code=404, detail="Cat not found")

    # Check existing pin for this cat
    existing_pin = db.scalar(
        select(CatLocation).where(CatLocation.cat_id == payload.cat_id)
    )
    # Check if cat is currently in adoption listings
    adoption_listing = db.query(AdoptionListing).filter(
        AdoptionListing.cat_id == payload.cat_id,
        AdoptionListing.is_active == True).first()
    
    if adoption_listing:
        raise HTTPException(
            status_code=403,
            detail="This cat is currently listed for adoption and cannot receive new location pins"
        )

    if existing_pin:
        # Update instead of creating new
        existing_pin.latitude = payload.latitude
        existing_pin.longitude = payload.longitude
        db.commit()
        db.refresh(existing_pin)

        # Get condition from CatLocation (handle if column doesn't exist)
        try:
            condition = getattr(existing_pin, 'condition', None) or "NORMAL"
        except Exception:
            condition = "NORMAL"

        return PinOut(
            location_id=existing_pin.location_id,
            cat_id=existing_pin.cat_id,
            latitude=float(existing_pin.latitude),
            longitude=float(existing_pin.longitude),
            created_at=str(existing_pin.created_at) if existing_pin.created_at is not None else None,
            condition=condition,
        )

    # No existing pin → create new
    new_pin = CatLocation(
        cat_id=payload.cat_id,
        latitude=payload.latitude,
        longitude=payload.longitude,
    )

    try:
        db.add(new_pin)
        db.commit()
        db.refresh(new_pin)
        # Get condition from CatLocation (handle if column doesn't exist)
        try:
            condition = getattr(new_pin, 'condition', None) or "NORMAL"
        except Exception:
            condition = "NORMAL"
        
        return PinOut(
            location_id=new_pin.location_id,
            cat_id=new_pin.cat_id,
            latitude=float(new_pin.latitude),
            longitude=float(new_pin.longitude),
            created_at=str(new_pin.created_at) if new_pin.created_at is not None else None,
            condition=condition,
        )
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error")
@router.delete("/{pin_id}", status_code=204)
def delete_pin(pin_id: int, db: Session = Depends(get_db)):
    stmt = delete(CatLocation).where(CatLocation.location_id == pin_id)
    result = db.execute(stmt)
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Pin not found")
    db.commit()