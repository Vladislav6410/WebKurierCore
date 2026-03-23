from engine.mavlink.bridge import SafeMavlinkBridge

bridge = SafeMavlinkBridge()

print("Connecting...")

result = bridge.connect()
print(result)

if result["ok"]:
    state = bridge.get_state()
    print("STATE:", state)

    mission = {
        "command": "MISSION_HOLD"
    }

    action = bridge.apply_mission_action(mission)
    print("ACTION:", action)
