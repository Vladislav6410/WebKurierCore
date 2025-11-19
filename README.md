С учётом варианта B (часть анализа/оркестрации в Hybrid, тяжёлые вычисления в DroneHybrid) даю стабильный финальный README для репозитория №3 – WebKurierDroneHybrid. Его можно вставлять как есть в README.md.

# WebKurierDroneHybrid · Drones · Geodesy · GeoViz3D · Autopilot

Unified drone hub for geodesy, 3D mapping, GeoViz3D visualization, swarm missions and hybrid autopilot modes.  
Чётко структурированный «дрон-хаб» для геодезии, 3D-моделирования, GeoViz3D-визуализации, миссий роем и гибридного автопилота.

**Made in Germany · Developed by VLADOEXPORT (Vladyslav Hushchyn / Владислав Гущин)**

---

## 🇬🇧 Overview

**WebKurierDroneHybrid** is the main drone and geodesy backend of the WebKurier ecosystem.  
It focuses on:

- Photogrammetry and geodesy pipelines (Geodesy & 3D Suite)
- 3D / 4D terrain visualization (GeoViz3D backend)
- Mission planning, execution and telemetry
- Hybrid autopilot modes (manual / auto / geodesy / acro / swarm)
- Power modes (tether, solar, generator)
- Data exchange with WebKurierHybrid, WebKurierCore and WebKurierChain

**Logic split (option B):**

- **WebKurierDroneHybrid** — performs **heavy computations**:
  - data ingestion, photogrammetry, DEM/DSM/DTM,
  - NDVI/NDRE, volumes, hydrology,
  - mesh/cloud generation, GeoViz3D terrain preparation.
- **WebKurierHybrid** — performs **cross-system analysis and orchestration**:
  - temporal comparisons across missions,
  - unified reports (drone + chain + business),
  - AI-driven insights via ExpertAgent.

---

## 🇷🇺 Обзор

**WebKurierDroneHybrid** — основной бэкенд для дронов и геодезии в экосистеме WebKurier.  
Он отвечает за:

- Геодезию и фотограмметрию (Geodesy & 3D Suite)
- 3D / 4D визуализацию рельефа (бэкенд GeoViz3D)
- Планирование, выполнение миссий и телеметрию
- Гибридный автопилот (ручной / авто / геодезия / акро / рой)
- Режимы питания (трос, солнечные панели, генератор)
- Обмен данными с WebKurierHybrid, WebKurierCore и WebKurierChain

**Разделение логики (вариант B):**

- **WebKurierDroneHybrid** — выполняет **тяжёлые вычисления**:
  - загрузка данных, фотограмметрия, DEM/DSM/DTM,
  - NDVI/NDRE, объёмы, гидравлика,
  - генерация mesh/облаков точек, подготовка данных для GeoViz3D.
- **WebKurierHybrid** — выполняет **сквозной анализ и оркестрацию**:
  - сравнение миссий по времени,
  - объединённые отчёты (дрон + блокчейн + бизнес),
  - AI-анализ через ExpertAgent.

---

## ✨ Key Modules / Основные модули

### 🧭 Autopilot Modes / Режимы автопилота

Backend for autopilot agents and flight modes:

- `manual_mode` — manual RC / assisted manual
- `auto_mode` — waypoint / route missions
- `geodesy_mode` — grid missions, GSD-based planning
- `acro_mode` — acrobatics / training mode
- `swarm_mode` — multi-drone swarm operations

Поддержка PX4 / ArduPilot / MAVLink (через адаптеры) и интеграция с AutopilotAgent / PilotAgent из Hybrid/Core.

---

### 🌍 Geodesy & 3D Suite / Геодезия и 3D-комплекс

**Модуль `geodesy_suite`** — флагманский блок для:

- Импорта:
  - фото/видео с дронов
  - логов полёта (telemetry, GPX, CSV)
  - GCP (Ground Control Points)
- Фотограмметрии:
  - ORTHO (ортомозаика)
  - DSM/DTM/DEM
  - Point cloud (LAS/LAZ/PLY)
  - Mesh (OBJ/glTF)
- Аналитики:
  - NDVI, NDRE, растительность
  - объёмы выемки/насыпи
  - профили, сечения, изолинии
- Гидравлики:
  - интеграция с HEC-RAS и аналогами
  - моделирование затопления
  - карты глубин и скорости потока
- Пресетов:
  - агро
  - стройка
  - карьеры
  - реки/гидравлика

UI для этого модуля реализован в **WebKurierCore** (панель геодезиста), а WebKurierDroneHybrid отвечает за backend и расчёты.

---

### 🛰 GeoViz3D Engine / Движок GeoViz3D

**GeoViz3D** — это 3D/4D движок визуализации рельефа и исторических данных, работающий как backend в DroneHybrid.

Основные функции:

- Загрузка рельефа по координатам + дате (DEM/DSM/DTM)
- Сбор исторических данных (например, Beckum 1945 vs 2025)
- Конвертация DEM в 3D mesh (OBJ / glTF)
- Временной анализ:
  - изменения высот
  - изменения объёмов
  - эрозия/накопление
  - динамика растительности (NDVI)
- Интеграция с **GRM API** (Geospatial Resource Management) и другими поставщиками данных.
- Подготовка данных для фронтенда (WebKurierCore: React + Three.js).

Тип миссии: `geoviz_analysis` (см. ниже).

---

### 🔋 Power & Telemetry / Питание и телеметрия

- Поддержка:
  - тросового питания (tether mode)
  - солнечных панелей (solar mode)
  - гибридных решений (генератор + аккумуляторы)
- Подсистема телеметрии:
  - логирование полётных параметров
  - логирование энергорасхода
  - экспорт логов в WebKurierHybrid и WebKurierChain

---

### 🔗 Integration with Hybrid / Интеграция с Hybrid

WebKurierDroneHybrid тесно интегрирован с:

- **WebKurierHybrid**:
  - оркестрация миссий и деплой
  - сквозной анализ миссий (во времени и по объектам)
  - ExpertAgent для анализа отчётов и логов
- **WebKurierCore**:
  - геодезический UI
  - GeoViz3D Dashboard
- **WebKurierChain**:
  - хранение ключевых результатов и хэшей отчётов
- **WebKurierSecurity**:
  - проверка файлов и скриптов на угрозы

---

## 🗂 Repository Structure / Структура репозитория

```text
WebKurierDroneHybrid/
├── engine/
│   ├── autopilot/
│   │   ├── manual_mode.py
│   │   ├── auto_mode.py
│   │   ├── geodesy_mode.py
│   │   ├── acro_mode.py
│   │   ├── swarm_mode.py
│   │   └── mavlink_adapter.py       # PX4/ArduPilot integration
│   │
│   ├── geodesy_suite/
│   │   ├── ingestion/               # Import of photos, logs, GCP
│   │   ├── photogrammetry/          # ODM/OpenDroneMap pipelines, etc.
│   │   ├── modeling_3d/             # Mesh / point cloud generation
│   │   ├── analysis/                # NDVI, volumes, profiles
│   │   ├── hydraulics/              # HEC-RAS integration, flood models
│   │   ├── visualization/           # 2D/3D map preparation
│   │   │   └── geoviz3d/
│   │   │       ├── __init__.py
│   │       │   ├── terrain_loader.py
│   │       │   ├── temporal_analyzer.py
│   │       │   ├── geo_renderer.py
│   │       │   ├── hyperspectral_viz.py
│   │       │   ├── historical_overlay.py
│   │       │   └── grm_integration.py
│   │   ├── reports/                 # PDF/GeoPDF generators (backend part)
│   │   ├── missions/                # geodesy mission builders
│   │   ├── presets/                 # agro, construction, mining, rivers
│   │   └── api/
│   │       ├── geodesy_api.py
│   │       └── geoviz3d_api.py
│   │
│   ├── power/
│   │   ├── mode_tether.py
│   │   ├── mode_solar.py
│   │   └── mode_hybrid.py
│   │
│   ├── telemetry/
│   │   ├── telemetry_logger.py
│   │   └── telemetry_export.py
│   │
│   └── config/
│       ├── dronehybrid.yaml        # Main configuration
│       └── geodesy_presets.yaml    # Geodesy presets
│
├── exchange/
│   ├── missions_in/
│   │   ├── mission_photogrammetry.json
│   │   ├── mission_geodesy.json
│   │   └── mission_geoviz_analysis.json
│   ├── missions_out/
│   └── terrain_cache/
│       ├── beckum_1945/
│       │   ├── terrain.obj
│       │   ├── orthophoto.tif
│       │   └── metadata.json
│       └── ...
│
├── docs/
│   ├── dronehybrid_overview.md
│   ├── geodesy_suite_guide.md
│   ├── geoviz3d_guide.md
│   └── missions_schema.md
│
├── infra/
│   ├── docker/
│   │   ├── Dockerfile
│   │   └── docker-compose.yml
│   └── k8s/
│       └── webkurier-dronehybrid/
│
├── .github/
│   └── workflows/
│       └── ci-dronehybrid.yml
│
├── Makefile
├── LICENSE
└── README.md

Детальные спецификации модулей (файлы, параметры, схемы JSON) вынесены в docs/, чтобы не перегружать README и не менять его при каждом добавлении новой функции.

⸻

📡 Mission Types / Типы миссий

Photogrammetry / Фотограмметрия

{
  "schema_version": "1.1",
  "id": "msn-photo-001",
  "type": "photogrammetry",
  "params": {
    "area": "100x100m",
    "gsd_cm": 2,
    "overlap": {
      "front": 75,
      "side": 70
    },
    "altitude_m": 80,
    "speed_mps": 6
  }
}

Geodesy / Геодезия

{
  "schema_version": "1.1",
  "id": "msn-geo-001",
  "type": "geodesy",
  "params": {
    "location": {
      "lat": 51.7548,
      "lon": 8.0415,
      "name": "Beckum, Germany"
    },
    "targets": ["ORTHO", "DSM", "LAS", "VOLUME"],
    "gcp": true
  }
}

GeoViz Analysis / Анализ GeoViz (geoviz_analysis)

{
  "schema_version": "1.1",
  "id": "msn-viz-001",
  "type": "geoviz_analysis",
  "params": {
    "location": {
      "lat": 51.7548,
      "lon": 8.0415,
      "name": "Beckum, Germany"
    },
    "temporal": {
      "date": "1945-04-01",
      "compare_with": "2025-11-15"
    },
    "layers": ["DEM", "ORTHO", "NDVI", "GEOLOGY"],
    "output": ["MESH_3D", "CHANGE_MAP", "REPORT"]
  }
}


⸻

🐳 Docker

Minimal example:

version: "3.9"
services:
  dronehybrid:
    build: ./infra/docker
    ports:
      - "8100:8100"
    volumes:
      - ./exchange:/app/exchange
    environment:
      HYBRID_API_URL: "http://webkurier-hybrid:8099"
      LOG_LEVEL: "INFO"


⸻

🧪 CI / Continuous Integration

./.github/workflows/ci-dronehybrid.yml включает:
	•	Линтинг Python (ruff/flake8 + black)
	•	Юнит-тесты основных модулей
	•	Проверку схем JSON миссий
	•	Сборку Docker-образа
	•	Базовый smoke-тест API

⸻

📜 License / Лицензия

© 2025 VLADOEXPORT · WebKurierDroneHybrid
Created by Vladyslav Hushchyn · All Rights Reserved
Made in Germany

© 2025 VLADOEXPORT · Проект WebKurierDroneHybrid
Создано Владиславом Гущиным · Все права защищены
Произведено в Германии

License type / Тип лицензии: VLADOEXPORT License v1.0 (MIT-compatible).

Если хочешь, дальше можем:

- сделать такой же стабильный README для **репозитория №4 (WebKurierChain)**,  
или  
- отдельно оформить один из `docs/*.md` (например, `geodesy_suite_guide.md` с более подробной структурой модулей).

  
