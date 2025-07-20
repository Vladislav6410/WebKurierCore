from dronekit import connect, VehicleMode, LocationGlobalRelative
import time

def connect_vehicle(conn_str):
    print(f"Connecting to {conn_str} ...")
    return connect(conn_str, wait_ready=True)

def simple_takeoff_and_land(vehicle, target_alt=10):
    vehicle.mode = VehicleMode("GUIDED")
    vehicle.armed = True
    while not vehicle.armed:
        time.sleep(1)
    vehicle.simple_takeoff(target_alt)
    while vehicle.location.global_relative_frame.alt < target_alt * 0.95:
        time.sleep(1)
    vehicle.mode = VehicleMode("LAND")