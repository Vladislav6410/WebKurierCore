# VERIFIERS SPECIFICATION
Version: 1.0

This document defines formal verifiers used in WebKurierPhoneCore
for translation, subtitles, lessons and other language tasks.

---

## 1. General Principles

- All scores are normalized to [0.0 – 1.0]
- HARD failures → candidate is discarded
- SOFT failures → score penalty
- Final score = weighted sum of components
- Verifiers are deterministic and reproducible

---

## 2. Translator Verifiers (MT)

### 2.1 Entity & Number Preservation (HARD)

**Goal:** do not break names, brands, numbers, dates, currencies

**Input:**
- source_text
- hypothesis_text

**Rules:**
- entities present in source must exist in hypothesis
- numbers, dates, currency symbols must be preserved

**Failure codes (HARD):**
- HARD_ENTITY_MISSING
- HARD_NUMBER_CHANGED
- HARD_DATE_CHANGED
- HARD_CURRENCY_CHANGED

---

### 2.2 Glossary Compliance (HARD)

**Goal:** enforce domain glossary

**Rules:**
- required glossary terms must be used
- forbidden variants are not allowed

**Failure codes (HARD):**
- HARD_GLOSSARY_MISSING
- HARD_GLOSSARY_VIOLATION

---

### 2.3 Semantic Fidelity (SOFT)

**Goal:** preserve meaning, do not distort facts

**Checks:**
- key facts preserved
- no contradictions
- optional round-trip similarity

**Failure codes (SOFT):**
- SOFT_SEMANTIC_DRIFT
- SOFT_CONTRADICTION

---

### 2.4 Style & Register (SOFT)

**Goal:** correct tone and register

**Examples:**
- neutral
- formal
- instructional
- conversational

**Failure codes (SOFT):**
- SOFT_STYLE_MISMATCH

---

## 3. Voice / Subtitles Verifiers

- timing consistency
- sentence completeness
- no hallucinated content

---

## 4. Normalization & Scoring

- HARD failures → candidate rejected
- SOFT penalties reduce component score
- final_score = mean(component_scores)

---

## 5. Output Format (JSON)

### 5.1 Output Schema

```json
{
  "task_id": "same-as-input",
  "verifier_id": "translator_entity_number",
  "version": "1.0",
  "scores": {
    "total": 0.0,
    "components": {
      "fidelity": 0.0,
      "glossary": 0.0,
      "entities": 0.0,
      "numbers": 0.0,
      "style": 0.0,
      "safety": 0.0
    }
  },
  "failures": [],
  "notes": {}
}

5.2 Field Semantics
	•	task_id — идентификатор задачи (обязан совпадать с входным)
	•	verifier_id — уникальный идентификатор верификатора
	•	version — версия спецификации формата
	•	scores.total — финальный агрегированный score
	•	scores.components — component-level scores (0.0–1.0)
	•	failures — список ошибок (пустой, если ошибок нет)
	•	notes — произвольные диагностические данные (опционально)

5.3 Scoring Rules
	•	HARD failure → candidate rejected
	•	SOFT penalties → уменьшают component score
	•	total = mean(all component scores)
	•	Если есть хотя бы один HARD failure → total = 0.0

5.4 Failure Object

{
  "code": "HARD_NUMBER_MISMATCH",
  "component": "numbers",
  "message": "Numeric value mismatch between source and hypothesis"
}

	•	code — канонический код ошибки
	•	component — затронутый компонент
	•	message — человекочитаемое описание

5.5 JSON Validity Rules
	•	Output MUST be valid JSON
	•	No trailing commas
	•	UTF-8 encoding
	•	Deterministic field order
	•	Non-compliant output MUST be rejected


