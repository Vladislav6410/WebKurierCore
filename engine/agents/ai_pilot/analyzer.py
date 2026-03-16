from .rules import (
    battery_warning,
    gps_warning,
    speed_warning,
    link_warning,
)


def analyze_telemetry(data: dict):

    warnings = []

    battery = data.get("battery_remaining_pct")
    gps = data.get("gps_fix_type")
    speed = data.get("ground_speed_mps")
    link = data.get("link_alive")

    w = battery_warning(battery)
    if w:
        warnings.append(w)

    w = gps_warning(gps)
    if w:
        warnings.append(w)

    w = speed_warning(speed)
    if w:
        warnings.append(w)

    w = link_warning(link)
    if w:
        warnings.append(w)

    if not warnings:
        return {
            "status": "OK",
            "message": "Flight conditions normal"
        }

    return {
        "status": "WARNING",
        "warnings": warnings
    }