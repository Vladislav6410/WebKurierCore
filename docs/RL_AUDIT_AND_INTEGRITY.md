# RL Audit & Integrity Specification

---

## 1. Goals

- reproducibility
- tamper resistance
- traceable training runs

---

## 2. Pre-Run Checks

- no unexpected outbound network
- dataset hash verification
- verifier version locked

---

## 3. Post-Run Actions

- sign artifacts (hash)
- store audit trail
- link model → verifier version

---

## 4. Logged Artifacts

- dataset hash
- verifier hash
- model checkpoint hash
- metrics summary

---

## 5. Failure Conditions

- hash mismatch
- verifier version drift
- collapse alert triggered

---

END