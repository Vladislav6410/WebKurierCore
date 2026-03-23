import json
import time
import urllib.request
import urllib.error

from engine.agents.ai_navigator.navigator_agent import AINavigatorAgent

TELEMETRY_URL = "http://127.0.0.1:8000/api/autopilot/telemetry/live"


def fetch_json(url: str, timeout: int = 5) -> dict:
    with urllib.request.urlopen(url, timeout=timeout) as response:
        raw = response.read().decode("utf-8")
        return json.loads(raw)


def main():
    agent = AINavigatorAgent()

    print("AI Navigator loop started")
    print(f"Telemetry source: {TELEMETRY_URL}")
    print("Press Ctrl+C to stop")

    while True:
        try:
            telemetry = fetch_json(TELEMETRY_URL)
            result = agent.analyze(telemetry)

            print("=" * 60)
            print("AI NAVIGATOR ANALYSIS")
            print("-" * 60)
            print(json.dumps(result, ensure_ascii=False, indent=2))
            print("=" * 60)

        except urllib.error.URLError as exc:
            print("=" * 60)
            print("AI NAVIGATOR ERROR")
            print("-" * 60)
            print(f"Cannot reach DroneHybrid API: {exc}")
            print("=" * 60)

        except KeyboardInterrupt:
            print("\nAI Navigator loop stopped")
            break

        except Exception as exc:
            print("=" * 60)
            print("AI NAVIGATOR ERROR")
            print("-" * 60)
            print(str(exc))
            print("=" * 60)

        time.sleep(3)


if __name__ == "__main__":
    main()
