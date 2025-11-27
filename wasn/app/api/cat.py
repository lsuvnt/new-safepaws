from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select, desc
from app.db.session import get_db
from app.db.models import AdoptionListing, Cat
from app.db.auth import get_current_user_id 

router = APIRouter(prefix="/cats", tags=["cats"])


# ---------- SCHEMAS ----------
class CatIn(BaseModel):
    name: str
    gender: str = "UNKNOWN"
    age: Optional[int] = None
    notes: Optional[str] = None
    image_url: Optional[str] = None


class CatOut(BaseModel):
    cat_id: int
    name: str
    gender: str
    age: Optional[int]
    notes: Optional[str] | None = None
    image_url: Optional[str] | None = None
    adding_user: int | None = None

class CatUpdate(BaseModel):
    name: str | None = None
    gender: str | None = None
    age: int | None = None
    notes: str | None = None
    image_url: str | None = None

# ---------- CREATE CAT ----------
@router.post("/", response_model=CatOut, status_code=201)
def create_cat(payload: CatIn, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    new_cat = Cat(
        name=payload.name,
        gender=payload.gender,
        age=payload.age,
        notes=payload.notes,
        image_url=payload.image_url,
        adding_user=user_id
    )
    db.add(new_cat)
    db.commit()
    db.refresh(new_cat)
    return new_cat


# ---------- LIST CATS ----------
@router.get("/cats", response_model=List[CatOut])
def list_cats(db: Session = Depends(get_db)):
    adoption_subquery = db.query(AdoptionListing.cat_id)
    cats = (
        db.query(Cat)
        .filter(Cat.cat_id.not_in(adoption_subquery))
        .order_by(Cat.cat_id.desc())
        .all()
    )
    return cats

# ---------- UPDATE CAT ----------
@router.put("/cat/{cat_id}", response_model=CatOut)
def update_cat(
    cat_id: int,
    payload: CatUpdate,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):

    # نجيب الكات من الداتابيس
    cat = db.query(Cat).filter(Cat.cat_id == cat_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Cat not found")

    # نشيك إذا الكات موجودة في الادوبشن
    adoption_listing = db.query(AdoptionListing).filter(
        AdoptionListing.cat_id == cat_id
    ).first()

    # إذا كانت موجودة في adoption لازم يكون الي يعدل صاحبها
    if adoption_listing and adoption_listing.uploader_id != current_user_id:
        raise HTTPException(
            status_code=403,
            detail="You cannot edit this cat because it is part of adoption and you are not the owner",
        )

    # إذا وصلنا هنا يعني يا إما الكات ماهي في adoption أو اليوزر هو صاحبها
    if payload.name is not None:
        cat.name = payload.name

    if payload.gender is not None:
        cat.gender = payload.gender

    if payload.age is not None:
        cat.age = payload.age

    if payload.notes is not None:
        cat.notes = payload.notes

    if payload.image_url is not None:
        cat.image_url = payload.image_url

     # Update who modified the cat
    cat.adding_user = current_user_id

    db.commit()
    db.refresh(cat)

    return cat

# ---------- DELETE CAT ----------
@router.delete("/cat/{cat_id}", status_code=204)
def delete_cat(
    cat_id: int,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    cat = db.query(Cat).filter(Cat.cat_id == cat_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Cat not found")

    adoption_listing = (
        db.query(AdoptionListing).filter(AdoptionListing.cat_id == cat_id).first()
    )

    # If in adoption, only uploader can delete
    if adoption_listing and adoption_listing.uploader_id != current_user_id:
        raise HTTPException(status_code=403, detail="Not allowed to delete this cat")

    db.delete(cat)
    db.commit()
    return

@router.get("/mycats", response_model=List[CatOut])
def list_my_cats(
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    cats = (
        db.query(Cat)
        .filter(Cat.adding_user == current_user_id)
        .order_by(Cat.cat_id.desc())
        .all()
    )
    return cats

