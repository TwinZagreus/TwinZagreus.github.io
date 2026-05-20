# motorsport-background-demo

一个基于 **Next.js App Router** 的视觉实验项目，主方向是高级赛车 / 科技感网页背景、Three.js 动效、Shader 页面，以及内置 SQLite 博客系统。

A **Next.js App Router** playground for premium motorsport-style visual experiments, Three.js motion, shader-heavy pages, and an in-app SQLite blog system.

## 路由 / Routes

- `/` - Perlin contour 首页，包含 shader 背景、图片 reveal 图层、自定义 Three.js loading overlay。  
  Perlin contour landing page with shader controls, reveal-image layer, and a custom Three.js loading overlay.
- `/home` - 深色电影感首页背景实验。  
  Dark cinematic homepage background experiment.
- `/perlin-contours` - Perlin contour 视觉实验页，也是当前默认首页内容。  
  Perlin contour visual experiment route, also used by the current root page.
- `/scan-effect` - 基于深度图的扫描效果实验，参考 `d3adrabbit/ScanningEffectWithDepthMap` 并改成稳定 WebGL shader 路由。  
  Depth-map scan study inspired by `d3adrabbit/ScanningEffectWithDepthMap`, adapted into a stable WebGL shader route.
- `/loading-overlay-lab` - Loading overlay 调试页，用来调整 Twin/Z 尺寸、间距和移动端布局。  
  Static loading-overlay preview route for tuning Twin/Z size, spacing, and mobile layout.
- `/blog` - 公开博客列表，登录后切换为管理模式。  
  Public blog index that switches into admin mode after login.
- `/blog/:slug` - 公开博客详情页。  
  Public blog detail page.
- `/blog/new` - 受保护的新建文章页。  
  Protected post editor for creating posts.
- `/blog/:slug/edit` - 受保护的编辑文章页。  
  Protected post editor for updating posts.

## 项目结构 / Project Structure

- `src/app` - Next.js App Router 入口和 API route handlers。页面文件保持轻量，只负责路由转发。  
  Next.js App Router entrypoints and API route handlers. Page files should stay thin and delegate to feature pages.
- `src/features/blog/pages` - 博客列表、详情、编辑页实现。  
  Blog list, detail, and editor page implementations.
- `src/features/visual-labs/pages` - Perlin、Scan、Home、Loading Overlay Lab 等视觉实验页。  
  Visual experiment pages for perlin contours, scan effect, home lab, and loading overlay lab.
- `src/components` - 共享 UI、Provider、可复用 Three.js 图层和视觉组件。  
  Shared UI, providers, reusable Three.js layers, and visual components.
- `src/lib` - 客户端工具、设计 token、导航封装、服务端博客辅助函数。  
  Client utilities, design tokens, navigation wrappers, and server-side blog helpers.
- `src/legacy-vite` - Next.js 迁移前的 Vite shell 归档，不是当前活跃运行时。  
  Archived Vite shell from before the Next.js migration. It is not the active runtime.
- `@/` - 在 `jsconfig.json` 中配置为 `src/` 的路径别名；新的活跃 Next.js 代码优先使用它。  
  Configured in `jsconfig.json` as the project alias for `src/`; use it for new active Next.js imports.

## 技术栈 / Tech Stack

- Next.js App Router
- React
- Tailwind CSS
- Framer Motion
- Three.js
- `@react-three/fiber`
- GSAP
- MUI
- React Markdown
- SQLite
- `better-sqlite3`

## 使用过的 Skills / Skills Used

这个项目的实现过程参考过这些 Codex skills：

The project work in this repo was guided by these Codex skills:

- `frontend-design`  
  用于视觉方向、版式、界面质感控制，避免页面变成普通模板感。  
  Used for visual direction, composition, and keeping the interface from drifting into generic landing-page aesthetics.

- `emilkowal-animations`  
  用于动效节奏、缓动、transform 优先的运动方式，以及交互手感。  
  Used for motion design guidance, especially around animation restraint, pacing, transform-first movement, and polished interaction feel.

- `webgpu-threejs-tsl`  
  用于 GPU 渲染、Three.js/WebGPU 思路、shader 架构和扫描效果技术方向。  
  Used to guide GPU-driven rendering exploration, Three.js/WebGPU patterns, shader-oriented architecture, and scan-effect technical direction.

- `find-skills`  
  用于发现和评估适合创意 WebGL、shader 前端工作的额外 skills。  
  Used to discover and evaluate additional skills relevant to creative WebGL and shader-heavy frontend work.

## 运行 / Running Locally

安装依赖：

Install dependencies:

```bash
npm install
```

启动开发服务器：

Start the development server:

```bash
npm run dev
```

需要把开发日志写入文件时：

When you want development logs written to a file:

```bash
npm run dev:log
```

日志会写入 `logs/next-dev.log`，`logs/*.log` 不会进入 git。

Logs are written to `logs/next-dev.log`, and `logs/*.log` files are ignored by git.

生产构建和启动：

Build and start for production:

```bash
npm run build
npm run start
```

Next.js 现在同时负责页面路由和博客 API 层。

The Next.js app now serves both page routes and the blog API layer directly.

## 博客后端 / Blog Backend

服务端会从以下位置读取配置：

The server reads configuration from:

- `backend/.env`
- root `.env`
- root `.env.local`

当前默认存储路径：

Current default storage paths:

- database / 数据库：`backend/data/blog.db`
- uploads / 上传目录：`backend/uploads`

本地开发默认管理员账号：

Default admin credentials in local development:

- username / 用户名：`admin`
- password / 密码：`change-this-password`

博客后端位于 `src/app/api/*`，使用 SQLite，暴露 `/api/*` 和 `/uploads/*`。

The current blog backend lives in `src/app/api/*`, uses SQLite, and exposes `/api/*` plus `/uploads/*`.

## 重要说明 / Notes

- 首页 loading 由 `src/components/ThreeLoadingOverlay.jsx` 驱动，使用正交 Three.js 场景、CanvasTexture logo、斜切片下落转场。  
  The homepage loading experience is driven by `src/components/ThreeLoadingOverlay.jsx` and uses an orthographic Three.js scene, canvas-based logo textures, and staggered falling slice panels for exit transition.
- 共享项目颜色位于 `src/lib/projectColors.js`，并从 `src/lib/theme.js` 重新导出；`BASE_COLOR` 会生成 5 套颜色组。  
  Shared project colors live in `src/lib/projectColors.js` and are re-exported from `src/lib/theme.js`. `BASE_COLOR` drives five generated color groups.
- Next.js 重构提示词保存在 `NEXTJS_REFACTOR_PROMPTS.md`。  
  The Next.js migration prompt suite lives in `NEXTJS_REFACTOR_PROMPTS.md`.
- `/scan-effect` 当前使用稳定 WebGL shader 实现，没有直接生产化 WebGPU/TSL 版本，因为原参考栈和本地运行环境不完全兼容。  
  The `/scan-effect` route currently uses a stable WebGL shader implementation rather than a direct production WebGPU/TSL port, because the original reference stack was not fully compatible with this local app/runtime combination.
- Scan study 资源存放在 `public/scan-effect`。  
  Assets for the scan study are stored in `public/scan-effect`.
- 旧 Python/FastAPI 运行时已经移除；`backend/` 现在只保存本地环境、SQLite 数据和 Next.js server 使用的上传文件。  
  The old Python/FastAPI runtime has been removed. The `backend/` directory now only holds local env, SQLite data, and uploaded files used by the Next.js server.
