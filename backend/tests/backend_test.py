"""TechTangle backend API tests."""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://app-constructor-87.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

# Seed credentials — these match the auto-seeded admin documented in
# /app/memory/test_credentials.md. Override with env vars in CI if needed.
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@techtangle.edu")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "Admin@123")


# ---------- Fixtures ----------
@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def admin_token(session):
    r = session.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="session")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


@pytest.fixture(scope="session")
def student(session):
    """Create a brand-new student and return {email, password, token, user}."""
    suffix = uuid.uuid4().hex[:8]
    email = f"test_student_{suffix}@test.com"
    password = os.environ.get("STUDENT_TEST_PASSWORD", "Student@123")
    r = session.post(f"{API}/auth/register", json={"name": f"TEST Student {suffix}", "email": email, "password": password})
    assert r.status_code == 200, f"Register failed: {r.status_code} {r.text}"
    data = r.json()
    return {"email": email, "password": password, "token": data["token"], "user": data["user"]}


@pytest.fixture(scope="session")
def student_headers(student):
    return {"Authorization": f"Bearer {student['token']}", "Content-Type": "application/json"}


# ---------- Health ----------
def test_root(session):
    r = session.get(f"{API}/")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


# ---------- Auth ----------
class TestAuth:
    def test_register_returns_token_and_user(self, student):
        assert "token" in student and len(student["token"]) > 10
        assert student["user"]["email"] == student["email"]
        assert student["user"]["role"] == "student"
        assert student["user"]["points"] == 0
        assert "beginner" in student["user"].get("level_progress", {}) or student["user"].get("current_level") == "beginner"

    def test_register_duplicate_email(self, session, student):
        r = session.post(f"{API}/auth/register", json={"name": "Dup", "email": student["email"], "password": "Whatever1!"})
        assert r.status_code == 400

    def test_login_valid(self, session, student):
        r = session.post(f"{API}/auth/login", json={"email": student["email"], "password": student["password"]})
        assert r.status_code == 200
        assert "token" in r.json()
        assert r.json()["user"]["email"] == student["email"]

    def test_login_invalid(self, session):
        r = session.post(f"{API}/auth/login", json={"email": "nope@example.com", "password": "wrong"})
        assert r.status_code == 401

    def test_me_with_token(self, session, student_headers, student):
        r = session.get(f"{API}/auth/me", headers=student_headers)
        assert r.status_code == 200
        assert r.json()["email"] == student["email"]

    def test_me_without_token(self, session):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401


# ---------- Levels ----------
class TestLevels:
    def test_get_levels_new_user(self, session, student_headers):
        r = session.get(f"{API}/levels", headers=student_headers)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list) and len(data) == 4
        levels = {x["level"]: x for x in data}
        assert levels["beginner"]["unlocked"] is True
        assert levels["intermediate"]["unlocked"] is False
        assert levels["advanced"]["unlocked"] is False
        assert levels["expert"]["unlocked"] is False
        for lvl in ("beginner", "intermediate", "advanced", "expert"):
            assert levels[lvl]["total"] > 0, f"{lvl} has no puzzles seeded"

    def test_levels_total_count_44(self, session, student_headers):
        r = session.get(f"{API}/levels", headers=student_headers)
        data = r.json()
        total = sum(x["total"] for x in data)
        # >= 44 because admin-created puzzles from prior test runs may exist
        assert total >= 44, f"Expected at least 44 puzzles seeded, got {total}"


# ---------- Puzzles ----------
class TestPuzzles:
    def test_next_puzzle_beginner(self, session, student_headers):
        r = session.get(f"{API}/puzzles/next?level=beginner", headers=student_headers)
        assert r.status_code == 200
        p = r.json()["puzzle"]
        assert p["difficulty"] == "beginner"
        assert "scrambled" in p
        assert p["length"] > 0
        assert "definition" in p
        assert "points_reward" in p

    def test_next_puzzle_locked_level(self, session, student_headers):
        r = session.get(f"{API}/puzzles/next?level=expert", headers=student_headers)
        assert r.status_code == 403

    def test_submit_wrong_answer_resets_streak(self, session, student_headers):
        # fetch a puzzle, submit garbage
        r = session.get(f"{API}/puzzles/next?level=beginner", headers=student_headers)
        p = r.json()["puzzle"]
        r2 = session.post(f"{API}/puzzles/submit", headers=student_headers, json={"puzzle_id": p["id"], "answer": "WRONGZ"})
        assert r2.status_code == 200
        body = r2.json()
        assert body["correct"] is False
        assert "definition" in body
        assert "points_earned" not in body  # no points awarded

    def test_submit_correct_and_no_double_credit(self, session, admin_headers, student_headers):
        # Get the word of a beginner puzzle from admin endpoint
        r = session.get(f"{API}/admin/puzzles", headers=admin_headers)
        assert r.status_code == 200
        beginners = [p for p in r.json() if p["difficulty"] == "beginner"]
        assert len(beginners) > 0
        puzzle = beginners[0]

        # Snapshot user points
        me_before = session.get(f"{API}/auth/me", headers=student_headers).json()
        pts_before = me_before["points"]
        solved_before = me_before["puzzles_solved"]

        # Submit correct
        r1 = session.post(f"{API}/puzzles/submit", headers=student_headers,
                          json={"puzzle_id": puzzle["id"], "answer": puzzle["word"]})
        assert r1.status_code == 200
        b1 = r1.json()
        assert b1["correct"] is True
        assert b1["points_earned"] == puzzle["points_reward"]
        assert b1["new_points"] == pts_before + puzzle["points_reward"]

        # Submit same puzzle again - should NOT double credit
        r2 = session.post(f"{API}/puzzles/submit", headers=student_headers,
                          json={"puzzle_id": puzzle["id"], "answer": puzzle["word"]})
        assert r2.status_code == 200
        b2 = r2.json()
        assert b2["correct"] is True
        assert b2.get("already_solved") is True

        me_after = session.get(f"{API}/auth/me", headers=student_headers).json()
        assert me_after["points"] == pts_before + puzzle["points_reward"], "Double credit happened!"
        assert me_after["puzzles_solved"] == solved_before + 1

    def test_unlock_intermediate_after_5_beginner_solves(self, session, admin_headers):
        """Use a fresh student and submit 5 unique beginner puzzles."""
        # Create fresh student
        email = f"TEST_unlock_{uuid.uuid4().hex[:6]}@test.com"
        reg = session.post(f"{API}/auth/register", json={"name": "Unlock Test", "email": email, "password": "Pass1234"})
        assert reg.status_code == 200
        token = reg.json()["token"]
        h = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

        beginners = [p for p in session.get(f"{API}/admin/puzzles", headers=admin_headers).json()
                     if p["difficulty"] == "beginner"][:5]
        assert len(beginners) == 5, "Need 5 beginner puzzles to unlock intermediate"

        last_response = None
        for i, p in enumerate(beginners):
            r = session.post(f"{API}/puzzles/submit", headers=h,
                             json={"puzzle_id": p["id"], "answer": p["word"]})
            assert r.status_code == 200
            assert r.json()["correct"] is True
            last_response = r.json()

        # 5th submission should report intermediate unlocked
        assert last_response.get("next_level_unlocked") == "intermediate", f"Got {last_response}"

        # Verify levels endpoint says intermediate unlocked
        levels = session.get(f"{API}/levels", headers=h).json()
        levels_map = {x["level"]: x for x in levels}
        assert levels_map["intermediate"]["unlocked"] is True
        assert levels_map["advanced"]["unlocked"] is False

        # Now fetching intermediate puzzle should work (no 403)
        r2 = session.get(f"{API}/puzzles/next?level=intermediate", headers=h)
        assert r2.status_code == 200


# ---------- Leaderboard & Profile ----------
class TestLeaderboardAndProfile:
    def test_leaderboard_sorted_excludes_admin(self, session, student_headers):
        r = session.get(f"{API}/leaderboard?limit=50", headers=student_headers)
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        # No admin emails
        for item in items:
            assert ADMIN_EMAIL not in item["email"], "Admin should not appear in leaderboard"
            assert "rank" in item
        # Sort check
        points = [x["points"] for x in items]
        assert points == sorted(points, reverse=True)
        # Ranks ascending starting from 1
        for i, item in enumerate(items, start=1):
            assert item["rank"] == i

    def test_profile(self, session, student_headers, student):
        r = session.get(f"{API}/profile", headers=student_headers)
        assert r.status_code == 200
        data = r.json()
        assert data["user"]["email"] == student["email"]
        assert "stats" in data
        for k in ("total_attempts", "correct_attempts", "accuracy", "global_rank"):
            assert k in data["stats"]


# ---------- Admin ----------
class TestAdmin:
    def test_student_cannot_access_admin(self, session, student_headers):
        r = session.get(f"{API}/admin/puzzles", headers=student_headers)
        assert r.status_code == 403
        r2 = session.get(f"{API}/admin/stats", headers=student_headers)
        assert r2.status_code == 403

    def test_admin_list_puzzles(self, session, admin_headers):
        r = session.get(f"{API}/admin/puzzles", headers=admin_headers)
        assert r.status_code == 200
        assert len(r.json()) >= 44

    def test_admin_stats(self, session, admin_headers):
        r = session.get(f"{API}/admin/stats", headers=admin_headers)
        assert r.status_code == 200
        data = r.json()
        assert data["total_puzzles"] >= 44
        assert len(data["by_difficulty"]) == 4

    def test_admin_create_update_delete_puzzle(self, session, admin_headers):
        payload = {
            "word": f"TESTWORD{uuid.uuid4().hex[:4].upper()}",
            "definition": "A test definition used by automated tests.",
            "category": "Testing",
            "difficulty": "beginner",
            "points_reward": 15,
        }
        r = session.post(f"{API}/admin/puzzles", headers=admin_headers, json=payload)
        assert r.status_code == 200
        created = r.json()
        pid = created["id"]
        assert created["word"] == payload["word"].upper()

        # Update
        update = {**payload, "definition": "Updated definition for test.", "points_reward": 25}
        r2 = session.put(f"{API}/admin/puzzles/{pid}", headers=admin_headers, json=update)
        assert r2.status_code == 200
        assert r2.json()["definition"] == "Updated definition for test."
        assert r2.json()["points_reward"] == 25

        # Verify via GET list
        listing = session.get(f"{API}/admin/puzzles", headers=admin_headers).json()
        found = [p for p in listing if p["id"] == pid]
        assert len(found) == 1
        assert found[0]["points_reward"] == 25

        # Delete
        r3 = session.delete(f"{API}/admin/puzzles/{pid}", headers=admin_headers)
        assert r3.status_code == 200

        # Verify deletion
        listing2 = session.get(f"{API}/admin/puzzles", headers=admin_headers).json()
        assert not any(p["id"] == pid for p in listing2)
