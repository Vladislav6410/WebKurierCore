# WebKurier LLM Router

Single entrypoint for all model calls.

## Flow
User → WebKurierCore → engine/llm/router → provider → domain hub

## Security
- ❌ NO API keys in repo
- ✅ Keys injected via WebKurierHybrid secrets or fetched via WebKurierChain/Security proxy
- ✅ All models routed by agent/task logic

## Usage
```python
from engine.llm import llm_router

response = await llm_router.chat(
    agent="engineer",
    task="fast",
    messages=[{"role": "user", "content": "Fix this bug..."}]
)