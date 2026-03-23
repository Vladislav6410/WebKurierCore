from typing import Any, Dict, List


class AIFlightBrain:
    """
    Safe decision layer.
    This module DOES NOT send commands to the drone.
    It only analyzes telemetry and returns recommended actions.
    """

    def analyze(self, telemetry: Dict[str, Any]) -> Dict[str, Any]:
        reasons: List[str] = []
        score = 0

        link_alive = telemetry.get("link_alive")
        battery_pct = telemetry.get("battery_remaining_pct")
        gps_fix_type = telemetry.get("gps_fix_type")
        satellites_visible = telemetry.get("satellites_visible")
        altitude_m = telemetry.get("altitude_m")
        ground_speed_mps = telemetry.get("ground_speed_mps")
        climb_rate_mps = telemetry.get("climb_rate_mps")
        home_distance_m = telemetry.get("home_distance_m")
        ekf_status = telemetry.get("ekf_status")
        failsafe_state = telemetry.get("failsafe_state")

        # 1. Link
        if link_alive is False:
            score += 5
            reasons.append("Link lost")

        # 2. Battery
        if battery_pct is None:
            score += 1
            reasons.append("Battery telemetry unavailable")
        elif battery_pct <= 15:
            score += 5
            reasons.append("Battery critical")
        elif battery_pct <= 25:
            score += 3
            reasons.append("Battery low")
        elif battery_pct <= 35:
            score += 1
            reasons.append("Battery moderate")

        # 3. GPS
        if gps_fix_type in ("NO_GPS", "NO_FIX"):
            score += 5
            reasons.append("GPS unavailable")
        elif gps_fix_type == "2D_FIX":
            score += 3
            reasons.append("Weak GPS fix")

        if satellites_visible is not None and satellites_visible < 8:
            score += 2
            reasons.append("Low satellite count")

        # 4. EKF / failsafe
        if ekf_status == "BAD":
            score += 4
            reasons.append("EKF degraded")

        if failsafe_state == "ACTIVE":
            score += 5
            reasons.append("Failsafe active")

        # 5. Flight profile
        if altitude_m is not None and altitude_m > 150:
            score += 1
            reasons.append("Altitude above recommended survey band")

        if ground_speed_mps is not None and ground_speed_mps > 20:
            score += 2
            reasons.append("Ground speed high")

        if climb_rate_mps is not None and abs(climb_rate_mps) > 5:
            score += 2
            reasons.append("Climb rate aggressive")

        # 6. Mission geometry / return feasibility
        if battery_pct is not None and home_distance_m is not None:
            if battery_pct <= 25 and home_distance_m > 500:
                score += 4
                reasons.append("Low battery with long home distance")
            elif battery_pct <= 35 and home_distance_m > 1000:
                score += 3
                reasons.append("Battery margin shrinking for return")

        # Decision ladder
        decision = "CONTINUE"
        confidence = "LOW"
        mission_adjustment = "NONE"

        if score >= 10:
            decision = "ABORT_MISSION"
            confidence = "HIGH"
            mission_adjustment = "IMMEDIATE_RETURN_SEQUENCE"
        elif score >= 7:
            decision = "RTL_RECOMMENDED"
            confidence = "HIGH"
            mission_adjustment = "RETURN_HOME"
        elif score >= 4:
            decision = "HOLD"
            confidence = "MEDIUM"
            mission_adjustment = "PAUSE_AND_REASSESS"
        else:
            decision = "CONTINUE"
            confidence = "MEDIUM"
            mission_adjustment = "KEEP_CURRENT_PLAN"

        # Route correction suggestion
        route_correction = self._route_correction_hint(
            telemetry=telemetry,
            decision=decision
        )

        # Risk band
        if score >= 10:
            risk_band = "CRITICAL"
        elif score >= 7:
            risk_band = "HIGH"
        elif score >= 4:
            risk_band = "MEDIUM"
        else:
            risk_band = "LOW"

        return {
            "agent": "AI_FLIGHT_BRAIN",
            "risk_score": score,
            "risk_band": risk_band,
            "decision": decision,
            "confidence": confidence,
            "mission_adjustment": mission_adjustment,
            "route_correction": route_correction,
            "reasons": reasons if reasons else ["Flight conditions normal"],
            "telemetry_snapshot": {
                "link_alive": link_alive,
                "battery_remaining_pct": battery_pct,
                "gps_fix_type": gps_fix_type,
                "satellites_visible": satellites_visible,
                "altitude_m": altitude_m,
                "ground_speed_mps": ground_speed_mps,
                "climb_rate_mps": climb_rate_mps,
                "home_distance_m": home_distance_m,
                "ekf_status": ekf_status,
                "failsafe_state": failsafe_state,
            }
        }

    def _route_correction_hint(self, telemetry: Dict[str, Any], decision: str) -> str:
        battery_pct = telemetry.get("battery_remaining_pct")
        gps_fix_type = telemetry.get("gps_fix_type")
        link_alive = telemetry.get("link_alive")
        altitude_m = telemetry.get("altitude_m")

        if decision == "ABORT_MISSION":
            return "Abort current route and transition to safe recovery flow"

        if decision == "RTL_RECOMMENDED":
            return "Terminate survey legs and return to home corridor"

        if decision == "HOLD":
            if gps_fix_type in ("NO_GPS", "NO_FIX", "2D_FIX"):
                return "Hold position or reduce maneuver complexity until navigation stabilizes"
            if battery_pct is not None and battery_pct <= 35:
                return "Shorten route and prioritize nearest safe return path"
            if link_alive is False:
                return "Hold mission logic and wait for comms recovery"
            return "Pause route progression and reassess telemetry"

        if altitude_m is not None and altitude_m > 150:
            return "Consider lowering altitude to survey band"

        return "No correction required"
