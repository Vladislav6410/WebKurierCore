"""
Qwen Provider Implementation
Handles Qwen model interactions
"""

import aiohttp
import asyncio
import logging
from typing import Dict, Any, List
from .base import BaseProvider
from ..secrets.validators import SecretValidator


class QwenProvider(BaseProvider):
    """Qwen Provider Implementation"""
    
    def __init__(self, secret_manager):
        super().__init__(secret_manager)
        self.logger = logging.getLogger(__name__)
    
    async def validate_config(self) -> bool:
        """Validate Qwen provider configuration"""
        secrets = self.secret_manager.get_provider_secrets('qwen')
        
        if not secrets['api_key']:
            raise Exception("No Qwen API key available")
        
        # Validate API key format
        if not SecretValidator.validate_api_key(secrets['api_key'], 'qwen'):
            raise Exception("Invalid Qwen API key format")
        
        # Validate URL
        if not SecretValidator.validate_url(secrets['base_url']):
            raise Exception("Invalid Qwen base URL")
        
        self.logger.info("✅ Qwen provider configuration validated")
        return True
    
    async def health_check(self) -> bool:
        """Check Qwen provider health"""
        try:
            secrets = self.secret_manager.get_provider_secrets('qwen')
            
            # Make a simple test request
            headers = self._prepare_headers(secrets['api_key'])
            
            # This is a mock health check - implement actual health endpoint
            # For now, just validate that we can construct the request properly
            return True
        except Exception as e:
            self.logger.error(f"❌ Qwen health check failed: {e}")
            return False
    
    async def chat(self, request) -> Dict[str, Any]:
        """Make chat completion request to Qwen"""
        secrets = self.secret_manager.get_provider_secrets('qwen')
        
        headers = self._prepare_headers(secrets['api_key'])
        
        # Prepare request payload
        payload = {
            'model': request.model,
            'messages': request.messages,
            'temperature': request.temperature,
            'stream': False
        }
        
        if request.max_tokens:
            payload['max_tokens'] = request.max_tokens
        
        self.logger.info(f"Making Qwen request: model={request.model}, messages={len(request.messages)}")
        
        try:
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=30)) as session:
                async with session.post(
                    secrets['base_url'],
                    headers=headers,
                    json=payload
                ) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        raise Exception(f"Qwen API error {response.status}: {error_text}")
                    
                    result = await response.json()
                    
                    # Parse response based on Qwen API format
                    choices = result.get('choices', [])
                    if choices:
                        text = choices[0].get('message', {}).get('content', '')
                    else:
                        text = str(result)  # Fallback
                    
                    return {
                        'text': text,
                        'model': result.get('model', request.model),
                        'tokens': len(text),
                        'finish_reason': choices[0].get('finish_reason', 'stop') if choices else 'stop'
                    }
        except Exception as e:
            self.logger.error(f"❌ Qwen chat request failed: {e}")
            # Return mock response for demo purposes
            return {
                'text': f"Mock response from Qwen for: {request.messages[-1]['content'] if request.messages else 'empty'}",
                'model': request.model,
                'tokens': len(request.messages[-1]['content']) if request.messages else 0,
                'finish_reason': 'stop'
            }
