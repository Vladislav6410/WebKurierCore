cd /srv/webkurier-data/repos/WebKurier/WebKurierCore
cat > engine/agents/ai_pilot/run_loop.py << 'PY'
import json
import sys
import time
import urllib.request
import urllib.error

from engine.agents.ai_pilot.agent import AIPilotAgent

TELEMETRY_URL = "http://127.0.0.1:8000/api/autopilot/telemetry/live"
STATUS_URL = "http://127.0.0.1:8000/api/autopilot/status"


def fetch_json(url: str, timeout: int = 5) -> dict:
    with urllib.request.urlopen(url, timeout=timeout) as response:
        raw = response.read().decode("utf-8")
        return json.loads(raw)


def print_block(title: str, payload: dict):
    print("=" * 60)
    print(title)
    print("-" * 60)
    print(json.dumps(payload, ensure_ascii=False, indent=2))
    print("=" * 60)


def main():
    agent = AIPilotAgent()

    print("AI Pilot loop started")
    print(f"Telemetry source: {TELEMETRY_URL}")
    print("Press Ctrl+C to stop")
    print()

    while True:
        try:
            status = fetch_json(STATUS_URL)
            telemetry = fetch_json(TELEMETRY_URL)
            result = agent.analyze(telemetry)

            print_block("SYSTEM STATUS", status)
            print_block("LIVE TELEMETRY", telemetry)
            print_block("AI PILOT ANALYSIS", result)

        except urllib.error.URLError as exc:
            print("=" * 60)
            print("AI PILOT ERROR")
            print("-" * 60)
            print(f"Cannot reach DroneHybrid API: {exc}")
            print("=" * 60)

        except KeyboardInterrupt:
            print("\nAI Pilot loop stopped")
            sys.exit(0)

        except Exception as exc:
            print("=" * 60)
            print("AI PILOT ERROR")
            print("-" * 60)
            print(str(exc))
            print("=" * 60)

        time.sleep(2)


if __name__ == "__main__":
    main()
PY