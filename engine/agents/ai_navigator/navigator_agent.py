from engine.agents.ai_navigator.risk_rules import (
    battery_risk,
    gps_risk,
    link_risk,
    altitude_risk
)


class AINavigatorAgent:

    def analyze(self, telemetry):

        battery = battery_risk(telemetry.get("battery_remaining_pct"))
        gps = gps_risk(
            telemetry.get("gps_fix_type"),
            telemetry.get("satellites_visible")
        )
        link = link_risk(telemetry.get("link_alive"))
        altitude = altitude_risk(telemetry.get("altitude_m"))

        risks = [battery, gps, link, altitude]

        highest = "low"
        for r in risks:
            if r["level"] == "high":
                highest = "high"
                break
            if r["level"] == "medium":
                highest = "medium"

        return {
            "agent": "AI_NAVIGATOR",
            "risk_level": highest,
            "details": risks
        }
