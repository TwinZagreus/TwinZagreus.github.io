from __future__ import annotations

from fastapi import HTTPException, Request, status

from .config import settings


def is_authenticated(request: Request) -> bool:
    return request.session.get("is_authenticated") is True


def require_auth(request: Request) -> None:
    if is_authenticated(request):
        return

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required.",
    )


def validate_credentials(username: str, password: str) -> bool:
    return username == settings.admin_username and password == settings.admin_password
