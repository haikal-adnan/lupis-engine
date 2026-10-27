---
title: "Top-Down Movement"
category: "Movement"
description: "Build an 8-directional top-down character controller with normalized diagonal speed, sprinting, mouse aiming, and directional animations."
---

## Overview {#overview}

The [Top-Down Controller](node_library/helper_tool#node-topDownController) node handles 8-directional movement on the X and Y axes with diagonal speed normalization and sprint multipliers. Connect its outputs to [Top-Down Animator](node_library/helper_tool#node-topDownAnimator) to drive 4-way, 8-way, or angle-rotated character sprites.

:::features
- **8-Way Movement**: Smooth horizontal, vertical, and diagonal movement with automatic normalization.
- **Sprint Support**: Hold **Shift** (or any mapped sprint key) to multiply movement speed and fire **onSprint**.
- **Mouse Aiming**: Turn on **faceMouse** to calculate facing angle and direction toward the cursor.
- **Directional Clips**: Switch between **4-Way (Cardinal)**, **8-Way**, or **Rotation** animation modes.
:::

## Requirements {#requirements}

Configure your character [entity](components/entities_and_prefabs) for zero-gravity 2D movement on the X and Y plane.

| Requirement | Configuration |
| --- | --- |
| [Physics Body](components/physics_body) | Set **Motion Mode** to **Top-Down** and **Linear Drag** to **5.00** or higher so the character stops crisply (gravity is automatically 0). |
| [Multi-Collider](components/multi_collider) | Attach a **Solid (Physics)** box or circle collider positioned around the character's feet or torso. |
| [Image Renderer](components/renderers/sprite_renderer) & [Sprite Animator](components/sprite_animator) | Create directional clips (such as **idle_down**, **walk_down**, **walk_up**, **walk_side**) or single clips for rotation mode. |
| [Script Controller](components/script_controller) | Attach to the character entity to run the top-down script. |

## Setup {#setup}

Connect **Top-Down Controller** and **Top-Down Animator** in a visual script.

:::steps
1. Select your character entity, check its **Physics Body** section in the [Property Inspector](interface/property_inspector), and set **Motion Mode** to **Top-Down** (gravity is automatically disabled).
2. Open your character script in the [visual scripting](visual_scripting/graph_concepts) editor and add an [On Tick](node_library/game_lifecycle#node-eventTick) node.
3. Add a [Top-Down Controller](node_library/helper_tool#node-topDownController) node and a [Top-Down Animator](node_library/helper_tool#node-topDownAnimator) node from [Helper & Tool](node_library/helper_tool).
4. Connect **execOut** on **On Tick** to **execIn** on **Top-Down Controller**, and **execOut** on **Top-Down Controller** to **execIn** on **Top-Down Animator**.
5. Wire **movementState**, **facingDirection**, and **facingAngle** from **Top-Down Controller** into the matching inputs on **Top-Down Animator**.
6. Select **Top-Down Animator**, choose your **Direction Mode** (**4-Way**, **8-Way**, or **Rotation**), enter your clip names, and click **Play** in the [Scene Viewport](interface/scene_viewport).
:::

## Settings {#settings}

Adjust these inputs on **Top-Down Controller** and **Top-Down Animator** in the **Parameters** section.

| Setting | Recommended value | Effect |
| --- | --- | --- |
| speed | 180 to 240 | Base walking speed in pixels per second. |
| sprintMultiplier | 1.4 to 1.7 | Multiplies **speed** while **keySprint** (default **shift**) is held down. |
| normalizeDiagonal | True | Prevents diagonal movement from being 41 percent faster than cardinal movement. |
| faceMouse | False (RPG) / True (Shooter) | When **True**, aims **facingDirection** and **facingAngle** toward the mouse cursor instead of the movement keys. |
| directionMode | 4way / 8way / rotation | On **Top-Down Animator**, selects whether clips are chosen by 4 cardinal directions, 8 directions, or sprite rotation angle. |
| autoFlipX | True | Automatically mirrors horizontal side animations when switching between **left** and **right**. |

## Variations {#variations}

Customize the controller for twin-stick shooters, footsteps, or custom axis math.

| Variation | How to build it |
| --- | --- |
| Twin-Stick / Mouse Aim Shooter | Set **faceMouse** to **True** on **Top-Down Controller** and set **directionMode** to **rotation** on **Top-Down Animator** so the character rotates toward the cursor while moving with **W**, **A**, **S**, and **D**. |
| Footstep Dust or Audio | Connect the **onMove** or **onSprint** execution output of **Top-Down Controller** to a [Cooldown](node_library/flow_logic#node-logicCooldown) node followed by [Play Audio](node_library/system_utilities#node-playAudio). |
| Custom Low-Level Movement | Combine [Calculate Axis 2D](node_library/input_controls#node-calculateAxis2d), [Set Face Direction](node_library/game_physics#node-setFaceDirection), and [Move and Slide](node_library/game_physics#node-moveAndSlide) when you want custom acceleration formulas. |

## Common issues {#common-issues}

| Problem | Solution |
| --- | --- |
| Character falls toward the bottom of the screen when the game starts | Set **Gravity Scale** to **0** in the character's **Physics Body** component. |
| Character moves faster diagonally than horizontally | Set **normalizeDiagonal** to **True** on the **Top-Down Controller** node. |
| Character collider blocks doorways that look wide enough | Reduce the **Size (px)** of the character's **Solid (Physics)** collider so it covers only the lower half (feet) of the sprite. |

## Related {#related}

| Page | Use it when |
| --- | --- |
| [Patrol & Basic Motion](behaviour/movement/basic_motion) | You want to add AI enemies that patrol and chase your top-down player. |
| [Triggers & Hitboxes](behaviour/physics_and_collision/triggers_and_hitboxes) | You want to add item pickups, interaction zones, and combat. |
| [Sprite Animator](components/sprite_animator) | You want to play 4-direction or 8-direction walking and idling animations. |
