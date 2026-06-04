---
title: 鼠标轨迹揭示层笔记
slug: webgl-reveal-layer-notes
category: Three.js Lab
date: 2026-05-30
excerpt: 记录鼠标轨迹、图片混合和 ping-pong buffer 在首页视觉里的角色。
tags: webgl, reveal, buffer
---

# 鼠标轨迹揭示层笔记

轨迹揭示层让首页不只是背景动画，而是能被用户短暂改变的画面。它像一种视觉记忆，保留鼠标经过的痕迹。

## 技术角色

- 常显层负责稳定画面。
- 隐藏层负责制造惊喜。
- 轨迹 buffer 负责记录路径。
- 混合 shader 负责把两张图合成。

## 体验判断

效果应该轻，不要像工具一样抢交互焦点。
