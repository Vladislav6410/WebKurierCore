#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Core Admin API client for WebKurier Admin Bot.

Responsible for:
- communicating with WebKurierCore Admin API
- unified error handling
- timeouts and response normalization
"""

import os
from typing import Any, Dict, Optional

import aiohttp


# Base URL for WebKurierCore Admin API
CORE_ADMIN_API_URL = os.getenv(
    "CORE_ADMIN_API_URL",
    "http://127.0.0.1:8080/admin"
).rstrip("/")

# Request timeout (seconds)
CORE_API_TIMEOUT = float(os.getenv("CORE_API_TIMEOUT", "8"))


async def _request(
    method: str,
    path: str,
    payload: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Perform a unified request to Core Admin API.

    Expected Core response formats:
      { "ok": true,  "data": {...} }
      { "ok": false, "error": "..." }

    Returns a normalized dict:
      - ok: bool
      - data / error
      - status (optional)
    """
    url = f"{CORE_ADMIN_API_URL}{path}"
    timeout = aiohttp.ClientTimeout(total=CORE_API_TIMEOUT)

    try:
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.request(
                method=method,
                url=url,
                json=payload,
            ) as resp:
                content_type = resp.headers.get("Content-Type", "")
                text = await resp.text()

                # JSON response
                if "application/json" in content_type:
                    data = await resp.json()
                    if isinstance(data, dict) and "ok" in data:
                        return data
                    return {
                        "ok": resp.status < 400,
                        "data": data,
                        "status": resp.status,
                    }

                # Non-JSON response
                return {
                    "ok": False,
                    "error": f"Non-JSON response ({resp.status}): {text[:400]}",
                    "status": resp.status,
                }

    except aiohttp.ClientError as e:
        return {
            "ok": False,
            "error": f"Core API connection error: {e}",
        }
    except Exception as e:
        return {
            "ok": False,
            "error": f"Core API unexpected error: {e}",
        }


async def core_get(path: str) -> Dict[str, Any]:
    """GET request helper"""
    return await _request("GET", path)


async def core_post(path: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    """POST request helper"""
    return await _request("POST", path, payload)