import os
import json
import re
from typing import List, Optional, Any, Dict

import requests
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

# =============================
#  🔧 FASTAPI SETUP
# =============================

app = FastAPI()

FRONTEND_ORIGINS = [
    "http://localhost:5173",
    "https://joureny-planner.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================
#  🔑 GEMINI CONFIG
# =============================

GEMINI_API_KEYS = [
    os.getenv("GEMINI_API_KEY_1"),
    os.getenv("GEMINI_API_KEY_2"),
    os.getenv("GEMINI_API_KEY_3"),
]

MODEL_NAME = os.getenv("MODEL_NAME", "gemini-2.5-flash")
GEMINI_ENDPOINT = (
    f"https://generativelanguage.googleapis.com/v1/models/{MODEL_NAME}:generateContent"
)

# =============================
#  REQUEST MODELS
# =============================

class GeminiRecommendationsRequest(BaseModel):
    mood: Optional[str] = None
    country: Optional[str] = None
    state: Optional[str] = None
    budget: Optional[float] = None
    travelers: Optional[int] = None
    existing: Optional[List[str]] = None

# =============================
#  BASIC HELPERS
# =============================

@app.get("/api/health")
def health() -> Dict[str, bool]:
    return {"ok": True}


def build_mock_suggestions(
    mood: Optional[str],
    country: Optional[str],
    state: Optional[str],
    budget: Optional[float],
    travelers: Optional[int],
) -> List[Dict[str, Any]]:
    b = float(budget) if budget is not None else 50000.0
    t = int(travelers) if travelers is not None and travelers > 0 else 1
    per_person = round(b / max(t, 1))

    base_names = [
        "City Highlights",
        "Hidden Gems",
        "Nature Escape",
        "Food & Culture",
        "Adventure Mix",
        "Relax & Reset",
    ]

    prefix = f"{country} - {state}" if state else (country or "Destination")

    result = []
    for idx, label in enumerate(base_names):
        result.append(
            {
                "destination": f"{prefix} - {label}",
                "summary": f"Suggested {mood or 'trip'} in {prefix}: {label.lower()} with approx per-person cost.",
                "tags": [mood or "Trip", country or "World", label.lower()],
                "approxBaseCost": per_person + idx * 1500,
            }
        )
    return result


def build_cost_breakdown_from_base(amount: Any) -> Dict[str, int]:
    try:
        num = float(amount)
    except (TypeError, ValueError):
        num = 0.0

    if num <= 0:
        return {
            "hotelPerNight": 0,
            "foodPerDay": 0,
            "transport": 0,
            "shopping": 0,
            "activities": 0,
            "totalPerPerson": 0,
        }

    nights = 2
    days = 2

    hotel_per_night = round((num * 0.35) / nights)
    food_per_day = round((num * 0.2) / days)
    transport = round(num * 0.15)
    shopping = round(num * 0.15)

    used = (
        hotel_per_night * nights
        + food_per_day * days
        + transport
        + shopping
    )

    activities = max(0, round(num - used))

    return {
        "hotelPerNight": hotel_per_night,
        "foodPerDay": food_per_day,
        "transport": transport,
        "shopping": shopping,
        "activities": activities,
        "totalPerPerson": round(num),
    }


def normalize_base_from_suggestion(s: Dict[str, Any]) -> float:
    candidates = [
        s.get("approxBaseCost"),
        s.get("estimatedPerPerson"),
        s.get("totalPerPerson"),
        s.get("perPerson"),
        s.get("costPerPerson"),
        s.get("pricePerPerson"),
    ]

    for raw in candidates:
        if raw is None:
            continue

        if isinstance(raw, (int, float)) and raw > 0:
            return float(raw)

        text = str(raw)
        numbers = re.findall(r"[\d.]+", text)
        if numbers:
            try:
                n = float("".join(numbers))
                if n > 0:
                    return n
            except ValueError:
                continue

    return 0.0

# =============================
#  GEMINI: AI RECOMMENDATIONS
# =============================

def call_gemini_with_key(api_key: Optional[str], body: Dict[str, Any]) -> Optional[requests.Response]:
    if not api_key:
        return None

    print(
        "Trying Gemini key prefix:",
        api_key[:8] if api_key else "NO_KEY",
    )

    resp = requests.post(
        GEMINI_ENDPOINT,
        headers={
            "Content-Type": "application/json",
            "x-goog-api-key": api_key,
        },
        data=json.dumps(body),
        timeout=60,
    )

    print("Upstream status with this key:", resp.status_code)

    if resp.status_code != 200:
        print("Gemini upstream error data:", resp.text)
        return None

    return resp


@app.post("/api/gemini-recommendations")
def gemini_recommendations(payload: GeminiRecommendationsRequest):
    mood = payload.mood
    country = payload.country
    state = payload.state
    budget = payload.budget
    travelers = payload.travelers
    existing = payload.existing or []

    existing_str = ", ".join(existing)

    if not mood or not country:
        mock = []
        for s in build_mock_suggestions(
            mood=mood,
            country=country,
            state=state,
            budget=budget,
            travelers=travelers,
        ):
            base = normalize_base_from_suggestion(s)
            mock.append(
                {
                    **s,
                    "approxBaseCost": base,
                    "breakdown": build_cost_breakdown_from_base(base),
                }
            )
        return {
            "success": True,
            "suggestions": mock,
            "note": "Required fields missing. Using local suggestions.",
        }

    prompt = f"""
Return a JSON array of up to 10 DIFFERENT travel suggestions for a user.

Mood: {mood}
Country: {country}
StateOrRegion: {state or 'Any'}
TotalBudgetINR: {budget}
Travelers: {travelers}
ExistingDestinations (do NOT repeat any of these city/place names): [{existing_str}]

Each object MUST be exactly:
{{
  "destination": "City or Place, State",
  "summary": "1–3 lines about this place (small history + why visit)",
  "tags": ["tag1","tag2","tag3"],
  "approxBaseCost": number  // per person, INR
}}

Rules:
- Give a mix of famous and lesser-known places.
- Do NOT include any destination whose city/place name already appears in ExistingDestinations.
- Avoid repeating the same city name across different objects in the same response.
- Respond with VALID JSON ONLY (no backticks, no extra text).
""".strip()

    body = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": prompt}],
            }
        ],
        "generationConfig": {
            "temperature": 1.0,
            "topP": 0.9,
            "topK": 40,
        },
    }

    suggestions: List[Dict[str, Any]] = []

    try:
        print("Using Gemini model:", MODEL_NAME)
        print("Calling Gemini endpoint:", GEMINI_ENDPOINT)

        resp = None
        for key in GEMINI_API_KEYS:
            resp = call_gemini_with_key(key, body)
            if resp is not None:
                break

        if resp is None:
            raise RuntimeError("All Gemini API keys failed")

        data = resp.json()
        candidates = data.get("candidates", [])
        first = (candidates[0] or {}).get("content") if candidates else None

        if isinstance(first, dict) and isinstance(first.get("parts"), list):
            textual = "".join(p.get("text", "") for p in first["parts"])
        elif isinstance(first, str):
            textual = first
        else:
            textual = json.dumps(data)

        cleaned = (textual or "").strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```[a-zA-Z]*\s*", "", cleaned)
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3].strip()

        first_brace = cleaned.find("{")
        first_bracket = cleaned.find("[")
        if first_bracket != -1 and (first_bracket < first_brace or first_brace == -1):
            start_index = first_bracket
        else:
            start_index = first_brace
        if start_index > 0:
            cleaned = cleaned[start_index:]

        parsed = json.loads(cleaned)
        suggestions = parsed if isinstance(parsed, list) else [parsed]

    except Exception as e:
        print("Gemini parse/upstream error, using mock suggestions:", repr(e))
        suggestions = build_mock_suggestions(
            mood=mood,
            country=country,
            state=state,
            budget=budget,
            travelers=travelers,
        )

    with_breakdown = []
    for s in suggestions:
        base = normalize_base_from_suggestion(s)
        breakdown = build_cost_breakdown_from_base(base)
        with_breakdown.append(
            {
                "destination": s.get("destination"),
                "summary": s.get("summary"),
                "tags": s.get("tags") or [],
                "approxBaseCost": base,
                "breakdown": breakdown,
            }
        )

    return {"success": True, "suggestions": with_breakdown}


if __name__ == "__main__":
  import uvicorn
  uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", "4000")), reload=True)
