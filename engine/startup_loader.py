#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import yaml, os, subprocess, time, sys

BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
CONFIG_PATH = os.path.join(BASE, 'config', 'config.yaml')

def load_config():
    with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
        return yaml.safe_load(f)

def start_agent(key, module):
    path = module.get('path', '/')
    agent_dir = os.path.normpath(os.path.join(BASE, path.strip('/')))
    entry_file = os.path.join(agent_dir, f'{key}-agent.py')
    if os.path.isfile(entry_file):
        print(f'🚀 Запуск агента: {key} ({entry_file})', flush=True)
        subprocess.Popen(['python3', entry_file], cwd=agent_dir)
    else:
        print(f'⚠️ Не найден файл запуска: {entry_file}', flush=True)

def main():
    print('🧠 WebKurierCore Autostart', flush=True)
    try:
        cfg = load_config()
    except Exception as e:
        print(f'❌ Ошибка загрузки конфига: {e}', flush=True)
        sys.exit(1)

    modules = cfg.get('modules', {})
    print(f'🔧 Всего модулей: {len(modules)}', flush=True)

    for key, mod in modules.items():
        if mod.get("enabled"):
            start_agent(key, mod)
            time.sleep(1.0)

    print('✅ Все активные агенты запущены', flush=True)

if __name__ == '__main__':
    main()