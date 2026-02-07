"""
LLM Configuration Module
Handles configuration with security validation
"""

import os
from typing import Dict, Any
from dataclasses import dataclass


@dataclass
class ModelConfig:
    """Model configuration"""
    max_tokens: int
    temperature_range: tuple
    cost_per_token: float


@dataclass
class ProviderConfig:
    """Provider configuration"""
    endpoint: str
    models: Dict[str, ModelConfig]


class LLMConfig:
    """
    LLM Configuration with Security Validation
    All sensitive data must be loaded via environment variables only
    """
    
    def __init__(self):
        self.providers = {
            'qwen': ProviderConfig(
                endpoint=os.getenv('QWEN_BASE_URL', 'https://dashscope.aliyuncs.com/compatible-mode/v1'),
                models={
                    'qwen3-coder': ModelConfig(
                        max_tokens=8192,
                        temperature_range=(0.0, 1.0),
                        cost_per_token=0.000001
                    ),
                    'qwen3-coder-flash': ModelConfig(
                        max_tokens=4096,
                        temperature_range=(0.0, 1.0),
                        cost_per_token=0.000005
                    ),
                    'qwen3-vl-32b': ModelConfig(
                        max_tokens=4096,
                        temperature_range=(0.0, 1.0),
                        cost_per_token=0.00001
                    ),
                    'qwen3-omni-flash': ModelConfig(
                        max_tokens=2048,
                        temperature_range=(0.0, 1.0),
                        cost_per_token=0.000003
                    ),
                    'qwen2.5-turbo': ModelConfig(
                        max_tokens=32768,
                        temperature_range=(0.0, 1.0),
                        cost_per_token=0.000002
                    )
                }
            ),
            'openai': ProviderConfig(
                endpoint=os.getenv('OPENAI_BASE_URL', 'https://api.openai.com/v1'),
                models={
                    'gpt-5': ModelConfig(
                        max_tokens=128000,
                        temperature_range=(0.0, 1.0),
                        cost_per_token=0.00002
                    ),
                    'qwq-32b': ModelConfig(
                        max_tokens=8192,
                        temperature_range=(0.0, 1.0),
                        cost_per_token=0.000015
                    )
                }
            )
        }
        
        self.defaults = {
            'model': 'qwen3-coder',
            'temperature': 0.1,
            'timeout': 30000,
            'max_retries': 3
        }
        
        self.rate_limits = {
            'requests_per_minute': 100,
            'tokens_per_minute': 100000
        }
    
    def validate_config(self) -> bool:
        """Validate configuration security"""
        required_env_vars = [
            'QWEN_API_KEY',
            'OPENAI_API_KEY',
            'QWEN_BASE_URL',
            'OPENAI_BASE_URL'
        ]
        
        missing = [var for var in required_env_vars if not os.getenv(var)]
        
        if missing:
            print(f"⚠️ Missing environment variables: {', '.join(missing)}")
            return False
        
        # Validate URLs
        import re
        url_pattern = r'^https?://[^\s/$.?#].[^\s]*$'
        
        qwen_url_valid = re.match(url_pattern, os.getenv('QWEN_BASE_URL', ''))
        openai_url_valid = re.match(url_pattern, os.getenv('OPENAI_BASE_URL', ''))
        
        if not qwen_url_valid:
            print("❌ QWEN_BASE_URL format is invalid")
            return False
        
        if not openai_url_valid:
            print("❌ OPENAI_BASE_URL format is invalid")
            return False
        
        print("✅ Configuration security validation passed")
        return True