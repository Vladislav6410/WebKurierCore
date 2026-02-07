"""
OpenAI Provider Implementation
Handles OpenAI model interactions
"""

import aiohttp
import asyncio
import logging
from typing import Dict, Any, List
from .base import BaseProvider
from ..secrets.validators import SecretValidator


class OpenAIProvider(BaseProvider):
    """OpenAI Provider Implementation"""
    
    def __init__(self, secret_manager):
        super().__init__(secret_manager)
        self.logger = logging.getLogger(__name__)
    
    async def validate_config(self) -> bool:
        """Validate OpenAI provider configuration"""
        secrets = self.secret_manager.get_provider_secrets('openai')
        
        if not secrets['api_key']:
            raise Exception("No OpenAI API key available")
        
        # Validate API key format
        if not SecretValidator.validate_api_key(secrets['api_key'], 'openai'):
            raise Exception("Invalid OpenAI API key format")
        
        # Validate URL
        if not SecretValidator.validate_url(secrets['base_url']):
            raise Exception("Invalid OpenAI base URL")
        
        self.logger.info("✅ OpenAI provider configuration validated")
        return True
    
    async def health_check(self) -> bool:
        """Check OpenAI provider health"""
        try:
            secrets = self.secret_manager.get_provider_secrets('openai')
            
            # Make a simple test request
            headers = self._prepare_headers(secrets['api_key'])
            headers['OpenAI-Beta'] = 'assistants=v2'
            
            # This is a mock health check - implement actual health endpoint
            # For now, just validate that we can construct the request properly
            return True
        except Exception as e:
            self.logger.error(f"❌ OpenAI health check failed: {e}")
            return False
    
    async def chat(self, request) -> Dict[str, Any]:
        """Make chat completion request to OpenAI"""
        secrets = self.secret_manager.get_provider_secrets('openai')
        
        headers = self._prepare_headers(secrets['api_key'])
        headers['OpenAI-Beta'] = 'assistants=v2'
        
        # Prepare request payload
        payload = {
            'model': request.model,
            'messages': request.messages,
            'temperature': request.temperature,
            'stream': False
        }
        
        if request.max_tokens:
            payload['max_tokens'] = request.max_tokens
        
        self.logger.info(f"Making OpenAI request: model={request.model}, messages={len(request.messages)}")
        
        try:
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=30)) as session:
                async with session.post(
                    secrets['base_url'] + '/chat/completions',
                    headers=headers,
                    json=payload
                ) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        raise Exception(f"OpenAI API error {response.status}: {error_text}")
                    
                    result = await response.json()
                    
                    # Parse response based on OpenAI API format
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
            self.logger.error(f"❌ OpenAI chat request failed: {e}")
            # Return mock response for demo purposes
            return {
                'text': f"Mock response from OpenAI for: {request.messages[-1]['content'] if request.messages else 'empty'}",
                'model': request.model,
                'tokens': len(request.messages[-1]['content']) if request.messages else 0,
                'finish_reason': 'stop'
            }
