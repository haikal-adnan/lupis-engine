---
title: "Script Controller"
category: "Components"
description: "Attaches one or more visual scripts to an entity and exposes local script variables in the inspector. Use Script Controller to run gameplay logic and tune values per entity."
---

## Overview {#overview}

The **Script Controller** component binds [visual scripting](visual_scripting/graph_concepts) graphs from the **Scripts** panel to an [entity](components/entities_and_prefabs). A single **Script Controller** can run multiple scripts on the same entity, and any local [variables](visual_scripting/variables_and_collections) defined in those scripts appear directly in the [Property Inspector](interface/property_inspector) so you can customize values per entity instance.

:::features
- **Multi-Script Stack**: Attach multiple modular scripts (such as movement, combat, and health) to one entity.
- **Exposed Variables**: Tune local script variables like speed or jump force directly in the inspector.
- **Instance Overrides**: Override variable values on individual entities and reset to defaults with one click.
- **Quick Graph Launch**: Click **Open Visual Script** to jump straight into the node graph tab.
:::

## Add the component {#add-the-component}

:::steps
1. Select an entity in the [Scene Hierarchy](interface/scene_hierarchy) or [Scene Viewport](interface/scene_viewport).
2. In the [Property Inspector](interface/property_inspector), click **Add Component...** under **Actions** and select **Script Controller**.
3. In the bottom bar, click **Scripts** to open the **Scripts** panel (or click the 3-dots button next to **Attached Scripts** and select **Add Script...**).
4. Right-click a script in the **Scripts** panel and select **Add to [Entity ID]**.
:::

## Properties {#properties}

Select an attached script from the **Attached Scripts** dropdown in the **Script Controller** section to manage its state and variables.

| Property / Control | Type | Default | Description |
| --- | --- | --- | --- |
| Attached Scripts | String | None | Dropdown listing all visual scripts attached to this entity. Active scripts show a checkmark. |
| Script Options (3-dots) | Object | - | Menu next to the dropdown with **Add Script...** (opens the **Scripts** dock) and **Remove Current** (detaches the selected script). |
| Active Status | Boolean | Active | Toggles **Active** or **Inactive** to enable or pause execution of the selected script on this entity. |
| Source (Open Visual Script) | Object | - | Opens the selected script's node graph in a workspace tab. |
| Exposed Local Variables | Any | Script default | Lists every local variable (number, boolean, or string) defined in the script. Edited values highlight in amber and display a reset button. |

> [!TIP]
> Click the amber reset icon next to an overridden script variable to restore its default value from the script's Variable Manager.

## Usage examples {#usage-examples}

Reuse one patrol script across multiple enemies while giving each enemy its own movement speed.

:::steps
1. Open your enemy script in the graph editor and create a local **Number** variable named **MoveSpeed** with a default value of **150**.
2. Attach the script to two enemy entities in your scene via **Script Controller**.
3. Select the second enemy in the [Scene Hierarchy](interface/scene_hierarchy).
4. In the **Script Controller** section of the [Property Inspector](interface/property_inspector), change **MoveSpeed** to **300**. The input highlights in amber, and only that enemy moves faster.
:::

## Scripting {#scripting}

Scripts attached to a **Script Controller** start execution from [Scene & Lifecycle](node_library/game_lifecycle), input, or signal event nodes and read or update variables from [Audio & System](node_library/system_utilities).

| Node | Description |
| --- | --- |
| [On Scene Start](node_library/game_lifecycle#node-eventSceneStart) | Fires once when the scene finishes loading. |
| [On Tick](node_library/game_lifecycle#node-eventTick) | Fires every frame while the entity and script are active. |
| [Get Variable](node_library/system_utilities#node-variableGet) | Reads the value of a local variable (including per-entity inspector overrides) or a global variable. |
| [Set Variable](node_library/system_utilities#node-variableSet) | Updates a local or global variable at runtime. |
| [Emit Signal](node_library/system_utilities#node-actionEmitSignal) | Broadcasts a named event to other scripts in the scene. |
| [On Signal Received](node_library/system_utilities#node-eventOnSignal) | Runs logic when a matching signal is broadcast. |

## Common issues {#common-issues}

| Problem | Solution |
| --- | --- |
| **Add to [Entity]** does not appear when right-clicking a script | Select the target entity in the **Scene Hierarchy** first and make sure it has a **Script Controller** component attached. |
| A variable from my script does not appear in **Script Controller** | Only **Local** variables (Number, Boolean, and String) appear on the entity inspector. **Global** variables are shared across the whole project and are managed in [Variables & Collections](visual_scripting/variables_and_collections). |
| Attached script does not run during preview | Check that both the entity's **Active** button in **Object** and the script's **Active Status** in **Script Controller** are set to **Active**. |

## Related {#related}

| Page | Use it when |
| --- | --- |
| [Graph & Node Concepts](visual_scripting/graph_concepts) | You want to learn how to create scripts and connect execution and data nodes. |
| [Variables & Collections](visual_scripting/variables_and_collections) | You want to create local variables, global variables, lists, and maps. |
| [Custom Node & Code Panel](visual_scripting/custom_node_and_code) | You want to write custom JavaScript inside a visual script. |
| [Overview & Architecture](node_library/overview) | You want to browse all built-in nodes in the Node Library. |
