---
title: "Patrol & Basic Motion"
category: "Movement"
description: "Move platforms, hazards, and AI enemies using Ping Pong Stepper, Enemy Chaser, Proximity Sensor, and transform tweens."
---

## Overview {#overview}

Not every moving entity is controlled by keyboard input. Lupis Engine provides [Ping Pong Stepper](node_library/helper_tool#node-pingPongStepper) for back-and-forth moving platforms, [Enemy Chaser](node_library/helper_tool#node-enemyChaser) for enemies that patrol and pursue the player, and tween nodes in [Animation](node_library/game_animation) for scripted motion.

:::features
- **Ping-Pong Platforms**: Oscillate an entity between **minPos** and **maxPos** on the X or Y axis and fire **onBounce**.
- **AI Patrol & Chase**: Patrol a set distance and automatically chase a tagged player within **detectRadius**.
- **Proximity Alerts**: Detect when a target enters or leaves a radius with [Proximity Sensor](node_library/helper_tool#node-proximitySensor).
- **Eased Tweens**: Animate position, rotation, and scale over time with **Move To**, **Rotate To**, and **Scale To**.
:::

## Requirements {#requirements}

Choose the component setup that matches whether your [entity](components/entities_and_prefabs) is a scripted platform or a physics-driven enemy.

| Entity Type | Required Components |
| --- | --- |
| Moving Platform / Hazard | [Transform & UI Transform](components/transform), a visual renderer, [Script Controller](components/script_controller), and a [Multi-Collider](components/multi_collider) (plus a **Custom / Arcade** [Physics Body](components/physics_body) for solid platforms). |
| Patrolling / Chasing Enemy | **Physics Body** (**Platformer** or **Top-Down**), **Multi-Collider** (**Solid**), **Script Controller**, and a player entity in the scene tagged **player**. |

## Setup {#setup}

Build a back-and-forth moving platform using **Ping Pong Stepper** and a local direction variable.

:::steps
1. Open your platform script in the [visual scripting](visual_scripting/graph_concepts) editor and create a **Local** **number** variable named **Dir** with a default value of **1** in [Variables & Collections](visual_scripting/variables_and_collections).
2. Add an [On Tick](node_library/game_lifecycle#node-eventTick) node and connect its **execOut** pin to a [Ping Pong Stepper](node_library/helper_tool#node-pingPongStepper) node.
3. On **Ping Pong Stepper**, set **targetEntity** to **self**, **axis** to **X Axis (Horizontal)**, **minPos** to **100**, **maxPos** to **400**, and **speed** to **2**.
4. In the [Property Inspector](interface/property_inspector), click **Switch to Variable** next to **direction** on **Ping Pong Stepper** and bind your **Dir (Local)** variable.
5. Hold **Alt** and drag **Dir** onto the canvas to create a **Set Dir** node, connect **onBounce** from **Ping Pong Stepper** to **execIn** on **Set Dir**, and wire **nextDirection** into **Value**.
6. Attach the script to your platform entity and click **Play** in the [Scene Viewport](interface/scene_viewport) to watch it patrol between X 100 and X 400.
:::

To set up an AI enemy that patrols and chases the player, use **Enemy Chaser** instead:

:::steps
1. Assign the **player** tag to your player entity in the **Object** section of the **Property Inspector**.
2. In your enemy script, connect **On Tick** to [Enemy Chaser](node_library/helper_tool#node-enemyChaser).
3. Set **playerTag** to **player**, **detectRadius** to **250**, **chaseSpeed** to **160**, and **patrolDistance** to **100**.
4. Optionally connect **movementState** and **facingDirection** from **Enemy Chaser** to [Platformer Animator](node_library/helper_tool#node-platformerAnimator) or [Top-Down Animator](node_library/helper_tool#node-topDownAnimator).
:::

## Settings {#settings}

Tune these parameters on **Ping Pong Stepper** and **Enemy Chaser**.

| Setting | Recommended value | Effect |
| --- | --- | --- |
| minPos / maxPos (Ping Pong Stepper) | 100 / 400 | Minimum and maximum world coordinate along the chosen **axis** (**x** or **y**). |
| speed (Ping Pong Stepper) | 1 to 5 | Position step added per frame along the chosen axis. |
| detectRadius / loseRadius (Enemy Chaser) | 250 / 350 | Distance in pixels at which the enemy starts chasing the player and gives up pursuit. |
| stopRadius (Enemy Chaser) | 40 to 60 | Distance from the player at which the enemy stops moving and fires **onInAttackRange**. |
| chaseSpeed / patrolSpeed (Enemy Chaser) | 160 / 70 | Movement speeds in pixels per second while chasing versus patrolling. |
| patrolDistance (Enemy Chaser) | 100 | Distance in pixels the enemy walks from its spawn point before turning around. |

## Variations {#variations}

Combine motion nodes with tweens and sensors for richer level design.

| Variation | How to build it |
| --- | --- |
| One-Shot Door or Elevator | Trigger [Move To](node_library/game_animation#node-tweenMoveTo) when a switch or [Trigger Zone](node_library/game_physics#node-triggerZone) fires, and choose **Smooth (Ease In-Out)** easing. |
| Enemy Attack on Range | Connect the **onInAttackRange** execution pin of **Enemy Chaser** to [Enemy Combat](node_library/helper_tool#node-enemyCombat) so the enemy attacks when it catches the player. |
| Turret or Trap Alert | Use [Proximity Sensor](node_library/helper_tool#node-proximitySensor) to fire **onDetected** when the player enters **radius** without moving the sensor entity itself. |

## Common issues {#common-issues}

| Problem | Solution |
| --- | --- |
| **Ping Pong Stepper** stops at **maxPos** and does not reverse | Connect the **nextDirection** output to a local variable on **onBounce** and bind that variable to the **direction** input so the reversed direction persists across frames. |
| **Enemy Chaser** never detects the player | Check that your player entity has the exact tag matching **playerTag** (default **player**) in the **Object** section of the **Property Inspector**. |

## Related {#related}

| Page | Use it when |
| --- | --- |
| [Platformer Movement](behaviour/movement/platformer) | You want to build a side-scrolling player character. |
| [Top-Down Movement](behaviour/movement/top_down) | You want to build an 8-directional top-down player character. |
| [Triggers & Hitboxes](behaviour/physics_and_collision/triggers_and_hitboxes) | You want to add enemy melee attacks, hurtboxes, and hazard zones. |
