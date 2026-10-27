---
title: "Physics Body"
category: "Components"
description: "Adds gravity, velocity, drag, and collision response to an entity. Pair Physics Body with a Multi-Collider so the entity moves and reacts like a physical object."
---

## Overview {#overview}

The **Physics Body** component connects an entity to the 2D physics simulation. It controls how gravity, velocity, drag, and sloped surfaces affect the entity. Pair it with a [Multi-Collider](components/multi_collider) so it can collide with walls, floors, and other entities.

:::features
- **Motion Modes**: Choose **Platformer (Side-Scroll)**, **Top-Down**, or **Custom / Arcade** to tailor settings automatically.
- **Gravity & Drag**: Tune per-entity **Gravity Scale** and **Linear Drag** without editor clutter.
- **Slope Alignment**: Turn on **Align to Slope** to rotate characters smoothly along angled terrain.
- **Live Simulation Toggle**: Pause or resume physics on individual entities at any time.
:::

## Add the component {#add-the-component}

:::steps
1. Select the entity in the [Scene Hierarchy](interface/scene_hierarchy) or [Scene Viewport](interface/scene_viewport).
2. In the [Property Inspector](interface/property_inspector), click **Add Component...** under **Actions** and select **Physics Body**.
3. Click **Add Component...** again and select **Collider** so the physics body has a collision shape.
:::

## Properties {#properties}

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| Simulation | Boolean | Running | Toggles **Running** or **Paused** to enable or freeze physics updates on this entity. |
| Motion Mode | String | Platformer (Side-Scroll) | Sets the motion archetype: **Platformer (Side-Scroll)**, **Top-Down** (0 gravity, planar damping), or **Custom / Arcade**. |
| Linear Drag | Number | 1.00 | Resistance that slows velocity over time (minimum 0). Crucial for top-down braking friction. |
| Gravity Scale | Number | 1.00 | Multiplier for scene gravity on this entity (hidden in Top-Down mode). |
| Align to Slope | Boolean | false | Rotates the entity automatically to match the angle of sloped surfaces beneath it (hidden in Top-Down mode). |
| Adapt Speed | Number | 12 | Visible when **Align to Slope** is checked. Controls how fast the entity rotates to match a slope. |
| Max Slope (deg) | Number | 60 | Visible when **Align to Slope** is checked. Steepest slope angle (5 to 89 degrees) the entity can climb. |

> [!TIP]
> Select **Top-Down** in **Motion Mode** for RPGs or top-down games to automatically set gravity to 0 and apply full planar damping.

## Usage examples {#usage-examples}

Choose the right combination of **Motion Mode** and **Gravity Scale** for common gameplay entities.

| Entity Role | Motion Mode | Gravity Scale | Notes |
| --- | --- | --- | --- |
| Platformer Player | **Platformer** | **1.00** to **2.50** | Check **Align to Slope** if your level has angled ramps. |
| Top-Down Player / Enemy | **Top-Down** | **0.00** (Auto) | Set **Linear Drag** to **5.00** or higher for crisp stopping. |
| Moving Platform / Scripted | **Custom / Arcade** | **0.00** | Move with [Ping Pong Stepper](node_library/helper_tool#node-pingPongStepper) or velocity nodes. |
| Static Wall / Prop | *(No Physics)* | N/A | Only add **Collider** (solid). No Physics Body needed. |

## Scripting {#scripting}

Use the nodes in [Physics & Collision](node_library/game_physics) and [Helper & Tool](node_library/helper_tool) to move bodies and read physics states at runtime.

| Node | Description |
| --- | --- |
| [Get Physics Info](node_library/game_physics#node-getPhysics) | Reads velocity, grounded state, drag, or facing direction. |
| [Set Physics Info](node_library/game_physics#node-setPhysics) | Updates velocity, **Gravity Scale**, or **Linear Drag** at runtime. |
| [Move and Slide](node_library/game_physics#node-moveAndSlide) | Moves a body with automatic wall sliding and ground detection. |
| [Apply Knockback](node_library/game_physics#node-applyKnockback) | Pushes an entity with an impulse velocity and friction decay. |
| [Platformer Controller](node_library/helper_tool#node-platformerController) | Complete 2D platformer movement node with walking, jumping, and landing triggers. |
| [Top-Down Controller](node_library/helper_tool#node-topDownController) | Complete 8-directional top-down movement node with diagonal normalization and sprinting. |

## Common issues {#common-issues}

| Problem | Solution |
| --- | --- |
| Entity falls right through the floor | Make sure both the entity and the floor have a [Multi-Collider](components/multi_collider) set to **Solid (Physics)** (or a [Tilemap](components/renderers/tilemap) with **Solid** checked). |
| Entity rotates on a slope, tilting its solid collider into the ground | In the entity's **Collider** section, check **Lock World Rotation (Stay Upright)** so the visual sprite tilts to the slope while the physical collider stays upright. |
| Top-down character drifts down the screen | Set **Gravity Scale** to **0** in **Physics Body**. |

## Related {#related}

| Page | Use it when |
| --- | --- |
| [Multi-Collider](components/multi_collider) | You want to define solid collision boxes, capsules, triggers, or hitboxes. |
| [Physics & Slopes](behaviour/physics_and_collision/physics_and_slopes) | You want a full guide on configuring slopes, capsules, and terrain collision. |
| [Platformer Movement](behaviour/movement/platformer) | You want to build a jumping and running platformer character. |
| [Top-Down Movement](behaviour/movement/top_down) | You want to build an 8-directional top-down character. |
