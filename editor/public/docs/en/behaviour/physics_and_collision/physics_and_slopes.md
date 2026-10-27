---
title: "Physics & Slopes"
category: "Physics & Collision"
description: "Configure capsule colliders, angled ramps, slope alignment, and solid terrain so characters climb hills and cross tile seams smoothly."
---

## Overview {#overview}

Sharp rectangular colliders can snag on tile boundaries or get stuck at the base of angled ramps. By combining capsule corner rounding on [Multi-Collider](components/multi_collider), sloped vector geometry on [Shape Renderer](components/renderers/shape_renderer), and slope alignment on [Physics Body](components/physics_body), you get smooth traversal across flat tiles and hills.

:::features
- **Capsule Feet**: Round collider corners with **Corner Radius (Capsule)** to glide across tilemap seams and ramp transitions.
- **Polygon Ramps**: Draw angled terrain in **Shape Renderer** and enable **Solid** physics in one click.
- **Slope Alignment**: Tilt character sprites to match hill angles automatically with **Align to Slope**.
- **Upright Collider Lock**: Keep the physical collision box vertical with **Lock World Rotation (Stay Upright)**.
:::

## Requirements {#requirements}

You need a character [entity](components/entities_and_prefabs) and a sloped ground entity in the same **World** layer.

| Entity | Required Components |
| --- | --- |
| Character Entity | [Physics Body](components/physics_body) (**Platformer**), [Multi-Collider](components/multi_collider) (**Solid (Physics)**), and a movement controller such as [Platformer Movement](behaviour/movement/platformer). |
| Slope / Ramp Entity | [Shape Renderer](components/renderers/shape_renderer) with a closed **Polygon** ramp and **Solid** enabled in its **Physics** settings (or a rotated **Solid (Physics)** box collider). |

## Setup {#setup}

Follow these steps to build a sloped ramp and configure your character to climb it smoothly.

:::steps
1. Create a ramp entity in your **World** layer, attach a [Shape Renderer](components/renderers/shape_renderer), and click **Edit Shape** in the [Property Inspector](interface/property_inspector).
2. Press **G** to select the **Polygon** tool, draw a triangular or sloped ramp, and press **Enter** to commit the shape.
3. In the **Shape Renderer** section of the **Property Inspector**, check **Solid** under **Physics**.
4. Select your character entity, open its **Collider** section, and increase **Corner Radius (Capsule)** to half of the collider's width so the bottom forms a smooth capsule.
5. Still in the character's **Collider** section, check **Lock World Rotation (Stay Upright)** so the physical collider never tips into the ramp.
6. In the character's **Physics Body** section, check **Align to Slope**, set **Max Slope (deg)** to **60**, and click **Play** in the [Scene Viewport](interface/scene_viewport).
:::

## Settings {#settings}

Tune these properties across **Physics Body** and **Collider** to control how the character handles ramps and terrain.

| Setting | Recommended value | Effect |
| --- | --- | --- |
| Corner Radius (Capsule) (Collider) | 8 to 16 (half of width) | Rounds the collider corners so the character slides smoothly onto slopes and over [Tilemap](components/renderers/tilemap) seams. |
| Lock World Rotation (Stay Upright) (Collider) | Checked (true) | Keeps the solid collision bounds vertical in world space while the entity's visual sprite rotates to match the slope. |
| Align to Slope (Physics Body) | Checked (true) | Rotates the entity to match the surface normal of the ground beneath it. |
| Adapt Speed (Physics Body) | 10 to 15 | Controls how quickly the entity's rotation interpolates when entering or leaving a slope. |
| Max Slope (deg) (Physics Body) | 45 to 60 | Maximum incline in degrees (5 to 89) that the character can walk up without sliding back down. |
| Gravity Scale (Physics Body) | 1.5 to 2.5 | Keeps the character grounded firmly when cresting the top of a ramp. |

## Variations {#variations}

Use runtime physics and collision nodes from [Physics & Collision](node_library/game_physics) to adapt behavior on different surfaces.

| Variation | How to build it |
| --- | --- |
| One-Way Slopes or Bridges | Assign the **platform** tag to a bridge entity and match **oneWayTag** on [Platformer Controller](node_library/helper_tool#node-platformerController) so players can jump up through it or drop down. |
| Ice or Mud Surfaces | Detect surface tags with [Solid Collision](node_library/game_physics#node-solidCollision) and adjust **drag** or **velocityX** at runtime using [Set Physics Info](node_library/game_physics#node-setPhysics). |
| Ground & Ledge Raycasting | Use [Raycast 2D](node_library/game_physics#node-raycast2D) pointing downward ahead of an enemy to detect ledges or steep drops before stepping forward. |

## Common issues {#common-issues}

| Problem | Solution |
| --- | --- |
| Character snags or stutters at the bottom of a ramp | Increase **Corner Radius (Capsule)** on the character's **Solid (Physics)** collider so a sharp box corner does not catch on the ramp edge. |
| Character sprite tilts on a slope and gets wedged into the floor | Check **Lock World Rotation (Stay Upright)** in the character's **Collider** section. |
| Character cannot climb a steep ramp | Increase **Max Slope (deg)** in **Physics Body** so it exceeds the angle of your ramp. |

## Related {#related}

| Page | Use it when |
| --- | --- |
| [Physics Body](components/physics_body) | You want the complete property reference for Physics Body. |
| [Multi-Collider](components/multi_collider) | You want to configure capsule radius, offsets, and upright locks. |
| [Shape Renderer](components/renderers/shape_renderer) | You want to draw custom polygon terrain and ramps in the Shape Editor. |
| [Platformer Movement](behaviour/movement/platformer) | You want to set up walking, jumping, and animations on your character. |
