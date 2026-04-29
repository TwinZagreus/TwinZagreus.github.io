# Next.js Refactor Prompt Suite

Copy the prompt that matches the stage you want to run.  
Default stack is fixed to:

- Next.js
- JavaScript
- App Router
- Tailwind + MUI
- SQLite
- local uploads
- single-admin login modal
- full preservation of the current Three.js pages and effects

Use these prompts with:

- `$frontend-design`
- `$nextjs-best-practices`

Add `$emilkowal-animations` when reviewing motion behavior, and `$webgpu-threejs-tsl` when touching the shader-heavy pages.

## 1. Master Control Prompt

```text
Use $frontend-design and $nextjs-best-practices to fully refactor this repository from Vite + React + React Router + FastAPI into a Next.js JavaScript + App Router full-stack project.

Important constraints:
- Preserve all existing Three.js / R3F pages and interactions
- Do not weaken or replace the current shader pages with static mockups
- Keep MUI as the primary button/component library where suitable
- Keep the default font strategy for regular pages as Trebuchet MS / Segoe UI / sans-serif
- Treat the current ThreeLoadingOverlay font behavior as a deliberate exception and preserve equivalent behavior

Current routes that must exist after migration:
- /
- /home
- /perlin-contours
- /scan-effect
- /loading-overlay-lab
- /blog
- /blog/[slug]
- /blog/new
- /blog/[slug]/edit

Migration targets:
- Replace React Router with Next.js App Router
- Replace the standalone FastAPI runtime with Next.js-native backend capabilities
- Preserve SQLite persistence
- Preserve local uploads
- Preserve the single-admin login modal experience
- Preserve unauthenticated read-only blog browsing
- Preserve authenticated create/edit/delete flows

Required route mapping:
- app/page.js -> current /
- app/home/page.js
- app/perlin-contours/page.js
- app/scan-effect/page.js
- app/loading-overlay-lab/page.js
- app/blog/page.js
- app/blog/[slug]/page.js
- app/blog/new/page.js
- app/blog/[slug]/edit/page.js

Three.js protection rules:
- Preserve the behavior and visual structure of:
  - PerlinContoursRoute
  - ScanEffectRoute
  - LoadingOverlayLabRoute
  - ThreeLoadingOverlay
  - MouseRevealLayer
  - HomepageBackground
- Explicitly decide which migrated components must use "use client"
- Handle browser-only APIs safely in Next.js, including window, document, canvas, FontFace, and R3F runtime boundaries
- Do not delete or flatten loading overlay, reveal layer, shader motion, or scan effect behavior

Backend migration requirements:
- Move blog auth, post CRUD, and upload handling into Next.js Route Handlers and/or Server Actions
- Keep SQLite as the source of truth
- Keep uploads stored locally and publicly served
- Keep the login modal UX instead of introducing /admin/login
- Keep one admin account model and session-based auth behavior

UI migration requirements:
- Reuse shared layout pieces instead of page-local duplication
- Rebuild the existing blog layout, login modal, button wrapper, and theme utilities as reusable Next.js modules
- Keep MUI button usage consistent with the current AppButton-style abstraction

Execution requirements:
- Inspect the current routes, blog flow, and Three.js components first
- Propose the migration structure before editing
- Then implement directly
- Run build/test checks after the migration
- Clearly list moved responsibilities, new scripts, env vars, and startup commands

Acceptance criteria:
- Next.js starts locally and replaces the current Vite app entry
- All listed routes are reachable
- Blog list/detail/new/edit/delete/upload all work
- Login modal still controls protected blog actions
- Three.js pages still render and preserve their key interactions
- MUI button system still drives the actionable UI
```

## 2. Frontend Pages Prompt

```text
Use $frontend-design, $nextjs-best-practices, and $emilkowal-animations to migrate the frontend pages in this repository to Next.js JavaScript + App Router.

Page groups:
- Visual experiment pages:
  - /
  - /home
  - /perlin-contours
  - /scan-effect
  - /loading-overlay-lab
- Blog pages:
  - /blog
  - /blog/[slug]
  - /blog/new
  - /blog/[slug]/edit

Requirements:
- Preserve current page hierarchy, general layout composition, and visual tone
- Preserve the current MUI button abstraction approach
- Keep the default regular-page font strategy as Trebuchet MS / Segoe UI / sans-serif
- Preserve current route intent and path structure

Implementation decisions to lock:
- Use app/ directory only
- Use JavaScript, not TypeScript
- Use App Router layouts instead of React Router wrappers
- Split reusable UI into shared modules rather than copying current route files one-to-one

Required structure:
- app/layout.js
- app/page.js
- app/home/page.js
- app/perlin-contours/page.js
- app/scan-effect/page.js
- app/loading-overlay-lab/page.js
- app/blog/page.js
- app/blog/[slug]/page.js
- app/blog/new/page.js
- app/blog/[slug]/edit/page.js

Behavior requirements:
- Preserve loading overlay composition and reveal ordering
- Preserve blog layout shell, login modal, and protected editor flow
- Preserve the current scan effect and perlin contour presentation
- Preserve the current top-level page navigation affordances

Client/server guidance:
- Mark only the pages/components that truly need browser APIs as "use client"
- Keep server-rendered shells where possible
- Do not force shader-heavy pages into server logic that breaks runtime behavior

Validation:
- Confirm that every existing route has a Next.js equivalent
- Confirm that the navigation still reaches every destination
- Confirm that the migrated pages still use MUI-driven actions instead of falling back to raw button styling
```

## 3. Blog Backend Migration Prompt

```text
Use $nextjs-best-practices to migrate the current blog backend behavior from FastAPI into Next.js-native backend capabilities inside the same repository.

Keep the current product behavior:
- single admin
- login modal
- unauthenticated users can only browse
- authenticated users can create, edit, and delete posts
- SQLite remains the database
- uploads remain local

Required features:
- login
- logout
- session restore/check
- public post listing
- public post detail
- admin post listing
- admin post detail lookup
- create post
- update post
- delete post
- cover upload
- inline Markdown image upload

Implementation constraints:
- Use Next.js Route Handlers and/or Server Actions
- Keep JavaScript, not TypeScript
- Do not introduce /admin/login
- Keep the login-modal-based interaction model
- Keep local file uploads and public file serving
- Keep the existing post model shape equivalent:
  - title
  - slug
  - excerpt
  - content_markdown
  - cover_image_url
  - status
  - published_at

Architecture requirements:
- Eliminate the need for a separate FastAPI runtime
- Preserve SQLite-backed persistence
- Preserve the current protected editor behavior
- Keep the blog flow compatible with Next.js page rendering and client transitions

Validation:
- login works
- session survives expected navigation flow
- unauthenticated users cannot mutate data
- blog CRUD works end to end
- cover and inline uploads work end to end
- public routes only expose published content
```

## 4. Verification and Regression Prompt

```text
Use $nextjs-best-practices, $frontend-design, $emilkowal-animations, and $webgpu-threejs-tsl to verify a completed Next.js migration of this repository.

Check these areas:

1. Route parity
- /
- /home
- /perlin-contours
- /scan-effect
- /loading-overlay-lab
- /blog
- /blog/[slug]
- /blog/new
- /blog/[slug]/edit

2. Blog system
- login modal still exists
- unauthenticated users are read-only
- authenticated users can create, edit, delete
- cover upload works
- inline Markdown image upload works

3. Three.js pages
- Perlin contours still render
- scan effect still renders
- loading overlay lab still renders
- homepage background still renders
- loading overlay behavior is not flattened or removed
- reveal layer behavior is not broken

4. UI consistency
- MUI button abstraction is still used for actionable buttons
- regular page font defaults remain Trebuchet MS / Segoe UI / sans-serif
- ThreeLoadingOverlay special font behavior was preserved as an exception

5. Final checks
- Next.js starts locally
- production build succeeds
- no route regressions
- no obvious visual breakage in the shader-heavy pages

Report findings in this order:
- functional regressions
- visual regressions
- runtime/client-boundary issues
- remaining cleanup items
```

