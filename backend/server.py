from fastapi import FastAPI, APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
import uuid
import bcrypt
from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# ---- Config ----
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ.get('JWT_SECRET', 'exzibo-manager-dev-secret-change-me-in-prod')
JWT_ALGORITHM = 'HS256'
JWT_EXP_MINUTES = 60 * 24 * 7  # 7 days

# ---- App ----
app = FastAPI(title="Exzibo Manager API")
api_router = APIRouter(prefix="/api")
bearer_scheme = HTTPBearer(auto_error=False)

logger = logging.getLogger("exzibo")
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')


# ---- Models ----
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(min_length=1)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserPublic(BaseModel):
    id: str
    email: EmailStr
    name: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


class RestaurantOut(BaseModel):
    id: str
    name: str
    role: str  # owner | admin | manager | staff


class BootstrapResponse(BaseModel):
    user: UserPublic
    restaurants: List[RestaurantOut]


# ---- Booking models ----
class BookingCreate(BaseModel):
    restaurant_id: str
    guest_name: str = Field(min_length=1)
    phone_code: str = Field(min_length=1)
    phone: str = Field(min_length=1)
    date: str  # ISO YYYY-MM-DD
    time: str  # HH:MM (24h)
    guests: int = Field(ge=1, le=50)
    booking_type: str  # 'table' | 'room'
    seating_area: str  # e.g. 'Main hall', 'Terrace', 'Bar', 'Private wing'
    seat: str  # table or room identifier
    status: str  # 'pending' | 'confirmed'
    source: str  # 'phone' | 'walk-in' | 'whatsapp' | 'other'
    special_request: Optional[str] = None
    staff_note: Optional[str] = None


class BookingOut(BaseModel):
    id: str
    restaurant_id: str
    guest_name: str
    phone_code: str
    phone: str
    date: str
    time: str
    guests: int
    booking_type: str
    seating_area: str
    seat: str
    status: str
    source: str
    special_request: Optional[str] = None
    staff_note: Optional[str] = None
    created_at: str


# ---- Helpers ----
def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False


def create_access_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=JWT_EXP_MINUTES),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_user(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> dict:
    if creds is None or not creds.credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def user_public(user: dict) -> UserPublic:
    return UserPublic(id=user["id"], email=user["email"], name=user.get("name", ""))


# ---- Routes ----
@api_router.get("/")
async def root():
    return {"message": "Exzibo Manager API", "ok": True}


@api_router.post("/auth/register", response_model=TokenResponse)
async def register(payload: UserRegister):
    existing = await db.users.find_one({"email": payload.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = str(uuid.uuid4())
    doc = {
        "id": user_id,
        "email": payload.email.lower(),
        "name": payload.name,
        "hashed_password": hash_password(payload.password),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(doc)

    # Attach the new user to a demo restaurant automatically so they have data.
    demo = await db.restaurants.find_one({"slug": "demo-diner"}, {"_id": 0})
    if demo:
        await db.memberships.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "restaurant_id": demo["id"],
            "role": "manager",
        })

    token = create_access_token(user_id)
    return TokenResponse(access_token=token, user=user_public(doc))


@api_router.post("/auth/login", response_model=TokenResponse)
async def login(payload: UserLogin):
    user = await db.users.find_one({"email": payload.email.lower()}, {"_id": 0})
    if not user or not verify_password(payload.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user["id"])
    return TokenResponse(access_token=token, user=user_public(user))


@api_router.get("/auth/me", response_model=UserPublic)
async def me(user: dict = Depends(get_current_user)):
    return user_public(user)


@api_router.get("/bootstrap", response_model=BootstrapResponse)
async def bootstrap(user: dict = Depends(get_current_user)):
    memberships = await db.memberships.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    rest_ids = [m["restaurant_id"] for m in memberships]
    role_by_rid = {m["restaurant_id"]: m["role"] for m in memberships}
    restaurants: List[RestaurantOut] = []
    if rest_ids:
        cursor = db.restaurants.find({"id": {"$in": rest_ids}}, {"_id": 0})
        async for r in cursor:
            restaurants.append(RestaurantOut(id=r["id"], name=r["name"], role=role_by_rid.get(r["id"], "staff")))
    return BootstrapResponse(user=user_public(user), restaurants=restaurants)


# ---- Bookings ----
async def _user_can_access_restaurant(user_id: str, restaurant_id: str) -> bool:
    m = await db.memberships.find_one({"user_id": user_id, "restaurant_id": restaurant_id})
    return m is not None


def _time_to_minutes(t: str) -> int:
    hh, mm = t.split(":")
    return int(hh) * 60 + int(mm)


@api_router.get("/bookings", response_model=List[BookingOut])
async def list_bookings(
    restaurant_id: str,
    date: Optional[str] = None,
    user: dict = Depends(get_current_user),
):
    if not await _user_can_access_restaurant(user["id"], restaurant_id):
        raise HTTPException(status_code=403, detail="No access to this restaurant")
    q: dict = {"restaurant_id": restaurant_id}
    if date:
        q["date"] = date
    cursor = db.bookings.find(q, {"_id": 0}).sort("time", 1)
    return [BookingOut(**b) async for b in cursor]


@api_router.post("/bookings", response_model=BookingOut, status_code=201)
async def create_booking(payload: BookingCreate, user: dict = Depends(get_current_user)):
    if not await _user_can_access_restaurant(user["id"], payload.restaurant_id):
        raise HTTPException(status_code=403, detail="No access to this restaurant")

    # Basic validation
    try:
        dt = datetime.strptime(f"{payload.date} {payload.time}", "%Y-%m-%d %H:%M")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date or time")
    if payload.booking_type not in ("table", "room"):
        raise HTTPException(status_code=400, detail="booking_type must be table or room")
    if payload.status not in ("pending", "confirmed"):
        raise HTTPException(status_code=400, detail="status must be pending or confirmed")
    if payload.source not in ("phone", "walk-in", "whatsapp", "other"):
        raise HTTPException(status_code=400, detail="invalid source")

    # Conflict check: same restaurant + same table/room + same date + within 90 minutes
    same_slot = db.bookings.find({
        "restaurant_id": payload.restaurant_id,
        "seat": payload.seat,
        "date": payload.date,
    }, {"_id": 0})
    target = _time_to_minutes(payload.time)
    async for b in same_slot:
        try:
            other = _time_to_minutes(b["time"])
        except Exception:
            continue
        if abs(other - target) < 90 and b.get("status") != "completed":
            raise HTTPException(
                status_code=409,
                detail=f"{payload.seat} already booked at {b['time']} on {payload.date}",
            )

    doc = {
        "id": str(uuid.uuid4()),
        **payload.dict(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.bookings.insert_one(doc)
    doc.pop("_id", None)
    return BookingOut(**doc)


# ---- Seed data ----
async def seed_demo():
    # Demo user
    demo_email = "demo@exzibo.com"
    demo_user = await db.users.find_one({"email": demo_email})
    if not demo_user:
        demo_id = str(uuid.uuid4())
        await db.users.insert_one({
            "id": demo_id,
            "email": demo_email,
            "name": "Demo Owner",
            "hashed_password": hash_password("demo1234"),
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info(f"Seeded demo user {demo_email} / demo1234")
    else:
        demo_id = demo_user["id"]

    # Demo restaurants
    demo_restaurants = [
        {"slug": "demo-diner", "name": "Demo Diner", "role": "owner"},
        {"slug": "sunset-bistro", "name": "Sunset Bistro", "role": "admin"},
        {"slug": "urban-eats", "name": "Urban Eats Cafe", "role": "manager"},
    ]
    for r in demo_restaurants:
        existing = await db.restaurants.find_one({"slug": r["slug"]}, {"_id": 0})
        if not existing:
            rid = str(uuid.uuid4())
            await db.restaurants.insert_one({
                "id": rid,
                "slug": r["slug"],
                "name": r["name"],
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
            existing_id = rid
        else:
            existing_id = existing["id"]
        # Membership
        m = await db.memberships.find_one({"user_id": demo_id, "restaurant_id": existing_id})
        if not m:
            await db.memberships.insert_one({
                "id": str(uuid.uuid4()),
                "user_id": demo_id,
                "restaurant_id": existing_id,
                "role": r["role"],
            })

    # Seed a few bookings for demo diner (today + tomorrow)
    dd = await db.restaurants.find_one({"slug": "demo-diner"}, {"_id": 0})
    if dd:
        already = await db.bookings.count_documents({"restaurant_id": dd["id"]})
        if already == 0:
            today = datetime.now(timezone.utc).date()
            tomorrow = today + timedelta(days=1)
            seed_bookings = [
                {"guest_name": "Farah Sheikh",   "phone_code": "+91", "phone": "9010130022", "time": "19:30", "guests": 4, "booking_type": "table", "seating_area": "Main hall", "seat": "T-04", "status": "confirmed", "source": "phone",    "special_request": "Anniversary",       "date": today.isoformat()},
                {"guest_name": "Manish Aggarwal","phone_code": "+91", "phone": "9822090011", "time": "20:00", "guests": 2, "booking_type": "table", "seating_area": "Bar",       "seat": "T-11", "status": "confirmed", "source": "walk-in",  "special_request": None,                "date": today.isoformat()},
                {"guest_name": "Ishaan Verma",   "phone_code": "+91", "phone": "9650012345", "time": "20:15", "guests": 4, "booking_type": "table", "seating_area": "Terrace",   "seat": "T-06", "status": "confirmed", "source": "whatsapp", "special_request": "Vegetarian menu",   "date": today.isoformat()},
                {"guest_name": "Neha Rao",       "phone_code": "+91", "phone": "9021155432", "time": "21:00", "guests": 6, "booking_type": "table", "seating_area": "Main hall", "seat": "T-02", "status": "pending",   "source": "phone",    "special_request": None,                "date": today.isoformat()},
                {"guest_name": "Karan Malik",    "phone_code": "+91", "phone": "9234567890", "time": "13:00", "guests": 3, "booking_type": "table", "seating_area": "Terrace",   "seat": "T-08", "status": "confirmed", "source": "phone",    "special_request": None,                "date": tomorrow.isoformat()},
            ]
            for b in seed_bookings:
                await db.bookings.insert_one({
                    "id": str(uuid.uuid4()),
                    "restaurant_id": dd["id"],
                    "staff_note": None,
                    **b,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                })
            logger.info("Seeded demo bookings for Demo Diner")


@app.on_event("startup")
async def on_startup():
    await seed_demo()


@app.on_event("shutdown")
async def on_shutdown():
    client.close()


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
