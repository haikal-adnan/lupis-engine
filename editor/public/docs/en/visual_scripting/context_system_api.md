---
title: "Context System API"
category: "Visual Scripting"
description: "Complete JavaScript reference for the runtime context object available inside the Code Panel. Access entities, physics, input, audio, camera, scenes, and variables."
---

## Overview {#overview}

The **Context System** (**context**) is the runtime API object passed into every node script in the [Custom Node & Code Panel](visual_scripting/custom_node_and_code). It provides safe, structured access to entities, physics, input, audio, camera, scenes, and variables during gameplay.

:::features
- **Domain Facades**: Control entities, colliders, audio channels, cameras, and scenes through dedicated namespaces.
- **Persistent State**: Store per-node timers, counters, and flags across frames in **context.state**.
- **Fail-Fast Assertions**: Validate entities, components, and numbers with **context.assert** before mutating state.
- **Contextual Logging**: Send tagged messages to the editor **Console** with **context.console** (compact tags and repeat counts).
:::

## Key concepts {#key-concepts}

Every executing node receives root properties on **context** along with methods for reading and writing [Variables & Collections](visual_scripting/variables_and_collections).

| Property / Method | Returns | Description |
| --- | --- | --- |
| context.owner | Object | The host entity owning the active [Script Controller](components/script_controller) component. |
| context.dt / context.deltaTime | Number | Elapsed time in seconds since the previous frame. |
| context.state | Object | Persistent per-node memory object that retains values across frames. |
| context.node | Object | The current node definition being executed. |
| context.getLocal(key) | Any | Reads a **Local** variable from the current script instance. |
| context.setLocal(key, value) | Any | Updates a **Local** variable on the current script instance. |
| context.getGlobal(key) | Any | Reads a project-wide **Global** variable. Throws if **key** is not defined. |
| context.setGlobal(key, value) | Any | Updates a project-wide **Global** variable across all scenes. |
| context.getVariable(key) | Any | Searches **Local** scope first, then falls back to **Global** scope. |
| context.hasVariable(key) | Boolean | Returns **true** if **key** exists in **Local** or **Global** scope. |

Use lifecycle hooks, flow triggers, assertions, and logging namespaces to coordinate execution and validate runtime state.

| Namespace / Method | Key Methods | Description |
| --- | --- | --- |
| context.triggerFlow(portName) | triggerFlow('execOut') | Fires a named execution output pin (such as **onTrue** or **onCollected**). |
| context.onTick(callback) | onTick(callback) | Registers a per-frame update callback that receives delta time (dt). |
| Lifecycle Callbacks | onGameStart, onSceneStart, onGamePause, onGameResume, onGameRestart, onGameQuit, onQuit | Registers callbacks that fire when the game or active scene changes state. |
| context.lifecycle | pause(), resume(), restart(), quit(), isPaused() | Pauses, resumes, restarts, or exits the active game session. |
| context.signal | emit(signalName, data?), on(signalName, callback) | Broadcasts and listens for custom events across decoupled entities and scripts. |
| context.assert | exists(val, msg?), hasComponent(entity, name, msg?), isNumber(val, msg?), isString(val, msg?), isBoolean(val, msg?), isObject(val, msg?), isArray(val, msg?), inRange(val, min, max, msg?), isTrue(cond, msg?), isFalse(cond, msg?), fail(msg?) | Validates contracts and halts the node immediately with a **Console** error if a check fails. |
| context.console | log(...args), warn(...args), error(...args) | Logs messages to the **Console** panel with compact badges ([entity::script]), hover tooltips, and repeat deduplication. |
| context.ui | notify(message, source?, type?), isUiLayer(layerId), dispatchEvent(event) | Pushes toast notifications to the editor and queries screen-space UI layers. |

> [!NOTE]
> Always validate required inputs and entities with **context.assert.exists()** or **context.assert.isNumber()** instead of silent fallback checks. If an assertion fails, the engine stops the node cleanly and logs the exact node location in the **Console** panel.

## How it works {#how-it-works}

Inside the **Code Panel**, node scripts follow a consistent pattern to read inputs, call engine domain facades, and pass results downstream.

:::steps
1. Read input ports from **inputs** and validate required values with **context.assert**.
2. Resolve the target [entity](components/entities_and_prefabs) using **context.entity.get(inputs.targetEntity)** (pass **'self'** to target **context.owner**).
3. Call the appropriate domain facade (such as **context.collider**, **context.input**, or **context.audio**) to query or update the game world.
4. Store any multi-frame timers or accumulators on **context.state**.
5. Assign output ports on **outputs**, set **outputs.execOut = true;** (for **Action** and **Event** nodes), and end with **return;**.
:::

Use these spatial, hierarchy, physics, and input facades to interact with entities in the active scene.

| Domain Facade | Available Methods & Properties | Description |
| --- | --- | --- |
| context.entity | get(targetId), destroy(entity), destroyByTag(tag), clone(entity), getParent(entity), getChildren(entity), getRoot(entity), findClosestByTag(tag, origin, y?), getAllByTag(tag), findByName(name), findByScriptId(scriptId) | Resolves entities by **'self'**, UUID, or **scriptId**, traverses parent-child hierarchies, queries tags, and clones or destroys entities. |
| context.prefab | spawn(prefabAssetId, x?, y?, layerId?, parentId?) | Spawns a new prefab instance into the scene at coordinates **(x, y)**. |
| context.layer | get(layerId), destroy(layerId, destroyEntities?), freezeInput(layerId, active?, type?), isInputFrozen(layerId, type?), reset(sceneName?, layerName?) | Resolves display layers, removes layers, freezes pointer and keyboard input on a specific layer, or restores a layer to its scene template definition. |
| context.collider | moveAndSlide(entity, moveX, moveY), checkSolid(entity), checkOverlap(entity, filterTag?), getShape(entity, scriptId), setShapeEnabled(entity, scriptId, enabled), checkHitbox(attacker, id, filterTag?, types?), getBounds(entity) | Moves entities with wall sliding, checks solid collisions or trigger overlaps, and manages shape states and hitbox queries on [Multi-Collider](components/multi_collider) shapes. |
| context.input | getPointer(), mouse, keyboard.isDown(key), keyboard.isPressed(key), keyboard.isReleased(key), raycast.getTopEntity(), isPointerOver(entity, useRaycast?) | Reads pointer coordinates, mouse buttons, keyboard state, and top Z-indexed entities under the cursor. |

Use these presentation, audio, scene, and gameplay toolkit facades to control cameras, sound channels, scene transitions, and high-level mechanics.

| Domain Facade | Available Methods & Properties | Description |
| --- | --- | --- |
| context.camera | follow(targetEntity, speed?, offset?), stopFollow(), snapTo(x, y), setTransform(x, y, scale?, speed?), getInfo(), x, y, scale, lerp | Follows a target entity smoothly, teleports the camera, or adjusts viewport zoom and position. |
| context.audio | play(targetOrAssetId, options?), stop(targetOrId), stopAll(), setVolume(channel, volume), getVolume(channel), setMute(channel, isMute), isMuted(channel) | Plays or stops [Audio Source](components/audio_source) sounds and controls the **master**, **background**, **sfx**, and **voice** mixer channels (0 to 100). |
| context.transition | fade(mode, duration, color, onComplete?) | Runs a full-screen fade transition (**'fade_in'**, **'fade_out'**, or **'fade'**). |
| context.scene | load(sceneName), restart(), getCurrentName(), getCurrentId(), getCurrentData(), getAllScenes(), injectLayer(sceneName, layerName, inheritState?, targetLayer?) | Switches or reloads scenes and injects layers from another scene (such as a shared HUD overlay). |
| context.asset | get(idOrScriptId), resolveId(idOrScriptId) | Resolves project asset metadata or converts an asset **scriptId** into its UUID. |
| context.toolkit | platformer, combat, ai, collectable, dialogue | High-level helpers used by [Helper & Tool](node_library/helper_tool) preset and template nodes. |

> [!WARNING]
> Never access **context.game** inside node scripts. The **Code Panel** validator flags unrecognized root properties and enforces access through the documented **context** domain facades.

## Example {#example}

This custom node resolves a target entity, moves it horizontally using keyboard input and **context.collider.moveAndSlide()**, and tracks total distance traveled in **context.state**:

```javascript
const speed = context.assert.isNumber(inputs.speed, 'Speed must be a number');
const entity = context.assert.exists(
  context.entity.get(inputs.targetEntity),
  'Target entity not found'
);

const dir = (context.input.keyboard.isDown('KeyD') ? 1 : 0) - (context.input.keyboard.isDown('KeyA') ? 1 : 0);
const moveX = dir * speed * context.dt;
context.collider.moveAndSlide(entity, moveX, 0);

context.state.distance = (context.state.distance || 0) + Math.abs(moveX);
outputs.totalDistance = context.state.distance;
outputs.execOut = true;
return;
```

This snippet updates a global variable, plays a sound effect via **context.audio**, and broadcasts a signal with **context.signal.emit()**:

```javascript
const points = context.assert.isNumber(inputs.points, 'Points must be a number');
const nextScore = context.getGlobal('Score') + points;

context.setGlobal('Score', nextScore);
context.audio.play(inputs.sfxAssetId);
context.signal.emit('scoreChanged', nextScore);

outputs.newScore = nextScore;
outputs.execOut = true;
return;
```

## Related {#related}

| Page | Use it when |
| --- | --- |
| [Custom Node & Code Panel](visual_scripting/custom_node_and_code) | You want to create a Custom Node, add ports, and edit JavaScript in the Code Panel. |
| [Graph & Node Concepts](visual_scripting/graph_concepts) | You want to learn how execution pins, data ports, and node roles work. |
| [Variables & Collections](visual_scripting/variables_and_collections) | You want to define Local and Global variables in the Variable Manager. |
| [Overview & Architecture](node_library/overview) | You want to see how built-in nodes use the Context System API. |
