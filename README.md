# motorsport-background-demo

A Vite + React playground for premium motorsport-style visual experiments, now extended with a FastAPI-powered blog system.

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

- React
- Vite
- Tailwind CSS
- Framer Motion
- Three.js
- @react-three/fiber
- GSAP
- React Router
- React Markdown
- FastAPI
- SQLite

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

- `fastapi-python`
  Used to structure the blog backend, cookie authentication, upload flow, and CRUD API design.

## Notes

- The homepage loading experience is driven by `src/components/ThreeLoadingOverlay.jsx` and uses an orthographic Three.js scene, canvas-based logo textures, and staggered falling slice panels for exit transition.
- Shared project colors live in `src/lib/projectColors.js` and are re-exported from `src/lib/theme.js`.
- The `/scan-effect` route currently uses a stable WebGL shader implementation rather than a direct production WebGPU/TSL port, because the original reference stack was not fully compatible with this local app/runtime combination.
- Assets for the scan study are stored in `public/scan-effect`.
- The blog backend lives in `backend/`, uses SQLite, and exposes `/api/*` plus `/uploads/*`.

## Blog Backend

Create your backend env from `backend/.env.example` if you want to override defaults.

Default admin credentials in local development:

- username: `admin`
- password: `change-this-password`

Run the frontend and backend in separate terminals:

```bash
npm run dev
npm run server
```

Vite proxies `/api` and `/uploads` to `http://127.0.0.1:8010`.
