---
title: "Scene Viewport"
category: "Interface"
description: "The interactive canvas where you place, move, rotate, and resize entities in real time. Use the Scene Viewport to arrange scenes, snap layouts to the grid, and launch game previews."
---

## Overview {#overview}

The **Scene Viewport** sits in the center of the [Editor Overview](interface/editor_overview) and renders your active scene in real time. You can select entities on the canvas, transform them with visual handles, and preview your game from the bottom overlay toolbar.

:::features
- **Transform Gizmo**: Move, resize, and rotate selected entities directly on the canvas.
- **Grid & Snapping**: Align entities to pixel grids and smart guides for clean layouts.
- **Quick Spawning**: Right-click anywhere on the canvas to create or paste entities at the cursor.
- **Instant Preview**: Click **Play** or **Update** in the bottom bar to test changes live.
:::

## Layout {#layout}

The viewport includes the interactive canvas and a floating toolbar at the bottom center.

| Area / Control | Description |
| --- | --- |
| Canvas | Renders visible **World** and **User Interface** layers, selection boxes, and collider wireframes. |
| Transform Gizmo | Bounding box around the selected entity. Drag inside to move, drag edge or corner handles to resize, or drag the rotation handle to rotate. |
| X / Y Coordinates | Displays the live pointer coordinates in world pixels on the left side of the bottom overlay bar. |
| Snap On / Snap Off | Magnet button in the bottom overlay bar that toggles grid and smart-guide snapping. |
| Toggle Grid | Grid button in the bottom overlay bar that shows or hides the alignment grid. |
| Play / Update | Launches the game preview, or updates a running preview with your latest scene edits. |

Right-clicking on the canvas opens a context menu. The available actions depend on whether you right-click empty space or a selected entity.

| Context Menu Item | Target | Description |
| --- | --- | --- |
| Create Entity | Empty canvas | Spawns an **Empty Entity**, **Sprite**, **Shape**, **Text**, [Tilemap](components/renderers/tilemap), or user interface (UI) element at the cursor position. |
| Paste Here | Empty canvas | Pastes copied entities centered at the clicked coordinates. |
| Copy / Cut / Duplicate | Selected entity | Copies, cuts, or clones the selected entity. |
| Bring to Front / Send to Back | Selected entity | Increases or decreases the entity **Z-Index** by 1 within its layer. |
| Use as Prefab | Selected entity | Saves the entity and its children as a reusable [prefab](components/entities_and_prefabs). |
| Lock | Selected entity | Prevents accidental selection or movement on the canvas. |
| Hidden Entity | Selected entity | Hides or shows the entity in the viewport. |
| Inactive Entity | Selected entity | Enables or disables the entity at runtime. |
| Delete | Selected entity | Removes the selected entity and its children from the scene. |

> [!TIP]
> Press **Esc** to clear your selection, then use **Quick Actions** in the [Property Inspector](interface/property_inspector) to toggle camera bounds, UI borders, and collider wireframes.

## Common tasks {#common-tasks}

You can create new entities directly at any world coordinate from the canvas context menu.

:::steps
1. Hold **Space** and drag with the left mouse button to pan the **Scene Viewport** to your target area.
2. Right-click on empty canvas space.
3. Hover over **Create Entity**, select a target layer, and click **Sprite**, **Shape**, **Text**, or **Tilemap**. The new entity spawns at the clicked position.
:::

Use the transform gizmo and grid snapping to position and resize entities.

:::steps
1. In the bottom overlay bar, click the magnet button to turn **Snap On**.
2. Click an entity on the canvas to select it and show its transform gizmo.
3. Drag inside the selection box to move the entity along the grid. Hold **Ctrl** while dragging to temporarily ignore snapping.
4. Drag a corner handle while holding **Shift** to resize the entity with a locked aspect ratio.
:::

> [!NOTE]
> Clicking a child entity on the canvas selects its root parent by default. Hold **Ctrl** and click the child entity to select it directly.

## Shortcuts {#shortcuts}

Use these mouse and keyboard shortcuts in the **Scene Viewport** and UI editor. For **Tilemap Editor** and **Shape Editor** shortcuts, see [Shortcuts Reference](interface/shortcuts).

:::shortcuts
- `Space` + `Left Click`: Pan the viewport camera (hold **Space** and drag)
- `Scroll`: Zoom in or out toward the pointer
- `Ctrl` + `Scroll`: Fast zoom at 2x speed
- `Shift` + `Scroll`: Scroll the camera vertically
- `Alt` + `Scroll`: Scroll the camera horizontally
- `Left Click`: Select entity (or drag on empty space to box-select)
- `Ctrl` + `Left Click`: Select a nested child entity directly
- `Shift` + `Left Click`: Add or remove an entity from the selection
- `Shift`: Lock aspect ratio while dragging a resize handle
- `Ctrl`: Invert grid snapping while moving or resizing
- `Ctrl` + `D`: Duplicate the selected entity
- `Delete`: Delete the selected entity
:::

## Related {#related}

| Page | Use it when |
| --- | --- |
| [Editor Overview](interface/editor_overview) | You want to learn how the viewport connects with other editor panels. |
| [Scene Hierarchy](interface/scene_hierarchy) | You want to manage layers, scene switching, and parent-child trees. |
| [Property Inspector](interface/property_inspector) | You want to enter exact transform numbers or toggle debug bounds. |
| [Transform & UI Transform](components/transform) | You want to configure position, pivot, scale, and UI anchors. |
| [Shortcuts Reference](interface/shortcuts) | You want shortcuts for the Tilemap Editor, Shape Editor, and Graph Editor. |
