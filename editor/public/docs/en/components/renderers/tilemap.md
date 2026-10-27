---
title: "Tilemap"
category: "Visual Renderers"
description: "Paints grid-based 2D levels using a tileset image and optional solid collision. Use Tilemap to build platformer stages, top-down maps, walls, and floors."
---

## Overview {#overview}

The **Tilemap** component lets you paint 2D worlds onto a grid from a single tileset image. It is available on **World** entities and includes a dedicated **Tilemap Editor** tab with brush, eraser, flood-fill, eyedropper, and marquee selection tools, plus one-click solid collision for all painted tiles.

:::features
- **Tile Palette**: Select single tiles or drag across multiple tiles to paint full stamps at once.
- **Painting Tools**: Paint with the **Brush**, erase, flood fill with the **Bucket**, or pick tiles with the **Picker**.
- **Solid Collision**: Check **Solid** to turn painted tiles into physical walls and floors automatically.
- **Auto-Fit Bounds**: Automatically resizes the entity's transform bounds to match the painted tile area.
:::

## Add the component {#add-the-component}

:::steps
1. Select an entity inside a **World** layer in the [Scene Hierarchy](interface/scene_hierarchy).
2. In the [Property Inspector](interface/property_inspector), click **Add Component...** under **Actions** and select **Tilemap**.
3. In the **Assets** panel of the bottom dock, right-click a tileset image and choose **Apply to Tilemap**.
4. In the **Tilemap** section of the inspector, click **Open Editor** to launch the **Tilemap Editor** tab.
:::

> [!TIP]
> Right-click a **World** layer in the **Scene Hierarchy**, hover over **Add Entity**, and click **Tilemap** to create a tilemap entity in one step.

## Properties {#properties}

Configure rendering and collision in the **Tilemap** section of the [Property Inspector](interface/property_inspector).

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| Source (Open Editor) | Object | - | Displays the tileset thumbnail and the **Open Editor** button. |
| Opacity | Number | 100 | Transparency percentage of the tilemap from 0% to 100%. |
| Rendering | String | Pixelated | Texture filter mode: **Pixelated** for crisp pixel art or **Smooth** for high-resolution tiles. |
| Collision (Solid) | Boolean | false | When checked, all painted tiles block entities with a [Physics Body](components/physics_body) and solid [Multi-Collider](components/multi_collider). |

When you click **Open Editor**, the right panel switches to the **Tilemap Editor** with **Tile Tool**, **Tilemap Settings**, and **Tile Palette**.

| Editor Control / Tool | Shortcut | Description |
| --- | --- | --- |
| Pan Tool | **Space** | Pans the tilemap canvas. |
| Select / Move | **V** | Box-selects painted tiles so you can move or delete them (or hold **Ctrl** while using the brush). |
| Brush | **B** | Paints the selected tile or multi-tile stamp onto the grid. |
| Eraser | **E** | Erases painted tiles under the pointer. |
| Bucket Fill | **G** | Flood fills a bounded empty area or contiguous matching tiles. |
| Picker | **I** | Samples the tile under the pointer as your active brush. |
| Tile Size (Px) | - | Sets the cell width (**W**) and height (**H**) in pixels (default 16x16). Must be set before painting tiles. |
| Clear Tilemap Data | - | Deletes all painted tiles from the tilemap after confirmation. |

## Usage examples {#usage-examples}

Build a solid ground layer and a decorative background layer by using two separate **Tilemap** entities.

:::steps
1. Right-click your **World** layer in the [Scene Hierarchy](interface/scene_hierarchy), hover over **Add Entity**, and click **Tilemap**. Rename its **ID** to **Tilemap_Ground**.
2. Assign your tileset image and click **Open Editor** in the [Property Inspector](interface/property_inspector).
3. In **Tilemap Settings**, set **Tile Size (Px)** (**W** and **H**) to match your tileset grid (such as **16** or **32**).
4. In **Tile Palette**, click a tile (or drag across several tiles), press **B**, and paint your platforms on the canvas.
5. Close the **Tilemap Editor** tab and check **Solid** under **Collision** in the **Tilemap** section.
6. Create a second **Tilemap** entity with a lower **Z-Index** and leave **Solid** unchecked for background decorations.
:::

## Scripting {#scripting}

Use the nodes in [Rendering & Camera](node_library/game_renderer) and [Physics & Collision](node_library/game_physics) to query or update tilemaps at runtime.

| Node | Description |
| --- | --- |
| [Get Tilemap](node_library/game_renderer#node-getTilemap) | Reads the tileset asset, tile dimensions, **Solid** collision state, or opacity. |
| [Set Tilemap](node_library/game_renderer#node-setTilemap) | Changes the tileset asset, **Solid** collision state, or opacity at runtime. |
| [Solid Collision](node_library/game_physics#node-solidCollision) | Checks whether an entity collides with solid objects or solid tilemaps. |

## Common issues {#common-issues}

| Problem | Solution |
| --- | --- |
| **Tile Size (Px)** inputs (**W** and **H**) are disabled | You cannot change the cell size while tiles are already painted on the grid. Click **Clear Tilemap Data** in **Tilemap Settings** first, then set **Tile Size (Px)**. |
| **Tilemap** is not listed in **Add Component...** | **Tilemap** is only available on entities in **World** layers. It cannot be added to **User Interface** entities. |
| Tiles have thin seams or blurry edges | Set **Rendering** to **Pixelated** in the **Tilemap** inspector. |

## Related {#related}

| Page | Use it when |
| --- | --- |
| [Visual Renderers](components/renderers) | You want to compare all four renderer components. |
| [Physics Body](components/physics_body) | You want characters to walk and land on solid tilemaps. |
| [Physics & Slopes](behaviour/physics_and_collision/physics_and_slopes) | You want characters to walk smoothly up and down angled tilemap terrain. |
