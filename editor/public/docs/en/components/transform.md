---
title: "Transform & UI Transform"
category: "Components"
description: "Controls where an entity is placed, how big it is, and how it rotates. World entities use **Transform**, while user interface entities use **UI Transform** with screen anchors."
---

## Overview {#overview}

Every entity automatically includes a transform component beneath **Object** in the [Property Inspector](interface/property_inspector). Entities in **World** layers use **Transform** for camera-space coordinates, while entities in **User Interface** layers use **UI Transform**, which adds a 3x3 **Anchor** grid to pin elements to the screen or parent container.

:::features
- **Position & Size**: Place entities in pixels and set width and height with optional aspect ratio locking.
- **Pivot Matrix**: Choose the 3x3 origin point that the entity rotates, scales, and flips around.
- **UI Anchors**: Pin user interface (UI) elements to any corner, edge, or center of their container.
- **Parent Inheritance**: Child entities inherit position, rotation, and scale from their parent in the [Scene Hierarchy](interface/scene_hierarchy).
:::

## Properties {#properties}

Both **Transform** and **UI Transform** share core spatial properties. **UI Transform** adds the **Anchor** grid and treats **Position** as an offset from that anchor.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| Position / Position (Offset) | Vector2 | 0, 0 | Local **X** and **Y** coordinates in pixels. Relative to the parent entity, or relative to the **Anchor** on UI entities. |
| Anchor (UI Transform only) | Vector2 | 0.5, 0.5 | 3x3 grid pinning the UI element to the top-left (0, 0), center (0.5, 0.5), bottom-right (1, 1), or any edge of its container. |
| Rotation | Number | 0 | Local rotation angle in degrees (0 to 359). Displays **World Rot** below when the entity has a parent. |
| Pivot | Vector2 | 0.5, 0.5 | 3x3 origin grid for rotation, scaling, and flipping. Changing the pivot compensates **X** and **Y** so the entity does not jump on the canvas. |
| Size (px) | Vector2 | 100, 100 | Pixel width (**W**) and height (**H**) of the entity (defaults to 160, 40 on UI entities). Click the lock icon to keep the aspect ratio proportional. |
| Scale | Vector2 | 1, 1 | Horizontal (**X**) and vertical (**Y**) scale multipliers. The lock icon is enabled by default for uniform scaling. |
| Flip | Boolean | false | Toggle **Horz** or **Vert** to mirror the entity across its pivot axis. |

Click the 3-dots icon in the **Transform** or **UI Transform** header for quick alignment and reset actions.

| Menu Action | Description |
| --- | --- |
| Sync Transform | Available on [prefab](components/entities_and_prefabs) instances. Reverts size, rotation, scale, pivot, and flip to the master prefab while keeping the scene **X** and **Y** position. |
| Reset Values / Reset Position | Resets position, rotation, scale, pivot, and flip back to their defaults. |
| Center Anchors (UI only) | Sets the **Anchor** to center (0.5, 0.5) and resets the **Position (Offset)** to 0, 0. |
| Fit All Child to Me | Available when the entity has children. Resizes the parent's width, height, and pivot to tightly wrap all child entities. |

> [!TIP]
> Hold **Shift** while dragging a resize handle in the [Scene Viewport](interface/scene_viewport) to lock the aspect ratio temporarily.

## Usage examples {#usage-examples}

Use the **Anchor** grid on **UI Transform** to keep HUD elements pinned to screen edges when the game window resizes.

:::steps
1. In the [Scene Hierarchy](interface/scene_hierarchy), right-click a layer under **User Interface**, hover over **Add UI Element**, and click **UI Image**.
2. In the [Property Inspector](interface/property_inspector), locate the **UI Transform** section.
3. Click the top-left dot in the 3x3 **Anchor** grid (0, 0) and set **Pivot** to top-left (0, 0).
4. Set **Position (Offset)** to **X: 20** and **Y: 20**. The element stays 20 pixels from the top-left corner at any screen resolution.
:::

Use **Fit All Child to Me** when grouping several sprites or UI widgets inside an empty container entity.

:::steps
1. Create an **Empty Entity** and drag multiple child entities into it in the **Scene Hierarchy**.
2. Select the parent container entity.
3. In the **Transform** (or **UI Transform**) header, click the 3-dots icon and select **Fit All Child to Me**. The parent bounding box resizes around all of its children.
:::

## Scripting {#scripting}

Use the nodes in [Entity & Transform](node_library/game_entity) and [Animation](node_library/game_animation) to read, set, or animate transform values at runtime.

| Node | Description |
| --- | --- |
| [Get Transform](node_library/game_entity#node-getTransform) | Reads position, rotation, scale, size, flip, or **Z-Index** from an entity. |
| [Set Transform](node_library/game_entity#node-setTransform) | Updates position, rotation, scale, size, flip, or **Z-Index** on an entity. |
| [Move To](node_library/game_animation#node-tweenMoveTo) | Smoothly animates an entity's position to target X and Y coordinates over time. |
| [Scale To](node_library/game_animation#node-tweenScaleTo) | Smoothly animates an entity's scale over a duration. |
| [Rotate To](node_library/game_animation#node-tweenRotateTo) | Smoothly animates an entity's rotation angle in degrees. |
| [Resize To](node_library/game_animation#node-tweenResizeTo) | Smoothly animates an entity's width and height. |

## Common issues {#common-issues}

| Problem | Solution |
| --- | --- |
| **Size (px)** height or width inputs are disabled | When a [Text Renderer](components/renderers/text_renderer) has **Auto Line** enabled, it controls the height automatically. When a [Tilemap](components/renderers/tilemap) is attached, the tilemap grid controls both width and height. |
| Entity rotates around its corner instead of its center | Check the 3x3 **Pivot** grid in **Transform** and click the center dot (0.5, 0.5). |
| Child entity appears at an unexpected angle or size | A child entity multiplies its local rotation and scale by its parent's transform. Check the amber **World Rot** and **World Scale** readouts beneath the inputs. |

## Related {#related}

| Page | Use it when |
| --- | --- |
| [Entities & Prefabs](components/entities_and_prefabs) | You want to group entities or save them as reusable prefabs. |
| [Scene Viewport](interface/scene_viewport) | You want to move, resize, and rotate entities with the canvas gizmo. |
| [Multi-Collider](components/multi_collider) | You want collision shapes that automatically match an entity's transform. |
| [Interactive Widgets](behaviour/ui/interactive_widgets) | You want to build anchored UI buttons, sliders, and toggles. |
