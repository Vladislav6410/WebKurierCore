from abc import ABC, abstractmethod
from typing import List, Dict, Any

class LLMProvider(ABC):
    def __init__(self, name: str):
        self.name = name

    @abstractmethod
    async def chat(self, model: str, messages: List[Dict[str, str]], temperature: float = 0.2) -> Dict[str, Any]:
        pass