from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parents[2]
BACKEND_ROOT = PROJECT_ROOT / "backend"

load_dotenv(BACKEND_ROOT / ".env")
load_dotenv(PROJECT_ROOT / ".env")


@dataclass(frozen=True)
class Settings:
    admin_password: str
    admin_username: str
    allowed_origins: list[str]
    app_secret_key: str
    database_path: Path
    dist_dir: Path
    uploads_dir: Path


def _resolve_path(raw_value: str, default_relative: str) -> Path:
    target = raw_value.strip() if raw_value else default_relative
    path = Path(target)
    if path.is_absolute():
        return path
    return PROJECT_ROOT / path


def load_settings() -> Settings:
    allowed_origins = [
        origin.strip()
        for origin in os.getenv(
            "ALLOWED_ORIGINS",
            "http://127.0.0.1:4173,http://localhost:4173,http://127.0.0.1:5173,http://localhost:5173",
        ).split(",")
        if origin.strip()
    ]

    return Settings(
        admin_password=os.getenv("ADMIN_PASSWORD", "change-this-password"),
        admin_username=os.getenv("ADMIN_USERNAME", "admin"),
        allowed_origins=allowed_origins,
        app_secret_key=os.getenv("APP_SECRET_KEY", "dev-secret-key"),
        database_path=_resolve_path(os.getenv("DATABASE_PATH", ""), "backend/data/blog.db"),
        dist_dir=PROJECT_ROOT / "dist",
        uploads_dir=_resolve_path(os.getenv("UPLOADS_DIR", ""), "backend/uploads"),
    )


settings = load_settings()
