import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, ExtraTreesClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score
import lightgbm as lgb
from catboost import CatBoostClassifier
import joblib

df = pd.read_csv(r"./merged_accounts.csv")

x = df.drop(columns=["account_id", "is_fake"]).copy()
y = df['is_fake']

x_train, x_test, y_train, y_test = train_test_split(
    x, y, test_size=0.2, random_state=42, stratify=y
)

results = {}
models = {}  # keep the actual fitted model objects here

x_train_lgb = x_train.copy()
x_test_lgb = x_test.copy()
x_train_lgb['platform'] = x_train_lgb['platform'].astype('category')
x_test_lgb['platform'] = x_test_lgb['platform'].astype('category')

lgb_clf = lgb.LGBMClassifier(random_state=42, verbose=-1)
lgb_clf.fit(x_train_lgb, y_train, categorical_feature=['platform'])
results['LightGBM'] = accuracy_score(y_test, lgb_clf.predict(x_test_lgb))
models['LightGBM'] = lgb_clf

cat_clf = CatBoostClassifier(random_state=42, verbose=0)
cat_clf.fit(x_train.fillna(-999), y_train, cat_features=['platform'])
results['CatBoost'] = accuracy_score(y_test, cat_clf.predict(x_test.fillna(-999)))
models['CatBoost'] = cat_clf

x_train_enc = pd.get_dummies(x_train, columns=['platform'], dummy_na=True)
x_test_enc = pd.get_dummies(x_test, columns=['platform'], dummy_na=True)
x_test_enc = x_test_enc.reindex(columns=x_train_enc.columns, fill_value=0)

medians = x_train_enc.median(numeric_only=True)
x_train_enc = x_train_enc.fillna(medians)
x_test_enc = x_test_enc.fillna(medians)

rf_clf = RandomForestClassifier(random_state=42)
rf_clf.fit(x_train_enc, y_train)
results['RandomForest'] = accuracy_score(y_test, rf_clf.predict(x_test_enc))
models['RandomForest'] = rf_clf

et_clf = ExtraTreesClassifier(random_state=42)
et_clf.fit(x_train_enc, y_train)
results['ExtraTrees'] = accuracy_score(y_test, et_clf.predict(x_test_enc))
models['ExtraTrees'] = et_clf

scaler = StandardScaler()
x_train_scaled = scaler.fit_transform(x_train_enc)
x_test_scaled = scaler.transform(x_test_enc)

for name, acc in results.items():
    print(f"{name}: {acc:.4f}")

avg_acc = np.mean(list(results.values()))
print(f"\nAverage accuracy across 4 models: {avg_acc:.4f}")

best_name = max(results, key=results.get)
best_model = models[best_name]
best_acc = results[best_name]

print(f"\nBest model: {best_name} (accuracy = {best_acc:.4f})")

joblib.dump(best_model, f'best_model_{best_name}.joblib')
print(f"Saved as best_model_{best_name}.joblib")

if best_name in ['RandomForest', 'ExtraTrees', 'LogisticRegression']:
    joblib.dump(x_train_enc.columns.tolist(), 'encoded_columns.joblib')
    if best_name == 'LogisticRegression':
        joblib.dump(scaler, 'scaler.joblib')