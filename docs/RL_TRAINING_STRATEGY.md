# RL Training Strategy for WebKurier (PhoneCore ↔ Core ↔ Hybrid)
Made in Germany • WebKurier ecosystem • v1.0

## 0) Цель документа
Связать “эволюционную линию” PPO → GRPO → DAPO с архитектурой WebKurier и дать практическое решение:
- какие модели и где использовать (Translator / Voice / Lessons / Council),
- где RL оправдан, а где лучше SFT / rules,
- какие verifiers/rewards нужны,
- какую роль играют Core и Hybrid (routing, entitlements, метрики), без смешивания доменных ролей.

---

## 1) Архитектурная привязка (строго по границам репозиториев)

### 1.1 WebKurierCore (Level 1) — Router, NOT Trainer
Core:
- маршрутизирует задачи (Terminal/Portal/Council routing),
- применяет entitlements/roles (кто может что делать),
- агрегирует ответы,
- НЕ обучает модели и НЕ хранит тренинговые секреты.

Core может:
- запускать запросы в PhoneCore,
- передавать контекст (язык, домен, глоссарий, стиль, tier),
- собирать telemetry/quality signals обратно в Hybrid/Chain.

### 1.2 WebKurierPhoneCore (Domain hub) — место для качества речи/перевода/уроков
PhoneCore:
- Translator pipeline (text + realtime captions),
- Voice pipeline (ASR/TTS),
- Lessons A1–C1 (pedagogy + exercises + assessment),
- хранит доменные verifiers, scoring и датасеты (без секретов).

### 1.3 WebKurierHybrid (Orchestrator)
Hybrid:
- CI/CD, деплой, healthchecks,
- сбор метрик качества и стабильности,
- контроль безопасности: gate на датасеты, модели, артефакты обучения,
- хранение секретов (через защищённые механизмы), НЕ в репозиториях.

---

## 2) Связь “PDF с моделями” с WebKurier: как читать и применять
Если PDF — это список/каталог моделей, применяем правило:
1) Разделить модели по задачам:
   - MT/LLM Translation (перевод текста)
   - ASR (speech-to-text)
   - TTS (text-to-speech)
   - Tutor/Reasoning LLM (уроки/объяснения)
   - Router/Planner (Council routing)
2) Для каждой задачи выбрать стратегию обучения:
   - Rules / Prompting
   - SFT (supervised fine-tuning)
   - Preference tuning (DPO/ORPO) — если есть рейтинги
   - RLVR (GRPO/DAPO) — если reward можно ВЕРИФИЦИРОВАТЬ автоматически

> Важно: “лучшие reasoning-RL рецепты” (GRPO/DAPO) применимы там, где есть verifier/score, а не “везде”.

---

## 3) Модельная матрица по компонентам (что подходит куда)

### 3.1 PhoneCore.translator (text + realtime subtitles)
**Подходит лучше всего:**
- MT/LLM переводчик с поддержкой:
  - glossary/terminology constraints,
  - sentence/segment alignment,
  - streaming режим (для субтитров),
  - детерминированный режим (низкая галлюцинация на числах/именах).

**Рекомендуемая стратегия качества:**
- ✅ Rules first: глоссарии, запреты на “выдумывание” чисел/дат, preserve entities.
- ✅ SFT: доменная терминология (геодезия/юридическое/финансы), стиль “точно и кратко”.
- ✅ RLVR (GRPO/DAPO) — ТОЛЬКО если есть verifier:
  - entity consistency (имена/числа/даты),
  - terminology compliance (словарь),
  - semantic fidelity (проверка ключевых фактов),
  - bilingual consistency tests (round-trip checks как слабый сигнал).

**Где RL оправдан:**
- ✅ Документный перевод + OCR → перевод → сверка терминов/чисел
- ✅ Live captions: стабильность фактов и имен, “не придумывать”

**Где RL НЕ обязателен:**
- общий бытовой перевод без verifiers → достаточно SFT + rules.

---

### 3.2 VoiceAgent (ASR + TTS + diarization + streaming)
VoiceAgent — это не один LLM. Это цепочка:

**ASR (speech-to-text)**
- предпочтение моделям, оптимизированным под:
  - low-latency streaming,
  - шум/ветер/улица,
  - немецкий/польский/русский/английский.

**TTS (text-to-speech)**
- модели с:
  - стабильным произношением имён/терминов,
  - controllable prosody (скорость/эмоции),
  - голосовые профили (если предусмотрено лицензиями).

**Рекомендуемая стратегия обучения:**
- ✅ Rules: фильтрация токсичности, PII, корректировка чисел/единиц, произношение терминов.
- ✅ SFT/Finetune: акценты, доменные термины, “радио-качество” дикции.
- ⚠️ RL: редко оправдан. RL для голоса обычно сложен и дорог, полезен только если есть строгий objective:
  - word error rate targets (ASR) в специфической среде,
  - MOS proxy (TTS) через автоматический оценщик,
  - latency/robustness reward (системный RL).

**Практический вывод:**
- VoiceAgent: **SFT + DSP/rules** почти всегда лучше, чем GRPO/DAPO.

---

### 3.3 Lessons A1–C1 (Tutor + exercises + assessment)
Здесь есть и LLM-часть (объяснения), и проверяемая часть (упражнения).

**Компоненты:**
1) Tutor LLM (объясняет, ведёт диалог)
2) Exercise generator (создаёт задания)
3) Assessor/verifier (проверяет ответы)
4) Curriculum planner (план прогресса)

**Где RL оправдан (RLVR):**
- ✅ Assessor + задания с проверяемым ответом:
  - grammar drills (правильно/неправильно),
  - cloze tests,
  - multiple-choice,
  - translation exercises с ограниченным множеством допустимых вариантов,
  - listening comprehension с ключами.

**Алгоритм:**
- старт: GRPO (группы решений на один промпт + относительная оценка)
- масштаб: DAPO (когда много данных и нужен stable throughput)

**Где лучше SFT / rules:**
- Tutor-диалоги “как человек” → reward субъективен.
  - лучше SFT на качественных диалогах + rules safety + preference tuning (если есть рейтинги учеников)

**Идеальная схема:**
- Tutor: SFT (+ preference)
- Exercises/Assessor: RLVR (GRPO → DAPO) при наличии verifiers

---

### 3.4 SecondSelf Council (Core) — маршрутизация и “reasoning about tools”
Council — это “планировщик/маршрутизатор”, а не “переводчик/голос”.

**Главный принцип:**
- Council в Core НЕ тренируем RL’ом как модель “контента”.
- Council оптимизируем как **policy routing** и **tool-use planner** через:
  - правила,
  - симуляции,
  - оффлайн оценку качества решений,
  - возможно preference tuning (на логах выбора маршрутов).

**Где RL оправдан:**
- ограниченно, только как оффлайн RLVR для routing-policy, если есть четкий verifier:
  - правильный выбор доменного хаба (PhoneCore vs VehicleHub vs Security vs Chain),
  - соблюдение entitlements,
  - минимизация ошибок/повторов,
  - latency/cost-aware routing.

Но это лучше держать как:
- “Router policy” с тестами/контрактами и метриками,
а не как “генеративный RL для текста”.

---

## 4) Где RL нужен, а где нет (короткая decision table)

| Компонент | Лучший базовый подход | Когда добавлять RL | RL алгоритм |
|---|---|---|---|
| Translator (text/docs/subtitles) | Rules + SFT | есть verifiers по фактам/терминам/числам | GRPO → DAPO |
| VoiceAgent (ASR/TTS) | SFT + DSP/rules | редко, только при строгом objective | чаще НЕ нужно |
| Lessons (exercises/assessment) | SFT + rules | есть правильный/неправильный ответ | GRPO → DAPO |
| Lessons (tutor dialogue) | SFT + preference | если есть рейтинги пользователей | DPO/ORPO (не RLVR) |
| SecondSelf Council routing | rules + tests + offline eval | если есть строгая метрика маршрутизации | ограниченно, оффлайн |

---

## 5) Практический “минимальный пайплайн” (без перегруза)

### Stage A — обязательный фундамент (до RL)
1) Glossary & constraints
2) Safety rules
3) SFT на доменных примерах
4) Набор unit-тестов качества (golden sets)

### Stage B — GRPO как первый RLVR
- генерируем K кандидатов
- считаем relative score по verifier’ам
- обучаем policy без critic

### Stage C — DAPO (когда есть масштаб)
- Clip-Higher: сильнее учить “явно лучшие”
- Dynamic sampling: отбрасывать “неинформативные группы”
- аккуратно с KL: зависит от режима (preference vs verifiable)

---

## 6) Какие verifiers нужны (самое важное для успеха RLVR)

### Translator verifiers
- entity/number/date preservation
- glossary compliance score
- contradiction checks (минимально)
- terminology consistency across segments
- “no hallucination” hard fails

### Lessons verifiers
- grammar checker / answer key
- rubric-based scoring (структурированный)
- level constraints A1–C1 (длина, лексика, сложность)

### Voice verifiers (если понадобится)
- WER/CER (ASR)
- latency budget
- pronunciation dictionary compliance

---

## 7) Роль Hybrid/Chain в наблюдаемости (observability)
Hybrid должен собирать:
- качество (scores, pass/fail, regressions),
- стабильность (variance по prompts),
- стоимость (tokens/latency),
- инциденты безопасности (Security gates).

Chain (при необходимости) фиксирует:
- версии моделей/артефактов,
- хэши датасетов,
- лицензии/entitlements,
- audit trails.

---

## 8) Итоговый выбор для WebKurier (коротко)
- Translator + Lessons(assessment) — лучшие кандидаты для GRPO/DAPO (RLVR).
- VoiceAgent — чаще SFT/rules, RL редко окупается.
- Council/Router — не “RL для текста”, а routing policy + тесты + метрики, возможно оффлайн оптимизация.

---
END