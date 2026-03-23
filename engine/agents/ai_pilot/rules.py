def battery_warning(value):
<<<<<<< HEAD

    if value is None:
        return None

    if value <= 20:
        return "Battery critical"

    if value <= 35:
        return "Battery getting low"

=======
    if value is None:
        return None
    if value <= 20:
        return "Battery critical"
    if value <= 35:
        return "Battery getting low"
>>>>>>> 86ab79d (add engineer agent)
    return None


def gps_warning(fix):
<<<<<<< HEAD

    if fix in ("NO_FIX", "NO_GPS"):
        return "GPS signal lost"

    if fix == "2D_FIX":
        return "Weak GPS signal"

=======
    if fix in ("NO_FIX", "NO_GPS"):
        return "GPS signal lost"
    if fix == "2D_FIX":
        return "Weak GPS signal"
>>>>>>> 86ab79d (add engineer agent)
    return None


def speed_warning(speed):
<<<<<<< HEAD

    if speed is None:
        return None

    if speed > 20:
        return "Speed unusually high"

=======
    if speed is None:
        return None
    if speed > 20:
        return "Speed unusually high"
>>>>>>> 86ab79d (add engineer agent)
    return None


def link_warning(link):
<<<<<<< HEAD

    if link is False:
        return "Link lost"

    return None
=======
    if link is False:
        return "Link lost"
    return None


def altitude_warning(altitude_m):
    if altitude_m is None:
        return None
    if altitude_m > 150:
        return "Altitude above recommended survey level"
    return None
>>>>>>> 86ab79d (add engineer agent)
