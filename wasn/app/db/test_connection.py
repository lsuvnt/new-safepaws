import os
from urllib.parse import quote_plus
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

user = os.getenv("DB_USER")
pwd  = quote_plus(os.getenv("DB_PASSWORD") or "")
host = os.getenv("DB_HOST", "127.0.0.1")
port = os.getenv("DB_PORT", "3306")
name = os.getenv("DB_NAME", "safepaws")

url = f"mysql+mysqlconnector://{user}:{pwd}@{host}:{port}/{name}"
print("Trying:", url.replace(pwd, "*****"))

engine = create_engine(url, pool_pre_ping=True)

try:
    with engine.connect() as conn:
        db_name = conn.execute(text("SELECT DATABASE();")).scalar()
        print(f"✅ Connected successfully to database: {db_name}")
except Exception as e:
    print(f"❌ Connection failed: {e}")