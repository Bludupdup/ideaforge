import joblib
import pandas as pd

# Loded model
model = joblib.load('best_model_LightGBM.joblib')  # adjust filename to match what you saved


def predict_account(input_dict):
    df_input = pd.DataFrame([input_dict])
    df_input['platform'] = df_input['platform'].astype('category')

    pred = model.predict(df_input)[0]
    prob = model.predict_proba(df_input)[0][1]  # probability of being fake

    return pred, prob


def get_user_input():
    print("Enter account details:")
    account = {
        'platform': input("Platform (Instagram/Twitter/TikTok/Facebook): "),
        'account_age_days': float(input("Account age (days): ")),
        'has_profile_picture': int(input("Has profile picture (1/0): ")),
        'is_default_avatar': int(input("Is default avatar (1/0): ")),
        'bio_length': float(input("Bio length (characters): ")),
        'has_bio': int(input("Has bio (1/0): ")),
        'username_digit_ratio': float(input("Username digit ratio (0-1): ")),
        'username_length': int(input("Username length: ")),
        'follower_count': float(input("Follower count: ")),
        'following_count': float(input("Following count: ")),
        'is_verified': int(input("Is verified (1/0): ")),
        'profile_completeness': float(input("Profile completeness (0-1): ")),
        'posts_per_day_avg': float(input("Posts per day (avg): ")),
        'pct_posts_duplicate_content': float(input("Pct duplicate content (0-1): ")),
        'avg_time_between_posts_min': float(input("Avg time between posts (min): ")),
        'device_fingerprint_diversity': int(input("Device fingerprint diversity: ")),
    }
    return account


if __name__ == "__main__":
    account = get_user_input()
    pred, prob = predict_account(account)

    label = "FAKE" if pred == 1 else "REAL"
    print(f"\nPrediction: {label}")
    print(f"Confidence (probability of fake): {prob:.2%}")