---
title: "Movement"
category: "Behaviour"
description: "Build responsive 2D character controllers, enemy patrols, and moving platforms using Lupis Engine's physics components and visual scripting kits."
---

## Overview {#overview}

Lupis Engine provides ready-to-use movement nodes in [Helper & Tool](node_library/helper_tool) along with low-level velocity and transform controls in [Physics & Collision](node_library/game_physics). Pair a [Physics Body](components/physics_body) and [Multi-Collider](components/multi_collider) with a [Script Controller](components/script_controller) to move player characters, AI enemies, or environmental props.

> [!TIP]
> Use **Platformer (Side-Scroll)** or **Top-Down** motion modes for player characters, and **Custom / Arcade** for moving platforms that should not be pushed by gravity.

## Choose a page {#choose-a-page}

| Page | Use it when |
| --- | --- |
| [Platformer Movement](behaviour/movement/platformer) | You want side-scrolling walking, jumping, one-way platform drop-through, and state-driven sprite animations. |
| [Top-Down Movement](behaviour/movement/top_down) | You want 8-directional RPG or twin-stick movement with diagonal speed normalization, sprinting, and directional animations. |
| [Patrol & Basic Motion](behaviour/movement/basic_motion) | You want moving platforms, oscillating hazards, or AI enemies that patrol and chase the player. |

## Related {#related}

| Page | Use it when |
| --- | --- |
| [Physics & Collision](behaviour/physics_and_collision) | You want to configure solid terrain, sloped ramps, triggers, and combat hitboxes. |
| [Sprite Animator](components/sprite_animator) | You want to create idle, walk, run, and jump animation clips. |
| [Physics Body](components/physics_body) | You want to configure gravity scale, linear drag, and slope alignment on moving entities. |
| [Script Controller](components/script_controller) | You want to attach logic graphs and wire movement nodes to entities. |
