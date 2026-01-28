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

## 6. Definition of Done

A run is considered successful if **all** of the following are true:

- `total_score` increased compared to baseline  
- `hard_fail_rate` did not increase  
- No collapse alerts were detected  
- Golden test set shows no regressions  
- Hashes and full audit trail are recorded


