# motorsport-background-demo

A Next.js App Router playground for premium motorsport-style visual experiments, now extended with an in-app SQLite blog system.

## Routes

- `/` - perlin contour landing page with shader controls, reveal-image layer, and a custom Three.js loading overlay
- `/blog` - public blog index, switches into admin mode after login
- `/blog/:slug` - public blog detail
- `/blog/new` - protected post editor
- `/blog/:slug/edit` - protected post editor
- `/home` - dark cinematic homepage background experiment
- `/loading-overlay-lab` - static loading-overlay preview route for tuning Twin/Z size, spacing, and mobile layout
- `/scan-effect` - depth-map scan study inspired by `d3adrabbit/ScanningEffectWithDepthMap`, adapted into a stable WebGL shader route

## Tech Stack

- Next.js App Router
- React
- Tailwind CSS
- Framer Motion
- Three.js
- @react-three/fiber
- GSAP
- MUI
- React Markdown
- SQLite
- better-sqlite3

## Skills Used

The project work in this repo was guided by these Codex skills:

- `frontend-design`
  Used for visual direction, composition, and keeping the interface from drifting into generic landing-page aesthetics.

- `emilkowal-animations`
  Used for motion design guidance, especially around animation restraint, pacing, transform-first movement, and polished interaction feel.

- `webgpu-threejs-tsl`
  Used to guide the exploration of GPU-driven rendering, Three.js/WebGPU patterns, shader-oriented architecture, and scan-effect technical direction.

- `find-skills`
  Used to discover and evaluate additional skills relevant to creative WebGL and shader-heavy frontend work.

## Notes

- The homepage loading experience is driven by `src/components/ThreeLoadingOverlay.jsx` and uses an orthographic Three.js scene, canvas-based logo textures, and staggered falling slice panels for exit transition.
- Shared project colors live in `src/lib/projectColors.js` and are re-exported from `src/lib/theme.js`.
- The Next.js migration prompt suite lives in `NEXTJS_REFACTOR_PROMPTS.md`.
- The `/scan-effect` route currently uses a stable WebGL shader implementation rather than a direct production WebGPU/TSL port, because the original reference stack was not fully compatible with this local app/runtime combination.
- Assets for the scan study are stored in `public/scan-effect`.
- The current blog backend lives in `src/app/api/*`, uses SQLite, and exposes `/api/*` plus `/uploads/*`.
- The old Python/FastAPI runtime has been removed. The `backend/` directory now only holds local env, SQLite data, and uploaded files used by the Next.js server.

## Blog Backend

The server reads configuration from:

- `backend/.env`
- root `.env`
- root `.env.local`

Current default storage paths:

- database: `backend/data/blog.db`
- uploads: `backend/uploads`

Default admin credentials in local development:

- username: `admin`
- password: `change-this-password`

Run the app:

```bash
npm run dev
```

Build for production:

```bash
npm run build
npm run start
```

The Next.js app now serves both page routes and the blog API layer directly.
