import os
from typing import Optional, Set

from aiogram.types import Message


def _parse_admin_ids(raw: str) -> Set[int]:
    """
    ADMIN_IDS format: "123,456,789"
    Spaces are allowed but will be stripped.
    """
    ids: Set[int] = set()
    if not raw:
        return ids

    for part in raw.split(","):
        part = part.strip()
        if not part:
            continue
        try:
            ids.add(int(part))
        except ValueError:
            # ignore invalid entries
            pass
    return ids


def get_admin_ids() -> Set[int]:
    return _parse_admin_ids(os.getenv("ADMIN_IDS", "").strip())


def is_admin_message(message: Message) -> bool:
    """
    Checks message sender is in ADMIN_IDS.
    Safe default: if ADMIN_IDS is empty => deny all.
    """
    admin_ids = get_admin_ids()
    if not admin_ids:
        return False

    uid: Optional[int] = message.from_user.id if message.from_user else None
    return bool(uid and uid in admin_ids)


# Backward-compatible name (used by handlers)
def is_admin(message: Message) -> bool:
    return is_admin_message(message)