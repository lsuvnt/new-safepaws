from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.models import AdoptionRequest, AdoptionListing, Cat
from app.db.session import get_db
from app.db.auth import get_current_user_id
from app.db.schemas import AdoptionRequestCreate, AdoptionRequestOut, StatusEnum


router = APIRouter(prefix="/adoption-requests", tags=["adoption requests"])


@router.post("/", response_model=AdoptionRequestOut, status_code=201)
def create_adoption_request(
    payload: AdoptionRequestCreate,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    # listing exists?
    listing = db.query(AdoptionListing).filter(
        AdoptionListing.listing_id == payload.listing_id,
        AdoptionListing.is_active == True
    ).first()

    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found or inactive")

    # trying to adopt own cat?
    cat = db.query(Cat).filter(Cat.cat_id == listing.cat_id).first()
    if cat.adding_user == current_user_id:
        raise HTTPException(status_code=400, detail="You cannot adopt your own cat")

    # duplicate request?
    duplicate = db.query(AdoptionRequest).filter(
        AdoptionRequest.listing_id == payload.listing_id,
        AdoptionRequest.sender_id == current_user_id
    ).first()
    if duplicate:
        raise HTTPException(status_code=400, detail="Request already exists")

    # create request
    new_req = AdoptionRequest(
        listing_id=payload.listing_id,
        sender_id=current_user_id,
        receiver_id=listing.uploader_id,
        city=payload.city,
        age=payload.age,
        full_name=payload.full_name,
        reason_for_adoption=payload.reason_for_adoption,
        living_situation=payload.living_situation,
        experience_level=payload.experience_level.value,
        has_other_pets=payload.has_other_pets,
        status="Pending"
    )

    db.add(new_req)
    db.commit()
    db.refresh(new_req)

    return new_req
# =============== LIST SENT ===================
@router.get("/sent", response_model=list[AdoptionRequestOut])
def list_sent_requests(current_user_id: int = Depends(get_current_user_id),
                       db: Session = Depends(get_db)):

    return db.query(AdoptionRequest).filter(
        AdoptionRequest.sender_id == current_user_id
    ).all()


# =============== LIST INCOMING ===============
@router.get("/incoming", response_model=list[AdoptionRequestOut])
def list_incoming_requests(current_user_id: int = Depends(get_current_user_id),
                           db: Session = Depends(get_db)):

    return db.query(AdoptionRequest).filter(
        AdoptionRequest.receiver_id == current_user_id,
        AdoptionRequest.status == "Pending"
    ).all()


# =============== HANDLE ACTION ===============
@router.put("/action")
def handle_request_action(request_id: int, action: StatusEnum,
                          current_user_id: int = Depends(get_current_user_id),
                          db: Session = Depends(get_db)):

    request = db.query(AdoptionRequest).filter(
        AdoptionRequest.request_id == request_id,
        AdoptionRequest.receiver_id == current_user_id
    ).first()

    if not request:
        raise HTTPException(status_code=404, detail="Request not found")

    request.status = action.value  # update status
    db.commit()

    return {"detail": f"Request updated to {action.value}"}
# =============== DELETE REQUEST ===================
@router.delete("/{request_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_request(request_id: int,
                   current_user_id: int = Depends(get_current_user_id),
                   db: Session = Depends(get_db)):

    request = db.query(AdoptionRequest).filter(
        AdoptionRequest.request_id == request_id
    ).first()

    if not request:
        raise HTTPException(status_code=404, detail="Request not found")

    # Check if user is allowed to delete
    if request.sender_id != current_user_id and request.receiver_id != current_user_id:
        raise HTTPException(status_code=403, detail="You are not allowed to delete this request")

    # Cannot delete accepted or rejected
    if request.status != "Pending":
        raise HTTPException(status_code=400, detail="Only pending requests can be deleted")

    db.delete(request)
    db.commit()

    return {"detail": "Request deleted successfully"}

