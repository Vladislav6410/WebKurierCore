# WebKurier LLM Router

Single entrypoint for all model calls.

## Flow
User → WebKurierCore → engine/llm/router → provider → (optional) domain hub

## Security
❌ NO API keys in repo  
✅ Keys only via ENV (set by WebKurierHybrid secrets) or via Security/Chain proxy  
✅ All models routed by agent/task mapping  
✅ Core is the only entrypoint; hubs never expose secrets  

## Usage

### Python Interface
```python
from engine.llm import llm_router

result = await llm_router.chat(
    agent="engineer",
    task="fast", 
    messages=[{"role":"user","content":"Fix bug..."}],
    temperature=0.1,
)
print(result.text)

WebKurierCore/
└── engine/
    └── llm/
        ├── README.md
        ├── models_map.py
        ├── router.py
        ├── __init__.py
        ├── config.py
        └── providers/
            ├── base.py
            ├── qwen.py
            └── openai.py
