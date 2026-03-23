import json
import urllib.request
from typing import Any, Dict

from engine.agents.ai_controller.ai_controller import AIController
from engine.agents.mission_controller.mission_controller import MissionController
from engine.mavlink.mission_uploader import SafeMissionUploader

TELEMETRY_URL = "http://127.0.0.1:8000/api/autopilot/telemetry/live"


class AutonomyManager:
    """
    Safe autonomy manager for WebKurier.

    Important:
    - advisory / dry-run only
    - does not arm motors
    - does not execute real takeoff
    - does not perform direct actuator control
    """

    def __init__(self, telemetry_url: str = TELEMETRY_URL, dry_run: bool = True):
        self.telemetry_url = telemetry_url
        self.ai_controller = AIController()
        self.mission_controller = MissionController()
        self.uploader = SafeMissionUploader(dry_run=dry_run)

    def fetch_telemetry(self) -> Dict[str, Any]:
        with urllib.request.urlopen(self.telemetry_url, timeout=5) as response:
            return json.loads(response.read().decode("utf-8"))

    def build_demo_mission(self) -> Dict[str, Any]:
        return {
            "name": "autonomy-manager-demo",
            "items": [
                {"x": 52.5200, "y": 13.4050, "z": 120, "description": "WP-1"},
                {"x": 52.5205, "y": 13.4055, "z": 120, "description": "WP-2"},
                {"x": 52.5210, "y": 13.4060, "z": 120, "description": "WP-3"},
            ]
        }

    def run_cycle(self) -> Dict[str, Any]:
        telemetry = self.fetch_telemetry()

        ai_result = self.ai_controller.analyze(telemetry)
        mission_result = self.mission_controller.decide(ai_result)

        mission_plan = self.build_demo_mission()
        upload_result = self.uploader.upload(mission_plan)

        command = mission_result.get("command")
        action_result: Dict[str, Any]

        if command == "RETURN_TO_HOME":
            action_result = self.uploader.request_rtl()

        elif command == "MISSION_HOLD":
            action_result = {
                "ok": True,
                "executed": False,
                "dry_run": True,
                "message": "Mission hold simulated by autonomy manager"
            }

        elif command == "MISSION_CONTINUE":
            action_result = self.uploader.start_mission()

        elif command == "MISSION_ABORT":
            action_result = self.uploader.request_rtl()

        else:
            action_result = {
                "ok": False,
                "executed": False,
                "dry_run": True,
                "message": f"Unsupported mission command: {command}"
            }

        return {
            "agent": "AUTONOMY_MANAGER",
            "status": "ONLINE",
            "telemetry": telemetry,
            "ai_result": ai_result,
            "mission_result": mission_result,
            "upload_result": upload_result,
            "action_result": action_result
        }
