---
title: "Image Renderer"
category: "Visual Renderers"
description: "Displays a 2D texture or a cropped spritesheet region on an entity. Use Image Renderer for characters, props, backgrounds, and UI images."
---

## Overview {#overview}

The **Image Renderer** component draws an imported image asset (**.png**, **.jpg**, or **.webp**) inside the bounds of an entity's [Transform & UI Transform](components/transform). It includes an interactive crop modal for slicing individual frames out of a spritesheet and supports both crisp pixel art and smooth filtering.

:::features
- **Interactive Crop**: Click the preview thumbnail to slice spritesheets with grid snapping.
- **Pixel & Smooth Modes**: Switch between **Pixelated** filtering for retro art and **Smooth** filtering for HD graphics.
- **SDF Rendering**: Turn on **SDF** for sharp edges when scaling icons and silhouettes.
- **Animator Ready**: Pair with [Sprite Animator](components/sprite_animator) for frame-by-frame animation clips.
:::

## Add the component {#add-the-component}

:::steps
1. Select an entity in the [Scene Hierarchy](interface/scene_hierarchy) or [Scene Viewport](interface/scene_viewport).
2. In the [Property Inspector](interface/property_inspector), click **Add Component...** under **Actions** and select **Image Renderer**.
3. In the **Assets** panel of the bottom dock, right-click an image asset and choose **Apply to SpriteRenderer** (or click the **Texture** box in the inspector to pick an asset).
:::

> [!TIP]
> Right-click a **World** or **User Interface** layer in the **Scene Hierarchy**, hover over **Add Entity** (or **Add UI Element**), and click **Sprite** (or **UI Image**) to create an entity with **Image Renderer** already attached.

## Properties {#properties}

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| Crop Thumbnail | Object | Full image | 52x52 preview box on the left. Click it to open the interactive sprite crop modal. |
| Texture | String | None | The assigned image asset **ID**. |
| Source Rect (X, Y, W, H) | Number | 0, 0, 100, 100 | Pixel rectangle sampled from the source texture (**X**, **Y** offset and **W**, **H** size). |
| Opacity | Number | 100 | Transparency percentage from 0% (invisible) to 100% (opaque). |
| Rendering (Filter Mode) | String | Pixelated | Texture sampling filter: **Pixelated** (nearest-neighbor for pixel art) or **Smooth** (bilinear for high-resolution art). |
| SDF | Boolean | false | Enables Signed Distance Field rendering for sharp edges at any scale. |

Click the 3-dots icon in the **Image Renderer** header to access size and component actions.

| Menu Action | Description |
| --- | --- |
| Reset to Native Size | Resets **Source Rect** to the full texture and resizes the entity's transform width and height to match the image's pixel dimensions. |
| Sync Component | Available on [prefab](components/entities_and_prefabs) instances. Reverts sprite settings to the master prefab. |
| Remove Component | Removes **Image Renderer** from the entity. |

## Usage examples {#usage-examples}

Use the interactive crop modal to slice a single frame or prop from a larger spritesheet.

:::steps
1. Assign a spritesheet texture to your entity's **Image Renderer**.
2. In the **Image Renderer** section of the [Property Inspector](interface/property_inspector), click the 52x52 **Crop Thumbnail**.
3. In the crop modal toolbar, set **Snap** to your tile size (**16px**, **32px**, or **64px**).
4. Drag the crop handles around the desired sprite frame, or nudge the box with the **Arrow Keys**.
5. Press **Enter** or click **Done**. The sprite crops to that region and the entity's transform size updates proportionally.
:::

## Scripting {#scripting}

Use the nodes in [Rendering & Camera](node_library/game_renderer) and [Animation](node_library/game_animation) to modify sprites or animate effects at runtime.

| Node | Description |
| --- | --- |
| [Get Sprite](node_library/game_renderer#node-getSprite) | Reads texture asset, source crop coordinates, opacity, or filter settings from an entity. |
| [Set Sprite](node_library/game_renderer#node-setSprite) | Changes the texture asset, crop rectangle, or opacity at runtime. |
| [Fade To](node_library/game_animation#node-tweenFadeTo) | Smoothly animates the sprite opacity over a duration. |
| [Crop Image](node_library/game_animation#node-tweenCropTo) | Animates the sprite **Source Rect** coordinates over time. |
| [Fill Amount](node_library/game_animation#node-tweenFillAmount) | Crops the sprite from 0% to 100% for health bars, progress bars, and cooldown radial or directional wipes. |

## Common issues {#common-issues}

| Problem | Solution |
| --- | --- |
| **Image Renderer** is locked with **Controlled by Animator** | An active [Sprite Animator](components/sprite_animator) overrides the texture and crop region every frame. Set **Status** to **Disabled** in **Sprite Animator** to edit **Image Renderer** manually. |
| Cannot remove **Image Renderer** | **Sprite Animator** requires **Image Renderer**. Remove **Sprite Animator** first, then remove **Image Renderer**. |
| Pixel art looks blurry when scaled up | Set **Rendering** to **Pixelated** and make sure **SDF** is turned off. |

## Related {#related}

| Page | Use it when |
| --- | --- |
| [Visual Renderers](components/renderers) | You want to compare all four renderer components. |
| [Sprite Animator](components/sprite_animator) | You want to play frame-by-frame spritesheet animations. |
| [Transform & UI Transform](components/transform) | You want to resize, flip, or anchor the sprite. |
| [Dynamic UI & Data Binding](behaviour/ui/dynamic_ui) | You want to drive health bars or UI icons from game data. |
