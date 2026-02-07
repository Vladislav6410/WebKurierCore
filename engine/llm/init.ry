"""
WebKurier LLM Package
Initialization module for LLM components
"""

from .router import llm_router, LLMRouter, AgentType, TaskType, ChatResponse

__version__ = "2.0.0"
__author__ = "WebKurier Team"

# Export main components
__all__ = [
    'llm_router',
    'LLMRouter', 
    'AgentType',
    'TaskType',
    'ChatResponse'
]

# Initialize router on import
import asyncio

def _initialize_router():
    """Initialize the router when package is imported"""
    try:
        # In async context, we'll initialize when needed
        pass
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Failed to initialize LLM router: {e}")

_initialize_router()