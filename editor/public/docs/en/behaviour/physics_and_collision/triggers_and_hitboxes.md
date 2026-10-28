---
title: "Triggers & Hitboxes"
category: "Physics & Collision"
description: "Detect non-blocking area overlaps, collect items, and activate frame-accurate melee combat hitboxes."
---

## Overview {#overview}

Triggers and hitboxes detect non-blocking overlaps for area checkpoints, collectible pickups, and melee or projectile combat.

:::features
- **Event-Driven Trigger Zones**: Fire entry, exit, and continuous presence events whenever an entity matching a target tag crosses a trigger boundary.
- **Collectible Pickups**: Handle touch or key-prompt item collection with automatic bobbing, sound effects, score values, and timed respawns.
- **Frame-Synced Combat Hitboxes**: Activate attack hitboxes during specific animation frames, chain multi-hit combos, and apply directional knockback.
:::

## Requirements {#requirements}

Attach the following components and prepare the required nodes before building trigger zones, pickups, or combat hitboxes.

| Requirement | Target entity | Purpose |
| --- | --- | --- |
| [Multi-Collider](components/multi_collider) | Trigger Zone & Pickup | Defines the overlap volume with **Type** set to **Trigger (Zone)** so entities pass through without physical blocking. |
| [Physics Body](components/physics_body) | Player & Enemies | Moves actors in the physics simulation and receives knockback impulses during combat. |
| [Sprite Animator](components/sprite_animator) | Player, Enemies & Pickups | Plays idle, pickup, and multi-stage attack clips synchronized with hitbox activation frames. |
| [Script Controller](components/script_controller) | Zone, Pickup, or Actor | Runs [Trigger Zone](node_library/game_physics#node-triggerZone), [Collectable Item](node_library/helper_tool#node-collectableItem), or [Platformer Combat](node_library/helper_tool#node-platformerCombat). |

## Setup {#setup}

Follow these steps to configure a non-blocking trigger zone and an animated melee combat hitbox.

:::steps
1. In the [Scene Hierarchy](interface/scene_hierarchy), create an entity for your checkpoint or collectable item (right-click **World Layer** > **Add Entity** > **Sprite** or **Shape**), then in the [Property Inspector](interface/property_inspector) open the **Add Component...** dropdown under **Actions**, select **Collider** ([Multi-Collider](components/multi_collider)), and set its **Type** to **Trigger (Zone)**.
2. Select the player entity and set its **Tag** field in the Property Inspector header to **player** so trigger nodes can filter overlaps.
3. Open the trigger entity's [Logic Graph](visual_scripting/graph_concepts) and wire [On Tick](node_library/game_lifecycle#node-eventTick) into [Trigger Zone](node_library/game_physics#node-triggerZone) with **Target Tag** set to **player**.
4. Connect the **On Enter** execution output of **Trigger Zone** to your checkpoint save, dialogue trigger, or hazard damage logic.
5. For item pickups, replace **Trigger Zone** with [Collectable Item](node_library/helper_tool#node-collectableItem), set **Collector Tag** to **player**, and connect **On Collected** to update your score variable.
6. For melee attacks, open the player graph, add [Platformer Combat](node_library/helper_tool#node-platformerCombat), and set **Target Tag** to **enemy** and **Attack Key** to **j**.
7. Connect **On Hit** from **Platformer Combat** to [Apply Knockback](node_library/game_physics#node-applyKnockback), passing **Hit Target** as the target entity so struck enemies recoil from the blow.
:::

## Settings {#settings}

Tune these parameters on [Trigger Zone](node_library/game_physics#node-triggerZone), [Collectable Item](node_library/helper_tool#node-collectableItem), and [Platformer Combat](node_library/helper_tool#node-platformerCombat) to control overlap detection and combat timing.

| Setting | Recommended value | Effect |
| --- | --- | --- |
| **Target Tag / Collector Tag** | player / enemy | Filters overlap checks so only entities with the matching tag activate the trigger, pickup, or hitbox. |
| **Pickup Mode** | collision | Collects the item immediately on touch when set to **collision**, or waits for **Interact Key** (**e**) when set to **interact_key**. |
| **Despawn Action** | destroy | Determines whether a collected pickup destroys itself permanently, deactivates for **Respawn Time** seconds, or stays active. |
| **Auto Bobbing** | true | Applies a smooth vertical sine wave and gentle rotation to the pickup sprite while idle. |
| **Attacks Config** | ground & air lists | Defines each combo stage's animation clip, damage value, hitbox offset (**offsetX**, **offsetY**), size (**width**, **height**), and active frame window. |
| **Combo Buffer Time** | 0.35 | Time window in seconds after an attack finishes before the combo counter resets to the first strike. |
| **Attack Cooldown** | 0.25 | Minimum delay in seconds after a combo ends before the actor can initiate a new attack sequence. |

## Variations {#variations}

Adapt trigger zones and hitboxes for interactive chests, enemy AI attacks, and dynamic collider toggling.

| Variation | Configuration |
| --- | --- |
| **Prompted Chest or Door** | In [Collectable Item](node_library/helper_tool#node-collectableItem), set **Pickup Mode** to **interact_key**, **Interact Key** to **e**, and **Despawn Action** to **none** so pressing **E** plays the chest opening animation. |
| **Enemy Melee & Aggro AI** | Wire [Enemy Combat](node_library/helper_tool#node-enemyCombat) onto an enemy entity to detect the player within an aggro radius, trigger attack clips, and spawn synchronized damage hitboxes. |
| **Runtime Collider Resizing** | Call [Manage Collider](node_library/game_physics#node-manageCollider) to resize, offset, or disable an entity's hitbox when crouching, sliding, or entering invulnerability frames. |
| **Hit Stop & Screen Shake** | Trigger [Shake Transform](node_library/game_animation#node-actionShakeTransform) from the **On Hit** output of [Platformer Combat](node_library/helper_tool#node-platformerCombat) to add tactile impact feedback on each strike. |

## Common issues {#common-issues}

| Problem | Solution |
| --- | --- |
| Player bounces off the trigger zone or coin instead of passing through it | Select the trigger or coin entity and set its [Multi-Collider](components/multi_collider) **Type** to **Trigger (Zone)** so it detects overlaps without solid blocking. |
| [Trigger Zone](node_library/game_physics#node-triggerZone) never fires **On Enter** | Verify that the entering entity's **Tag** in the [Property Inspector](interface/property_inspector) matches **Target Tag** (case-insensitive) and that both entities have active colliders. |
| [Platformer Combat](node_library/helper_tool#node-platformerCombat) plays the animation but deals no damage | Check that target enemies carry the exact tag specified in **Target Tag** (**enemy**) and that **startFrame** and **endFrame** in **Attacks Config** fall within the clip's frame count. |
| Attack hitbox spawns on the wrong side when the player turns around | Wire the **Facing Direction** output from [Platformer Controller](node_library/helper_tool#node-platformerController) into the **Facing Direction** input of **Platformer Combat**. |

## Related {#related}

| Page | Use it when |
| --- | --- |
| [Physics & Slopes](behaviour/physics_and_collision/physics_and_slopes) | Configure solid collisions, sloped terrain, and one-way platforms. |
| [Platformer Movement](behaviour/movement/platformer) | Connect horizontal facing direction and grounded state into combat nodes. |
| [Multi-Collider](components/multi_collider) | Configure collider roles, trigger zones, and shape bounds. |
| [Helper Tool Nodes](node_library/helper_tool) | Look up all ports for Collectable Item, Platformer Combat, and Enemy Combat. |
