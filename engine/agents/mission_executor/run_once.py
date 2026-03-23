import json
import urllib.request

from engine.agents.ai_controller.ai_controller import AIController
from engine.agents.mission_controller.mission_controller import MissionController
from engine.mavlink.mission_uploader import SafeMissionUploader

TELEMETRY_URL = "http://127.0.0.1:8000/api/autopilot/telemetry/live"


def fetch_json(url: str, timeout: int = 5) -> dict:
    with urllib.request.urlopen(url, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


def build_demo_mission() -> dict:
    return {
        "name": "executor-demo-mission",
        "items": [
            {"x": 52.5200, "y": 13.4050, "z": 120, "description": "WP-1"},
            {"x": 52.5205, "y": 13.4055, "z": 120, "description": "WP-2"},
            {"x": 52.5210, "y": 13.4060, "z": 120, "description": "WP-3"},
        ]
    }


def main():
    telemetry = fetch_json(TELEMETRY_URL)

    ai = AIController()
    ai_result = ai.analyze(telemetry)

    mission_controller = MissionController()
    mission_result = mission_controller.decide(ai_result)

    uploader = SafeMissionUploader(dry_run=True)
    demo_mission = build_demo_mission()

    upload_result = uploader.upload(demo_mission)

    action_result = None
    command = mission_result.get("command")

    if command == "RETURN_TO_HOME":
        action_result = uploader.request_rtl()
    elif command == "MISSION_HOLD":
        action_result = {
            "ok": True,
            "executed": False,
            "dry_run": True,
            "message": "Mission hold simulated"
        }
    elif command == "MISSION_CONTINUE":
        action_result = uploader.start_mission()
    elif command == "MISSION_ABORT":
        action_result = uploader.request_rtl()
    else:
        action_result = {
            "ok": False,
            "executed": False,
            "dry_run": True,
            "message": f"Unsupported mission command: {command}"
        }

    result = {
        "telemetry": telemetry,
        "ai_result": ai_result,
        "mission_result": mission_result,
        "upload_result": upload_result,
        "action_result": action_result
    }

    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
