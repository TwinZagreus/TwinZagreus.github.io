from __future__ import annotations

from datetime import datetime, timezone
from sqlite3 import Row

from fastapi import HTTPException, status

from .db import get_connection
from .schemas import PostCreate, PostUpdate


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def parse_timestamp(value: str | None) -> datetime | None:
    if not value:
        return None
    return datetime.fromisoformat(value)


def row_to_post(row: Row) -> dict:
    return {
        "content_markdown": row["content_markdown"],
        "cover_image_url": row["cover_image_url"],
        "created_at": parse_timestamp(row["created_at"]),
        "excerpt": row["excerpt"],
        "id": row["id"],
        "published_at": parse_timestamp(row["published_at"]),
        "slug": row["slug"],
        "status": row["status"],
        "title": row["title"],
        "updated_at": parse_timestamp(row["updated_at"]),
    }


def slug_exists(slug: str, exclude_id: int | None = None) -> bool:
    query = "SELECT id FROM posts WHERE slug = ?"
    parameters: list[object] = [slug]

    if exclude_id is not None:
        query += " AND id != ?"
        parameters.append(exclude_id)

    with get_connection() as connection:
        row = connection.execute(query, parameters).fetchone()
    return row is not None


def list_public_posts() -> list[dict]:
    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT *
            FROM posts
            WHERE status = 'published'
            ORDER BY COALESCE(published_at, created_at) DESC, id DESC
            """
        ).fetchall()

    return [row_to_post(row) for row in rows]


def list_admin_posts() -> list[dict]:
    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT *
            FROM posts
            ORDER BY updated_at DESC, id DESC
            """
        ).fetchall()

    return [row_to_post(row) for row in rows]


def get_public_post_by_slug(slug: str) -> dict:
    with get_connection() as connection:
        row = connection.execute(
            """
            SELECT *
            FROM posts
            WHERE slug = ? AND status = 'published'
            LIMIT 1
            """,
            (slug,),
        ).fetchone()

    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found.")

    return row_to_post(row)


def get_admin_post_by_slug(slug: str) -> dict:
    with get_connection() as connection:
        row = connection.execute(
            """
            SELECT *
            FROM posts
            WHERE slug = ?
            LIMIT 1
            """,
            (slug,),
        ).fetchone()

    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found.")

    return row_to_post(row)


def get_admin_post_by_id(post_id: int) -> dict:
    with get_connection() as connection:
        row = connection.execute(
            """
            SELECT *
            FROM posts
            WHERE id = ?
            LIMIT 1
            """,
            (post_id,),
        ).fetchone()

    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found.")

    return row_to_post(row)


def create_post(payload: PostCreate) -> dict:
    if slug_exists(payload.slug):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Slug already exists.")

    timestamp = now_iso()
    published_at = timestamp if payload.status == "published" else None

    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO posts (
                title,
                slug,
                excerpt,
                content_markdown,
                cover_image_url,
                status,
                published_at,
                created_at,
                updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                payload.title.strip(),
                payload.slug.strip(),
                payload.excerpt.strip(),
                payload.content_markdown,
                payload.cover_image_url.strip(),
                payload.status,
                published_at,
                timestamp,
                timestamp,
            ),
        )
        connection.commit()
        post_id = cursor.lastrowid

    return get_admin_post_by_id(int(post_id))


def update_post(post_id: int, payload: PostUpdate) -> dict:
    existing = get_admin_post_by_id(post_id)

    if slug_exists(payload.slug, exclude_id=post_id):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Slug already exists.")

    next_published_at = existing["published_at"]
    if payload.status == "published" and next_published_at is None:
        next_published_at = datetime.fromisoformat(now_iso())
    if payload.status == "draft":
        next_published_at = None

    with get_connection() as connection:
        connection.execute(
            """
            UPDATE posts
            SET
                title = ?,
                slug = ?,
                excerpt = ?,
                content_markdown = ?,
                cover_image_url = ?,
                status = ?,
                published_at = ?,
                updated_at = ?
            WHERE id = ?
            """,
            (
                payload.title.strip(),
                payload.slug.strip(),
                payload.excerpt.strip(),
                payload.content_markdown,
                payload.cover_image_url.strip(),
                payload.status,
                next_published_at.isoformat() if next_published_at else None,
                now_iso(),
                post_id,
            ),
        )
        connection.commit()

    return get_admin_post_by_id(post_id)


def delete_post(post_id: int) -> None:
    get_admin_post_by_id(post_id)

    with get_connection() as connection:
        connection.execute("DELETE FROM posts WHERE id = ?", (post_id,))
        connection.commit()
