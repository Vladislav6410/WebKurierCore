def battery_warning(value):

    if value is None:
        return None

    if value <= 20:
        return "Battery critical"

    if value <= 35:
        return "Battery getting low"

    return None


def gps_warning(fix):

    if fix in ("NO_FIX", "NO_GPS"):
        return "GPS signal lost"

    if fix == "2D_FIX":
        return "Weak GPS signal"

    return None


def speed_warning(speed):

    if speed is None:
        return None

    if speed > 20:
        return "Speed unusually high"

    return None


def link_warning(link):

    if link is False:
        return "Link lost"

    return None