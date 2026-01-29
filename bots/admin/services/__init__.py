"""
Services layer for WebKurier Admin Bot.

Contains integrations / API clients (Core Admin API, etc).
"""

from .core_api import core_api_call

__all__ = ["core_api_call"]