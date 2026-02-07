"""
LLM API Endpoints
FastAPI routes for LLM operations
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from pydantic import BaseModel

from .router import llm_router, AgentType, TaskType

router = APIRouter(prefix="/llm", tags=["llm"])


class ChatRequest(BaseModel):
    """Chat request model"""
    agent: str
    task: str
    messages: List[Dict[str, str]]
    temperature: float = 0.1
    model: str = None
    max_tokens: int = None


class ChatResponse(BaseModel):
    """Chat response model"""
    text: str
    model: str
    tokens: int
    finish_reason: str
    provider: str
    latency_ms: float


@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """Chat endpoint for LLM interactions"""
    try:
        response = await llm_router.chat(
            agent=request.agent,
            task=request.task,
            messages=request.messages,
            temperature=request.temperature,
            model=request.model,
            max_tokens=request.max_tokens
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat request failed: {str(e)}")


@router.get("/health")
async def health_endpoint():
    """Health check for LLM services"""
    health_status = await llm_router.health_check()
    return health_status


@router.get("/models")
async def list_models():
    """List available models and their mappings"""
    from .models_map import MODEL_MAP
    return {"models": MODEL_MAP}


@router.get("/providers")
async def list_providers():
    """List available providers and their status"""
    health_status = await llm_router.health_check()
    return {
        "providers": {
            "qwen": {
                "available": health_status["providers"]["qwen"],
                "models": ["qwen3-coder", "qwen3-coder-flash", "qwen3-vl-32b", "qwen3-omni-flash", "qwen2.5-turbo"]
            },
            "openai": {
                "available": health_status["providers"]["openai"],
                "models": ["gpt-5", "qwq-32b", "o1-series"]
            }
        },
        "overall_status": health_status["status"]
    }