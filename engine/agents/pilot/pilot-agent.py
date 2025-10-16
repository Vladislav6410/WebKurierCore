#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import time

print("✈️ Pilot Agent: демо-режим", flush=True)

def loop():
    # здесь появится телеметрия/маршруты/миссии (PX4/ArduPilot)
    while True:
        time.sleep(12)

if __name__ == "__main__":
    loop()