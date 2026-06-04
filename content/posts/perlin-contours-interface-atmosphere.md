---
title: Perlin contours as interface atmosphere
slug: perlin-contours-interface-atmosphere
category: Shader Notes
date: 2026-06-02
excerpt: A field note on using contour lines as a persistent layer instead of a static background image.
tags: shader, perlin, atmosphere
---

# Perlin contours as interface atmosphere

The contour background works best when it behaves like weather: present, continuous, and slightly indifferent to the content above it.

When the user scrolls, the interface moves. The field stays.

## Rules

- Let the line system keep running across route changes.
- Keep contrast low enough that reading remains easy.
- Use theme colors for every visible surface.

## Result

The page feels less like a stack of screens and more like a single instrument with different reading states.
