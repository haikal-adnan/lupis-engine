---
title: "Visual Renderers"
category: "Components"
description: "Visual renderer components draw sprites, vector shapes, text, and tilemaps in your scene. Each entity can have one visual renderer attached at a time."
---

## Overview {#overview}

A visual renderer defines how an [entity](components/entities_and_prefabs) appears on screen. You can attach one renderer per entity from **Add Component...** in the [Property Inspector](interface/property_inspector), and combine it with simulation or logic components such as [Sprite Animator](components/sprite_animator), [Physics Body](components/physics_body), or [Multi-Collider](components/multi_collider).

> [!NOTE]
> An entity can have only one visual renderer at a time. Once you attach one renderer, the other three show **(Conflict)** in the **Add Component...** menu.

## Choose a page {#choose-a-page}

| Page | Use it when |
| --- | --- |
| [Image Renderer](components/renderers/sprite_renderer) | You want to display 2D textures, sprites, UI icons, or cropped regions from a spritesheet. |
| [Shape Renderer](components/renderers/shape_renderer) | You want to draw custom vector polygons, circles, or line segments with optional shape physics. |
| [Text Renderer](components/renderers/text_renderer) | You want to render crisp scalable text with alignment, outlines, and drop shadows. |
| [Tilemap](components/renderers/tilemap) | You want to paint grid-based 2D levels and solid terrain in **World** layers. |

## Related {#related}

| Page | Use it when |
| --- | --- |
| [Sprite Animator](components/sprite_animator) | You want to animate an **Image Renderer** with frame-by-frame clips. |
| [Transform & UI Transform](components/transform) | You want to position, resize, rotate, or flip a rendered entity. |
| [Rendering & Camera](node_library/game_renderer) | You want to change renderer properties or camera targets from a visual script. |
