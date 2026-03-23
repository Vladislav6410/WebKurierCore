from .rules import (
    battery_warning,
    gps_warning,
    speed_warning,
    link_warning,
<<<<<<< HEAD
)


def analyze_telemetry(data: dict):

=======
    altitude_warning,
)


def analyze_telemetry(data: dict) -> dict:
>>>>>>> 86ab79d (add engineer agent)
    warnings = []

    battery = data.get("battery_remaining_pct")
    gps = data.get("gps_fix_type")
    speed = data.get("ground_speed_mps")
    link = data.get("link_alive")
<<<<<<< HEAD

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
=======
    altitude = data.get("altitude_m")

    checks = [
        battery_warning(battery),
        gps_warning(gps),
        speed_warning(speed),
        link_warning(link),
        altitude_warning(altitude),
    ]

    for item in checks:
        if item:
            warnings.append(item)
>>>>>>> 86ab79d (add engineer agent)

    if not warnings:
        return {
            "status": "OK",
<<<<<<< HEAD
            "message": "Flight conditions normal"
        }

    return {
        "status": "WARNING",
        "warnings": warnings
    }
=======
            "message": "Flight conditions normal",
            "recommendation": "Continue mission"
        }

    recommendation = "Check warnings before continuing mission"
    if "Battery critical" in warnings or "Link lost" in warnings:
        recommendation = "Recommend RTL or immediate mission pause"

    return {
        "status": "WARNING",
        "warnings": warnings,
        "recommendation": recommendation
    }
>>>>>>> 86ab79d (add engineer agent)
