---
title: "Entities & Prefabs"
category: "Components"
description: "Every item in a scene is an entity configured through modular components. A prefab saves an entity and its children as a reusable template across scenes."
---

## Overview {#overview}

An **entity** is a building block in your scene, such as a player, enemy, tilemap, or user interface (UI) button. Every entity has an **Object** identity section and a [Transform & UI Transform](components/transform) component, and you attach extra components in the [Property Inspector](interface/property_inspector) to give it visuals, physics, audio, or logic.

A **prefab** is a reusable entity template stored in the **Prefabs** panel of the bottom dock. When you update a master prefab, all synced instances in your scenes update automatically.

:::features
- **Object Identity**: Every entity has a unique **ID**, **Z-Index**, and active or visible states.
- **Multi-Tag System**: Assign multiple tags to an entity so scripts can filter or group targets.
- **Master Prefabs**: Convert any configured entity tree into a reusable **World** or **UI** template.
- **Live Overrides**: Customize individual prefab instances and push or revert edits at any time.
:::

## Create entities and prefabs {#create-entities-and-prefabs}

You can create an entity from the [Scene Hierarchy](interface/scene_hierarchy) or directly in the [Scene Viewport](interface/scene_viewport), then convert it into a prefab for reuse.

:::steps
1. In the **Scene Hierarchy**, right-click a **World** or **User Interface** layer row.
2. Hover over **Add Entity** (or **Add UI Element**) and choose a template such as **Sprite**, **Shape**, **Text**, or **Empty Entity**.
3. In the [Property Inspector](interface/property_inspector), configure the entity's **Object** settings, transform, and components.
4. Right-click the entity in the **Scene Hierarchy** and click **Use as Prefab**.
5. Enter a prefab name and click **Create**. The entity icon turns into a blue box and the template appears in the **Prefabs** dock.
:::

> [!TIP]
> To spawn a new copy of a prefab, open the **Prefabs** tab in the bottom dock, right-click the prefab, and choose **Instantiate to...**.

## Properties {#properties}

Every entity displays the **Object** section at the top of the [Property Inspector](interface/property_inspector).

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| ID | String | entity_1 | Unique identifier used to reference this entity in visual scripts. |
| Prefab | String | None | Shows the linked master prefab name on prefab instances, with a button to open the master prefab. |
| Tag | Array | [] | List of project tags assigned to the entity. Select **Create New Tag...** in the dropdown to add a new tag. |
| Z-Index | Number | 0 | Sorting order within the entity's layer. Higher numbers render in front of lower ones. |
| Active | Boolean | true | Enables or disables the entity and its scripts and physics at runtime. |
| Visibility (Eye) | Boolean | true | Shows or hides the entity in the viewport and at runtime. |
| Lock | Boolean | false | Locks the entity so it cannot be selected or moved accidentally on the canvas. |

When an entity is linked to a prefab, each section header in the inspector displays a **Sync** (green) or **Override** (amber) badge. Open the 3-dots menu on the **Object** header to manage the prefab link.

| Prefab Action | Description |
| --- | --- |
| Apply to Master | Saves all local property overrides on this instance back to the master prefab, updating all synced instances. |
| Revert to Sync | Resets all components, tags, and states back to the master prefab values while keeping the instance's current X and Y position. |
| Sync Component | Available in an individual component's 3-dots menu. Reverts only that component to the master prefab. |
| Unpack Prefab | Breaks the link to the master prefab and turns the instance into a regular standalone entity. |

## Usage examples {#usage-examples}

Use tags and prefabs together when you build repeatable gameplay items such as coins, enemies, or projectiles.

:::steps
1. Create a **Sprite** entity and name its **ID** **Enemy_Slime**.
2. In the **Object** section, open the **Tag** dropdown, click **Create New Tag...**, and add the tag **Enemy**.
3. Attach a [Physics Body](components/physics_body), [Multi-Collider](components/multi_collider), and [Script Controller](components/script_controller).
4. Right-click **Enemy_Slime** in the [Scene Hierarchy](interface/scene_hierarchy) and click **Use as Prefab**.
5. Spawn multiple instances across your level from the **Prefabs** dock. Move each instance freely without breaking its **Sync** status.
:::

## Scripting {#scripting}

Use the nodes in [Entity & Transform](node_library/game_entity) to spawn prefabs, manage entity lifecycles, and query tags at runtime.

| Node | Description |
| --- | --- |
| [Spawn Prefab](node_library/game_entity#node-entitySpawn) | Spawns a new prefab instance at a position and layer at runtime. |
| [Clone Entity](node_library/game_entity#node-entityClone) | Duplicates an existing entity in the active scene. |
| [Destroy Entity](node_library/game_entity#node-entityDestroy) | Removes an entity from the scene. |
| [Get Object Info](node_library/game_entity#node-getObject) | Reads an entity's **ID**, tag, active state, or visibility. |
| [Set Object Info](node_library/game_entity#node-setObject) | Changes an entity's tag, active state, or visibility at runtime. |
| [Entity Has Tag](node_library/game_entity#node-entityHasTag) | Checks if an entity has a specific tag assigned. |
| [Find Closest By Tag](node_library/game_entity#node-findClosestByTag) | Finds the nearest active entity with a matching tag. |

## Common issues {#common-issues}

| Problem | Solution |
| --- | --- |
| Cannot add or remove a component on a prefab instance | Prefab instances lock their component list to match the master prefab. Edit the master prefab from the **Prefabs** dock, or click the **Object** 3-dots menu and select **Unpack Prefab**. |
| Moving a prefab instance does not show the **Override** badge | This is expected. Scene **Position** (**X** and **Y**) is exempt from prefab overrides so you can place instances anywhere in a level. |
| **Use as Prefab** is disabled in the context menu | The entity is already a prefab instance or is a child inside a prefab hierarchy. Unpack the parent prefab first or select an unlinked root entity. |

## Related {#related}

| Page | Use it when |
| --- | --- |
| [Scene Hierarchy](interface/scene_hierarchy) | You want to organize entities into layers and parent-child trees. |
| [Property Inspector](interface/property_inspector) | You want to inspect entity sections, tags, and component menus. |
| [Transform & UI Transform](components/transform) | You want to position, scale, rotate, or anchor entities. |
| [Visual Renderers](components/renderers) | You want to display sprites, shapes, text, or tilemaps on an entity. |
