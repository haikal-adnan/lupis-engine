# Context System API Reference

The **Context System** (`core/Script/ContextSystem.js`) is the primary runtime gateway and security boundary (Engine Gate 2) between game scripts/nodes and the internal Lupis Engine subsystems.

When an execution chain executes a node in `ScriptRunner`, it receives an execution context object (`context`). The `context` facade provides sandboxed, segmented access to engine domains (entities, physics, input, audio, scenes, camera, variables, and UI) without exposing raw engine internals or mutable game instances.

---

## 1. Architectural Rules & Invariants

All node scripts (`data.code`) and custom scripts must adhere to strict runtime invariants:

1. **Zero Access to `context.game`**: Node code is strictly prohibited from accessing `context.game`. All operations must pass through domain facades (`context.entity`, `context.input`, `context.audio`, etc.).
2. **Zero Defensive Null-Checking**: Node logic must never use optional chaining (`?.`), nullish coalescing (`??`), or silent fallbacks (`if (!entity) return;`) for required engine invariants.
3. **Fail-Fast Invariant Enforcement**: When an entity, component, or data type is required, nodes must use `context.assert.*`. Assertion failures throw a `ScriptAssertionError`, emit a structured `console:error` event, and halt execution immediately without downstream flow leakage.
4. **Context-Aware Logging**: All logging, warnings, and errors must use `context.console.*`, which automatically tags each message with the active Scene, Entity, Script, and Node metadata.

---

## 2. Core Execution Context Properties

Every running node receives the following root-level properties on `context`:

| Property | Type | Description |
| :--- | :--- | :--- |
| `owner` | `Entity` | The host entity owning the running `ScriptController` component. |
| `node` | `ScriptNode` | The node definition currently being executed. |
| `dt` / `deltaTime` | `number` | Elapsed delta time for the current frame (in seconds). |
| `state` | `Object` | Persistent node-local memory cache. Retains values across tick executions for the same node instance. |

---

## 3. Scoped Variable Access

Lupis Engine supports three distinct variable scopes:

| Method | Parameters | Returns | Description |
| :--- | :--- | :--- | :--- |
| `context.getLocal(key)` | `key: string` | `any` | Retrieves a script-local variable from the current script runner instance. |
| `context.setLocal(key, value)` | `key: string, value: any` | `void` | Assigns a script-local variable on the current script runner instance. |
| `context.getGlobal(key)` | `key: string` | `any` | Reads a project-wide global variable. Throws an error if `key` is unregistered. |
| `context.setGlobal(key, value)` | `key: string, value: any` | `void` | Writes a project-wide global variable across scenes. |
| `context.getVariable(key)` | `key: string` | `any` | Searches for variable `key` in local scope first, then falls back to global scope. |
| `context.hasVariable(key)` | `key: string` | `boolean` | Returns `true` if `key` exists in either local or global scope. |

---

## 4. Lifecycle & Flow Control Methods

| Method | Parameters | Description |
| :--- | :--- | :--- |
| `context.onTick(callback)` | `(dt: number) => void` | Registers a per-frame update callback for this node. Executes on every engine tick while the node's script is active. |
| `context.triggerFlow(portName)` | `portName: string` | Manually triggers an execution output pin (e.g., `'onComplete'`, `'onUpdate'`, `'onTrue'`). |
| `context.onGameStart(callback)` | `() => void` | Fires once when the game gameplay starts. If the game has already started, fires immediately. |
| `context.onSceneStart(callback)` | `(sceneName: string) => void` | Fires once when the active scene finishes loading and begins simulation. |
| `context.onGamePause(callback)` | `() => void` | Fires when the game enters the paused state. |
| `context.onGameResume(callback)` | `() => void` | Fires when gameplay resumes from pause. |
| `context.onGameRestart(callback)`| `() => void` | Fires immediately before the game session reloads. |
| `context.onGameQuit(callback)` | `() => void` | Fires when gameplay terminates or the window begins closing. |
| `context.isPaused()` | `none` | Returns `true` if the engine is currently paused. |

---

## 5. Domain Facades

### 5.1 `context.assert` (Contract Validation & Invariant Checking)

Provides contract assertions that throw `ScriptAssertionError` upon violation.

```javascript
// Example: Strict component & target validation
const entity = context.assert.exists(context.entity.get(inputs.targetEntity), 'Target entity must exist');
const comp = context.assert.hasComponent(entity, 'SpriteRenderer', 'Entity requires SpriteRenderer');
const speed = context.assert.isNumber(inputs.speed, 'Speed must be numeric');
```

| Method | Parameters | Returns | Description |
| :--- | :--- | :--- | :--- |
| `exists(value, message?)` | `value: any, message?: string` | `value` | Verifies `value !== null && value !== undefined`. Returns the unwrapped value. |
| `hasComponent(entity, name, msg?)` | `entity: Entity, name: string, msg?: string` | `Component` | Verifies the entity contains the specified component. Returns the component instance. |
| `isTrue(condition, message?)` | `condition: boolean, message?: string` | `true` | Asserts condition is truthy. |
| `isFalse(condition, message?)` | `condition: boolean, message?: string` | `true` | Asserts condition is falsy. |
| `isNumber(value, message?)` | `value: any, message?: string` | `number` | Asserts value is a valid, finite number (not NaN, null, or empty string). Returns numeric value. |
| `isString(value, message?)` | `value: any, message?: string` | `string` | Asserts `typeof value === 'string'`. |
| `isBoolean(value, message?)` | `value: any, message?: string` | `boolean` | Asserts `typeof value === 'boolean'`. |
| `isObject(value, message?)` | `value: any, message?: string` | `Object` | Asserts value is a non-null object (and not an Array). |
| `isArray(value, message?)` | `value: any, message?: string` | `Array` | Asserts `Array.isArray(value)`. |
| `inRange(val, min, max, msg?)` | `val: number, min: number, max: number, msg?: string` | `number` | Asserts number is within `[min, max]` range inclusive. |
| `fail(message?)` | `message?: string` | `never` | Unconditionally halts node execution with an assertion failure. |

---

### 5.2 `context.console` (Diagnostic Logging)

Emits formatted console events (`console:log`, `console:warn`, `console:error`) captured by the editor Console Panel.

| Method | Parameters | Description |
| :--- | :--- | :--- |
| `log(...args)` | `...any` | Emits an informational message prefixed with `[Scene] [Entity] [Script] [Node]`. |
| `warn(...args)` | `...any` | Emits a warning message with contextual metadata. |
| `error(...args)` | `...any` | Emits an error message with contextual metadata. |

---

### 5.3 `context.entity` (Entity Lifecycle & Hierarchy)

Queries and manages Entities in the active world.

| Method | Parameters | Returns | Description |
| :--- | :--- | :--- | :--- |
| `get(targetId)` | `targetId: string` | `Entity \| null` | Resolves entity by `'self'`, UUID string, or `scriptId` (case-insensitive slug). |
| `destroy(entity)` | `entity: Entity \| string` | `void` | Removes the target entity and its component state from the active world. |
| `clone(entity)` | `entity: Entity` | `Entity` | Duplicates an existing entity hierarchy. |
| `getParent(entity)` | `entity: Entity` | `Entity \| null` | Retrieves the parent entity if `parentId` is defined. |
| `getChildren(entity)` | `entity: Entity` | `Entity[]` | Returns all immediate child entities. |
| `getRoot(entity)` | `entity: Entity` | `Entity` | Traverses parent hierarchy up to the top-most root entity. |
| `findClosestByTag(tag, fromXOrEntity, optFromY?)` | `tag: string, origin: Entity \| number, y?: number` | `Entity \| null` | Finds the nearest active entity with matching tag. |
| `getAllByTag(tag)` | `tag: string` | `Entity[]` | Retrieves all active entities matching the specified tag. |
| `findByName(name)` | `name: string` | `Entity \| null` | Searches for entity by script name or ID. |
| `findByScriptId(scriptId)` | `scriptId: string` | `Entity \| null` | Searches for entity by its unique `scriptId`. |

---

### 5.4 `context.prefab` (Prefab Instantiation)

| Method | Parameters | Returns | Description |
| :--- | :--- | :--- | :--- |
| `spawn(prefabAssetId, x?, y?, layerId?, parentId?)` | `id: string, x?: number, y?: number, layerId?: string, parentId?: string` | `Entity` | Spawns a prefab template instance into the active scene at coordinates `(x, y)`. |

---

### 5.5 `context.layer` (Display Layer Management)

| Method | Parameters | Returns | Description |
| :--- | :--- | :--- | :--- |
| `get(layerId)` | `layerId: string` | `Layer \| null` | Resolves a layer by `'self'`, layer UUID, or layer `scriptId`. |

---

### 5.6 `context.collider` (Physics & Collision Facade)

Interacts with the runtime 2D collision detection and kinematic sliding system.

| Method | Parameters | Returns | Description |
| :--- | :--- | :--- | :--- |
| `checkSolid(entity)` | `entity: Entity` | `boolean` | Checks if the entity's Collider is currently intersecting any solid colliders. |
| `checkOverlap(entity, filterTag?)` | `entity: Entity, filterTag?: string` | `Entity[]` | Detects overlapping trigger zones, optionally filtering by entity tag. |
| `moveAndSlide(entity, moveX, moveY)` | `entity: Entity, moveX: number, moveY: number` | `Object` | Moves kinematic character by `(moveX, moveY)` with wall sliding and obstacle resolution. |

---

### 5.7 `context.input` (Mouse, Keyboard, Touch & Raycast)

Unifies pointer devices (Mouse on PC, Touch on Mobile) and keyboard state.

| Method / Property | Returns | Description |
| :--- | :--- | :--- |
| `getPointer()` / `pointer` | `{ x: number, y: number, down: boolean } \| null` | Retrieves current primary pointer position in screen coordinates and pressed state. |
| `mouse` | `MouseInput \| null` | Direct mouse controller interface (`isDown(button)`, `isPressed(button)`). |
| `keyboard.isDown(key)` | `boolean` | Returns `true` if key is currently being held down. |
| `keyboard.isPressed(key)` | `boolean` | Returns `true` only on the initial frame the key was pressed down. |
| `keyboard.isReleased(key)`| `boolean` | Returns `true` on the frame the key was released. |
| `raycast.getTopEntity()` | `Entity \| null` | Returns the topmost visible entity under the cursor respecting Z-index and layer order. |
| `isPointerOver(entity, useRaycast?)` | `boolean` | Checks whether the pointer is over the specified entity (using Z-indexed Raycast or direct AABB bounds). |

---

### 5.8 `context.camera` (Viewport & Virtual Camera)

| Method / Property | Parameters / Type | Description |
| :--- | :--- | :--- |
| `follow(targetEntity, speed?, offset?)` | `entity: Entity, speed?: number, offset?: {x, y}` | Smoothly locks camera view to follow target entity with lerp smoothing. |
| `stopFollow()` / `clearTarget()` | `none` | Unbinds camera follow target. |
| `snapTo(x, y)` | `x: number, y: number` | Instantly teleports camera center to coordinates `(x, y)`. |
| `setTransform(x, y, scale?, speed?)` | `x: number, y: number, scale?: number, speed?: number` | Updates camera position, zoom factor, and smoothing lerp speed. |
| `getInfo()` | `Object` | Returns `{ x, y, scale, smoothSpeed, targetEntity, hasTarget }`. |
| `x`, `y`, `scale`, `lerp` | `number` | Direct getters/setters for camera coordinates, zoom factor, and lerp speed. |

---

### 5.9 `context.audio` (Spatial Audio & 4-Channel Mixer)

Directs sound playback through the engine's 4 audio buses: `master`, `background`, `sfx`, and `voice`.

| Method | Parameters | Description |
| :--- | :--- | :--- |
| `play(targetEntityOrAssetId, options?)` | `target: Entity \| string, options?: Object` | Plays sound on an entity with an `Audio` component or triggers one-shot audio asset. |
| `stop(targetEntityOrId)` | `target: Entity \| string` | Stops playback on the specified entity. |
| `stopAll()` | `none` | Stops all active audio voices across all channels. |
| `setVolume(channel, volume)` | `channel: string, volume: number` | Sets channel volume (`'master'`, `'background'`, `'sfx'`, `'voice'`) in range `0 - 100`. |
| `getVolume(channel)` | `channel: string` | Retrieves current volume level for channel (0 - 100). |
| `setMute(channel, isMute)` | `channel: string, isMute: boolean` | Mutes or unmutes a specific audio channel. |
| `isMuted(channel)` | `channel: string` | Returns mute status for channel. |

---

### 5.10 `context.transition` (Screen Transitions)

| Method | Parameters | Description |
| :--- | :--- | :--- |
| `fade(mode, duration, color, onComplete?)` | `mode: string, duration: number, color: string, onComplete?: () => void` | Runs full-screen fade transition. Modes: `'fade_in'`, `'fade_out'`, or `'fade'` (both). |

---

### 5.11 `context.scene` (Scene Director)

| Method | Parameters | Returns | Description |
| :--- | :--- | :--- | :--- |
| `load(sceneName)` | `sceneName: string` | `void` | Queues asynchronous scene transition by scene title or scriptId. |
| `restart()` | `none` | `void` | Reloads the currently active scene from scratch. |
| `getCurrentName()` | `none` | `string` | Returns active scene display title. |
| `getCurrentId()` | `none` | `string` | Returns active scene unique ID. |
| `getCurrentData()` | `none` | `SceneData` | Returns active scene raw configuration object. |
| `getAllScenes()` | `none` | `Array` | Returns list of all available project scenes. |

---

### 5.12 `context.signal` (Decoupled Global Event Bus)

Enables loose communication across different entities and script graphs without direct references.

| Method | Parameters | Description |
| :--- | :--- | :--- |
| `emit(signalName, data?)` | `signalName: string, data?: any` | Broadcasts a custom signal to all listeners in the world. |
| `on(signalName, callback)` | `signalName: string, callback: (data: any) => void` | Subscribes to custom signal. Automatically unsubscribes on script termination. |

---

### 5.13 `context.ui` (UI Notifications & Canvas Events)

| Method | Parameters | Description |
| :--- | :--- | :--- |
| `notify(message, source?, type?)` | `msg: any, source?: string, type?: 'log' \| 'warn' \| 'error'` | Pushes a toast notification to the editor UI. |
| `isUiLayer(layerId)` | `layerId: string` | Returns `true` if target layer is designated as a screen-space UI layer. |
| `dispatchEvent(event)` | `event: Event` | Dispatches custom DOM events through the WebGL canvas. |

---

### 5.14 `context.lifecycle` (Game State Controls)

| Method | Description |
| :--- | :--- |
| `pause()` | Pauses physics and game simulation ticks. |
| `resume()` | Resumes gameplay execution. |
| `restart()` | Restarts game session and reloads initial scene. |
| `quit()` | Exits game session or closes preview tab. |
| `isPaused()` | Returns current pause state. |

---

### 5.15 `context.asset` (Asset Resolver)

| Method | Parameters | Returns | Description |
| :--- | :--- | :--- | :--- |
| `get(idOrScriptId)` | `id: string` | `Asset \| null` | Resolves asset metadata by UUID or human-readable scriptId. |
| `resolveId(idOrScriptId)` | `id: string` | `string \| null` | Converts a human-readable asset `scriptId` into its canonical asset UUID. |

---

## 6. Example: Writing a Custom Node with Context API

```javascript
// Node Contract: Read inputs, perform logic via context facades, assign outputs
const targetId = inputs.targetEntity;
const moveSpeed = context.assert.isNumber(inputs.speed, 'Speed must be a valid number');

// 1. Resolve entity safely
const entity = context.assert.exists(
  context.entity.get(targetId),
  `Target entity '${targetId}' could not be resolved`
);

// 2. Query input
const axis = context.input.keyboard.isDown('KeyD') ? 1 : (context.input.keyboard.isDown('KeyA') ? -1 : 0);

// 3. Move via collider facade
const velocityX = axis * moveSpeed * context.deltaTime;
context.collider.moveAndSlide(entity, velocityX, 0);

// 4. Output results and continue execution flow
outputs.velocityX = velocityX;
outputs.execOut = true;
return;
```
