---
title: "Quick Start"
category: "Getting Started"
description: "Create your first project, place a player and ground in the scene, attach movement logic, and playtest your game in under five minutes."
---

## Overview {#overview}

This guide walks you through building a playable platformer scene from scratch. In a few minutes, you will create a project, add physical entities, wire a movement node, and test your character in the viewport.

:::features
- **Create a Project**: Initialize a new game workspace from the **My Projects** dashboard.
- **Build the Scene**: Place a solid ground floor and an active player entity in the viewport.
- **Wire Movement**: Connect **On Tick** to **Platformer Controller** for instant keyboard controls.
- **Play & Save**: Run the live simulation in the editor and save your project to storage.
:::

## Create a project {#create-a-project}

Start on the **Dashboard** (**My Projects**) to create a new project container.

:::steps
1. On the **My Projects** page, click **New** next to the heading (or click **Create First Project** if your project list is empty).
2. In the **New Project** dialog, enter a **Project Name** such as **My First Game** and an optional **Description**.
3. Click **Create**. The editor opens your new project in the [Editor Overview](interface/editor_overview) workspace.
:::

## Place entities in the scene {#place-entities-in-the-scene}

Next, create a solid floor and a player character using the [Scene Hierarchy](interface/scene_hierarchy), [Scene Viewport](interface/scene_viewport), and [Property Inspector](interface/property_inspector).

:::steps
1. In the **Scene Hierarchy** on the left, add an entity to your world layer and rename it **Ground**.
2. With **Ground** selected, click **Add Component** in the **Property Inspector** and add [Shape Renderer](components/renderers/shape_renderer) and [Multi-Collider](components/multi_collider).
3. In the **Property Inspector**, set **Ground**'s [Transform](components/transform) **Size** to **800 x 40**, position it near the bottom of the camera view, and ensure **Multi-Collider**'s **Type** is set to **Solid (Physics)** so it acts as immovable solid ground.
4. Create a second entity in the **Scene Hierarchy**, rename it **Player**, and position it above **Ground** in the **Scene Viewport**.
5. Add **Shape Renderer** (or [Image Renderer](components/renderers/sprite_renderer)), **Physics Body**, and **Multi-Collider** to **Player**.
6. In **Player**'s **Physics Body**, keep **Motion Mode** set to **Platformer (Side-Scroll)**, and in **Collider**, check **Lock World Rotation (Stay Upright)** so the character stays upright.
:::

## Add movement logic {#add-movement-logic}

Now attach a visual script to **Player** so you can run and jump with the keyboard.

:::steps
1. Select **Player** in the [Scene Hierarchy](interface/scene_hierarchy), click **Add Component** in the [Property Inspector](interface/property_inspector), and choose [Script Controller](components/script_controller).
2. In the **Script Controller** section, create or assign a script and open it in the [Graph & Node Concepts](visual_scripting/graph_concepts) editor at the bottom dock.
3. Right-click the graph canvas, search for [On Tick](node_library/game_lifecycle#node-eventTick), and place it in the graph.
4. Right-click the canvas again, add [Platformer Controller](node_library/helper_tool#node-platformerController), and connect the white execution pin from **On Tick** into **Platformer Controller**.
5. Connect the **deltaTime** output pin of **On Tick** to the **deltaTime** input pin of **Platformer Controller**.
:::

## Play and save {#play-and-save}

Test your scene directly inside the viewport and save your changes to storage.

:::steps
1. Click **Play** in the top bar. **Player** falls onto **Ground**.
2. Press **A** and **D** (or the **Left** and **Right** arrow keys) to move horizontally, and press **W** or **Space** to jump.
3. Click **Stop** in the top bar to return to edit mode, then press **Ctrl + S** to save your project.
:::

:::shortcuts
- `Ctrl` + `S`: Save the project
- `Ctrl` + `Z`: Undo the last action
- `Space` + `Left Click`: Pan the Scene Viewport
- `Scroll`: Zoom the Scene Viewport
:::

> [!TIP]
> Check the status indicator in the top bar: a green dot means your project is synced with storage, while a red dot indicates unsaved changes.

## Related {#related}

| Page | Use it when |
| --- | --- |
| [Platformer Movement](behaviour/movement/platformer) | You want to expand this scene with sprite animations, variable jump, and slope mechanics. |
| [Top-Down Movement](behaviour/movement/top_down) | You want to build an 8-directional top-down adventure instead of a platformer. |
| [Project & Export](getting_started/project_and_export) | You want to configure canvas resolution, auto-save, or export your game. |
| [Shortcuts Reference](interface/shortcuts) | You want the full list of keyboard shortcuts for every editor panel. |
