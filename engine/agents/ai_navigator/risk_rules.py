def battery_risk(battery_pct):
    if battery_pct is None:
        return {"level": "unknown", "message": "Battery data unavailable"}
    if battery_pct <= 20:
        return {"level": "high", "message": "Battery critical"}
    if battery_pct <= 35:
        return {"level": "medium", "message": "Battery getting low"}
    return {"level": "low", "message": "Battery normal"}


def gps_risk(gps_fix_type, satellites_visible):
    if gps_fix_type in ("NO_GPS", "NO_FIX"):
        return {"level": "high", "message": "GPS unavailable"}
    if gps_fix_type == "2D_FIX":
        return {"level": "medium", "message": "Weak GPS fix"}
    if satellites_visible is not None and satellites_visible < 8:
        return {"level": "medium", "message": "Low satellite count"}
    return {"level": "low", "message": "GPS stable"}


def link_risk(link_alive):
    if link_alive is False:
        return {"level": "high", "message": "Link lost"}
    if link_alive is None:
        return {"level": "unknown", "message": "Link state unavailable"}
    return {"level": "low", "message": "Link stable"}


def altitude_risk(altitude_m):
    if altitude_m is None:
        return {"level": "unknown", "message": "Altitude unavailable"}
    if altitude_m > 150:
        return {"level": "medium", "message": "Altitude above recommended survey band"}
    return {"level": "low", "message": "Altitude normal"}
