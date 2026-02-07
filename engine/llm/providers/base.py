"""
Base Provider Class
Abstract base for all LLM providers
"""

import abc
from typing import Dict, Any, List
from ..config import ModelConfig


class BaseProvider(abc.ABC):
    """Abstract base class for LLM providers"""
    
    def __init__(self, secret_manager):
        self.secret_manager = secret_manager
        self.name = self.__class__.__name__
    
    @abc.abstractmethod
    async def chat(self, request) -> Dict[str, Any]:
        """Make chat completion request"""
        pass
    
    @abc.abstractmethod
    async def validate_config(self) -> bool:
        """Validate provider configuration"""
        pass
    
    @abc.abstractmethod
    async def health_check(self) -> bool:
        """Check provider health"""
        pass
    
    def _prepare_headers(self, api_key: str) -> Dict[str, str]:
        """Prepare standard headers for API requests"""
        return {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
    
    def _validate_model_support(self, model: str, supported_models: Dict[str, ModelConfig]) -> bool:
        """Validate if model is supported"""
        return model in supported_models
