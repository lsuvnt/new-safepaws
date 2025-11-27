from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from pydantic import BaseModel
from app.db.session import get_db
from app.db.auth import get_current_user_id
from app.db.models import AdoptionListing, Cat, CatLocation


router = APIRouter(prefix="/adoptions", tags=["adoptions"])

# ===================== SCHEMAS =====================

class AdoptionListingCreate(BaseModel):
    cat_id: int
    vaccinated: bool = False
    sterilized: bool = False
    notes: str | None = None

class AdoptionListingUpdate(BaseModel):
    vaccinated: bool | None = None
    sterilized: bool | None = None
    notes: str | None = None
    is_active: bool | None = None


class AdoptionListingOut(BaseModel):
    listing_id: int
    cat_id: int
    vaccinated: bool
    sterilized: bool
    is_active: bool
    notes: str | None = None
    created_at: datetime | None = None
    uploader_id: int

    class Config:
        from_attributes = True


# ===================== CREATE =====================
@router.post("/", response_model=AdoptionListingOut, status_code=status.HTTP_201_CREATED)
def create_adoption_listing(
        payload: AdoptionListingCreate,
        current_user_id: int = Depends(get_current_user_id),
        db: Session = Depends(get_db)):

    # Check cat exists
    cat_exists = db.query(Cat).filter(Cat.cat_id == payload.cat_id).first()
    if not cat_exists:
        raise HTTPException(status_code=404, detail="Cat not found")

    # Check if the current user is allowed to adopt this cat
    if cat_exists.adding_user != current_user_id:
        raise HTTPException(
            status_code=403,
            detail="You are not allowed to create adoption listing for this cat"
        )

    # Check if cat is currently in cat_locations (street pin)
    cat_in_location = db.query(CatLocation).filter(
        CatLocation.cat_id == payload.cat_id
    ).first()

    if cat_in_location:
        raise HTTPException(
            status_code=403,
            detail="This cat is currently in street location and cannot be added to adoption listing"
        )

    # Check if already has adoption listing
    existing_listing = db.query(AdoptionListing).filter(
        AdoptionListing.cat_id == payload.cat_id
    ).first()
    if existing_listing:
        raise HTTPException(status_code=400, detail="Cat already has adoption listing")

    # Create Adoption Listing
    listing = AdoptionListing(
        cat_id=payload.cat_id,
        vaccinated=payload.vaccinated,
        sterilized=payload.sterilized,
        notes=payload.notes,
        uploader_id=current_user_id
    )

    db.add(listing)
    db.commit()
    db.refresh(listing)
    return listing
# ===================== LIST ALL =====================

@router.get("/", response_model=list[AdoptionListingOut])
def list_adoptions(db: Session = Depends(get_db)):
    listings = db.query(AdoptionListing).order_by(AdoptionListing.listing_id.desc()).all()
    return listings


# ===================== UPDATE =====================

@router.put("/{listing_id}", response_model=AdoptionListingOut)
def update_adoption_listing(
        listing_id: int,
        payload: AdoptionListingUpdate,
        current_user_id: int = Depends(get_current_user_id),
        db: Session = Depends(get_db)):

    listing = db.query(AdoptionListing).filter(AdoptionListing.listing_id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Adoption listing not found")

    # Only uploader can update
    if listing.uploader_id != current_user_id:
        raise HTTPException(status_code=403, detail="Not allowed to update this listing")

    if payload.vaccinated is not None:
        listing.vaccinated = payload.vaccinated
    if payload.sterilized is not None:
        listing.sterilized = payload.sterilized
    if payload.notes is not None:
        listing.notes = payload.notes
    if payload.is_active is not None:
        listing.is_active = payload.is_active

    db.commit()
    db.refresh(listing)
    return listing


# ===================== DELETE =====================

@router.delete("/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_adoption_listing(
        listing_id: int,
        current_user_id: int = Depends(get_current_user_id),
        db: Session = Depends(get_db)):

    listing = db.query(AdoptionListing).filter(AdoptionListing.listing_id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Adoption listing not found")

    # Only uploader can delete
    if listing.uploader_id != current_user_id:
        raise HTTPException(status_code=403, detail="Not allowed to delete this listing")

    db.delete(listing)
    db.commit()
    

