from typing import Any, Dict, List


class SafeMissionUploader:
    """
    Safe mission uploader for SITL / dry-run usage.
    """

    def __init__(self, dry_run: bool = True):
        self.dry_run = dry_run

    def validate_plan(self, mission: Dict[str, Any]) -> Dict[str, Any]:
        if not isinstance(mission, dict):
            return {"ok": False, "message": "Mission must be a dict"}

        items = mission.get("items")
        if not isinstance(items, list) or len(items) == 0:
            return {"ok": False, "message": "Mission items are missing"}

        for idx, item in enumerate(items):
            if not isinstance(item, dict):
                return {"ok": False, "message": f"Mission item {idx} must be a dict"}

            if "x" not in item or "y" not in item:
                return {"ok": False, "message": f"Mission item {idx} missing x/y"}

        return {
            "ok": True,
            "message": "Mission plan valid",
            "items_count": len(items)
        }

    def prepare_waypoints(self, mission: Dict[str, Any]) -> Dict[str, Any]:
        validation = self.validate_plan(mission)
        if not validation["ok"]:
            return validation

        prepared: List[Dict[str, Any]] = []

        for idx, item in enumerate(mission["items"]):
            prepared.append({
                "seq": idx,
                "lat": item.get("x"),
                "lon": item.get("y"),
                "alt": item.get("z", 0),
                "command": item.get("command", 16),
                "frame": item.get("frame", 3),
                "autocontinue": item.get("autocontinue", 1),
                "description": item.get("description", f"WP-{idx}")
            })

        return {
            "ok": True,
            "message": "Waypoints prepared",
            "dry_run": self.dry_run,
            "items_count": len(prepared),
            "waypoints": prepared
        }

    def upload(self, mission: Dict[str, Any]) -> Dict[str, Any]:
        prepared = self.prepare_waypoints(mission)
        if not prepared["ok"]:
            return prepared

        if self.dry_run:
            return {
                "ok": True,
                "executed": False,
                "dry_run": True,
                "message": "Mission upload simulated",
                "items_count": prepared["items_count"],
                "waypoints": prepared["waypoints"]
            }

        return {
            "ok": False,
            "executed": False,
            "dry_run": False,
            "message": "Real upload is disabled in this safe version"
        }

    def request_altitude_change(self, altitude_m: float) -> Dict[str, Any]:
        if altitude_m is None or altitude_m <= 0:
            return {"ok": False, "message": "Altitude must be > 0"}

        if self.dry_run:
            return {
                "ok": True,
                "executed": False,
                "dry_run": True,
                "message": f"Altitude change simulated: {altitude_m} m"
            }

        return {
            "ok": False,
            "executed": False,
            "dry_run": False,
            "message": "Real altitude change disabled in this safe version"
        }

    def request_rtl(self) -> Dict[str, Any]:
        if self.dry_run:
            return {
                "ok": True,
                "executed": False,
                "dry_run": True,
                "message": "RTL request simulated"
            }

        return {
            "ok": False,
            "executed": False,
            "dry_run": False,
            "message": "Real RTL disabled in this safe version"
        }

    def start_mission(self) -> Dict[str, Any]:
        if self.dry_run:
            return {
                "ok": True,
                "executed": False,
                "dry_run": True,
                "message": "Mission start simulated"
            }

        return {
            "ok": False,
            "executed": False,
            "dry_run": False,
            "message": "Real mission start disabled in this safe version"
        }
