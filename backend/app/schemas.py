from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


PostStatus = Literal["draft", "published"]


class LoginPayload(BaseModel):
    password: str = Field(min_length=1)
    username: str = Field(min_length=1)


class SessionState(BaseModel):
    is_authenticated: bool
    username: str | None = None


class PostBase(BaseModel):
    content_markdown: str = ""
    cover_image_url: str = ""
    excerpt: str = ""
    slug: str = Field(min_length=1, max_length=120)
    status: PostStatus = "draft"
    title: str = Field(min_length=1, max_length=180)


class PostCreate(PostBase):
    pass


class PostUpdate(PostBase):
    pass


class PostRecord(PostBase):
    model_config = ConfigDict(from_attributes=True)

    created_at: datetime
    id: int
    published_at: datetime | None = None
    updated_at: datetime


class UploadResponse(BaseModel):
    filename: str
    url: str
