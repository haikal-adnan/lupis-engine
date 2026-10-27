---
title: "Editor Overview"
category: "Interface"
description: "The Lupis Engine workspace brings scene editing, visual scripting, animation, and asset management into one window. Learn where each panel is and how to navigate the workspace."
---

## Overview {#overview}

The editor surrounds the central [Scene Viewport](interface/scene_viewport) with the [Scene Hierarchy](interface/scene_hierarchy) on the left, the [Property Inspector](interface/property_inspector) on the right, and the resource dock at the bottom. Panels resize, collapse, and switch automatically when you open different workspace tabs.

:::features
- **Scene Editing**: Place, move, and inspect entities in real time on the canvas.
- **Visual Logic**: Build gameplay with connected nodes in [visual scripting](visual_scripting/graph_concepts) tabs.
- **Resource Dock**: Manage **Assets**, **Scripts**, **Console** logs (with compact tags and repeat counts), and **Prefabs** in one drawer.
- **Live Preview**: Click **Play** to test your game and push live edits while it runs.
:::

## Layout {#layout}

The workspace is divided into five main areas. When you open a tool tab such as the **Tilemap Editor**, **Shape Editor**, **Animator Editor**, or a script graph, the side panels and bottom dock adapt to that tool.

| Area | Description |
| --- | --- |
| Top Bar | Contains the **Project Menu** on the left, the save status dot, and open workspace tabs across the top. |
| [Scene Hierarchy](interface/scene_hierarchy) | Left panel (**Hierarchy** or **UI Structure**) that organizes scenes, layers, and parent-child entities. |
| [Scene Viewport](interface/scene_viewport) | Center canvas where you arrange entities, paint tiles, draw shapes, or connect script nodes. |
| [Property Inspector](interface/property_inspector) | Right panel (**Inspector**) that edits the selected scene, layer, entity, or script node. |
| Bottom Dock | Collapsible bottom drawer with tabs for **Assets**, **Scripts**, **Console** (with compact tags and repeated log grouping), and **Prefabs** (or **Timeline** when editing animations). |

Click the project name in the top-left corner to open the **Project Menu**. The colored dot next to the project name shows your current save state.

| Control / Indicator | Description |
| --- | --- |
| Green dot | All changes are saved. |
| Red dot | The project has unsaved changes. |
| Yellow pulsing dot | The project is currently loading or saving. |
| Save Project | Saves all scenes, assets, and settings (or press **Ctrl** + **S**). |
| Export Project | Downloads the project as a **.lupisproject** backup archive. See [Project & Export](getting_started/project_and_export). |
| Settings | Opens project settings for resolution, physics, grid snapping, and debug bounds. |
| Back to Dashboard | Closes the editor and returns to the project dashboard. |

> [!TIP]
> Click the currently active tab in the bottom bar (**Assets**, **Scripts**, **Console**, or **Prefabs**) to collapse the bottom dock and give more vertical space to the canvas.

## Common tasks {#common-tasks}

Use the bottom overlay bar in the [Scene Viewport](interface/scene_viewport) to test your game and push changes without restarting from scratch.

:::steps
1. In the bottom overlay bar of the **Scene Viewport**, click **Play**. The game preview opens.
2. Move an entity or edit a component property in the [Property Inspector](interface/property_inspector).
3. In the bottom overlay bar, click **Update**. The running preview refreshes with your latest changes.
4. Click **Ctrl** + **S** or open the **Project Menu** and click **Save Project** to keep your work.
:::

Use the **Assets** panel in the bottom dock to import media files and assign them to entities.

:::steps
1. In the bottom bar, click **Assets** to expand the **Assets** panel.
2. Drag image (**.png**, **.jpg**, **.webp**), font (**.ttf**, **.otf**), or audio (**.ogg**, **.mp3**, **.wav**) files from your computer into the panel, or click **+** to browse.
3. Select a target entity in the [Scene Hierarchy](interface/scene_hierarchy).
4. Right-click the asset in the **Assets** panel and click **Apply to SpriteRenderer**, **Apply to Tilemap**, **Apply to TextRenderer**, or **Apply to Audio Component**.
:::

> [!NOTE]
> Drag the divider edge of the left panel, right panel, or bottom dock to resize it. Click the collapse icon in a side panel header to fold it into a narrow bar.

## Shortcuts {#shortcuts}

These global shortcuts work anywhere in the editor when a text field is not focused. See [Shortcuts Reference](interface/shortcuts) for the complete list.

:::shortcuts
- `Ctrl` + `S`: Save the project
- `Ctrl` + `Z`: Undo the last action
- `Ctrl` + `Y`: Redo the last undone action
- `Ctrl` + `Shift` + `Z`: Redo (alternative)
- `Ctrl` + `F2`: Toggle the mini console in preview
- `Esc`: Clear selection or close an open dialog
:::

## Related {#related}

| Page | Use it when |
| --- | --- |
| [Scene Viewport](interface/scene_viewport) | You want to navigate the canvas, snap to the grid, and transform entities. |
| [Scene Hierarchy](interface/scene_hierarchy) | You want to manage scenes, layers, and parent-child entity trees. |
| [Property Inspector](interface/property_inspector) | You want to edit entity components, tags, and prefab overrides. |
| [Shortcuts Reference](interface/shortcuts) | You want keyboard and mouse shortcuts for every editor tool. |
| [Quick Start](getting_started/quick_start) | You want to create and run your first game scene. |
