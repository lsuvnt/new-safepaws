from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Integer, Float, TIMESTAMP, func, ForeignKey, String, Column, Boolean, Enum, Text
from datetime import datetime
from app.db.session import Base
from sqlalchemy.sql import func as sql_func

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    full_name = Column(String(100))
    password_hash = Column(String(255), nullable=False)
    email = Column(String(100), unique=True)
    phone = Column(String(20))
    created_at = Column(TIMESTAMP, server_default=sql_func.now())
    profile_picture_url = Column(String(255))

class Cat(Base):
    __tablename__ = "cats"

    cat_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(80))
    gender = Column(Enum("M", "F", "UNKNOWN", name="gender_enum"), nullable=False, default="UNKNOWN")
    age = Column(Integer)
    notes = Column(Text)
    image_url = Column(String(255))
    adding_user = Column(Integer, ForeignKey("users.user_id", ondelete="SET NULL", onupdate="CASCADE"))
    
class CatLocation(Base):
    __tablename__ = "cat_locations"
    location_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    cat_id: Mapped[int] = mapped_column(ForeignKey("cats.cat_id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    condition: Mapped[str] = mapped_column(
        "condition_flag", 
        Enum("NORMAL", "AT VET", "URGENT", "UNKNOWN", "ADOPTED", "PASSED", name="condition_flag_enum"),
        nullable=False,
        default="UNKNOWN"
    )
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP, server_default=func.now(), nullable=False
    )

class AdoptionListing(Base):
    __tablename__ = "adoption_listings"
    listing_id = Column(Integer, primary_key=True, index=True)
    vaccinated = Column(Boolean, default=False)
    sterilized = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    notes = Column(Text)
    created_at = Column(TIMESTAMP, server_default=sql_func.now())
    uploader_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    cat_id = Column(Integer, ForeignKey("cats.cat_id"), nullable=False)    


class AdoptionRequest(Base):
    __tablename__ = "adoption_requests"

    request_id = Column(Integer, primary_key=True, index=True)
    listing_id = Column(Integer, ForeignKey("adoption_listings.listing_id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)

    sender_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)

    city = Column(String(100))
    age = Column(Integer)
    full_name = Column(String(100))
    reason_for_adoption = Column(Text)
    living_situation = Column(Text)

    experience_level = Column(Enum("None","Minimal","Fairly experienced","Good with cats", name="experience_level"), nullable=False, default="None")

    has_other_pets = Column(Boolean, nullable=False, default=False)

    status = Column(Enum("Pending","Accepted","Rejected", name="request_status_enum"), nullable=False, default="Pending")

    submitted_at = Column(TIMESTAMP, server_default=sql_func.now())


class Notification(Base):
    __tablename__ = "notifications"

    notification_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, server_default=sql_func.now(), nullable=False)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)