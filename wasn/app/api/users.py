from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.models import User
from app.db.schemas import UserCreate, UserLogin, UserUpdate
from app.db.utils import hash_password, verify_password
from app.db.auth import create_access_token, get_current_user
from app.db.session import get_db

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/register", status_code=201)
def register(user: UserCreate, db: Session = Depends(get_db)):

    existing_user = db.query(User).filter(User.username == user.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username is already taken")

    existing_email = db.query(User).filter(User.email == user.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email is already registered")

    hashed_pass = hash_password(user.password)

    new_user = User(
        username=user.username,
        full_name=user.full_name,
        password_hash=hashed_pass,
        email=user.email,
        phone=user.phone
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "User registered successfully!"}


@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    if not verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect password")

    token = create_access_token(data={"sub": db_user.username})
    return {"message": "Login successful", "access_token": token, "token_type": "bearer"}


@router.get("/profile")
def profile(current_user: str = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == current_user).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "message": f"Welcome {current_user}",
        "username": user.username,
        "user_id": user.user_id,
        "email": user.email,
        "phone": user.phone,
        "full_name": user.full_name,
        "profile_picture_url": user.profile_picture_url,
    }


@router.put("/profile/update")
def update_profile(
    updated_data: UserUpdate,
    db: Session = Depends(get_db),
    username: str = Depends(get_current_user)
):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if updated_data.email and updated_data.email != user.email:
        if db.query(User).filter(User.email == updated_data.email).first():
            raise HTTPException(status_code=400, detail="Email already used")
        user.email = updated_data.email

    if updated_data.phone and updated_data.phone != user.phone:
        if db.query(User).filter(User.phone == updated_data.phone).first():
            raise HTTPException(status_code=400, detail="Phone already used")
        user.phone = updated_data.phone

    if updated_data.full_name:
        user.full_name = updated_data.full_name

    if updated_data.password:
        user.password_hash = hash_password(updated_data.password)

    db.commit()
    db.refresh(user)

    return {
        "message": "Profile updated successfully",
        "user": {
            "full_name": user.full_name,
            "email": user.email,
            "phone": user.phone,
            "username": user.username,
        }
    }

