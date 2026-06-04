---
title: Mouse trails as image memory
slug: mouse-trails-image-memory
category: Three.js Lab
date: 2026-05-28
excerpt: Using a ping-pong buffer to make the cursor reveal a second image as a temporary memory layer.
tags: webgl, reveal, interaction
---

# Mouse trails as image memory

The cursor trail is a record of attention. It lets the page remember where the user looked for a short time.

This is more useful than a simple hover state because it creates a slow visual consequence.

## Implementation thought

Ping-pong buffers are not only for fluid effects. They are also a good way to preserve gesture history without storing a long list of points.
