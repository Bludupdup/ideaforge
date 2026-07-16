from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import numpy as np

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

model = joblib.load("best_model_LightGBM.joblib")

# Adjust this mapping to match however "platform" was encoded during training
# e.g. if your friend used LabelEncoder alphabetically on ["instagram","tiktok","twitter"]
PLATFORM_MAP = {"instagram": 0, "tiktok": 1, "twitter": 2}

class InputData(BaseModel):
    platform: str
    account_age_days: float
    has_profile_picture: int
    is_default_avatar: int
    bio_length: float
    has_bio: int
    username_digit_ratio: float
    username_length: float
    follower_count: float
    following_count: float
    is_verified: int
    profile_completeness: float
    posts_per_day_avg: float
    pct_posts_duplicate_content: float
    avg_time_between_posts_min: float
    device_fingerprint_diversity: float

@app.post("/predict")
def predict(data: InputData):
    platform_encoded = PLATFORM_MAP.get(data.platform.lower(), 0)

    features = [
        platform_encoded,
        data.account_age_days,
        data.has_profile_picture,
        data.is_default_avatar,
        data.bio_length,
        data.has_bio,
        data.username_digit_ratio,
        data.username_length,
        data.follower_count,
        data.following_count,
        data.is_verified,
        data.profile_completeness,
        data.posts_per_day_avg,
        data.pct_posts_duplicate_content,
        data.avg_time_between_posts_min,
        data.device_fingerprint_diversity,
    ]

    arr = np.array(features).reshape(1, -1)
    prediction = model.predict(arr)[0]

    result = {"prediction": int(prediction)}
    if hasattr(model, "predict_proba"):
        result["probabilities"] = model.predict_proba(arr)[0].tolist()

    return result