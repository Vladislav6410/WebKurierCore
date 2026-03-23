import json
import time
import urllib.request
import urllib.error

from engine.agents.ai_controller.ai_controller import AIController
from engine.agents.mission_controller.mission_controller import MissionController

TELEMETRY_URL = "http://127.0.0.1:8000/api/autopilot/telemetry/live"


def fetch_json(url: str, timeout: int = 5) -> dict:
    with urllib.request.urlopen(url, timeout=timeout) as response:
        raw = response.read().decode("utf-8")
        return json.loads(raw)


def main():
    ai_controller = AIController()
    mission_controller = MissionController()

    print("Autonomy Loop started")
    print(f"Telemetry source: {TELEMETRY_URL}")
    print("Press Ctrl+C to stop")

    while True:
        try:
            telemetry = fetch_json(TELEMETRY_URL)
            ai_result = ai_controller.analyze(telemetry)
            mission_result = mission_controller.decide(ai_result)

            print("=" * 60)
            print("AUTONOMY LOOP")
            print("-" * 60)
            print(json.dumps({
                "telemetry": telemetry,
                "ai": ai_result,
                "mission": mission_result
            }, ensure_ascii=False, indent=2))
            print("=" * 60)

        except urllib.error.URLError as exc:
            print("=" * 60)
            print("AUTONOMY LOOP ERROR")
            print("-" * 60)
            print(f"Cannot reach DroneHybrid API: {exc}")
            print("=" * 60)

        except KeyboardInterrupt:
            print("\nAutonomy Loop stopped")
            break

        except Exception as exc:
            print("=" * 60)
            print("AUTONOMY LOOP ERROR")
            print("-" * 60)
            print(str(exc))
            print("=" * 60)

        time.sleep(3)


if __name__ == "__main__":
    main()
