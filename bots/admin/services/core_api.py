import os
from typing import Any, Dict, Optional

import aiohttp


CORE_ADMIN_API_URL = os.getenv("CORE_ADMIN_API_URL", "http://127.0.0.1:8080/admin").rstrip("/")
CORE_API_TIMEOUT = float(os.getenv("CORE_API_TIMEOUT", "8"))


async def _request(
    method: str,
    path: str,
    payload: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Unified Core Admin API request.

    Expected (recommended) Core responses:
      { "ok": true,  "data": ... }
      { "ok": false, "error": "..." }

    If Core returns non-JSON, we wrap it into {ok:false,error:"..."}.
    """
    url = f"{CORE_ADMIN_API_URL}{path}"
    timeout = aiohttp.ClientTimeout(total=CORE_API_TIMEOUT)

    try:
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.request(method, url, json=payload) as resp:
                ctype = resp.headers.get("Content-Type", "")
                text = await resp.text()

                if "application/json" in ctype:
                    data = await resp.json()
                    # normalize if ok missing
                    if isinstance(data, dict) and "ok" in data:
                        return data
                    return {"ok": resp.status < 400, "data": data, "status": resp.status}

                return {
                    "ok": False,
                    "error": f"Non-JSON response ({resp.status}): {text[:400]}",
                    "status": resp.status
                }

    except aiohttp.ClientError as e:
        return {"ok": False, "error": f"Core API connection error: {e}"}
    except Exception as e:
        return {"ok": False, "error": f"Core API unexpected error: {e}"}


async def core_get(path: str) -> Dict[str, Any]:
    return await _request("GET", path, None)


async def core_post(path: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    return await _request("POST", path, payload)