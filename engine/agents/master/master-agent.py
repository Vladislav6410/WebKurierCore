#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import time

print("🧭 Master Agent: запущен (demo)", flush=True)

def loop():
    # здесь в будущем: координация, IPC/RPC, планировщик
    while True:
        time.sleep(15)

if __name__ == "__main__":
    loop()