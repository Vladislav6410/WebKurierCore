"""
Secure Secret Manager
Manages API keys through secure channels
"""

import os
import asyncio
from typing import Dict, Optional
from .validators import SecretValidator


class SecretManager:
    """
    Secure Secret Manager
    Manages API keys through secure channels
    """
    
    def __init__(self):
        self.secrets = {}
        self.cache = {}
        self.initialized = False
        print("🔐 Secret Manager initialized")
    
    async def initialize(self) -> bool:
        """Initialize secret manager with security validation"""
        if not self._validate_config():
            raise Exception("❌ Configuration validation failed - missing required environment variables")
        
        # Load secrets from environment variables only
        required_secrets = [
            'QWEN_API_KEY',
            'OPENAI_API_KEY',
            'QWEN_BASE_URL',
            'OPENAI_BASE_URL'
        ]

        for secret in required_secrets:
            value = os.getenv(secret)
            if not value:
                print(f"❌ Missing required secret: {secret}")
                return False
            self.secrets[secret] = value

        self.initialized = True
        print("✅ Secret Manager fully initialized")
        return True
    
    def _validate_config(self) -> bool:
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
        
        # Validate API keys format
        qwen_valid = SecretValidator.validate_api_key(os.getenv('QWEN_API_KEY', ''), 'qwen')
        openai_valid = SecretValidator.validate_api_key(os.getenv('OPENAI_API_KEY', ''), 'openai')
        
        if not qwen_valid:
            print("❌ QWEN_API_KEY format is invalid")
            return False
        
        if not openai_valid:
            print("❌ OPENAI_API_KEY format is invalid")
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

        return True
    
    def get(self, key: str) -> Optional[str]:
        """Get secret value securely"""
        if not self.initialized:
            print("❌ Secret Manager not initialized")
            return None
        
        return self.secrets.get(key)
    
    def is_valid(self, key: str) -> bool:
        """Validate secret exists and is valid"""
        value = self.get(key)
        return bool(value and isinstance(value, str) and len(value) > 0)
    
    def get_provider_secrets(self, provider: str) -> Dict[str, str]:
        """Get secrets for specific provider"""
        if provider.lower() == 'qwen':
            return {
                'api_key': self.get('QWEN_API_KEY'),
                'base_url': self.get('QWEN_BASE_URL') or 'https://dashscope.aliyuncs.com/compatible-mode/v1'
            }
        elif provider.lower() == 'openai':
            return {
                'api_key': self.get('OPENAI_API_KEY'),
                'base_url': self.get('OPENAI_BASE_URL') or 'https://api.openai.com/v1'
            }
        else:
            return {}


class SecretValidator:
    """Secret Validators - Validates API keys and endpoints"""
    
    @staticmethod
    def validate_api_key(key: str, provider: str) -> bool:
        """Validate API key format"""
        if not key or not isinstance(key, str):
            return False
        
        if provider.lower() == 'qwen':
            # Qwen keys typically start with 'sk-' or similar pattern
            import re
            return bool(re.match(r'^sk-[a-zA-Z0-9]{20,}$', key) or len(key) >= 32)
        elif provider.lower() == 'openai':
            # OpenAI keys typically start with 'sk-' followed by base64-like string
            import re
            return bool(re.match(r'^sk-[a-zA-Z0-9]{20,}$', key))
        else:
            # Generic validation: at least 32 characters
            return len(key) >= 32

    @staticmethod
    def validate_url(url: str) -> bool:
        """Validate URL format"""
        import re
        url_pattern = r'^https?://[^\s/$.?#].[^\s]*$'
        return bool(re.match(url_pattern, url))

    @staticmethod
    def sanitize_error(error: Exception) -> Exception:
        """Sanitize error messages to avoid leaking secrets"""
        message = str(error)
        # Remove potential API keys from error messages
        import re
        sanitized_message = re.sub(r'sk-[a-zA-Z0-9]+', '[REDACTED_API_KEY]', message)
        return Exception(sanitized_message)


# Global instance
secret_manager = SecretManager()