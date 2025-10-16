#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import time

print("🌍 Geodesist Agent: heartbeat", flush=True)

def loop():
    # сюда потом: ортофото, DSM/DTM, NDVI/NDRE, отчёты
    i = 0
    while True:
        i += 1
        print(f"Geodesist: tick {i}", flush=True)
        time.sleep(10)

if __name__ == "__main__":
    loop()