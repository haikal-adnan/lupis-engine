---
title: "Introduction"
category: "Getting Started"
description: "Lupis Engine is an open-source 2D game engine and visual studio for building platformers, top-down RPGs, and visual novels."
---

## Overview {#overview}

**Lupis Engine** combines a visual scene editor, a modular component system, and node-based visual scripting in a single workspace. You can design levels, wire gameplay logic without writing code, and test your game with one click.

## Key concepts {#key-concepts}

Every game in Lupis Engine is built from four core building blocks that work together in real time.

:::features
- **Scenes & Layers**: Organize levels into camera-tracked world layers and screen-fixed user interface (UI) layers.
- **Entities & Components**: Build characters, props, and tilemaps by attaching modular visual, physics, and audio components.
- **Visual Scripting**: Create gameplay mechanics by connecting event, action, and helper nodes on an interactive graph.
- **Instant Preview & Export**: Playtest changes immediately in the viewport and package finished games for web or desktop.
:::

| Concept | Where you edit it | What it does |
| --- | --- | --- |
| **Scene & Layer** | [Scene Hierarchy](interface/scene_hierarchy) | Groups entities into ordered rendering planes for gameplay worlds and heads-up display (HUD) overlays. |
| **Entity & Prefab** | [Entities & Prefabs](components/entities_and_prefabs) | Represents any object in your game; a **prefab** saves a configured entity as a reusable template. |
| **Component** | [Property Inspector](interface/property_inspector) | Adds specific capabilities to an entity, such as [Visual Renderers](components/renderers), [Physics Body](components/physics_body), or [Multi-Collider](components/multi_collider). |
| **Blueprint Graph** | [Graph & Node Concepts](visual_scripting/graph_concepts) | Defines how entities react to input, collisions, timers, and game state using connected nodes. |

## How it works {#how-it-works}

You build a game by assembling entities in a scene, attaching components for appearance and physics, and wiring node graphs for behavior.

:::steps
1. Open Lupis Engine in your browser or launch the desktop app (see [Installation & Setup](getting_started/installation)).
2. Create a project on the **My Projects** dashboard to open the [Editor Overview](interface/editor_overview) workspace.
3. Add entities in the **Scene Hierarchy** and arrange them in the [Scene Viewport](interface/scene_viewport).
4. Select an entity and click **Add Component** in the **Property Inspector** to attach sprites, colliders, or animations.
5. Attach a [Script Controller](components/script_controller) and connect nodes from the [Node Library](node_library/overview) to control movement, combat, or UI.
6. Click **Play** in the top bar to test your game live, then package it in [Project & Export](getting_started/project_and_export).
:::

## Example {#example}

Lupis Engine includes high-level gameplay nodes tailored for common 2D genres so you can prototype complete mechanics in minutes.

| Genre | Core mechanics | Where to start |
| --- | --- | --- |
| **2D Platformer** | Gravity, variable jumping, wall sliding, sloped terrain, and melee combos. | [Platformer Movement](behaviour/movement/platformer) |
| **Top-Down RPG** | 8-way normalized movement, directional animations, tilemaps, and area triggers. | [Top-Down Movement](behaviour/movement/top_down) |
| **Visual Novel & Interactive UI** | Typewriter dialogue, branching choice menus, audio sliders, and data-bound HUDs. | [Dynamic UI & Data Binding](behaviour/ui/dynamic_ui) |

> [!TIP]
> If you are new to Lupis Engine, follow [Quick Start](getting_started/quick_start) to build and playtest your first interactive scene.

## Related {#related}

| Page | Use it when |
| --- | --- |
| [Installation & Setup](getting_started/installation) | You want to run Lupis Engine on the web, download the executable, or start a local server. |
| [Quick Start](getting_started/quick_start) | You want to create a project and move a player entity in under five minutes. |
| [Editor Overview](interface/editor_overview) | You want a tour of the panels, toolbars, and docks inside the workspace. |
| [Project & Export](getting_started/project_and_export) | You want to save backups or export your game as a web bundle or Windows executable. |
