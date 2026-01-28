import os
import httpx
from .base import LLMProvider

class QwenProvider(LLMProvider):
    def __init__(self, api_key: str, base_url: str):
        super().__init__("qwen")
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")

    async def chat(self, model: str, messages: list, temperature: float = 0.2) -> dict:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "messages": messages,
                    "temperature": temperature,
                },
                timeout=60.0,
            )
            if response.status_code != 200:
                raise Exception(f"Qwen error: {response.status_code} - {response.text}")
            data = response.json()
            return {
                "text": data["choices"][0]["message"]["content"],
                "raw": data,
            }