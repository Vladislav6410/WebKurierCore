# WebKurier DroneAutopilot — autopilot-core
Версия: 2025-12-09  
Уровень: Domain Hub (VehicleHub / DroneAutopilot)  
Назначение: Центральная логика автономных миссий для геодезии, геологии, леса, урбанистики и mining.

autopilot-core — это сердце системы полёта и миссий WebKurier DroneAutopilot.  
Модуль отвечает за планирование, выполнение и контроль миссий, включая AI-настройки, управление сенсорами, режимы LiDAR/фотограмметрии и адаптивное поведение дрона в реальном времени.

---

# 1. Роль модуля

**autopilot-core обеспечивает:**

1. Планирование миссий:
   - area, corridor, vertical scans, multisensor missions.
   - GSD-based altitude + terrain-aware высоты.
   - адаптивные AI-паттерны для LiDAR/фото.

2. Исполнение миссий:
   - маршрутная логика,
   - переключение режимов LiDAR/RGB/multispectral/thermal,
   - безопасные переходы между точками.

3. Интеграция с MAVLink/MAVSDK:
   - управление скоростью, yaw, pitch, altitude,
   - поддержка PX4/ArduPilot,
   - синхронизация IMU/RTK/PPK.

4. AI-оптимизация в реальном времени:
   - корректировки маршрута по terrain/объектам,
   - AI-overlay: обнаружение пропусков, деформаций, риск-объектов,
   - реакция на ветер, уклон рельефа, плотность растительности.

5. Связь с `telemetry-bridge`, `fusion-engine`, `mission-planner`:
   - autopilot-core = главный исполнитель миссий.

---

# 2. Структура модуля

```text
autopilot-core/
  |-- src/
  |     |-- autopilot.py
  |     |-- mission_executor.py
  |     |-- flight_modes.py
  |     |-- lidar_modes.py
  |     |-- rgb_modes.py
  |     |-- terrain_ai.py
  |     |-- safety.py
  |     |-- rtk_ppk_sync.py
  |
  |-- interfaces/
  |     |-- mavlink_adapter.py
  |     |-- mavsdk_adapter.py
  |     |-- sensors_api.py
  |
  |-- configs/
  |     |-- default_mission.json
  |     |-- terrain_profiles.json
  |     |-- lidar_profiles.json
  |
  |-- tests/
  |     |-- simulation_mountain.py
  |     |-- simulation_forest.py
  |     |-- simulation_urban.py
  |
  |-- README.md  (этот файл)