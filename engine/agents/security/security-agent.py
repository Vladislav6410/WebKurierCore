#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os, time

print("🛡 Security Agent: проверяю окружение", flush=True)

CHECK_VARS = ["DROPBOX_TOKEN", "TELEGRAM_BOT_TOKEN"]

def check_env():
    for k in CHECK_VARS:
        print(f" • {k} = {'set' if os.environ.get(k) else 'missing'}", flush=True)

if __name__ == "__main__":
    while True:
        check_env()
        time.sleep(30)