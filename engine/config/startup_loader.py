#!/usr/bin/env python3
import yaml, os, subprocess, time

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "config", "config.yaml")

def load_config():
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)

def start_agent(name, path):
    full_path = os.path.join(os.getcwd(), path.strip("/"))
    if os.path.isdir(full_path):
        print(f"🚀 Запуск агента: {name} → {full_path}")
        subprocess.Popen(["python3", os.path.join(full_path, f"{name}-agent.py")], cwd=full_path)
    else:
        print(f"⚠️ Агент {name} не найден по пути {full_path}")

def main():
    cfg = load_config()
    print("🧠 WebKurierCore Autostart")
    print(f"Загружено модулей: {len(cfg['modules'])}")

    for key, module in cfg["modules"].items():
        if module.get("enabled"):
            start_agent(key, module["path"])
            time.sleep(1.5)

    print("✅ Все активные агенты запущены.")

if __name__ == "__main__":
    main()