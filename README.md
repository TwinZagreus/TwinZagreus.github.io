# motorsport-background-demo

一个基于 **Next.js App Router** 的个人视觉博客与 Three.js 实验项目，包含 Perlin 等高线背景、全站 loading、主题切换、音乐控件、Markdown 写作页和 WebGL 视觉实验。

A **Next.js App Router** personal visual blog and Three.js playground with Perlin contour backgrounds, global loading, theme switching, audio controls, Markdown writing pages, and WebGL visual experiments.

## 在线访问 / Live Sites

- GitHub Pages: [twinzagreus.github.io](https://twinzagreus.github.io/)
- Cloudflare Pages: [twinzagreus.pages.dev](https://twinzagreus.pages.dev/)

## 路由 / Routes

- `/` - 默认首页，包含 Perlin 背景、个人主页首屏和下滚博客目录。
  Default homepage with Perlin background, personal hero, and scroll-down writing index.
- `/home` - 深色视觉实验页。
  Dark visual experiment page.
- `/perlin-contours` - Perlin contour 视觉实验页。
  Perlin contour visual experiment route.
- `/scan-effect` - 基于深度图的扫描效果实验。
  Depth-map scan effect study.
- `/loading-overlay-lab` - Loading overlay 调试页。
  Static loading-overlay preview route.
- `/writing/[slug]` - Markdown 文章详情页。
  Markdown article detail route.

## 目录 / Structure

- `content/posts` - Markdown 文章内容。
  Markdown article source files.
- `src/app` - Next.js App Router 页面入口。
  Next.js App Router pages.
- `src/components` - 全局 UI、provider、loading、主题控件和 Three.js 图层。
  Shared UI, providers, loading, theme controls, and Three.js layers.
- `src/features/visual-labs` - 视觉实验页面。
  Visual experiment pages.
- `src/features/writing` - 博客目录和文章详情 UI。
  Writing index and article UI.
- `src/lib` - 主题色、Markdown 读取和公共工具。
  Theme colors, Markdown loading, and shared utilities.

## 技术栈 / Tech Stack

- Next.js App Router
- React
- Tailwind CSS
- Framer Motion
- Three.js
- `@react-three/fiber`
- GSAP
- MUI

## 本地运行 / Local Development

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

把开发日志写入 `logs/next-dev.log`：

Write development logs to `logs/next-dev.log`:

```bash
npm run dev:log
```

## 静态构建 / Static Build

本项目已经配置为静态导出：

This project is configured for static export:

```bash
npm run build
```

构建完成后，静态文件会输出到：

The static site is generated into:

```text
out/
```

## GitHub Pages 部署 / GitHub Pages Deployment

push 到 `main` 分支后，GitHub Actions 自动构建并部署，详见 `.github/workflows/deploy.yml`。

Pushing to `main` triggers automatic build and deployment via GitHub Actions. See `.github/workflows/deploy.yml`.

## Cloudflare Pages 部署 / Cloudflare Pages Deployment

同时部署到 Cloudflare Pages，国内访问更快。详见 `.github/workflows/deploy-cloudflare.yml`。

Also deployed to Cloudflare Pages for faster access from China. See `.github/workflows/deploy-cloudflare.yml`.

## 写文章 / Writing Posts

新增文章只需要在 `content/posts/` 新建一个 `.md` 文件。首页 Notes 列表、右侧 Recent Articles 和文章详情页都会自动读取这里的 Markdown，不需要再维护 JS 索引。

To add a post, create one `.md` file under `content/posts/`. The home Notes list, right-side Recent Articles, and writing detail pages all read from Markdown automatically. No JS index update is needed.

必填 frontmatter：

- `title`
- `slug`
- `category`
- `date`
- `excerpt`

可选 frontmatter：

- `tags`：用英文逗号分隔，例如 `tags: motion, shader, notes`

访问路径：

- `/writing/<slug>`

当前正文支持的 Markdown 子集：

- 段落
- `##` 二级标题
- `###` 三级标题
- `-` 列表
- `>` 引用

文章示例：

Example post:

```md
---
title: 用 Markdown 写一篇个人技术札记
slug: chinese-blog-writing-sample
category: Personal Log
date: 2026-06-04
excerpt: 一个中文博客文章示例。
tags: 中文, markdown, 写作
---

## 动机

这里写正文段落。

- 支持列表
- 支持基础排版

> 也支持引用块。
```

## 说明 / Notes

- 旧文章系统、SQLite、上传接口和登录后台已经移除。
  The old article system, SQLite storage, upload API, and login admin flow have been removed.
- 当前博客是构建时 Markdown 静态生成，不需要数据库。
  The current writing system is statically generated from Markdown at build time and does not need a database.
- 主题色集中在 `src/lib/projectColors.js`。
  Theme colors are centralized in `src/lib/projectColors.js`.
- 全站 loading 位于 `src/components/ThreeLoadingOverlay.jsx`。
  The global loading overlay lives in `src/components/ThreeLoadingOverlay.jsx`.
