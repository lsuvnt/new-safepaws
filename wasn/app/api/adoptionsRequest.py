from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.models import AdoptionRequest, AdoptionListing, Cat, Notification, User
from app.db.session import get_db
from app.db.auth import get_current_user_id
from app.db.schemas import AdoptionRequestCreate, AdoptionRequestOut, StatusEnum, AcceptedRequestWithContact


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

    # Get sender and cat info for notifications
    sender = db.query(User).filter(User.user_id == current_user_id).first()
    receiver = db.query(User).filter(User.user_id == listing.uploader_id).first()
    
    # Create notification for sender
    sender_notification = Notification(
        user_id=current_user_id,
        message=f"Your adoption request for {cat.name} has been submitted"
    )
    db.add(sender_notification)
    
    # Create notification for receiver (include request_id for parsing)
    receiver_notification = Notification(
        user_id=listing.uploader_id,
        message=f"New adoption request for {cat.name} from {sender.full_name or sender.username} [REQUEST_ID:{new_req.request_id}]"
    )
    db.add(receiver_notification)
    
    db.commit()

    return new_req
# =============== LIST SENT ===================
@router.get("/sent", response_model=list[AdoptionRequestOut])
def list_sent_requests(current_user_id: int = Depends(get_current_user_id),
                       db: Session = Depends(get_db)):

    return db.query(AdoptionRequest).filter(
        AdoptionRequest.sender_id == current_user_id
    ).all()


# =============== LIST ACCEPTED OUTGOING WITH CONTACT INFO ===============
@router.get("/sent/accepted", response_model=list[AcceptedRequestWithContact])
def list_accepted_sent_requests(current_user_id: int = Depends(get_current_user_id),
                                 db: Session = Depends(get_db)):
    """
    Get all accepted adoption requests sent by the current user.
    Includes contact information (email, phone) of the receiver (listing uploader).
    """
    requests = db.query(AdoptionRequest).filter(
        AdoptionRequest.sender_id == current_user_id,
        AdoptionRequest.status == "Accepted"
    ).order_by(AdoptionRequest.submitted_at.desc()).all()
    
    result = []
    for req in requests:
        # Get receiver (listing uploader) information
        receiver = db.query(User).filter(User.user_id == req.receiver_id).first()
        
        # Get cat name from listing
        listing = db.query(AdoptionListing).filter(AdoptionListing.listing_id == req.listing_id).first()
        cat_name = None
        if listing:
            cat = db.query(Cat).filter(Cat.cat_id == listing.cat_id).first()
            cat_name = cat.name if cat else None
        
        req_dict = {
            "request_id": req.request_id,
            "listing_id": req.listing_id,
            "cat_name": cat_name,
            "receiver_id": req.receiver_id,
            "receiver_name": (receiver.full_name or receiver.username) if receiver else None,
            "receiver_email": receiver.email if receiver else None,
            "receiver_phone": receiver.phone if receiver else None,
            "submitted_at": req.submitted_at
        }
        result.append(req_dict)
    
    return result


# =============== LIST INCOMING ===============
@router.get("/incoming", response_model=list[AdoptionRequestOut])
def list_incoming_requests(current_user_id: int = Depends(get_current_user_id),
                           db: Session = Depends(get_db)):

    requests = db.query(AdoptionRequest).filter(
        AdoptionRequest.receiver_id == current_user_id,
        AdoptionRequest.status == "Pending"
    ).all()
    
    # Add sender_name from User model for matching with notifications
    result = []
    for req in requests:
        sender = db.query(User).filter(User.user_id == req.sender_id).first()
        req_dict = {
            "request_id": req.request_id,
            "listing_id": req.listing_id,
            "sender_id": req.sender_id,
            "receiver_id": req.receiver_id,
            "city": req.city,
            "age": req.age,
            "full_name": req.full_name,
            "reason_for_adoption": req.reason_for_adoption,
            "living_situation": req.living_situation,
            "experience_level": req.experience_level,
            "has_other_pets": req.has_other_pets,
            "status": req.status,
            "sender_name": (sender.full_name or sender.username) if sender else None,
            "submitted_at": req.submitted_at.isoformat() if req.submitted_at else None
        }
        result.append(req_dict)
    
    return result

# =============== LIST ALL INCOMING (INCLUDING PROCESSED) ===============
@router.get("/incoming/all", response_model=list[AdoptionRequestOut])
def list_all_incoming_requests(current_user_id: int = Depends(get_current_user_id),
                               db: Session = Depends(get_db)):

    requests = db.query(AdoptionRequest).filter(
        AdoptionRequest.receiver_id == current_user_id
    ).order_by(AdoptionRequest.submitted_at.desc()).all()
    
    # Add sender_name from User model for matching with notifications
    result = []
    for req in requests:
        sender = db.query(User).filter(User.user_id == req.sender_id).first()
        req_dict = {
            "request_id": req.request_id,
            "listing_id": req.listing_id,
            "sender_id": req.sender_id,
            "receiver_id": req.receiver_id,
            "city": req.city,
            "age": req.age,
            "full_name": req.full_name,
            "reason_for_adoption": req.reason_for_adoption,
            "living_situation": req.living_situation,
            "experience_level": req.experience_level,
            "has_other_pets": req.has_other_pets,
            "status": req.status,
            "sender_name": (sender.full_name or sender.username) if sender else None,
            "submitted_at": req.submitted_at.isoformat() if req.submitted_at else None
        }
        result.append(req_dict)
    
    return result

# =============== GET SINGLE REQUEST ===============
@router.get("/{request_id}", response_model=AdoptionRequestOut)
def get_adoption_request(
    request_id: int,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    request = db.query(AdoptionRequest).filter(
        AdoptionRequest.request_id == request_id
    ).first()

    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    # Check if user has permission (sender or receiver)
    if request.sender_id != current_user_id and request.receiver_id != current_user_id:
        raise HTTPException(status_code=403, detail="You are not allowed to view this request")

    return request


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

    old_status = request.status
    request.status = action.value  # update status
    db.commit()
    
    # Create notifications for status change
    if old_status == "Pending":
        # Get cat and user info
        listing = db.query(AdoptionListing).filter(AdoptionListing.listing_id == request.listing_id).first()
        cat = db.query(Cat).filter(Cat.cat_id == listing.cat_id).first()
        sender = db.query(User).filter(User.user_id == request.sender_id).first()
        receiver = db.query(User).filter(User.user_id == current_user_id).first()
        
        if action.value == "Accepted":
            # Notification for sender
            sender_notification = Notification(
                user_id=request.sender_id,
                message=f"Your adoption request for {cat.name} has been accepted!"
            )
            db.add(sender_notification)
            
            # Notification for receiver
            receiver_notification = Notification(
                user_id=current_user_id,
                message=f"You accepted the adoption request from {sender.full_name or sender.username} for {cat.name}"
            )
            db.add(receiver_notification)
        elif action.value == "Rejected":
            # Notification for sender
            sender_notification = Notification(
                user_id=request.sender_id,
                message=f"Your adoption request for {cat.name} was rejected"
            )
            db.add(sender_notification)
            
            # Notification for receiver
            receiver_notification = Notification(
                user_id=current_user_id,
                message=f"You rejected the adoption request from {sender.full_name or sender.username} for {cat.name}"
            )
            db.add(receiver_notification)
        
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

