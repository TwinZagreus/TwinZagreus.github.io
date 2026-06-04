---
title: 等高线背景下的阅读密度
slug: contour-background-reading-density
category: Shader Notes
date: 2026-06-02
excerpt: 测试动态等高线背景与长列表内容共存时，文字层级是否仍然清楚。
tags: shader, typography, density
---

# 等高线背景下的阅读密度

动态背景很容易抢走文字的注意力。博客区域需要保持足够的透明度和边界，让内容像浮在地图上的标注。

## 层级

- 背景负责氛围。
- 分类负责组织。
- 标题负责点击入口。
- 摘要负责判断是否继续阅读。

## 调整方向

如果视觉太吵，优先降低内容容器透明度，而不是停掉背景。
