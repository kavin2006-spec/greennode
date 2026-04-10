import pandas as pd
import pickle
import os as _os
from sqlalchemy import create_engine
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import mean_absolute_error
import numpy as np
from codecarbon import EmissionsTracker
import json
import sys
import time

_emissions_dir = _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), "emissions")
_os.makedirs(_emissions_dir, exist_ok=True)


engine = create_engine(
    "mssql+pyodbc://@MSI\\SQLEXPRESS/F1Database"
    "?driver=ODBC+Driver+17+for+SQL+Server"
    "&trusted_connection=yes"
    "&TrustServerCertificate=yes"
)

def load_features():
    df = pd.read_sql("SELECT * FROM features", engine)
    return df

def train(df):
    import time
    import json
    from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import mean_absolute_error
    from codecarbon import EmissionsTracker

    feature_cols = [
        "grid_pos",
        "quali_gap_pct",
        "avg_quali_gap_last_3",
        "avg_finish_last_1",
        "avg_finish_last_3",
        "avg_finish_last_5",
        "team_avg_finish_last_3",
        "avg_positions_gained",
        "sprint_delta",
        "avg_sprint_delta_last_3",
        "weighted_avg_finish",
        "track_id",
        "is_wet",
        "start_compound_encoded",
        "avg_sc_laps_pct",
        "avg_teammate_quali_gap_last_3",
        "championship_rank_pre_race",
        "points_gap_to_leader",
        "wins_at_track",
    ]

    target_col = "position_delta"

    X = df[feature_cols].fillna(-1)
    y = df[target_col]

    year_weights = df["year"].map({
        2022: 1.0,
        2023: 1.5,
        2024: 2.0,
        2025: 3.0
    }).fillna(1.0)

    X_train, X_test, y_train, y_test, w_train, w_test = train_test_split(
        X, y, year_weights, test_size=0.2, random_state=42
    )

    rf = RandomForestRegressor(
        n_estimators=500,
        max_depth=8,
        min_samples_leaf=5,
        max_features=0.7,
        random_state=42
    )

    gb = GradientBoostingRegressor(
        n_estimators=300,
        max_depth=4,
        learning_rate=0.05,
        min_samples_leaf=5,
        subsample=0.8,
        random_state=42
    )

    # =========================
    # EMISSIONS TRACKING BLOCK
    # =========================

    tracker = EmissionsTracker(
        project_name="greennode-f1",
        output_dir=_emissions_dir,
        save_to_file=True,
        log_level="error"
    )

    tracker.start()
    start_time = time.time()

    # --- Train RF ---
    rf.fit(X_train, y_train, sample_weight=w_train)
    rf_preds = rf.predict(X_test)
    rf_mae = mean_absolute_error(y_test, rf_preds)

    # --- Train GB ---
    gb.fit(X_train, y_train, sample_weight=w_train)
    gb_preds = gb.predict(X_test)
    gb_mae = mean_absolute_error(y_test, gb_preds)

    emissions = tracker.stop()
    duration = time.time() - start_time

    # =========================
    # MODEL SELECTION
    # =========================
    print(f"Trained on {len(X_train)} samples, tested on {len(X_test)}")

    print(f"\nRandom Forest MAE:        {rf_mae:.2f} positions")
    print(f"Gradient Boosting MAE:    {gb_mae:.2f} positions")

    if gb_mae < rf_mae:
        print("\nGradient Boosting wins — saving that model")
        best_model = gb
        best_preds = gb_preds
        best_name = "Gradient Boosting"
        importances = gb.feature_importances_
    else:
        print("\nRandom Forest wins — saving that model")
        best_model = rf
        best_preds = rf_preds
        best_name = "Random Forest"
        importances = rf.feature_importances_

    print(f"\nFinal MAE: {mean_absolute_error(y_test, best_preds):.2f} positions")

    print(f"\nFeature importance ({best_name}):")
    for feat, imp in sorted(zip(feature_cols, importances), key=lambda x: x[1], reverse=True):
        bar = "#" * int(imp * 40)
        print(f"  {feat:<30} {bar} {imp:.3f}")

    evaluate_predictions(y_test, best_preds, X_test)

    # =========================
    # GREENNODE OUTPUT
    # =========================
    results = {
        "emissions_kg": emissions if emissions else 0.0,
        "energy_kwh": float(tracker._total_energy.kWh),
        "cpu_power_w": float(tracker._cpu_power_sum) if tracker._cpu_power_sum else None,
        "ram_power_w": float(tracker._ram_power_sum) if tracker._ram_power_sum else None,
        "duration_seconds": round(duration, 4),
        "model_name": "GradientBoosting" if gb_mae < rf_mae else "RandomForest",
        "dataset": "F1Database"
    }

    print("GREENNODE_RESULTS:" + json.dumps(results))

    return best_model

def evaluate_predictions(y_test, preds, df_test):
    """
    Beyond MAE — show metrics that actually mean something to F1 fans
    """
    results = pd.DataFrame({
        "actual_delta":    y_test.values,
        "predicted_delta": preds
    })

    # How often did we predict the right direction (gain vs lose positions)
    results["correct_direction"] = (
        (results["actual_delta"] > 0) == (results["predicted_delta"] > 0)
    )
    direction_acc = results["correct_direction"].mean() * 100

    # How often was predicted position within 3 places of actual
    results["within_3"] = abs(
        results["actual_delta"] - results["predicted_delta"]
    ) <= 3

    within_3_acc = results["within_3"].mean() * 100

    print(f"\nBeyond MAE:")
    print(f"  Correct direction (gain vs lose): {direction_acc:.1f}%")
    print(f"  Prediction within 3 positions:    {within_3_acc:.1f}%")
    

def save_model(model):
    import os
    os.makedirs("models", exist_ok=True)
    with open("models/f1_model.pkl", "wb") as f:
        pickle.dump(model, f)
    print("\nModel saved to models/f1_model.pkl")

if __name__ == "__main__":
    df = load_features()
    print(f"Loaded {len(df)} rows from features table")
    model = train(df)
    save_model(model)

