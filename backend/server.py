from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import logging
import random
from datetime import datetime, timezone, timedelta
from typing import Optional, List

import bcrypt
import jwt
from bson import ObjectId
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field

from seed_data import PUZZLES

# ---------------- Config ----------------
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALG = "HS256"
ACCESS_TTL_MIN = 60 * 24  # 1 day for convenience

# Level progression rules: solve N puzzles in current tier to unlock next
LEVEL_ORDER = ["beginner", "intermediate", "advanced", "expert"]
PUZZLES_TO_UNLOCK_NEXT = 5

# ---------------- DB ----------------
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

# ---------------- App ----------------
app = FastAPI(title="TechTangle API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("techtangle")

# ---------------- Helpers ----------------
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False

def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TTL_MIN),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

def scramble_word(word: str) -> str:
    """Deterministic-feeling scramble that guarantees the result != word."""
    letters = list(word.upper())
    if len(letters) <= 1:
        return word
    shuffled = letters[:]
    for _ in range(10):
        random.shuffle(shuffled)
        if "".join(shuffled) != word.upper():
            return "".join(shuffled)
    # last resort: swap first two
    shuffled = letters[:]
    shuffled[0], shuffled[1] = shuffled[1], shuffled[0]
    return "".join(shuffled)

def serialize_user(u: dict) -> dict:
    return {
        "id": str(u["_id"]),
        "email": u["email"],
        "name": u.get("name", ""),
        "role": u.get("role", "student"),
        "points": u.get("points", 0),
        "current_level": u.get("current_level", "beginner"),
        "puzzles_solved": u.get("puzzles_solved", 0),
        "streak": u.get("streak", 0),
        "badges": u.get("badges", []),
        "level_progress": u.get("level_progress", {}),
        "created_at": u.get("created_at").isoformat() if isinstance(u.get("created_at"), datetime) else u.get("created_at"),
    }

def serialize_puzzle_public(p: dict) -> dict:
    """Puzzle as shown to a student (no answer)."""
    return {
        "id": str(p["_id"]),
        "scrambled": scramble_word(p["word"]),
        "length": len(p["word"]),
        "definition": p["definition"],
        "category": p.get("category", ""),
        "difficulty": p["difficulty"],
        "points_reward": p.get("points_reward", 10),
    }

def serialize_puzzle_admin(p: dict) -> dict:
    return {
        "id": str(p["_id"]),
        "word": p["word"],
        "definition": p["definition"],
        "category": p.get("category", ""),
        "difficulty": p["difficulty"],
        "points_reward": p.get("points_reward", 10),
        "created_at": p.get("created_at").isoformat() if isinstance(p.get("created_at"), datetime) else p.get("created_at"),
    }

# ---------------- Auth Dependency ----------------
async def get_current_user(request: Request) -> dict:
    token = None
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
    if not token:
        token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ---------------- Models ----------------
class RegisterIn(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class SubmitAnswerIn(BaseModel):
    puzzle_id: str
    answer: str

class PuzzleIn(BaseModel):
    word: str = Field(min_length=2, max_length=40)
    definition: str = Field(min_length=5, max_length=500)
    category: str = Field(default="General", max_length=60)
    difficulty: str = Field(pattern="^(beginner|intermediate|advanced|expert)$")
    points_reward: int = Field(default=10, ge=1, le=200)

# ---------------- Routes: Auth ----------------
@api.get("/")
async def root():
    return {"name": "TechTangle API", "status": "ok"}

@api.post("/auth/register")
async def register(body: RegisterIn, response: Response):
    email = body.email.lower().strip()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    doc = {
        "email": email,
        "password_hash": hash_password(body.password),
        "name": body.name.strip(),
        "role": "student",
        "points": 0,
        "current_level": "beginner",
        "puzzles_solved": 0,
        "streak": 0,
        "badges": [],
        "level_progress": {"beginner": 0, "intermediate": 0, "advanced": 0, "expert": 0},
        "unlocked_levels": ["beginner"],
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.users.insert_one(doc)
    doc["_id"] = result.inserted_id
    token = create_access_token(str(result.inserted_id), email, "student")
    return {"token": token, "user": serialize_user(doc)}

@api.post("/auth/login")
async def login(body: LoginIn):
    email = body.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(str(user["_id"]), email, user.get("role", "student"))
    return {"token": token, "user": serialize_user(user)}

@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return serialize_user(user)

# ---------------- Routes: Levels ----------------
@api.get("/levels")
async def get_levels(user: dict = Depends(get_current_user)):
    unlocked = set(user.get("unlocked_levels", ["beginner"]))
    progress = user.get("level_progress", {})
    out = []
    for lvl in LEVEL_ORDER:
        count = await db.puzzles.count_documents({"difficulty": lvl})
        out.append({
            "level": lvl,
            "unlocked": lvl in unlocked,
            "solved": progress.get(lvl, 0),
            "total": count,
            "puzzles_needed_to_unlock_next": PUZZLES_TO_UNLOCK_NEXT,
        })
    return out

# ---------------- Routes: Puzzles (Student) ----------------
@api.get("/puzzles/next")
async def next_puzzle(level: str, user: dict = Depends(get_current_user)):
    if level not in LEVEL_ORDER:
        raise HTTPException(status_code=400, detail="Invalid level")
    if level not in user.get("unlocked_levels", ["beginner"]):
        raise HTTPException(status_code=403, detail="Level locked")

    # exclude puzzles the user has already solved
    solved_ids = await db.attempts.distinct(
        "puzzle_id", {"user_id": str(user["_id"]), "is_correct": True}
    )
    solved_obj_ids = [ObjectId(pid) for pid in solved_ids if ObjectId.is_valid(pid)]

    pipeline = [
        {"$match": {"difficulty": level, "_id": {"$nin": solved_obj_ids}}},
        {"$sample": {"size": 1}},
    ]
    docs = await db.puzzles.aggregate(pipeline).to_list(length=1)
    if not docs:
        return {"puzzle": None, "message": "All puzzles solved in this level!"}
    return {"puzzle": serialize_puzzle_public(docs[0])}

@api.post("/puzzles/submit")
async def submit_answer(body: SubmitAnswerIn, user: dict = Depends(get_current_user)):
    if not ObjectId.is_valid(body.puzzle_id):
        raise HTTPException(status_code=400, detail="Invalid puzzle id")
    puzzle = await db.puzzles.find_one({"_id": ObjectId(body.puzzle_id)})
    if not puzzle:
        raise HTTPException(status_code=404, detail="Puzzle not found")

    given = body.answer.strip().upper()
    correct = given == puzzle["word"].upper()

    # log attempt
    await db.attempts.insert_one({
        "user_id": str(user["_id"]),
        "puzzle_id": body.puzzle_id,
        "answer_given": given,
        "is_correct": correct,
        "attempted_at": datetime.now(timezone.utc),
    })

    response_payload = {
        "correct": correct,
        "answer": puzzle["word"].upper(),
        "definition": puzzle["definition"],
    }

    if not correct:
        # streak resets on wrong
        await db.users.update_one({"_id": user["_id"]}, {"$set": {"streak": 0}})
        return response_payload

    # check if already counted as solved (avoid double-credit)
    prior_correct = await db.attempts.count_documents({
        "user_id": str(user["_id"]),
        "puzzle_id": body.puzzle_id,
        "is_correct": True,
    })
    if prior_correct > 1:
        return {**response_payload, "already_solved": True}

    # award points & progress
    points_reward = puzzle.get("points_reward", 10)
    level = puzzle["difficulty"]

    new_progress = dict(user.get("level_progress", {}))
    new_progress[level] = new_progress.get(level, 0) + 1
    new_streak = user.get("streak", 0) + 1
    new_points = user.get("points", 0) + points_reward
    new_solved_total = user.get("puzzles_solved", 0) + 1

    unlocked = list(user.get("unlocked_levels", ["beginner"]))
    next_unlocked = None
    if new_progress[level] >= PUZZLES_TO_UNLOCK_NEXT:
        try:
            next_level = LEVEL_ORDER[LEVEL_ORDER.index(level) + 1]
            if next_level not in unlocked:
                unlocked.append(next_level)
                next_unlocked = next_level
        except IndexError:
            pass

    # badges
    badges = list(user.get("badges", []))
    def add_badge(b):
        if b not in badges:
            badges.append(b)
    if new_solved_total == 1:
        add_badge("First Solve")
    if new_streak >= 5:
        add_badge("5x Streak")
    if new_streak >= 10:
        add_badge("Hot Streak")
    if new_progress.get("beginner", 0) >= PUZZLES_TO_UNLOCK_NEXT:
        add_badge("Beginner Conqueror")
    if new_progress.get("intermediate", 0) >= PUZZLES_TO_UNLOCK_NEXT:
        add_badge("Intermediate Conqueror")
    if new_progress.get("advanced", 0) >= PUZZLES_TO_UNLOCK_NEXT:
        add_badge("Advanced Conqueror")
    if new_progress.get("expert", 0) >= PUZZLES_TO_UNLOCK_NEXT:
        add_badge("Expert Conqueror")

    # update current_level to highest unlocked
    highest = "beginner"
    for lvl in LEVEL_ORDER:
        if lvl in unlocked:
            highest = lvl

    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {
            "points": new_points,
            "puzzles_solved": new_solved_total,
            "streak": new_streak,
            "level_progress": new_progress,
            "unlocked_levels": unlocked,
            "current_level": highest,
            "badges": badges,
        }},
    )

    return {
        **response_payload,
        "points_earned": points_reward,
        "new_points": new_points,
        "next_level_unlocked": next_unlocked,
        "streak": new_streak,
        "new_badges": [b for b in badges if b not in user.get("badges", [])],
    }

# ---------------- Routes: Leaderboard ----------------
@api.get("/leaderboard")
async def leaderboard(limit: int = 20):
    cursor = db.users.find(
        {"role": "student"},
        {"name": 1, "email": 1, "points": 1, "current_level": 1, "puzzles_solved": 1},
    ).sort("points", -1).limit(min(limit, 100))
    items = []
    rank = 0
    async for u in cursor:
        rank += 1
        items.append({
            "rank": rank,
            "id": str(u["_id"]),
            "name": u.get("name", "Anonymous"),
            "email": u["email"],
            "points": u.get("points", 0),
            "current_level": u.get("current_level", "beginner"),
            "puzzles_solved": u.get("puzzles_solved", 0),
        })
    return items

# ---------------- Routes: Profile ----------------
@api.get("/profile")
async def profile(user: dict = Depends(get_current_user)):
    total_attempts = await db.attempts.count_documents({"user_id": str(user["_id"])})
    correct_attempts = await db.attempts.count_documents({"user_id": str(user["_id"]), "is_correct": True})
    accuracy = (correct_attempts / total_attempts * 100) if total_attempts else 0.0

    # determine rank globally
    higher = await db.users.count_documents({"role": "student", "points": {"$gt": user.get("points", 0)}})
    rank = higher + 1

    return {
        "user": serialize_user(user),
        "stats": {
            "total_attempts": total_attempts,
            "correct_attempts": correct_attempts,
            "accuracy": round(accuracy, 1),
            "global_rank": rank,
        },
    }

# ---------------- Routes: Admin ----------------
@api.get("/admin/puzzles")
async def admin_list_puzzles(_: dict = Depends(require_admin)):
    docs = await db.puzzles.find({}).sort("created_at", -1).to_list(length=500)
    return [serialize_puzzle_admin(d) for d in docs]

@api.post("/admin/puzzles")
async def admin_create_puzzle(body: PuzzleIn, _: dict = Depends(require_admin)):
    doc = {
        "word": body.word.strip().upper(),
        "definition": body.definition.strip(),
        "category": body.category.strip() or "General",
        "difficulty": body.difficulty,
        "points_reward": body.points_reward,
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.puzzles.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_puzzle_admin(doc)

@api.put("/admin/puzzles/{puzzle_id}")
async def admin_update_puzzle(puzzle_id: str, body: PuzzleIn, _: dict = Depends(require_admin)):
    if not ObjectId.is_valid(puzzle_id):
        raise HTTPException(status_code=400, detail="Invalid puzzle id")
    update = {
        "word": body.word.strip().upper(),
        "definition": body.definition.strip(),
        "category": body.category.strip() or "General",
        "difficulty": body.difficulty,
        "points_reward": body.points_reward,
    }
    result = await db.puzzles.update_one({"_id": ObjectId(puzzle_id)}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Puzzle not found")
    updated = await db.puzzles.find_one({"_id": ObjectId(puzzle_id)})
    return serialize_puzzle_admin(updated)

@api.delete("/admin/puzzles/{puzzle_id}")
async def admin_delete_puzzle(puzzle_id: str, _: dict = Depends(require_admin)):
    if not ObjectId.is_valid(puzzle_id):
        raise HTTPException(status_code=400, detail="Invalid puzzle id")
    result = await db.puzzles.delete_one({"_id": ObjectId(puzzle_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Puzzle not found")
    return {"ok": True}

@api.get("/admin/stats")
async def admin_stats(_: dict = Depends(require_admin)):
    total_users = await db.users.count_documents({"role": "student"})
    total_puzzles = await db.puzzles.count_documents({})
    total_attempts = await db.attempts.count_documents({})
    correct_attempts = await db.attempts.count_documents({"is_correct": True})
    success_rate = (correct_attempts / total_attempts * 100) if total_attempts else 0.0

    by_difficulty = []
    for lvl in LEVEL_ORDER:
        c = await db.puzzles.count_documents({"difficulty": lvl})
        by_difficulty.append({"level": lvl, "count": c})

    # top categories - difficulty breakdown
    pipeline = [
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 8},
    ]
    cats = []
    async for d in db.puzzles.aggregate(pipeline):
        cats.append({"category": d["_id"], "count": d["count"]})

    return {
        "total_users": total_users,
        "total_puzzles": total_puzzles,
        "total_attempts": total_attempts,
        "correct_attempts": correct_attempts,
        "success_rate": round(success_rate, 1),
        "by_difficulty": by_difficulty,
        "by_category": cats,
    }

# ---------------- Startup: Seed & Indexes ----------------
@app.on_event("startup")
async def on_startup():
    await db.users.create_index("email", unique=True)
    await db.puzzles.create_index("difficulty")
    await db.attempts.create_index("user_id")

    # Seed admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@techtangle.edu").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "Admin@123")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "Administrator",
            "role": "admin",
            "points": 0,
            "current_level": "expert",
            "puzzles_solved": 0,
            "streak": 0,
            "badges": [],
            "level_progress": {"beginner": 0, "intermediate": 0, "advanced": 0, "expert": 0},
            "unlocked_levels": LEVEL_ORDER[:],
            "created_at": datetime.now(timezone.utc),
        })
        logger.info(f"Seeded admin user: {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})

    # Seed puzzles if empty
    count = await db.puzzles.count_documents({})
    if count == 0:
        now = datetime.now(timezone.utc)
        await db.puzzles.insert_many([{**p, "word": p["word"].upper(), "created_at": now} for p in PUZZLES])
        logger.info(f"Seeded {len(PUZZLES)} puzzles")

@app.on_event("shutdown")
async def on_shutdown():
    client.close()

# ---------------- Mount ----------------
app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
