# Agent Map Specification

Version: 1.0

This document describes the mapping between `verifier_id`s and their corresponding agents within WebKurierPhoneCore.

---

## Purpose

- Enables dynamic routing of verification tasks
- Allows pluggable agents without changing core logic
- Supports A/B testing of different verification strategies

---

## Structure

The `agent_map.json` file contains a `mapping` object with:

- **Key:** `verifier_id` (as defined in `VERIFIERS_SPEC.md`)
- **Value:** Name of the agent class/function responsible for execution

---

## Example Entry

```json
"translator_entity_number": "EntityNumberPreservationAgent"