# FastAPI Blog Build Prompt

Copy the prompt below into Codex:

```text
Use $frontend-design and $fastapi-python to implement a blog system in this repository.

Goals:
- Keep the existing React + Vite frontend structure
- Use FastAPI for the backend
- Use SQLite for persistence
- Use single-admin cookie session authentication
- Do not add /admin/login
- Use a login modal on the home page and blog pages
- Unauthenticated users can only browse
- Authenticated users can create, edit, and delete blog posts

Feature scope:
- Public blog list: /blog
- Public blog detail: /blog/:slug
- Protected new-post page: /blog/new
- Protected edit page: /blog/:slug/edit
- Post fields: title, slug, excerpt, content_markdown, cover_image_url, status, published_at
- Support cover image upload
- Support inline image upload for Markdown content
- Store uploads locally and return publicly accessible URLs

Backend requirements:
- Add a FastAPI backend directory
- Provide auth endpoints, post CRUD endpoints, and upload endpoints
- Require auth for admin actions
- Allow anonymous access for public read endpoints
- Configure admin credentials through environment variables
- Keep frontend and backend in one repo and access the API through a dev proxy

Frontend requirements:
- Match the existing project quality and visual tone, but prioritize content readability for blog pages
- Reuse one global login modal
- Show admin actions immediately after login without page reload
- Reuse one post editor form for create and edit
- Support Markdown preview
- Keep existing visual experiment pages accessible and do not break the current background work

Implementation requirements:
- Inspect existing routes and page structure first
- Then implement directly instead of stopping at analysis
- Run the necessary build or test checks after changes
- Clearly list new dependencies, environment variables, and startup commands

If a specialized skill is still missing during implementation, use $find-skills to search, but do not default to low-install CMS skills.
```

