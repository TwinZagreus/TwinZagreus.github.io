import { getDb } from "./db";

function nowIso() {
  return new Date().toISOString();
}

function parseTimestamp(value) {
  return value ? new Date(value).toISOString() : null;
}

function rowToPost(row) {
  return {
    content_markdown: row.content_markdown,
    cover_image_url: row.cover_image_url,
    created_at: parseTimestamp(row.created_at),
    excerpt: row.excerpt,
    id: row.id,
    published_at: parseTimestamp(row.published_at),
    slug: row.slug,
    status: row.status,
    title: row.title,
    updated_at: parseTimestamp(row.updated_at),
  };
}

function slugExists(slug, excludeId = null) {
  const db = getDb();
  const row = excludeId == null
    ? db.prepare("SELECT id FROM posts WHERE slug = ?").get(slug)
    : db.prepare("SELECT id FROM posts WHERE slug = ? AND id != ?").get(slug, excludeId);

  return Boolean(row);
}

export function listPublicPosts() {
  const db = getDb();
  const rows = db
    .prepare(`
      SELECT *
      FROM posts
      WHERE status = 'published'
      ORDER BY COALESCE(published_at, created_at) DESC, id DESC
    `)
    .all();

  return rows.map(rowToPost);
}

export function listAdminPosts() {
  const db = getDb();
  return db
    .prepare(`
      SELECT *
      FROM posts
      ORDER BY updated_at DESC, id DESC
    `)
    .all()
    .map(rowToPost);
}

export function getPublicPostBySlug(slug) {
  const db = getDb();
  const row = db
    .prepare(`
      SELECT *
      FROM posts
      WHERE slug = ? AND status = 'published'
      LIMIT 1
    `)
    .get(slug);

  if (!row) {
    const error = new Error("Post not found.");
    error.status = 404;
    throw error;
  }

  return rowToPost(row);
}

export function getAdminPostBySlug(slug) {
  const db = getDb();
  const row = db
    .prepare(`
      SELECT *
      FROM posts
      WHERE slug = ?
      LIMIT 1
    `)
    .get(slug);

  if (!row) {
    const error = new Error("Post not found.");
    error.status = 404;
    throw error;
  }

  return rowToPost(row);
}

export function getAdminPostById(postId) {
  const db = getDb();
  const row = db
    .prepare(`
      SELECT *
      FROM posts
      WHERE id = ?
      LIMIT 1
    `)
    .get(postId);

  if (!row) {
    const error = new Error("Post not found.");
    error.status = 404;
    throw error;
  }

  return rowToPost(row);
}

export function createPost(payload) {
  if (slugExists(payload.slug)) {
    const error = new Error("Slug already exists.");
    error.status = 409;
    throw error;
  }

  const timestamp = nowIso();
  const publishedAt = payload.status === "published" ? timestamp : null;
  const db = getDb();
  const insert = db.prepare(`
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
  `);

  const result = insert.run(
    payload.title.trim(),
    payload.slug.trim(),
    (payload.excerpt ?? "").trim(),
    payload.content_markdown ?? "",
    (payload.cover_image_url ?? "").trim(),
    payload.status,
    publishedAt,
    timestamp,
    timestamp,
  );

  return getAdminPostById(Number(result.lastInsertRowid));
}

export function updatePost(postId, payload) {
  const existing = getAdminPostById(postId);

  if (slugExists(payload.slug, postId)) {
    const error = new Error("Slug already exists.");
    error.status = 409;
    throw error;
  }

  let nextPublishedAt = existing.published_at;
  if (payload.status === "published" && !nextPublishedAt) {
    nextPublishedAt = nowIso();
  }
  if (payload.status === "draft") {
    nextPublishedAt = null;
  }

  const db = getDb();
  db.prepare(`
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
  `).run(
    payload.title.trim(),
    payload.slug.trim(),
    (payload.excerpt ?? "").trim(),
    payload.content_markdown ?? "",
    (payload.cover_image_url ?? "").trim(),
    payload.status,
    nextPublishedAt,
    nowIso(),
    postId,
  );

  return getAdminPostById(postId);
}

export function deletePost(postId) {
  getAdminPostById(postId);
  const db = getDb();
  db.prepare("DELETE FROM posts WHERE id = ?").run(postId);
}

