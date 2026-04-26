const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
};

async function request(path, options = {}) {
  const response = await fetch(path, {
    credentials: "include",
    headers: {
      ...DEFAULT_HEADERS,
      ...(options.headers ?? {}),
    },
    ...options,
  });

  if (response.status === 204)
    return null;

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const detail =
      typeof payload === "object" && payload !== null && "detail" in payload
        ? payload.detail
        : "Request failed.";
    throw new Error(detail);
  }

  return payload;
}

export function getSession() {
  return request("/api/auth/session", {
    method: "GET",
  });
}

export function login(payload) {
  return request("/api/auth/login", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export function logout() {
  return request("/api/auth/logout", {
    body: JSON.stringify({}),
    method: "POST",
  });
}

export function listPublicPosts() {
  return request("/api/posts", { method: "GET" });
}

export function getPublicPost(slug) {
  return request(`/api/posts/${slug}`, { method: "GET" });
}

export function listAdminPosts() {
  return request("/api/admin/posts", { method: "GET" });
}

export function getAdminPostBySlug(slug) {
  return request(`/api/admin/posts/by-slug/${slug}`, { method: "GET" });
}

export function createPost(payload) {
  return request("/api/admin/posts", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export function updatePost(postId, payload) {
  return request(`/api/admin/posts/${postId}`, {
    body: JSON.stringify(payload),
    method: "PUT",
  });
}

export function deletePost(postId) {
  return request(`/api/admin/posts/${postId}`, {
    method: "DELETE",
  });
}

export async function uploadAsset(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/admin/uploads", {
    body: formData,
    credentials: "include",
    method: "POST",
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.detail ?? "Upload failed.");
  }

  return payload;
}
