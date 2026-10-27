---
title: "Scene Hierarchy"
category: "Interface"
description: "Displays every layer and entity in the active scene as an organized tree. Use the Scene Hierarchy to switch scenes, build parent-child groups, and control rendering order."
---

## Overview {#overview}

The **Scene Hierarchy** panel on the left side of the editor lists every layer and entity in your active scene. It separates your scene into **World** layers that move with the camera and **User Interface** layers that stay fixed to the screen.

:::features
- **Scene Switcher**: Create, rename, duplicate, and switch scenes from the top toolbar.
- **World & UI Layers**: Separate camera-space gameplay entities from screen-space user interface (UI) elements.
- **Parent-Child Trees**: Nest entities so children move, rotate, scale, and hide with their parent.
- **Live Filter**: Search entities by **ID** while keeping parent layers and ancestors visible.
:::

## Layout {#layout}

The panel contains the scene toolbar at the top, a real-time search input, and the layer tree below.

| Area / Control | Description |
| --- | --- |
| Select Scene... | Dropdown at the top of the panel that switches the active scene in the [Scene Viewport](interface/scene_viewport). |
| Scene Options (3-dots) | Menu next to the scene selector with **New Scene**, **Rename Scene**, **Duplicate Scene**, **Set as Initial Scene**, and **Delete Scene**. |
| Search... | Filters the hierarchy tree by entity or layer **ID** as you type. Click **X** to clear the search. |
| World | Section for gameplay layers that move, zoom, and rotate with the scene camera. |
| User Interface | Section for HUD and menu layers anchored to the screen. Its section menu includes **Open UI Editor**. |
| Tree Row | Displays the expand arrow, type icon (such as a blue box for a [prefab](components/entities_and_prefabs)), unique **ID**, **Z-Index** badge, and hover buttons for lock and visibility. |

Right-clicking a layer or entity row opens context actions for spawning, organizing, and converting items.

| Context Menu Item | Target | Description |
| --- | --- | --- |
| Add Entity / Add UI Element | Layer row | Spawns an **Empty Entity**, **Sprite**, **Shape**, **Text**, [Tilemap](components/renderers/tilemap), or UI element inside the layer. |
| Add Child / Add Child UI | Entity row | Creates a new entity already parented under the clicked entity. |
| Use as Prefab | Entity row | Saves the entity and its children as a reusable prefab in the **Prefabs** dock. |
| Change Z-Index | Layer row | Updates the layer sorting integer. Layers with higher numbers render in front. |
| Rename Layer / Rename Entity | Layer or entity row | Prompts for a new unique **ID** (or press **F2**). |
| Lock / Visibility Icons | Layer or entity row | Hover over the right side of a row to lock canvas selection or toggle visibility. Locking or hiding a parent also applies to all of its children. |

> [!WARNING]
> **World** entities and **User Interface** elements use different transform components ([Transform & UI Transform](components/transform)). You cannot drag a **World** entity into a **User Interface** layer, or vice versa.

## Common tasks {#common-tasks}

Use the **Scene Options** menu at the top of the panel to add scenes and choose which scene loads first when your game starts.

:::steps
1. At the top of the **Scene Hierarchy**, click the **Scene Options** (3-dots) button next to the scene dropdown.
2. Click **New Scene**, enter a scene name, and click **Create**. The editor switches to the new scene.
3. Click **Scene Options** again and choose **Set as Initial Scene** to make this scene the starting point for your game.
:::

Drag rows in the tree to group children under a parent entity or reorder siblings.

:::steps
1. In the **Scene Hierarchy**, drag the entity you want to attach over the target parent entity.
2. Hover over the middle of the target row until a blue border highlights the row, then release the mouse button. The entity indents under the parent.
3. To reorder siblings instead, hover near the top or bottom edge of a row until a horizontal blue line appears, then release.
4. To unparent a child entity back to the root of the layer, drag it onto the parent layer row and release.
:::

> [!TIP]
> Selecting a parent entity in the **Scene Hierarchy** highlights all of its children in the tree while keeping the parent's properties open in the [Property Inspector](interface/property_inspector).

## Shortcuts {#shortcuts}

Use these shortcuts while working in the **Scene Hierarchy**. For the full list of editor shortcuts, see [Shortcuts Reference](interface/shortcuts).

:::shortcuts
- `Ctrl` + `Left Click`: Add or remove a node from the selection
- `Ctrl` + `C`: Copy the selected entity or layer subtree
- `Ctrl` + `X`: Cut the selected entity or layer subtree
- `Ctrl` + `V`: Paste clipboard entities into the selected layer or parent
- `Ctrl` + `D`: Duplicate the selected entity or layer
- `F2`: Rename the selected entity or layer
- `Delete`: Delete the selected entity and its children
:::

## Related {#related}

| Page | Use it when |
| --- | --- |
| [Entities & Prefabs](components/entities_and_prefabs) | You want to create reusable entity templates and manage prefab instances. |
| [Transform & UI Transform](components/transform) | You want to learn how parent transforms and UI anchors work. |
| [Scene Viewport](interface/scene_viewport) | You want to select and move entities on the canvas. |
| [Property Inspector](interface/property_inspector) | You want to configure layer properties, entity tags, and components. |
