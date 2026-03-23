from typing import Any, Dict

from engine.agents.ai_pilot.agent import AIPilotAgent
from engine.agents.ai_navigator.navigator_agent import AINavigatorAgent
from engine.agents.ai_flight_brain.brain import AIFlightBrain


class AIController:
    """
    Unified AI control layer for WebKurier drone logic.

    Flow:
    Telemetry
      -> Navigator (risk scan)
      -> Pilot (operator recommendation)
      -> Flight Brain (decision layer)
      -> Unified controller output
    """

    def __init__(self):
        self.navigator = AINavigatorAgent()
        self.pilot = AIPilotAgent()
        self.brain = AIFlightBrain()

    def analyze(self, telemetry: Dict[str, Any]) -> Dict[str, Any]:
        navigator_result = self.navigator.analyze(telemetry)
        pilot_result = self.pilot.analyze(telemetry)
        brain_result = self.brain.analyze(telemetry)

        final_action = brain_result.get("decision", "CONTINUE")
        risk_band = brain_result.get("risk_band", "UNKNOWN")
        route_correction = brain_result.get("route_correction", "NONE")

        mission_policy = self._build_mission_policy(
            final_action=final_action,
            route_correction=route_correction
        )

        return {
            "agent": "AI_CONTROLLER",
            "status": "ONLINE",
            "final_action": final_action,
            "risk_band": risk_band,
            "mission_policy": mission_policy,
            "route_correction": route_correction,
            "navigator": navigator_result,
            "pilot": pilot_result,
            "brain": brain_result,
        }

    def _build_mission_policy(self, final_action: str, route_correction: str) -> Dict[str, Any]:
        if final_action == "ABORT_MISSION":
            return {
                "mission_state": "ABORTED",
                "autonomy_mode": "SAFE_RECOVERY",
                "rtl": True,
                "hold": False,
                "note": route_correction,
            }

        if final_action == "RTL_RECOMMENDED":
            return {
                "mission_state": "RETURNING",
                "autonomy_mode": "RETURN_HOME",
                "rtl": True,
                "hold": False,
                "note": route_correction,
            }

        if final_action == "HOLD":
            return {
                "mission_state": "PAUSED",
                "autonomy_mode": "REASSESS",
                "rtl": False,
                "hold": True,
                "note": route_correction,
            }

        return {
            "mission_state": "ACTIVE",
            "autonomy_mode": "CONTINUE",
            "rtl": False,
            "hold": False,
            "note": route_correction,
        }
