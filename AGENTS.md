# Project Agent Instructions

## Creative Direction

This project is a high-interaction personal blog focused on motion, WebGL, shader atmospheres, animated transitions, and polished interface choreography.

When the user asks for UI, page, blog, interaction, navigation, loading, theme, Three.js, SVG, shader, scroll, hover, route transition, or visual polish work, bias toward a cinematic, high-aesthetic, high-motion implementation rather than a static or template-like solution.

## Animation Skill Priority

Before planning or implementing motion-related work, choose the most relevant skills from `.codex/animation-skills.md`.

Default combinations:

- Web UI motion: `frontend-design` + `emilkowal-animations` + `gsap-core`
- Complex timelines: `emilkowal-animations` + `gsap` + `gsap-timeline`
- Scroll motion: `emilkowal-animations` + `gsap-scrolltrigger` + `gsap-performance`
- Route/page transitions: `emilkowal-animations` + `gsap-core` or Framer Motion patterns already in the repo
- Three.js/WebGL motion: `webgpu-threejs-tsl` + `threejs-animation` + `threejs-shaders`
- Three.js interaction: `threejs-interaction` + `threejs-fundamentals`
- SVG/logo motion: `svg-animations` + `SVG Logo Designer`

## Implementation Preferences

- Preserve the existing theme system and use project theme colors instead of hardcoded colors whenever practical.
- Prefer `transform`, `opacity`, and shader uniforms for animation performance.
- Avoid layout-thrashing motion and oversized DOM reflows.
- Keep the Perlin/WebGL background feeling persistent and alive during page transitions.
- Respect reduced-motion handling when adding major animations.
- Keep right-bottom global controls stable unless the user explicitly asks to change them.

