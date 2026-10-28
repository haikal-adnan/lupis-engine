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
1. In the **Scene Hierarchy** on the left, locate the **World Layer** row under the **World** section. Right-click on **World Layer**, navigate to the **Add Entity** context menu, and select **Shape** to create a geometric shape entity.
2. Right-click the newly created entity in the hierarchy, select **Rename Entity** (or press **F2**), enter **Ground**, and confirm.
3. With **Ground** selected, check the **Property Inspector** on the right. A **Shape** entity automatically includes [Transform](components/transform) and [Shape Renderer](components/renderers/shape_renderer) components. Scroll down to **Actions**, open the **Add Component** dropdown, and choose **Collider** (to attach [Multi-Collider](components/multi_collider)).
4. In the **Transform & UI Transform** section, set **Ground**'s **Size** to **800 x 40** (width `800` and height `40`), and position it near the bottom of the camera view. In the **Collider** section, ensure **Type** is set to **Solid (Physics)** so it acts as immovable solid ground.
5. Create the player character entity: right-click **World Layer** again, select **Add Entity** > **Shape** (or choose **Sprite** if using an image texture), then rename it to **Player** via right-click > **Rename Entity** (or press **F2**). Position **Player** directly above **Ground** in the [Scene Viewport](interface/scene_viewport).
6. With **Player** selected, open the **Add Component** dropdown in the **Property Inspector** under **Actions** and add [Physics Body](components/physics_body) and [Multi-Collider](components/multi_collider) (**Collider**). In **Player**'s **Physics Body** section, ensure **Motion Mode** is set to **Platformer (Side-Scroll)**, and in the **Collider** section, check **Lock World Rotation (Stay Upright)** so the character stays upright without toppling over upon landing or moving.
:::

## Add movement logic {#add-movement-logic}

Now attach a visual script to **Player** so you can run and jump with the keyboard.

:::steps
1. Select **Player** in the [Scene Hierarchy](interface/scene_hierarchy). In the **Actions** section of the [Property Inspector](interface/property_inspector), open the **Add Component** dropdown and select [Script Controller](components/script_controller).
2. In the bottom dock, open the **Scripts** tab. Click the **+** button (or *Create New Component*), name the script **PlayerMovement**, and click **Create**.
3. In the **Scripts** panel, right-click the newly created `PlayerMovement` script and select **Add to Player** (or assign it via the **Attached Scripts** dropdown in the Property Inspector).
4. Double-click the `PlayerMovement` script in the Scripts panel (or click **Source / Open Graph** in the Script Controller inspector section) to open the visual scripting canvas in [Graph & Node Concepts](visual_scripting/graph_concepts).
5. Right-click an empty area on the graph canvas (or search from the Node Library sidebar on the left), find [On Tick](node_library/game_lifecycle#node-eventTick), and place it in the graph.
6. Right-click the canvas again, add [Platformer Controller](node_library/helper_tool#node-platformerController), then connect the white execution pin from **On Tick** to the execution input pin of **Platformer Controller**. Finally, connect the numeric **deltaTime** output pin of **On Tick** to the **deltaTime** input pin of **Platformer Controller**.
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
