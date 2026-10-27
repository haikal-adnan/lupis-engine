---
title: "Platformer Movement"
category: "Movement"
description: "Create a responsive 2D platformer character with horizontal running, jumping, one-way platform drop-through, and synchronized animations."
---

## Overview {#overview}

The [Platformer Controller](node_library/helper_tool#node-platformerController) node gives your character side-scrolling movement, ground detection, jumping, and one-way platform drop-through in a single node. Pair it with [Platformer Animator](node_library/helper_tool#node-platformerAnimator) to switch between idle, run, jump, and fall clips and flip the sprite automatically.

:::features
- **Walk & Jump**: Responsive horizontal speed and vertical jump impulse with ground checks.
- **One-Way Drop**: Hold **Down** and press **Jump** on tagged platforms to drop through them.
- **Event Hooks**: Trigger sound effects or particles from **onJump**, **onLand**, and **onDrop** pins.
- **Auto Animation**: Sync **movementState** and **facingDirection** directly to **Platformer Animator**.
:::

## Requirements {#requirements}

Before building the script, configure your player [entity](components/entities_and_prefabs) and ground in the scene.

| Requirement | Configuration |
| --- | --- |
| [Image Renderer](components/renderers/sprite_renderer) & [Sprite Animator](components/sprite_animator) | Attach both to the player entity and create animation clips such as **idle**, **run**, **jump**, and **fall**. |
| [Physics Body](components/physics_body) | Attach to the player entity with **Motion Mode** set to **Platformer (Side-Scroll)** and **Gravity Scale** set between **1.5** and **2.5**. |
| [Multi-Collider](components/multi_collider) | Attach a **Solid (Physics)** collider to the player (increase **Corner Radius (Capsule)** so the feet do not snag on tile seams) and to your floor or [Tilemap](components/renderers/tilemap). |
| [Script Controller](components/script_controller) | Attach to the player entity to run the platformer visual script. |

## Setup {#setup}

Wire the controller and animator nodes inside your player script.

:::steps
1. Open your player script in the [visual scripting](visual_scripting/graph_concepts) editor and add an [On Tick](node_library/game_lifecycle#node-eventTick) node.
2. Add a [Platformer Controller](node_library/helper_tool#node-platformerController) node and a [Platformer Animator](node_library/helper_tool#node-platformerAnimator) node from [Helper & Tool](node_library/helper_tool).
3. Connect **execOut** on **On Tick** to **execIn** on **Platformer Controller**, then connect **execOut** on **Platformer Controller** to **execIn** on **Platformer Animator**.
4. Connect the **movementState** and **facingDirection** data outputs from **Platformer Controller** to the matching inputs on **Platformer Animator**.
5. Select **Platformer Animator** and enter your clip names in **idleClips**, **runClips**, **jumpClips**, and **fallClips** inside the [Property Inspector](interface/property_inspector).
6. Attach the script to your player entity and click **Play** in the [Scene Viewport](interface/scene_viewport) to test running and jumping with **A**, **D**, and **Space**.
:::

## Settings {#settings}

Tune these inputs on **Platformer Controller** and **Platformer Animator** to match the feel of your game.

| Setting | Recommended value | Effect |
| --- | --- | --- |
| speed | 220 to 300 | Horizontal movement speed in pixels per second. |
| jumpForce | 480 to 600 | Upward velocity applied when jumping. Pair with a higher **Gravity Scale** on **Physics Body** for snappy jumps. |
| keyLeft / keyRight / keyJump / keyDown | a / d / space / s | Keyboard keys used for moving left, moving right, jumping, and crouching or dropping. |
| oneWayTag | platform | Entity tag that identifies one-way platforms the player can drop through when pressing **keyDown** and **keyJump**. |
| dropNudge | 6 | Downward pixel offset applied when dropping through a one-way platform. |
| autoFlipX | True | On **Platformer Animator**, automatically mirrors the sprite horizontally when **facingDirection** is **left**. |

## Variations {#variations}

Expand the base platformer setup with camera tracking, audio feedback, or melee combat.

| Variation | How to build it |
| --- | --- |
| Smooth Camera Follow | Connect an [On Scene Start](node_library/game_lifecycle#node-eventSceneStart) node to [Camera Follow](node_library/game_renderer#node-actionCameraFollow) and set **targetEntity** to your player's ID. |
| Jump & Land Sound Effects | Connect the **onJump** and **onLand** execution pins on **Platformer Controller** to [Play Audio](node_library/system_utilities#node-playAudio) nodes. |
| Melee Combo Attacks | Chain [Platformer Combat](node_library/helper_tool#node-platformerCombat) after **Platformer Controller** and wire **facingDirection** and **isGrounded** into it. See [Triggers & Hitboxes](behaviour/physics_and_collision/triggers_and_hitboxes). |

## Common issues {#common-issues}

| Problem | Solution |
| --- | --- |
| Character cannot jump even though **Space** is pressed | Verify that the floor has a **Solid (Physics)** collider so **isGrounded** becomes **true** when the player lands. |
| Character gets stuck on flat tilemap seams while walking | Select the player's **Solid (Physics)** collider in **Multi-Collider** and increase **Corner Radius (Capsule)** to **4** or higher. |
| Jump feels floaty and slow | Increase **Gravity Scale** on the player's **Physics Body** to **2.0** or **2.5** and raise **jumpForce** on **Platformer Controller** to compensate. |

## Related {#related}

| Page | Use it when |
| --- | --- |
| [Physics & Slopes](behaviour/physics_and_collision/physics_and_slopes) | You want your platformer character to walk smoothly up and down angled ramps. |
| [Triggers & Hitboxes](behaviour/physics_and_collision/triggers_and_hitboxes) | You want to add coins, hazards, and melee combat to your platformer. |
| [Physics Body](components/physics_body) | You want to adjust drag, gravity scale, and slope settings. |
| [Sprite Animator](components/sprite_animator) | You want to play matching run, jump, fall, and attack animation clips. |
