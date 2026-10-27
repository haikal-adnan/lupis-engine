---
title: "Shape Renderer"
category: "Visual Renderers"
description: "Draws custom vector polygons, line segments, and circles with fills, outlines, and optional geometry collision. Use Shape Renderer for platforms, barriers, zones, and vector UI."
---

## Overview {#overview}

The **Shape Renderer** component draws vector geometry directly in the engine without requiring an external image asset. It includes a dedicated **Shape Editor** workspace where you place vertices, connect segments, draw closed polygons or circles, and optionally enable solid physics collision directly on the drawn geometry.

:::features
- **Vector Tools**: Draw points, line segments, closed polygons, and circles in the **Shape Editor**.
- **Fill & Outline**: Customize interior fill color, stroke width, and independent opacity values.
- **Built-in Physics**: Turn on **Polygon Physics**, **Segment Physics**, or **Circle Physics** for sloped terrain and walls.
- **Scene Overlay**: Dim or hide the rest of the scene while editing vertices for precise tracing.
:::

## Add the component {#add-the-component}

:::steps
1. Select an entity in the [Scene Hierarchy](interface/scene_hierarchy) or [Scene Viewport](interface/scene_viewport).
2. In the [Property Inspector](interface/property_inspector), click **Add Component...** under **Actions** and select **Shape Renderer**.
3. Click **Open Shape Editor** in the **Shape Renderer** section to open the interactive drawing tab.
:::

> [!TIP]
> Right-click a layer in the **Scene Hierarchy**, hover over **Add Entity** (or **Add UI Element**), and click **Shape** (or **UI Shape**) to create a shape entity in one step.

## Properties {#properties}

Configure colors, stroke thickness, and physics collision in the **Shape Renderer** section of the [Property Inspector](interface/property_inspector).

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| Fill (Checkbox) | Boolean | true | Enables or disables the interior fill of closed polygons and circles. |
| Fill Color | String | #ff1e00 | Hex color for the interior fill. |
| Fill Opacity | Number | 100 | Interior fill transparency from 0% to 100%. |
| Outline Width | Number | 0 | Stroke thickness in pixels for polygon edges, segments, and circles. |
| Outline Color | String | #0066FF | Hex color for the outline stroke. |
| Outline Opacity | Number | 100 | Outline stroke transparency from 0% to 100%. |
| Open Shape Editor | Object | - | Opens the **Shape Editor** tab to draw and move vertices. |
| Polygon Physics | Boolean | false | Enables solid physics collision on closed polygons. |
| Segment Physics | Boolean | false | Enables solid edge collision along drawn line segments and polylines. |
| Circle Physics | Boolean | false | Enables solid radial collision on drawn circles. |

When you click **Open Shape Editor**, the right panel switches to **Custom Shape Inspector** with drawing tools and scene visibility controls.

| Shape Tool | Shortcut | Description |
| --- | --- | --- |
| Pan Tool | **Space** | Pans the canvas camera. |
| Select / Move | **V** | Selects and drags existing vertices. |
| Delete Point | **E** | Deletes any vertex you click. |
| Point Tool | **P** | Places standalone vertices. |
| Segment Tool | **S** | Draws connected multi-point line segments. Press **Enter** to finish. |
| Line Tool | **L** | Draws a single two-point line. |
| Polygon Tool | **G** | Draws a closed polygon shape. Press **Enter** to close and commit. |
| Circle Tool | **C** | Draws a circle by dragging its radius. |

## Usage examples {#usage-examples}

Use **Shape Renderer** with **Polygon Physics** or **Segment Physics** to create sloped hills and custom terrain.

:::steps
1. Create a **Shape** entity in a **World** layer and click **Open Shape Editor** in the [Property Inspector](interface/property_inspector).
2. Press **G** to select the **Polygon Tool** (or **S** for the **Segment Tool**).
3. Click on the canvas to place vertices along your desired slope, then press **Enter** to commit the shape.
4. Press **V** and drag any vertex to fine-tune the incline.
5. Close the **Shape Editor** tab, return to the **Property Inspector**, and check **Polygon Physics** (or **Segment Physics**).
:::

## Scripting {#scripting}

Use the nodes in [Rendering & Camera](node_library/game_renderer) and [Animation](node_library/game_animation) to read or update shape appearance at runtime.

| Node | Description |
| --- | --- |
| [Get Shape](node_library/game_renderer#node-getShape) | Reads fill color, outline color, outline width, or opacity from a **Shape Renderer**. |
| [Set Shape](node_library/game_renderer#node-setShape) | Updates fill color, outline color, outline width, or opacity at runtime. |
| [Fade To](node_library/game_animation#node-tweenFadeTo) | Smoothly animates the shape's opacity over a duration. |

## Common issues {#common-issues}

| Problem | Solution |
| --- | --- |
| Line segments are invisible in the viewport | Line segments have no interior fill. Set **Outline Width** to **1** or higher so the stroke is visible. |
| **Open Shape Editor** button is disabled | The entity is a linked [prefab](components/entities_and_prefabs) instance. Edit the master prefab from the **Prefabs** dock or unpack the prefab first. |
| Player passes through a drawn polygon or slope | Check **Polygon Physics**, **Segment Physics**, or **Circle Physics** at the bottom of the **Shape Renderer** section, and make sure the player has a [Physics Body](components/physics_body) and [Multi-Collider](components/multi_collider). |

## Related {#related}

| Page | Use it when |
| --- | --- |
| [Visual Renderers](components/renderers) | You want to compare all four renderer components. |
| [Physics & Slopes](behaviour/physics_and_collision/physics_and_slopes) | You want to configure character movement across sloped shapes. |
| [Shortcuts Reference](interface/shortcuts) | You want a quick list of all **Shape Editor** keyboard shortcuts. |
