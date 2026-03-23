from typing import Any, Dict


class MissionController:
    """
    Safe mission action mapper.
    Does not send commands to the drone directly.
    It converts AI controller output into a mission command plan.
    """

    def decide(self, ai_result: Dict[str, Any]) -> Dict[str, Any]:
        final_action = ai_result.get("final_action", "CONTINUE")
        risk_band = ai_result.get("risk_band", "UNKNOWN")
        mission_policy = ai_result.get("mission_policy", {})
        route_correction = ai_result.get("route_correction", "NONE")

        command = "NO_OP"
        priority = "LOW"
        execution_mode = "ADVISORY"

        if final_action == "ABORT_MISSION":
            command = "MISSION_ABORT"
            priority = "CRITICAL"
            execution_mode = "SAFE_RECOVERY"

        elif final_action == "RTL_RECOMMENDED":
            command = "RETURN_TO_HOME"
            priority = "HIGH"
            execution_mode = "GUIDED_RETURN"

        elif final_action == "HOLD":
            command = "MISSION_HOLD"
            priority = "MEDIUM"
            execution_mode = "PAUSE_AND_REASSESS"

        elif final_action == "CONTINUE":
            command = "MISSION_CONTINUE"
            priority = "LOW"
            execution_mode = "NORMAL"

        return {
            "agent": "MISSION_CONTROLLER",
            "status": "READY",
            "command": command,
            "priority": priority,
            "execution_mode": execution_mode,
            "risk_band": risk_band,
            "route_correction": route_correction,
            "mission_policy": mission_policy,
            "autonomy_state": self._autonomy_state(command),
        }

    def _autonomy_state(self, command: str) -> str:
        if command == "MISSION_ABORT":
            return "RECOVERY"
        if command == "RETURN_TO_HOME":
            return "RETURNING"
        if command == "MISSION_HOLD":
            return "HOLDING"
        if command == "MISSION_CONTINUE":
            return "ACTIVE"
        return "IDLE"
