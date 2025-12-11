from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import ActivityLog, Cat, AdoptionListing, User, CatLocation
from app.db.auth import get_current_user_id
from app.db.schemas import ActivityLogOut, ActivityLogCreate

router = APIRouter(prefix="/activity", tags=["Activity"])


# ------------------------------
# 1) LIST MY OWN ACTIVITY
# ------------------------------
@router.get("/my", response_model=list[ActivityLogOut])
def list_my_activity(db: Session = Depends(get_db), current_user: int = Depends(get_current_user_id)):
    logs = (
        db.query(ActivityLog, User)
        .outerjoin(User, ActivityLog.user_id == User.user_id)
        .filter(ActivityLog.user_id == current_user)
        .order_by(ActivityLog.activity_time.desc())
        .all()
    )

    result = []
    for log, user in logs:
        log_dict = {
            "log_id": log.log_id,
            "activity_time": log.activity_time.isoformat() if log.activity_time else "",
            "activity_description": log.activity_description,
            "cat_id": log.cat_id,
            "user_id": log.user_id,
            "username": user.username if user else None,
            "activity_type": "contribution",
        }
        result.append(log_dict)

    return result

# ------------------------------
# 2) LIST ACTIVITY BY CAT
# ------------------------------
@router.get("/cat/{cat_id}", response_model=list[ActivityLogOut])
def list_cat_activity(
    cat_id: int,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user_id)
):
    # Check if cat exists
    cat = db.query(Cat).filter(Cat.cat_id == cat_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Cat not found")

    # Check if cat has active listing (meaning currently for adoption)
    active_listing = (
        db.query(AdoptionListing)
        .filter(AdoptionListing.cat_id == cat_id)
        .first()
    )

    # If currently listed for adoption → only the owner can view activity
    if active_listing and active_listing.uploader_id != current_user:
        raise HTTPException(
            status_code=403,
            detail="Not allowed to view this activity while cat is listed for adoption"
        )

    # Otherwise: return the activity
    logs = (
        db.query(ActivityLog, User)
        .outerjoin(User, ActivityLog.user_id == User.user_id)
        .filter(ActivityLog.cat_id == cat_id)
        .order_by(ActivityLog.activity_time.desc())
        .all()
    )

    result = []
    for log, user in logs:
        log_dict = {
            "log_id": log.log_id,
            "activity_time": log.activity_time.isoformat() if log.activity_time else "",
            "activity_description": log.activity_description,
            "cat_id": log.cat_id,
            "user_id": log.user_id,
            "username": user.username if user else None,
            "activity_type": "contribution",  # Default to contribution
        }
        result.append(log_dict)

    return result

# ------------------------------
# 3) LIST ACTIVITY BY CAT (PUBLIC - for map pins)
# ------------------------------
@router.get("/cat/{cat_id}/public", response_model=list[ActivityLogOut])
def list_cat_activity_public(
    cat_id: int,
    db: Session = Depends(get_db)
):
    # Check if cat exists
    cat = db.query(Cat).filter(Cat.cat_id == cat_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Cat not found")

    # Return activity logs with usernames (no auth required for map pins)
    logs = (
        db.query(ActivityLog, User)
        .outerjoin(User, ActivityLog.user_id == User.user_id)
        .filter(ActivityLog.cat_id == cat_id)
        .order_by(ActivityLog.activity_time.asc())  # Ascending for timeline
        .all()
    )

    result = []
    for log, user in logs:
        # Detect activity type from description
        activity_type = "contribution"
        if log.activity_description:
            desc_upper = log.activity_description.upper()
            if "CONDITION CHANGED TO URGENT" in desc_upper:
                activity_type = "condition_change_urgent"
            elif "CONDITION CHANGED TO AT VET" in desc_upper:
                activity_type = "condition_change_at_vet"
            elif "MARKED AS ADOPTED" in desc_upper or "MARKED AS PASSED" in desc_upper:
                activity_type = "condition_change"
        
        log_dict = {
            "log_id": log.log_id,
            "activity_time": log.activity_time.isoformat() if log.activity_time else "",
            "activity_description": log.activity_description,
            "cat_id": log.cat_id,
            "user_id": log.user_id,
            "username": user.username if user else None,
            "activity_type": activity_type,
        }
        result.append(log_dict)

    return result

# ------------------------------
# 4) CREATE ACTIVITY LOG ENTRY
# ------------------------------
@router.post("/", response_model=ActivityLogOut, status_code=201)
def create_activity_log(
    payload: ActivityLogCreate,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    # Check if cat exists
    cat = db.query(Cat).filter(Cat.cat_id == payload.cat_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Cat not found")

    # Check if cat has a location (is on the map)
    cat_location = db.query(CatLocation).filter(CatLocation.cat_id == payload.cat_id).first()
    if not cat_location:
        raise HTTPException(status_code=404, detail="Cat location not found")

    # Check if cat is AT VET, ADOPTED, or PASSED - cannot add contributions
    if cat_location.condition in ["AT VET", "ADOPTED", "PASSED"]:
        raise HTTPException(
            status_code=403,
            detail=f"Cannot add contributions while cat is {cat_location.condition.lower()}"
        )

    # Create activity log entry
    new_log = ActivityLog(
        cat_id=payload.cat_id,
        user_id=current_user_id,
        activity_description=payload.activity_description,
    )

    db.add(new_log)
    db.commit()
    db.refresh(new_log)

    # Get username
    user = db.query(User).filter(User.user_id == current_user_id).first()

    return {
        "log_id": new_log.log_id,
        "activity_time": new_log.activity_time.isoformat() if new_log.activity_time else "",
        "activity_description": new_log.activity_description,
        "cat_id": new_log.cat_id,
        "user_id": new_log.user_id,
        "username": user.username if user else None,
        "activity_type": "contribution",
    }

