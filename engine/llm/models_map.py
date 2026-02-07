
📁 Папка: WebKurierCore/engine/llm/
📄 Файл: models_map.py
```python
"""
Model Mapping Configuration
Maps agents and tasks to specific AI models
"""

MODEL_MAP = {
    "engineer": {
        "default": "qwen3-coder",
        "fast": "qwen3-coder-flash", 
        "long": "qwen2.5-turbo",
        "reasoning": "qwq-32b",
    },
    "translator": {
        "default": "gpt-5",
        "bulk": "qwen2.5-turbo",
    },
    "legal": {
        "default": "gpt-5", 
        "fallback": "claude-3.5",
    },
    "security": {
        "analyze": "gpt-5",
        "patch": "qwen3-coder",
        "reasoning": "qwq-32b",
    },
    "vision": {
        "default": "qwen3-vl-32b",
        "heavy": "qwen3-vl-235b-a22b",
        "ocr": "qwen3-vl-32b",
    },
    "voice": {
        "default": "qwen3-omni-flash", 
        "lite": "qwen2.5-omni-7b",
    },
    "master": {
        "default": "gpt-5",
        "fallback": "qwq-32b",
    },
}

