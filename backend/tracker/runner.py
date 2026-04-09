from codecarbon import EmissionsTracker
from sklearn.ensemble import RandomForestClassifier
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
import time

def run_training_job(n_estimators: int = 200) -> dict:
    X, y = load_iris(return_X_y=True)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

    tracker = EmissionsTracker(
        project_name="greennode",
        output_dir="./tracker/emissions",
        save_to_file=True,
        log_level="error"
    )

    tracker.start()
    start_time = time.time()

    model = RandomForestClassifier(n_estimators=n_estimators)
    model.fit(X_train, y_train)

    emissions = tracker.stop()
    duration = time.time() - start_time

    return {
        "model_name": "RandomForest",
        "dataset": "iris",
        "duration_seconds": round(duration, 4),
        "emissions_kg": emissions if emissions else 0.0,
        "energy_kwh": float(tracker._total_energy.kWh),
        "cpu_power_w": float(tracker._cpu_power_sum) if tracker._cpu_power_sum else None,
        "ram_power_w": float(tracker._ram_power_sum) if tracker._ram_power_sum else None,
        "workload_type": "training"
    }