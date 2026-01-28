
**Содержимое файла (скопировать):**
```md
# RL Training Strategy for WebKurierPhoneCore

---

## 1. Scope

This document defines where Reinforcement Learning is applied
inside WebKurierPhoneCore.

WebKurierCore acts as router and policy gate.
WebKurierHybrid handles orchestration and audit.

---

## 2. Where RL is JUSTIFIED

### 2.1 Translator (Text / OCR / Documents)

- Verifiable rewards available
- Glossary & entity preservation
- Best candidate selection from N samples

**Recommended:**
- Stage 1: SFT + rules
- Stage 2: GRPO
- Stage 3: DAPO (at scale)

---

### 2.2 Voice & Subtitles

- factual correctness
- no hallucinated numbers
- timing alignment

**Recommended:**
- GRPO
- limited DAPO for stability

---

### 2.3 Lessons A1–C1

- exercises have correct/incorrect answers
- grammar and vocabulary verifiable

**Recommended:**
- GRPO
- optional DAPO for advanced levels

---

## 3. Where RL is NOT recommended

### 3.1 Romantic Agent
Meaning and quality are subjective

**Use instead:**
- SFT
- rules
- preference tuning

---

### 3.2 WebKurierCore / SecondSelf Council

- routing logic
- entitlements
- orchestration

**RL NOT APPLIED**

---

## 4. Algorithm Choice Summary

| Component        | PPO | GRPO | DAPO |
|------------------|-----|------|------|
| Translator       | ❌  | ✅   | ✅   |
| Voice/Subtitles  | ❌  | ✅   | ⚠️   |
| Lessons          | ❌  | ✅   | ⚠️   |
| Romantic         | ❌  | ❌   | ❌   |
| Core / Council   | ❌  | ❌   | ❌   |

---

## 5. Role of Core & Hybrid

- Core:
  - routing
  - entitlements
  - agent selection

- Hybrid:
  - CI/CD
  - training orchestration
  - integrity & audit

---

END