from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import Notification
from app.db.schemas import NotificationOut
from app.db.auth import get_current_user_id

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/", response_model=list[NotificationOut])
def list_notifications(
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):

    return (
        db.query(Notification)
        .filter(Notification.user_id == current_user_id)
        .order_by(Notification.created_at.desc())
        .all()
    )


@router.get("/unread-count", response_model=int)
def get_unread_count(
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
   
    return (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user_id,
            Notification.is_read == False,  # noqa: E712
        )
        .count()
    )


@router.post("/mark-all-read", status_code=status.HTTP_204_NO_CONTENT)
def mark_all_as_read(
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    
    (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user_id,
            Notification.is_read == False,  # noqa: E712
        )
        .update({"is_read": True})
    )
    db.commit()
    return


@router.post("/{notification_id}/read", status_code=status.HTTP_204_NO_CONTENT)
def mark_single_as_read(
    notification_id: int,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
  
    notification = (
        db.query(Notification)
        .filter(
            Notification.notification_id == notification_id,
            Notification.user_id == current_user_id,
        )
        .first()
    )

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found"
        )

    if not notification.is_read:
        notification.is_read = True
        db.commit()

    return