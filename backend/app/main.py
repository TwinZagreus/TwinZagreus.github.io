from __future__ import annotations

from pathlib import Path
from uuid import uuid4

from fastapi import FastAPI, File, HTTPException, Request, Response, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware

from .auth import is_authenticated, require_auth, validate_credentials
from .config import settings
from .db import init_db
from .posts import (
    create_post,
    delete_post,
    get_admin_post_by_id,
    get_admin_post_by_slug,
    get_public_post_by_slug,
    list_admin_posts,
    list_public_posts,
    update_post,
)
from .schemas import LoginPayload, PostCreate, PostRecord, PostUpdate, SessionState, UploadResponse


def ensure_runtime_directories() -> None:
    settings.uploads_dir.mkdir(parents=True, exist_ok=True)
    settings.database_path.parent.mkdir(parents=True, exist_ok=True)


ensure_runtime_directories()
init_db()

app = FastAPI(title="Motorsport Blog API")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_headers=["*"],
    allow_methods=["*"],
    allow_origins=settings.allowed_origins,
)
app.add_middleware(
    SessionMiddleware,
    max_age=60 * 60 * 24 * 7,
    same_site="lax",
    secret_key=settings.app_secret_key,
    session_cookie="motorsport_blog_session",
)

app.mount("/uploads", StaticFiles(directory=settings.uploads_dir), name="uploads")

if settings.dist_dir.exists():
    assets_dir = settings.dist_dir / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/auth/session", response_model=SessionState)
def get_session(request: Request) -> SessionState:
    if not is_authenticated(request):
        return SessionState(is_authenticated=False)

    return SessionState(is_authenticated=True, username=settings.admin_username)


@app.post("/api/auth/login", response_model=SessionState)
def login(payload: LoginPayload, request: Request) -> SessionState:
    if not validate_credentials(payload.username, payload.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password.",
        )

    request.session.clear()
    request.session["is_authenticated"] = True
    request.session["username"] = settings.admin_username
    return SessionState(is_authenticated=True, username=settings.admin_username)


@app.post("/api/auth/logout", response_model=SessionState)
def logout(request: Request, response: Response) -> SessionState:
    request.session.clear()
    response.delete_cookie("motorsport_blog_session")
    return SessionState(is_authenticated=False)


@app.get("/api/posts", response_model=list[PostRecord])
def get_posts() -> list[PostRecord]:
    return [PostRecord.model_validate(post) for post in list_public_posts()]


@app.get("/api/posts/{slug}", response_model=PostRecord)
def get_post(slug: str) -> PostRecord:
    return PostRecord.model_validate(get_public_post_by_slug(slug))


@app.get("/api/admin/posts", response_model=list[PostRecord])
def get_admin_posts(request: Request) -> list[PostRecord]:
    require_auth(request)
    return [PostRecord.model_validate(post) for post in list_admin_posts()]


@app.get("/api/admin/posts/by-slug/{slug}", response_model=PostRecord)
def get_admin_post_by_slug_route(slug: str, request: Request) -> PostRecord:
    require_auth(request)
    return PostRecord.model_validate(get_admin_post_by_slug(slug))


@app.get("/api/admin/posts/{post_id}", response_model=PostRecord)
def get_admin_post(post_id: int, request: Request) -> PostRecord:
    require_auth(request)
    return PostRecord.model_validate(get_admin_post_by_id(post_id))


@app.post("/api/admin/posts", response_model=PostRecord)
def create_post_route(payload: PostCreate, request: Request) -> PostRecord:
    require_auth(request)
    return PostRecord.model_validate(create_post(payload))


@app.put("/api/admin/posts/{post_id}", response_model=PostRecord)
def update_post_route(post_id: int, payload: PostUpdate, request: Request) -> PostRecord:
    require_auth(request)
    return PostRecord.model_validate(update_post(post_id, payload))


@app.delete("/api/admin/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post_route(post_id: int, request: Request) -> Response:
    require_auth(request)
    delete_post(post_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.post("/api/admin/uploads", response_model=UploadResponse)
def upload_file(request: Request, file: UploadFile = File(...)) -> UploadResponse:
    require_auth(request)

    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in {".png", ".jpg", ".jpeg", ".webp", ".gif"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported file type.")

    payload = file.file.read()
    if not payload:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty file.")
    if len(payload) > 8 * 1024 * 1024:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File too large.")

    target_name = f"{uuid4().hex}{suffix}"
    target_path = settings.uploads_dir / target_name
    target_path.write_bytes(payload)

    return UploadResponse(filename=target_name, url=f"/uploads/{target_name}")


@app.get("/{full_path:path}")
def spa_fallback(full_path: str) -> FileResponse:
    if not settings.dist_dir.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Frontend build not found.")

    candidate_path = settings.dist_dir / full_path
    if full_path and candidate_path.is_file():
        return FileResponse(candidate_path)

    index_path = settings.dist_dir / "index.html"
    if not index_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Frontend build not found.")

    return FileResponse(index_path)
