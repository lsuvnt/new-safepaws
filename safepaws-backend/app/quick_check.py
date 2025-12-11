# app/quick_check.py
from sqlalchemy import text, inspect
from app.db.session import engine, SessionLocal
import app.db.models as m  

def main():
    insp = inspect(engine)
    print("📦 Tables:", insp.get_table_names())
    with SessionLocal() as s:
        for tbl in ["users", "cats", "cat_locations", "adoption_requests", "notifications", "activity_log"]:
            if tbl in insp.get_table_names():
                cnt = s.execute(text(f"SELECT COUNT(*) FROM {tbl}")).scalar()
                print(f"✅ {tbl}: {cnt} rows")
            else:
                print(f"⚠️ {tbl}: جدول غير موجود")

if name == "__main__":
    main()