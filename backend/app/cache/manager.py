"""
File-based cache for agent stage outputs.

Cache key = normalized(competitor + product).  Each key stores the outputs of
the three parallel research stages (research, feature_analysis, positioning_intel)
so that repeat runs for the same competitor skip the expensive LLM + web-search
phase entirely.

Storage layout:
  backend/cache/
    <hex-key>.json   — one file per unique competitor+product pair

Each JSON file:
  {
    "key": "salesforce|hubspot",
    "created_at": "2026-03-14T10:00:00Z",
    "ttl_hours": 48,
    "stages": {
      "research":          "...",
      "feature_analysis":  "...",
      "positioning_intel": "..."
    }
  }
"""

import hashlib
import json
import os
from datetime import datetime, timezone, timedelta

from app.config import settings

# Stages whose outputs are cached (the parallel research phase)
CACHEABLE_STAGES = ("research", "feature_analysis", "positioning_intel")


def _cache_dir() -> str:
    """Return (and lazily create) the cache directory."""
    path = settings.CACHE_DIR
    os.makedirs(path, exist_ok=True)
    return path


def _make_key(competitor: str, product: str) -> str:
    """Deterministic cache key from competitor + product names."""
    raw = f"{competitor.strip().lower()}|{product.strip().lower()}"
    return hashlib.sha256(raw.encode()).hexdigest()[:24]


def _file_path(key: str) -> str:
    return os.path.join(_cache_dir(), f"{key}.json")


# ── Public API ────────────────────────────────────────────────────────


def get_cached_stages(
    competitor: str, product: str
) -> dict[str, str] | None:
    """
    Return cached stage outputs for this competitor+product, or None if the
    cache entry is missing or expired.
    """
    key = _make_key(competitor, product)
    path = _file_path(key)

    if not os.path.exists(path):
        return None

    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except (json.JSONDecodeError, OSError):
        return None

    # Check TTL
    created = datetime.fromisoformat(data["created_at"])
    ttl = timedelta(hours=data.get("ttl_hours", settings.CACHE_TTL_HOURS))
    if datetime.now(timezone.utc) - created > ttl:
        # Expired — remove stale file
        try:
            os.remove(path)
        except OSError:
            pass
        return None

    stages = data.get("stages", {})
    # All cacheable stages must be present
    if not all(s in stages for s in CACHEABLE_STAGES):
        return None

    return stages


def save_stages(
    competitor: str, product: str, stages: dict[str, str]
) -> None:
    """Persist stage outputs to the cache."""
    key = _make_key(competitor, product)
    path = _file_path(key)

    data = {
        "key": f"{competitor.strip().lower()}|{product.strip().lower()}",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "ttl_hours": settings.CACHE_TTL_HOURS,
        "stages": {s: stages[s] for s in CACHEABLE_STAGES if s in stages},
    }

    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False)


def invalidate(competitor: str, product: str) -> bool:
    """Remove a specific cache entry. Returns True if it existed."""
    key = _make_key(competitor, product)
    path = _file_path(key)
    if os.path.exists(path):
        os.remove(path)
        return True
    return False


def get_stats() -> dict:
    """Return cache statistics."""
    cache_dir = _cache_dir()
    entries = []
    total = 0
    expired = 0
    active = 0
    now = datetime.now(timezone.utc)

    for fname in os.listdir(cache_dir):
        if not fname.endswith(".json"):
            continue
        total += 1
        path = os.path.join(cache_dir, fname)
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
            created = datetime.fromisoformat(data["created_at"])
            ttl = timedelta(hours=data.get("ttl_hours", settings.CACHE_TTL_HOURS))
            is_expired = (now - created) > ttl
            if is_expired:
                expired += 1
            else:
                active += 1
                entries.append(
                    {
                        "key": data.get("key", "unknown"),
                        "created_at": data["created_at"],
                        "expires_at": (created + ttl).isoformat(),
                        "stages_cached": list(data.get("stages", {}).keys()),
                    }
                )
        except (json.JSONDecodeError, OSError, KeyError):
            expired += 1

    return {
        "total_entries": total,
        "active": active,
        "expired": expired,
        "ttl_hours": settings.CACHE_TTL_HOURS,
        "cache_dir": cache_dir,
        "entries": entries,
    }


def clear_all() -> int:
    """Remove all cache files. Returns count of files deleted."""
    cache_dir = _cache_dir()
    count = 0
    for fname in os.listdir(cache_dir):
        if fname.endswith(".json"):
            try:
                os.remove(os.path.join(cache_dir, fname))
                count += 1
            except OSError:
                pass
    return count


# Singleton-style access
class CacheManager:
    get = staticmethod(get_cached_stages)
    save = staticmethod(save_stages)
    invalidate = staticmethod(invalidate)
    stats = staticmethod(get_stats)
    clear = staticmethod(clear_all)


cache_manager = CacheManager()
