---
title: "Physics & Collision"
category: "Behaviour"
description: "Configure solid terrain, angled slopes, capsule colliders, trigger zones, and combat hitboxes in Lupis Engine."
---

## Overview {#overview}

Lupis Engine separates physical blocking collisions from non-blocking overlap detection so you can build smooth terrain traversal and responsive combat on the same [entity](components/entities_and_prefabs). Combine [Physics Body](components/physics_body) and [Multi-Collider](components/multi_collider) with the nodes in [Physics & Collision](node_library/game_physics) and [Helper & Tool](node_library/helper_tool).

> [!NOTE]
> Press **Esc** in the [Scene Viewport](interface/scene_viewport) and enable the collider bound toggles under **Quick Actions** in the [Property Inspector](interface/property_inspector) to visualize solid, trigger, hitbox, and hurtbox wireframes while editing.

## Choose a page {#choose-a-page}

| Page | Use it when |
| --- | --- |
| [Physics & Slopes](behaviour/physics_and_collision/physics_and_slopes) | You want characters to walk smoothly over tile seams, climb angled ramps, and align to sloped terrain. |
| [Triggers & Hitboxes](behaviour/physics_and_collision/triggers_and_hitboxes) | You want to build collectible pickups, hazard zones, checkpoints, and melee hitbox-to-hurtbox combat. |

## Related {#related}

| Page | Use it when |
| --- | --- |
| [Physics Body](components/physics_body) | You want to reference all Physics Body properties and motion modes. |
| [Multi-Collider](components/multi_collider) | You want to attach multiple collider shapes to a single entity. |
| [Movement](behaviour/movement) | You want to set up platformer, top-down, or AI patrol controllers. |
