from typing import List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import select, delete, desc
from app.db.session import get_db
from app.db.models import Cat, CatLocation, AdoptionListing, User, ActivityLog
from app.db.auth import get_current_user_id
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


class PinWithCatOut(BaseModel):
    location_id: int
    cat_id: int
    latitude: float
    longitude: float
    created_at: str | None = None  # From cat_locations table
    condition: str | None = None
    # Cat fields
    name: str | None = None
    age: int | None = None
    gender: str | None = None
    image_url: str | None = None
    notes: str | None = None  # Notes from cats table
    adding_user_id: int | None = None  # User ID who added the cat
    adding_user_username: str | None = None  # Username who added the cat
@router.get("/", response_model=List[PinWithCatOut])
def list_pins(db: Session = Depends(get_db)):
    # Query pins with cat and user data using joins
    results = db.query(
        CatLocation,
        Cat,
        User
    ).join(
        Cat, CatLocation.cat_id == Cat.cat_id
    ).outerjoin(
        User, Cat.adding_user == User.user_id
    ).order_by(
        desc(CatLocation.location_id)
    ).limit(100).all()
    
    # Build response with cat data
    result = []
    for location, cat, user in results:
        # Get condition, default to NORMAL if None or empty
        condition_value = getattr(location, 'condition', None)
        if not condition_value or condition_value.strip() == '':
            condition_value = "NORMAL"
        
        location_dict = {
            "location_id": location.location_id,
            "cat_id": location.cat_id,
            "latitude": float(location.latitude),
            "longitude": float(location.longitude),
            "created_at": str(location.created_at) if location.created_at is not None else None,
            "condition": condition_value,
            "name": cat.name if cat else None,
            "age": cat.age if cat else None,
            "gender": cat.gender if cat else None,
            "image_url": cat.image_url if cat else None,
            "notes": cat.notes if cat else None,
            "adding_user_id": cat.adding_user if cat else None,
            "adding_user_username": user.username if user else None,
        }
        result.append(location_dict)
    
    return result
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


class ConditionUpdate(BaseModel):
    condition: str = Field(..., description="Condition flag: NORMAL, URGENT, AT VET, ADOPTED, PASSED")
    description: str | None = None  # Description for URGENT or AT VET


@router.put("/{location_id}/condition", response_model=PinWithCatOut)
def update_pin_condition(
    location_id: int,
    payload: ConditionUpdate,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    # Get the pin
    pin = db.query(CatLocation).filter(CatLocation.location_id == location_id).first()
    if not pin:
        raise HTTPException(status_code=404, detail="Pin not found")

    # Get the cat
    cat = db.query(Cat).filter(Cat.cat_id == pin.cat_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Cat not found")

    # Check if user is allowed to change to ADOPTED or PASSED
    if payload.condition in ["ADOPTED", "PASSED"]:
        if cat.adding_user != current_user_id:
            raise HTTPException(
                status_code=403,
                detail="Only the user who added the cat can mark it as adopted or passed"
            )

    # Validate condition value
    valid_conditions = ["NORMAL", "URGENT", "AT VET", "UNKNOWN", "ADOPTED", "PASSED"]
    if payload.condition not in valid_conditions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid condition. Must be one of: {', '.join(valid_conditions)}"
        )

    old_condition = pin.condition or "NORMAL"
    pin.condition = payload.condition
    db.commit()
    db.refresh(pin)

    # If condition changed to URGENT or AT VET, create activity log entry
    if payload.condition in ["URGENT", "AT VET"] and payload.description:
        activity_description = f"Condition changed to {payload.condition}: {payload.description}"
        
        # Create activity log entry for condition change
        new_log = ActivityLog(
            cat_id=pin.cat_id,
            user_id=current_user_id,
            activity_description=activity_description,
        )
        db.add(new_log)
        db.commit()
    
    # If condition changed to ADOPTED or PASSED, create activity log entry
    if payload.condition in ["ADOPTED", "PASSED"]:
        activity_description = f"Cat marked as {payload.condition}"
        
        # Create activity log entry for condition change
        new_log = ActivityLog(
            cat_id=pin.cat_id,
            user_id=current_user_id,
            activity_description=activity_description,
        )
        db.add(new_log)
        db.commit()

    # Get user who added the cat
    adding_user = db.query(User).filter(User.user_id == cat.adding_user).first() if cat.adding_user else None
    
    # Get condition, default to NORMAL if None or empty
    condition_value = getattr(pin, 'condition', None)
    if not condition_value or condition_value.strip() == '':
        condition_value = "NORMAL"

    return {
        "location_id": pin.location_id,
        "cat_id": pin.cat_id,
        "latitude": float(pin.latitude),
        "longitude": float(pin.longitude),
        "created_at": str(pin.created_at) if pin.created_at is not None else None,
        "condition": condition_value,
        "name": cat.name if cat else None,
        "age": cat.age if cat else None,
        "gender": cat.gender if cat else None,
        "image_url": cat.image_url if cat else None,
        "notes": cat.notes if cat else None,
        "adding_user_id": cat.adding_user if cat else None,
        "adding_user_username": adding_user.username if adding_user else None,
    }