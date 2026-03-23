from typing import Any, Dict, Optional

try:
    from pymavlink import mavutil
except Exception:  # pragma: no cover
    mavutil = None


class SafeMavlinkBridge:
    """
    Safe bridge for SITL / dry-run integration.

    Safety rules:
    - DRY_RUN is enabled by default
    - only localhost UDP/TCP endpoints are accepted
    - no arming / no takeoff / no motor commands
    - only whitelisted mission-level actions are mapped
    """

    ALLOWED_COMMANDS = {
        "MISSION_HOLD",
        "RETURN_TO_HOME",
        "MISSION_CONTINUE",
        "MISSION_ABORT",
    }

    def __init__(
        self,
        connection_string: str = "udp:127.0.0.1:14550",
        baudrate: int = 57600,
        dry_run: bool = True,
    ):
        self.connection_string = connection_string
        self.baudrate = baudrate
        self.dry_run = dry_run
        self.master = None

    def connect(self) -> Dict[str, Any]:
        if mavutil is None:
            return {
                "ok": False,
                "message": "pymavlink is not installed"
            }

        if not self._is_local_endpoint(self.connection_string):
            return {
                "ok": False,
                "message": "Only localhost SITL endpoints are allowed"
            }

        try:
            self.master = mavutil.mavlink_connection(
                self.connection_string,
                baud=self.baudrate
            )
            self.master.wait_heartbeat(timeout=10)
            return {
                "ok": True,
                "message": "MAVLink connected",
                "connection_string": self.connection_string,
                "dry_run": self.dry_run
            }
        except Exception as exc:
            return {
                "ok": False,
                "message": f"Connection failed: {exc}"
            }

    def get_state(self) -> Dict[str, Any]:
        if self.master is None:
            return {
                "ok": False,
                "message": "Bridge not connected"
            }

        try:
            hb = self.master.recv_match(type="HEARTBEAT", blocking=True, timeout=2)
            if hb is None:
                return {
                    "ok": False,
                    "message": "No heartbeat received"
                }

            try:
                mode = mavutil.mode_string_v10(hb)
            except Exception:
                mode = "UNKNOWN"

            armed = bool(
                hb.base_mode & mavutil.mavlink.MAV_MODE_FLAG_SAFETY_ARMED
            )

            return {
                "ok": True,
                "mode": mode,
                "armed": armed,
                "system": getattr(hb, "get_srcSystem", lambda: None)(),
                "component": getattr(hb, "get_srcComponent", lambda: None)(),
                "dry_run": self.dry_run
            }
        except Exception as exc:
            return {
                "ok": False,
                "message": f"State read failed: {exc}"
            }

    def apply_mission_action(self, mission_result: Dict[str, Any]) -> Dict[str, Any]:
        command = mission_result.get("command", "NO_OP")

        if command not in self.ALLOWED_COMMANDS:
            return {
                "ok": False,
                "message": f"Command not allowed: {command}"
            }

        if self.master is None:
            return {
                "ok": False,
                "message": "Bridge not connected"
            }

        if self.dry_run:
            return {
                "ok": True,
                "executed": False,
                "dry_run": True,
                "command": command,
                "message": self._describe_command(command)
            }

        try:
            if command == "MISSION_HOLD":
                self._set_mode_guided_or_loiter()
            elif command == "RETURN_TO_HOME":
                self._send_rtl()
            elif command == "MISSION_CONTINUE":
                self._set_mode_auto()
            elif command == "MISSION_ABORT":
                self._send_rtl()

            return {
                "ok": True,
                "executed": True,
                "dry_run": False,
                "command": command,
                "message": self._describe_command(command)
            }

        except Exception as exc:
            return {
                "ok": False,
                "message": f"Execution failed: {exc}",
                "command": command
            }

    def _send_rtl(self):
        self.master.mav.command_long_send(
            self.master.target_system,
            self.master.target_component,
            mavutil.mavlink.MAV_CMD_NAV_RETURN_TO_LAUNCH,
            0,
            0, 0, 0, 0, 0, 0, 0
        )

    def _set_mode_auto(self):
        mode_id = self.master.mode_mapping().get("AUTO")
        if mode_id is None:
            raise RuntimeError("AUTO mode not available")
        self.master.set_mode(mode_id)

    def _set_mode_guided_or_loiter(self):
        mapping = self.master.mode_mapping() or {}
        mode_id = mapping.get("GUIDED", mapping.get("LOITER"))
        if mode_id is None:
            raise RuntimeError("Neither GUIDED nor LOITER mode available")
        self.master.set_mode(mode_id)

    def _describe_command(self, command: str) -> str:
        if command == "MISSION_HOLD":
            return "Hold / loiter requested"
        if command == "RETURN_TO_HOME":
            return "Return-to-home requested"
        if command == "MISSION_CONTINUE":
            return "Resume auto mission requested"
        if command == "MISSION_ABORT":
            return "Abort mapped to safe RTL"
        return "No action"

    def _is_local_endpoint(self, connection_string: str) -> bool:
        lowered = connection_string.lower()
        return (
            "127.0.0.1" in lowered
            or "localhost" in lowered
        )
