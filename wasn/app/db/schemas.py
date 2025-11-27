from pydantic import BaseModel, Field, EmailStr, field_validator
import re

class UserCreate(BaseModel):
    username: str = Field(
        min_length=3,
        max_length=20,
        description="Username must contain letters, numbers or underscores only"
    )

    password: str = Field(
        min_length=8,
        max_length=20,
        description="Password must be 8-20 characters and include letters & numbers"
    )

    full_name: str = Field(min_length=2, max_length=50)

    email: EmailStr

    phone: str = Field(min_length=10, max_length=13)

    # -------- Password Validation --------
    @field_validator("password")
    def validate_password(cls, value):
        if not re.search(r"[A-Za-z]", value):
            raise ValueError("Password must contain at least one letter")
        if not re.search(r"\d", value):
            raise ValueError("Password must contain at least one number")
        return value

    # -------- Username Validation --------
    @field_validator("username")
    def validate_username(cls, value):
        if not re.match(r"^[A-Za-z0-9_]+$", value):
            raise ValueError("Username can only contain letters, numbers, and _")
        return value

    # -------- Phone Validation (Saudi) --------
    @field_validator("phone")
    def validate_phone(cls, value):
        if not re.match(r"^(05)[0-9]{8}$", value):
            raise ValueError("Phone must start with 05 and be 10 digits long")
        return value
    
class UserLogin(BaseModel):
    username: str
    password: str 


class UserUpdate(BaseModel):
    full_name: str | None = Field(None, min_length=2, max_length=50)
    email: EmailStr | None
    phone: str | None = Field(
        None,
        pattern=r"^05\d{8}$",
        description="Phone must be a Saudi number starting with 05"
    )
    password: str | None = Field(
        None,
        min_length=8,
        max_length=20,
        description="Password must be 8-20 characters"
    )

from pydantic import BaseModel
from enum import Enum


from enum import Enum

class ExperienceEnum(str, Enum):
    NONE = "None"
    MINIMAL = "Minimal"
    FAIR = "Fairly experienced"
    GOOD = "Good with cats"


class StatusEnum(str, Enum):
    PENDING = "Pending"
    ACCEPTED = "Accepted"
    REJECTED = "Rejected"
    
class AdoptionRequestCreate(BaseModel):
    listing_id: int
    city: str
    age: int
    full_name: str
    reason_for_adoption: str
    living_situation: str
    experience_level: ExperienceEnum
    has_other_pets: bool


class AdoptionRequestOut(BaseModel):
    request_id: int
    listing_id: int
    sender_id: int
    receiver_id: int
    city: str
    age: int
    full_name: str
    reason_for_adoption: str
    living_situation: str
    experience_level: str
    has_other_pets: bool
    status: StatusEnum

    class Config:
        from_attributes = True


from datetime import datetime


class NotificationOut(BaseModel):
    notification_id: int
    message: str
    is_read: bool
    created_at: datetime | None = None
    user_id: int

    class Config:
        from_attributes = True

