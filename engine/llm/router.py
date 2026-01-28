import os
from typing import Dict, Any, List
from .models_map import MODEL_MAP
from .providers.openai import OpenAIProvider
from .providers.qwen import QwenProvider

# Model registry: logical name → (provider, real model ID)
MODEL_REGISTRY = {
    # OpenAI
    "gpt-5": ("openai", "gpt-5"),
    # Qwen3
    "qwen3-coder": ("qwen", "qwen3-coder"),
    "qwen3-coder-flash": ("qwen", "qwen3-coder-flash"),
    "qwen3-max": ("qwen", "qwen3-max"),
    "qwen3-vl-32b": ("qwen", "qwen3-vl-32b"),
    "qwen3-vl-235b-a22b": ("qwen", "qwen3-vl-235b-a22b"),
    "qwen3-omni-flash": ("qwen", "qwen3-omni-flash"),
    # Qwen2.5
    "qwen2.5-turbo": ("qwen", "qwen2.5-turbo"),
    "qwen2.5-14b-instruct-1m": ("qwen", "qwen2.5-14b-instruct-1m"),
    # Reasoning
    "qwq-32b": ("qwen", "qwq-32b"),
}

class LLMRouter:
    def __init__(self):
        self.providers = {}
        # Initialize providers from ENV
        if os.getenv("OPENAI_API_KEY"):
            self.providers["openai"] = OpenAIProvider(
                api_key=os.getenv("OPENAI_API_KEY"),
                base_url=os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
            )
        if os.getenv("QWEN_API_KEY") and os.getenv("QWEN_BASE_URL"):
            self.providers["qwen"] = QwenProvider(
                api_key=os.getenv("QWEN_API_KEY"),
                base_url=os.getenv("QWEN_BASE_URL")
            )

    def pick_model(self, agent: str, task: str = "default") -> str:
        profile = MODEL_MAP.get(agent, {})
        return profile.get(task) or profile.get("default") or "qwen3-max"

    async def chat(self, agent: str, task: str, messages: List[Dict[str, str]], temperature: float = 0.2) -> Dict[str, Any]:
        logical_model = self.pick_model(agent, task)
        if logical_model not in MODEL_REGISTRY:
            raise ValueError(f"Unknown model: {logical_model}")
        
        provider_name, real_model = MODEL_REGISTRY[logical_model]
        provider = self.providers.get(provider_name)
        if not provider:
            raise RuntimeError(f"Provider '{provider_name}' not configured for model '{logical_model}'")
        
        return await provider.chat(real_model, messages, temperature)

# Singleton instance
llm_router = LLMRouter()