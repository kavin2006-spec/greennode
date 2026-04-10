import subprocess
import json
import sys
import os
from datetime import datetime, timezone
from database import supabase
from scheduler_jobs.queue import promote_next_job

def parse_greennode_results(output: str) -> dict | None:
    for line in output.splitlines():
        if line.startswith("GREENNODE_RESULTS:"):
            try:
                return json.loads(line.replace("GREENNODE_RESULTS:", ""))
            except json.JSONDecodeError:
                return None
    return None

def execute_job(job: dict):
    job_id = job["id"]

    # Mark as running
    supabase.table("scheduled_jobs")\
        .update({"status": "running"})\
        .eq("id", job_id)\
        .execute()

    try:
        script_path = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "..", job["script_path"])
        )

        result = subprocess.run(
            [sys.executable, script_path],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=3600,  # 1 hour max
            env={**os.environ, "PYTHONIOENCODING": "utf-8"}  # Pass job ID to script
        )


        output = result.stdout
        print("STDOUT:", result.stdout)
        print("STDERR:", result.stderr)
        print("RETURNCODE:", result.returncode)
        greennode_data = parse_greennode_results(output)

        if greennode_data:
            # Store in training_runs
            run_data = {
                "model_name": greennode_data.get("model_name", job["job_name"]),
                "dataset": greennode_data.get("dataset", job["project"]),
                "duration_seconds": greennode_data.get("duration_seconds", 0),
                "emissions_kg": greennode_data.get("emissions_kg", 0),
                "energy_kwh": greennode_data.get("energy_kwh", 0),
                "cpu_power_w": greennode_data.get("cpu_power_w"),
                "ram_power_w": greennode_data.get("ram_power_w"),
                "workload_type": "training"
            }
            run_result = supabase.table("training_runs").insert(run_data).execute()
            run_id = run_result.data[0]["id"]

            supabase.table("scheduled_jobs").update({
                "status": "completed",
                "completed_at": datetime.now(timezone.utc).isoformat(),
                "run_id": run_id
            }).eq("id", job_id).execute()
        else:
            raise Exception(f"No GREENNODE_RESULTS in output. stderr: {result.stderr}")

    except Exception as e:
        supabase.table("scheduled_jobs").update({
            "status": "failed",
            "error_message": str(e)[:500],
            "completed_at": datetime.now(timezone.utc).isoformat()
        }).eq("id", job_id).execute()

    finally:
        promote_next_job()