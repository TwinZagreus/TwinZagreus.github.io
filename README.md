# motorsport-background-demo

A Vite + React playground for exploring premium motorsport-style homepage backgrounds, scan effects, and shader-driven visual treatments.

## Routes

- `/` - dark cinematic homepage background experiment
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

- The `/scan-effect` route currently uses a stable WebGL shader implementation rather than a direct production WebGPU/TSL port, because the original reference stack was not fully compatible with this local app/runtime combination.
- Assets for the scan study are stored in `public/scan-effect`.
