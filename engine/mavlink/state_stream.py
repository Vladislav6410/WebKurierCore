import json
import time

from engine.mavlink.bridge import SafeMavlinkBridge


def main():
    bridge = SafeMavlinkBridge()

    result = bridge.connect()
    print("CONNECT:", json.dumps(result, ensure_ascii=False, indent=2))

    if not result.get("ok"):
        return

    print("State stream started")
    print("Press Ctrl+C to stop")

    while True:
        try:
            state = bridge.get_state()
            print("=" * 60)
            print("MAVLINK STATE STREAM")
            print("-" * 60)
            print(json.dumps(state, ensure_ascii=False, indent=2))
            print("=" * 60)
            time.sleep(2)

        except KeyboardInterrupt:
            print("\nState stream stopped")
            break

        except Exception as exc:
            print("=" * 60)
            print("STATE STREAM ERROR")
            print("-" * 60)
            print(str(exc))
            print("=" * 60)
            time.sleep(2)


if __name__ == "__main__":
    main()
