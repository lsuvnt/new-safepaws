from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import ActivityLog, Cat, AdoptionListing
from app.db.auth import get_current_user_id
from app.db.schemas import ActivityLogOut

router = APIRouter(prefix="/activity", tags=["Activity"])


# ------------------------------
# 1) LIST MY OWN ACTIVITY
# ------------------------------
@router.get("/my", response_model=list[ActivityLogOut])
def list_my_activity(db: Session = Depends(get_db), current_user: int = Depends(get_current_user_id)):
    logs = (
        db.query(ActivityLog)
        .filter(ActivityLog.user_id == current_user)
        .order_by(ActivityLog.activity_time.desc())
        .all()
    )

    # نحول الوقت إلى string قبل الإرجاع
    for log in logs:
        log.activity_time = log.activity_time.isoformat()

    return logs

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
        db.query(ActivityLog)
        .filter(ActivityLog.cat_id == cat_id)
        .order_by(ActivityLog.activity_time.desc())
        .all()
    )

    for log in logs:
        log.activity_time = log.activity_time.isoformat()

    return logs

