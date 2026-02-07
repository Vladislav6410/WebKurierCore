"""
WebKurier LLM Router
Single entrypoint for all model calls.

Flow:
User → WebKurierCore → engine/llm/router → provider → (optional) domain hub

Security:
❌ NO API keys in repo
✅ Keys injected via WebKurierHybrid secrets or fetched via WebKurierChain/Security proxy
✅ All models routed by agent/task logic
✅ Core is the only entrypoint; hubs never expose secrets

Usage:
from engine.llm import llm_router

result = await llm_router.chat(
    agent="engineer",
    task="fast",
    messages=[{"role": "user", "content": "Fix this bug..."}],
    temperature=0.1,
)
"""

import asyncio
import aiohttp
import logging
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum

from .config import LLMConfig
from .secrets.manager import SecretManager
from .providers.qwen import QwenProvider
from .providers.openai import OpenAIProvider


class AgentType(str, Enum):
    ENGINEER = "engineer"
    MASTER = "master"
    VISION = "vision"
    VOICE = "voice"
    BULK = "bulk"


class TaskType(str, Enum):
    DEFAULT = "default"
    FAST = "fast"
    ARCHITECTURE = "architecture"
    CODE_GENERATION = "code-generation"
    LEGAL = "legal"
    OCR = "ocr"
    TRANSLATION = "translation"


@dataclass
class ChatRequest:
    """Chat request data structure"""
    agent: AgentType
    task: TaskType
    messages: List[Dict[str, str]]
    temperature: float = 0.1
    model: Optional[str] = None
    max_tokens: Optional[int] = None


@dataclass
class ChatResponse:
    """Chat response data structure"""
    text: str
    model: str
    tokens: int
    finish_reason: str
    provider: str
    latency_ms: float


class LLMRouter:
    """
    Main LLM Router class
    Handles all model routing and security validation
    """
    
    def __init__(self):
        self.config = LLMConfig()
        self.secret_manager = SecretManager()
        self.qwen_provider = QwenProvider(self.secret_manager)
        self.openai_provider = OpenAIProvider(self.secret_manager)
        
        # Initialize logger
        self.logger = logging.getLogger(__name__)
        
        # Model routing map
        self.model_routing = {
            # Engineer agent models
            (AgentType.ENGINEER, TaskType.DEFAULT): "qwen3-coder",
            (AgentType.ENGINEER, TaskType.FAST): "qwen3-coder-flash",
            (AgentType.ENGINEER, TaskType.ARCHITECTURE): "qwen3-coder",
            (AgentType.ENGINEER, TaskType.CODE_GENERATION): "qwen3-coder",
            
            # Master/Legal agent models
            (AgentType.MASTER, TaskType.DEFAULT): "gpt-5",
            (AgentType.MASTER, TaskType.LEGAL): "gpt-5",
            (AgentType.MASTER, TaskType.DEFAULT): "qwq-32b",  # fallback
            
            # Vision agent models
            (AgentType.VISION, TaskType.DEFAULT): "qwen3-vl-32b",
            (AgentType.VISION, TaskType.OCR): "qwen3-vl-32b",
            
            # Voice agent models
            (AgentType.VOICE, TaskType.DEFAULT): "qwen3-omni-flash",
            
            # Bulk processing models
            (AgentType.BULK, TaskType.DEFAULT): "qwen2.5-turbo",
            (AgentType.BULK, TaskType.TRANSLATION): "qwen2.5-turbo",
        }
        
        self.logger.info("LLM Router initialized successfully")
    
    async def initialize(self) -> bool:
        """Initialize router with security validation"""
        try:
            success = await self.secret_manager.initialize()
            if not success:
                raise Exception("Failed to initialize secret manager")
            
            # Validate all required providers
            await self.qwen_provider.validate_config()
            await self.openai_provider.validate_config()
            
            self.logger.info("LLM Router fully initialized with security validation")
            return True
        except Exception as e:
            self.logger.error(f"Failed to initialize LLM Router: {e}")
            return False
    
    def _get_model_for_agent_task(self, agent: AgentType, task: TaskType) -> str:
        """Get appropriate model for agent and task combination"""
        model = self.model_routing.get((agent, task))
        if not model:
            # Fallback to default model for agent
            default_mapping = {
                AgentType.ENGINEER: "qwen3-coder",
                AgentType.MASTER: "gpt-5",
                AgentType.VISION: "qwen3-vl-32b",
                AgentType.VOICE: "qwen3-omni-flash",
                AgentType.BULK: "qwen2.5-turbo",
            }
            model = default_mapping.get(agent, "qwen3-coder")
            self.logger.warning(f"No specific model found for {agent}/{task}, using fallback: {model}")
        
        return model
    
    def _get_provider_for_model(self, model: str):
        """Get appropriate provider for model"""
        if model.startswith('qwen'):
            return self.qwen_provider
        elif model.startswith('gpt') or model.startswith('o1'):
            return self.openai_provider
        else:
            # Default to Qwen for unknown models
            return self.qwen_provider
    
    async def chat(self, 
                   agent: str,
                   task: str,
                   messages: List[Dict[str, str]],
                   temperature: float = 0.1,
                   model: Optional[str] = None,
                   max_tokens: Optional[int] = None) -> ChatResponse:
        """
        Main chat interface
        
        Args:
            agent: Agent type (engineer, master, vision, voice, bulk)
            task: Task type (fast, default, architecture, etc.)
            messages: Conversation messages
            temperature: LLM temperature
            model: Override model selection
            max_tokens: Maximum tokens to generate
        
        Returns:
            ChatResponse with generated text and metadata
        """
        start_time = asyncio.get_event_loop().time()
        
        try:
            # Validate inputs
            agent_type = AgentType(agent.lower())
            task_type = TaskType(task.lower())
            
            # Get model (either provided or determined by agent/task)
            if model is None:
                model = self._get_model_for_agent_task(agent_type, task_type)
            
            # Get appropriate provider
            provider = self._get_provider_for_model(model)
            
            # Prepare request
            request = ChatRequest(
                agent=agent_type,
                task=task_type,
                messages=messages,
                temperature=temperature,
                model=model,
                max_tokens=max_tokens
            )
            
            self.logger.info(f"Routing request: agent={agent}, task={task}, model={model}, provider={type(provider).__name__}")
            
            # Make provider call
            response_data = await provider.chat(request)
            
            # Calculate latency
            latency_ms = (asyncio.get_event_loop().time() - start_time) * 1000
            
            # Create response
            response = ChatResponse(
                text=response_data.get('text', ''),
                model=response_data.get('model', model),
                tokens=response_data.get('tokens', len(response_data.get('text', ''))),
                finish_reason=response_data.get('finish_reason', 'stop'),
                provider=provider.__class__.__name__,
                latency_ms=round(latency_ms, 2)
            )
            
            self.logger.info(f"Request completed: latency={response.latency_ms}ms, tokens={response.tokens}")
            return response
            
        except Exception as e:
            self.logger.error(f"Chat request failed: {e}")
            raise
    
    async def health_check(self) -> Dict[str, Any]:
        """Health check for the router"""
        try:
            # Test both providers
            qwen_ok = await self.qwen_provider.health_check()
            openai_ok = await self.openai_provider.health_check()
            
            return {
                "status": "healthy" if qwen_ok and openai_ok else "degraded",
                "providers": {
                    "qwen": qwen_ok,
                    "openai": openai_ok
                },
                "timestamp": asyncio.get_event_loop().time()
            }
        except Exception as e:
            self.logger.error(f"Health check failed: {e}")
            return {
                "status": "unhealthy",
                "error": str(e),
                "timestamp": asyncio.get_event_loop().time()
            }


# Global router instance
llm_router = LLMRouter()

__all__ = ['llm_router', 'LLMRouter', 'AgentType', 'TaskType', 'ChatResponse']

