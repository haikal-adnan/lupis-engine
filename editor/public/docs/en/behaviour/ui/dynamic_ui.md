---
title: "Dynamic UI & Data Binding"
category: "User Interface"
description: "Bind live variables to HUD text, animate fill bars, and spawn data-bound inventory grids."
---

## Overview {#overview}

Dynamic UI and data binding keep HUD labels, health bars, and inventory grids synchronized with live gameplay variables and collections.

:::features
- **Live Text Interpolation**: Bind component variables or global state tokens directly into text labels without manual string concatenation.
- **Animated Fill Bars**: Smoothly tween health, mana, and experience bars across horizontal or vertical fill directions.
- **Prefab Grid Spawning**: Instantiate rows and columns of item slots from a prefab and bind each slot's child elements to an array of data.
:::

## Requirements {#requirements}

Set up the following components and assets before binding gameplay data to your HUD or inventory screen.

| Requirement | Target entity | Purpose |
| --- | --- | --- |
| [Text Renderer](components/renderers/text_renderer) | HUD Labels & Slot Captions | Displays formatted strings, score counters, and interpolated variable tokens. |
| [Sprite Renderer](components/renderers/sprite_renderer) | Health Bars & Item Icons | Renders cropped fill bars and dynamically swapped item textures inside spawned UI slots. |
| [Variables & Collections](visual_scripting/variables_and_collections) | Logic Graph or Global State | Stores player stats, scores, and inventory item maps read by UI binding nodes. |
| [Entities & Prefabs](components/entities_and_prefabs) | Slot Prefab | Provides the reusable UI slot prefab instantiated by [UI Grid Spawner](node_library/helper_tool#node-uiGridSpawner). |

## Setup {#setup}

Follow these steps to bind a live text counter, animate a health bar, and populate a data-driven inventory grid.

:::steps
1. Select your HUD label entity, inspect its [Text Renderer](components/renderers/text_renderer) component in the [Property Inspector](interface/property_inspector), set **Bind Variable** to your score variable, and set **Bind Format** to **Score: {value}**.
2. To format multiple variables in a graph, pass a template string such as **HP: {hp}/{maxHp}** into [Format String](node_library/system_utilities#node-stringFormat) and connect **Result** to [Set Text](node_library/game_renderer#node-setText).
3. Create a health bar entity with a [Sprite Renderer](components/renderers/sprite_renderer) component placed over a background frame sprite on your UI layer.
4. When the player's health changes, divide current health by max health, multiply by **100**, and pass the percentage into [Fill Amount](node_library/game_animation#node-tweenFillAmount) targeting the health bar sprite.
5. To build an inventory grid, design a single slot entity with child entities named **Icon** (**Sprite Renderer**) and **Count** (**Text Renderer**), then save the slot as a reusable [Prefab](components/entities_and_prefabs).
6. In your UI graph, wire [UI Grid Spawner](node_library/helper_tool#node-uiGridSpawner), set **Prefab Name** to your slot prefab, and connect your inventory list to **Data List**.
7. Connect **On Spawn Item** from **UI Grid Spawner** to [UI Prefab Data Binder](node_library/helper_tool#node-uiPrefabBinder), linking **Spawned Entity**, **Item Data**, and **Item Index** so each slot populates its own icon and count.
:::

## Settings {#settings}

Configure these parameters on [Fill Amount](node_library/game_animation#node-tweenFillAmount), [UI Grid Spawner](node_library/helper_tool#node-uiGridSpawner), and [UI Prefab Data Binder](node_library/helper_tool#node-uiPrefabBinder) to control layout and binding.

| Setting | Recommended value | Effect |
| --- | --- | --- |
| **Fill %** | 0 to 100 | Target visible percentage of the sprite cropped along the chosen **Direction** (**left_to_right**, **right_to_left**, **top_to_bottom**, or **bottom_to_top**). |
| **Duration (Fill Amount)** | 0.25 | Time in seconds used to smoothly animate the bar from its previous fill percentage to the new value. |
| **Total Count & Columns** | 15 / 5 | Determines the total number of grid cells spawned and how many cells fit in each horizontal row before wrapping. |
| **Spacing X & Spacing Y** | 120 / 120 | Horizontal and vertical pixel distance between the centers of adjacent spawned grid cells. |
| **Bindings (Data Binder)** | Child-to-property map | Maps each child entity name (or **$self**) to a target property (**text**, **sprite**, **color**, **alpha**, **visible**) and data key. |

## Variations {#variations}

Extend dynamic UI binding for modular HUD overlays, conditional slot highlighting, and batch property updates.

| Variation | Configuration |
| --- | --- |
| **Reusable HUD Layer Injection** | Design your HUD or pause menu in a dedicated UI scene and load it into any gameplay level at runtime with [Inject Layer](node_library/game_lifecycle#node-injectLayer). |
| **Formatted Timers & Currency** | Use [String Format](node_library/system_utilities#node-stringFormat) with **{0}** and **{1}** placeholders to assemble multi-part strings before calling [Set Text](node_library/game_renderer#node-setText). |
| **Batch Theme or Opacity Updates** | Pass the **Spawned Entities** array from [UI Grid Spawner](node_library/helper_tool#node-uiGridSpawner) into [Batch Set Properties](node_library/game_renderer#node-batchSet) to fade or tint every grid slot at once. |

## Common issues {#common-issues}

| Problem | Solution |
| --- | --- |
| [Fill Amount](node_library/game_animation#node-tweenFillAmount) stretches or shifts the bar instead of cropping it | Ensure the target entity uses a [Sprite Renderer](components/renderers/sprite_renderer) component with a loaded texture rather than a basic [Shape Renderer](components/renderers/shape_renderer). |
| [UI Prefab Data Binder](node_library/helper_tool#node-uiPrefabBinder) outputs a bound count of zero | Verify that the child entity names in the **Bindings** map match the exact child names inside the spawned prefab hierarchy. |
| Spawned grid items appear behind the inventory background panel | Set **Layer ID** on [UI Grid Spawner](node_library/helper_tool#node-uiGridSpawner) to your UI layer or assign the panel container as **Parent Entity**. |
| [Format String](node_library/system_utilities#node-stringFormat) leaves **{token}** unchanged in the text | Confirm that the variable name inside the curly braces exists in either the connected **Custom Map** input, port inputs, or global state. |

## Related {#related}

| Page | Use it when |
| --- | --- |
| [Interactive Widgets](behaviour/ui/interactive_widgets) | Add click, hover, slider, and toggle interactions to your spawned or static UI elements. |
| [Text Renderer](components/renderers/text_renderer) | Review inspector properties for font styling and built-in variable binding. |
| [Variables & Collections](visual_scripting/variables_and_collections) | Construct the lists and maps passed into UI Grid Spawner and UI Prefab Data Binder. |
| [Helper Tool Nodes](node_library/helper_tool) | Check port details for Interpolate Variables, UI Grid Spawner, and UI Prefab Data Binder. |
