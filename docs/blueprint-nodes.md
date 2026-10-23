# Blueprint Nodes Reference (v3)

Canonical catalog and technical specification for all **165 built-in visual scripting nodes** across **11 category modules** (`ALL_BLUEPRINTS`), plus the user-extensible **Custom Node (`customScript`)** template in `editor/src/features/nodes/library/blueprints/`.

For graph schemas, port rules, execution model, and runtime facades, see:
- [Schema and Data Contract (`schema-contract.md`)](schema-contract.md#8-visual-scripting-and-blueprint-contract)
- [Visual Scripting Guide (`visual-scripting.md`)](visual-scripting.md)
- [Context System API Reference (`context-system.md`)](context-system.md)

---

## 1. Library Architecture & Overview

### 1.1 Category Modules (`ALL_BLUEPRINTS`)

Registered in [`editor/src/features/nodes/library/blueprints/index.js`](../editor/src/features/nodes/library/blueprints/index.js) and exposed to the Node Library sidebar via [`useNodeBlueprint.js`](../editor/src/features/nodes/library/composables/useNodeBlueprint.js).

| # | Module Export | Category ID | Label | Color | Icon | Nodes | Source File |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| 1 | `BlueprintFlow` | `flow_logic` | [**Flow & Logic**](#21-flow-logic) | `#3F51B5` | `GitBranch` | **14** | [`BlueprintFlow.js`](../editor/src/features/nodes/library/blueprints/BlueprintFlow.js) |
| 2 | `BlueprintInput` | `input_controls` | [**Input & Controls**](#22-input-controls) | `#4CAF50` | `Gamepad2` | **8** | [`BlueprintInput.js`](../editor/src/features/nodes/library/blueprints/BlueprintInput.js) |
| 3 | `BlueprintEntity` | `game_entity` | [**Entity & Transform**](#23-game-entity) | `#64B5F6` | `Box` | **20** | [`BlueprintEntity.js`](../editor/src/features/nodes/library/blueprints/BlueprintEntity.js) |
| 4 | `BlueprintPhysics` | `game_physics` | [**Physics & Collision**](#24-game-physics) | `#8BC34A` | `Activity` | **9** | [`BlueprintPhysics.js`](../editor/src/features/nodes/library/blueprints/BlueprintPhysics.js) |
| 5 | `BlueprintRenderer` | `game_renderer` | [**Rendering & Camera**](#25-game-renderer) | `#00ACC1` | `Palette` | **14** | [`BlueprintRenderer.js`](../editor/src/features/nodes/library/blueprints/BlueprintRenderer.js) |
| 6 | `BlueprintAnimation` | `game_animation` | [**Animation**](#26-game-animation) | `#E91E63` | `Film` | **17** | [`BlueprintAnimation.js`](../editor/src/features/nodes/library/blueprints/BlueprintAnimation.js) |
| 7 | `BlueprintCollections` | `data_collections` | [**Collections & Data**](#27-data-collections) | `#FF8A65` | `Database` | **20** | [`BlueprintCollections.js`](../editor/src/features/nodes/library/blueprints/BlueprintCollections.js) |
| 8 | `BlueprintMath` | `math_operations` | [**Math & Random**](#28-math-operations) | `#009688` | `Calculator` | **16** | [`BlueprintMath.js`](../editor/src/features/nodes/library/blueprints/BlueprintMath.js) |
| 9 | `BlueprintLifecycle` | `game_lifecycle` | [**Scene & Lifecycle**](#29-game-lifecycle) | `#9C27B0` | `PlayCircle` | **13** | [`BlueprintLifecycle.js`](../editor/src/features/nodes/library/blueprints/BlueprintLifecycle.js) |
| 10 | `BlueprintSystem` | `system_utilities` | [**Audio & System**](#210-system-utilities) | `#06B6D4` | `Sliders` | **15** | [`BlueprintSystem.js`](../editor/src/features/nodes/library/blueprints/BlueprintSystem.js) |
| 11 | `BlueprintHelperTool` | `helper_tool` | [**Helper & Tool**](#211-helper-tool) | `#AB47BC` | `Wrench` | **19** | [`BlueprintHelperTool.js`](../editor/src/features/nodes/library/blueprints/BlueprintHelperTool.js) |
| 12 | `BlueprintCustom` | `custom` | [**Custom**](#212-custom) | `#8B5CF6` | `Cpu` | **1** *(template)* | [`BlueprintCustom.js`](../editor/src/features/nodes/library/blueprints/BlueprintCustom.js) |
| | **Total** | | | | | **165 + 1** | |

### 1.2 `BlueprintHelperTool` Sub-Modules

`BlueprintHelperTool` (`helper_tool`, 19 nodes) aggregates 6 specialized gameplay and UI toolkit modules:

| Sub-Module Export | Sub-Module ID | Label | Color | Icon | Nodes | Source File |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| `BlueprintUI` | `ui_tool` | **UI & Widget** | `#00ACC1` | `Sliders` | **6** | [`BlueprintUI.js`](../editor/src/features/nodes/library/blueprints/BlueprintUI.js) |
| `BlueprintDialogue` | `dialogue_tool` | **Dialogue & Narrative** | `#EC407A` | `MessageSquare` | **3** | [`BlueprintDialogue.js`](../editor/src/features/nodes/library/blueprints/BlueprintDialogue.js) |
| `BlueprintPlatformer` | `platformer_tool` | **Platformer Kit** | `#2E7D32` | `Gamepad2` | **3** | [`BlueprintPlatformer.js`](../editor/src/features/nodes/library/blueprints/BlueprintPlatformer.js) |
| `BlueprintTopDown` | `topdown_tool` | **Top-Down Kit** | `#00897B` | `Compass` | **2** | [`BlueprintTopDown.js`](../editor/src/features/nodes/library/blueprints/BlueprintTopDown.js) |
| `BlueprintAI` | `ai_tool` | **Enemy & AI** | `#FF6F00` | `Bot` | **4** | [`BlueprintAI.js`](../editor/src/features/nodes/library/blueprints/BlueprintAI.js) |
| `BlueprintCollectable` | `collectable_tool` | **Items & Collectables** | `#FFB300` | `Coins` | **1** | [`BlueprintCollectable.js`](../editor/src/features/nodes/library/blueprints/BlueprintCollectable.js) |

### 1.3 Node Roles (`NODE_ROLES`)

Resolved by [`getNodeRole()`](../editor/src/features/nodes/contract/nodeRoles.js):

| Role | Resolution Rule | Description |
| :--- | :--- | :--- |
| `event` | Explicit `role: "event"` or has `execution` output pin(s) and no `execution` input pin. | Entry point node triggered by engine lifecycle, input, or signal callbacks. |
| `action` | Has at least one `execution` input pin (`execIn`, `skip`, `triggerAttack`, or sequential `v0..vN`). | Imperative node that mutates state, controls flow, or triggers subsystem side effects. |
| `pure` | Has zero `execution` pins on both `inputs` and `outputs`. | Stateless or on-demand data provider evaluated lazily when its output port is read. |

### 1.4 Dynamic Port Modes (`dynamicMode`) & Custom Inspectors

Managed by [`useDynamicPortManager.js`](../editor/src/features/nodes/inspector/composables/useDynamicPortManager.js) and [`custom/index.js`](../editor/src/features/nodes/inspector/layouts/custom/index.js):

| `dynamicMode` | Behavior | Used By |
| :--- | :--- | :--- |
| `none` | Fixed input and output port layout (unless unlocked as a User Custom Node). | Most standard event, action, and pure nodes. |
| `sequential` | Dynamically adds/removes sequential input pins (`v0`, `v1`, `v2`, ...) and syncs `node.data.values`. | `logicAnd`, `logicOr`, `logicFlowMerge`, `mathAdd`, `mathSubtract`, `mathMultiply`, `mathDivide`, `mathChain`, `stringFormat`, `stringJoin`. |
| `inputProperty` | Exposes a property picker dropdown from `data.propertyOptions` to add/remove specific property input pins on demand. | `setObject`, `setTransform`, `setLayer`, `setPhysics`, `setSprite`, `setText`, `setShape`, `setTilemap`, `setAnimator`, `setClipProp`. |
| `outputProperty` | Exposes a property picker dropdown from `data.propertyOptions` to add/remove specific property output pins on demand. | `getObject`, `getTransform`, `getLayer`, `getPhysics`, `getSprite`, `getText`, `getShape`, `getTilemap`, `getAnimator`, `getClipProp`. |
| `switch` | Dynamically adds/removes paired `caseN` (input) and `onCaseN` (execution output) ports while preserving `onDefault`. | `logicSwitch`. |
| `keyboard` | Dynamically adds/removes paired `keyN` (input) and `onKeyN` (execution output) ports via `KeyboardMapperInspector.vue`. | `eventOnKey`. |

**Managed Custom Inspector Components:**
- `eventOnKey` → [`KeyboardMapperInspector.vue`](../editor/src/features/nodes/inspector/layouts/custom/KeyboardMapperInspector.vue)
- `batchSet` → [`BatchSetInspector.vue`](../editor/src/features/nodes/inspector/layouts/custom/BatchSetInspector.vue)
- `stringFormat` → [`StringFormatInspector.vue`](../editor/src/features/nodes/inspector/layouts/custom/StringFormatInspector.vue)
- `mathChain` → [`MathChainInspector.vue`](../editor/src/features/nodes/inspector/layouts/custom/MathChainInspector.vue)
- `customScript` (and any unlocked custom node) → [`CustomScriptInspector.vue`](../editor/src/features/nodes/inspector/layouts/custom/CustomScriptInspector.vue)

### 1.5 Port Contracts (`portIds.js` & `portTypes.js`)

- **Port ID Format (`PORT_ID_REGEX`):** `/^[A-Za-z][A-Za-z0-9]{0,31}$/` (camelCase alphanumeric, 1–32 chars, no spaces/underscores/hyphens).
- **Protected Ports (`PROTECTED_PORTS`):** `execIn`, `execOut`, `targetEntity`, `targetLayer`, `onClick` (cannot be deleted dynamically).

| Data Type (`dataType`) | Pin Color (`PORT_COLORS`) | Compatibility Rule |
| :--- | :--- | :--- |
| `execution` | `#FFFFFF` | Connects only to `execution` pins. |
| `string` | `#F48FB1` | Connects to `string` or `any` (coerced at compile/runtime). |
| `number` | `#64B5F6` | Connects to `number` or `any` (coerced at compile/runtime). |
| `boolean` | `#E57373` | Connects to `boolean` or `any` (coerced at compile/runtime). |
| `any` | `#B0BEC5` | Connects to any non-execution data type. |
| `list` | `#4DD0E1` | Connects to `list` or `any` (coerced at compile/runtime). |
| `map` | `#FF8A65` | Connects to `map` or `any` (coerced at compile/runtime). |

<details>
<summary>Canonical Port Dictionary (<code>CANONICAL_PORT_IDS</code> — 179 registered IDs)</summary>

| Port ID | Semantic Meaning |
| :--- | :--- |
| `execIn` | Main execution input |
| `execOut` | Main execution output |
| `onTrue` | Branch taken when condition is true |
| `onFalse` | Branch taken when condition is false |
| `loopBody` | Executed for each loop iteration |
| `completed` | Execution completed after loop or sequential sequence |
| `onComplete` | Asynchronous completion callback (animation, tween, fade) |
| `onHit` | Triggered when a collision or hit occurs |
| `onOn` | Triggered when switch state turns on |
| `onOff` | Triggered when switch state turns off |
| `onElse` | Fallback branch when no condition matches |
| `onDefault` | Default branch in switch statement |
| `onStart` | Triggered when script/scene/game starts |
| `onUpdate` | Triggered on frame tick/update |
| `onReady` | Triggered when component or asset is ready |
| `onCooling` | Triggered while cooling down |
| `onClick` | Triggered on click event |
| `onDrag` | Triggered on drag event |
| `onHover` | Triggered on hover event |
| `onDown` | Triggered when button or pointer is pressed down |
| `onHold` | Triggered continuously while held |
| `onUp` | Triggered when button or pointer is released |
| `onEnter` | Triggered on collision or area enter |
| `onExit` | Triggered on collision or area exit |
| `targetEntity` | Target entity ID or "self" |
| `sourceEntity` | Source entity triggering the event |
| `entityName` | Name of the entity |
| `tag` | Tag of the entity |
| `selfEntity` | Self entity identifier |
| `otherEntity` | Other colliding or related entity identifier |
| `parentEntity` | Parent entity identifier |
| `childEntity` | Child entity identifier |
| `childEntities` | List of child entity identifiers |
| `childName` | Name of the child entity to find |
| `prefabName` | Name of the prefab to spawn |
| `targetLayer` | Target layer identifier |
| `layerId` | Layer ID |
| `customId` | Custom component or object identifier |
| `clipId` | Animation clip ID |
| `sceneName` | Scene name |
| `signalName` | Custom event / signal name |
| `position` | Position vector/object |
| `rotation` | Rotation in degrees or radians |
| `scale` | Scale factor or vector |
| `x` | X coordinate or value |
| `y` | Y coordinate or value |
| `z` | Z coordinate or value |
| `velocity` | Velocity vector |
| `force` | Force vector |
| `velocityX` | Horizontal velocity |
| `velocityY` | Vertical velocity |
| `deltaX` | Change in X position |
| `deltaY` | Change in Y position |
| `offsetX` | Offset on X axis |
| `offsetY` | Offset on Y axis |
| `axisX` | X axis input (-1 to 1) |
| `axisY` | Y axis input (-1 to 1) |
| `fromX` | Starting X position |
| `fromY` | Starting Y position |
| `toX` | Ending X position |
| `toY` | Ending Y position |
| `x1` | First point X |
| `y1` | First point Y |
| `x2` | Second point X |
| `y2` | Second point Y |
| `directionX` | Direction vector X |
| `directionY` | Direction vector Y |
| `angle` | Angle in degrees or radians |
| `smoothSpeed` | Smoothing factor |
| `zIndex` | Layer or rendering depth order |
| `value` | Generic value input/output |
| `amount` | Numeric amount |
| `count` | Count or quantity |
| `a` | Operand A |
| `b` | Operand B |
| `result` | Calculation or operation result |
| `length` | Length of array or string |
| `size` | Size parameter |
| `min` | Minimum value limit |
| `max` | Maximum value limit |
| `start` | Range start |
| `end` | Range end |
| `step` | Step increment |
| `startValue` | Initial tween value |
| `endValue` | Final tween value |
| `chance` | Probability percentage or chance |
| `compare` | Comparison operand |
| `condition` | Boolean condition |
| `mode` | Operating mode |
| `speed` | Movement or playback speed |
| `lerpSpeed` | Interpolation speed |
| `color` | Color string or hex |
| `text` | Text content |
| `format` | Template format string |
| `separator` | Delimiter string |
| `source` | Source data |
| `message` | Log or notification message |
| `data` | Arbitrary payload data |
| `pretty` | Formatting flag |
| `reset` | Reset trigger or flag |
| `found` | Search success flag |
| `isDown` | Key or button is currently pressed down |
| `isColliding` | Entity is currently colliding |
| `isInside` | Position is inside boundary |
| `isHovering` | Pointer is hovering over entity |
| `isHolding` | Pointer or button is held down |
| `isTyping` | User is typing in an input field |
| `isOn` | Whether switch or state is currently on |
| `isOff` | Whether switch or state is currently off |
| `screenMode` | Screen display mode (window or fullscreen) |
| `hasTarget` | Whether target exists |
| `useRaycast` | Whether to use raycast detection |
| `useColliderBounds` | Whether to check collider bounds |
| `deltaTime` | Frame delta time |
| `duration` | Duration in seconds |
| `delay` | Delay in seconds |
| `activationDelay` | Delay in seconds before choices can be activated |
| `elapsedTime` | Time elapsed in seconds |
| `remainingTime` | Time remaining in seconds |
| `progress` | Normalized progress ratio between 0 and 1 |
| `isActive` | Whether timer or state is currently active |
| `isLooping` | Whether operation, timer, or animation is looping |
| `list` | Array collection input |
| `map` | Key-value map input |
| `item` | Single collection item |
| `key` | Map key or lookup key |
| `index` | Collection index |
| `eventData` | Payload from an event |
| `collection` | Generic collection |
| `path` | Property or node path |
| `listA` | First list operand |
| `listB` | Second list operand |
| `mapA` | First map operand |
| `mapB` | Second map operand |
| `keysList` | List of keys |
| `valuesList` | List of values |
| `listOut` | Resulting list output |
| `mapOut` | Resulting map output |
| `collectionOut` | Resulting collection output |
| `valueOut` | Resulting value output |
| `keys` | Comma-separated keyboard keys |
| `action` | Input action name |
| `upKey` | Key assigned to Up |
| `downKey` | Key assigned to Down |
| `leftKey` | Key assigned to Left |
| `rightKey` | Key assigned to Right |
| `scaleNormal` | Normal scale factor |
| `scaleHover` | Scale factor when hovered |
| `scalePressed` | Scale factor when pressed |
| `onCollected` | Triggered when item is collected |
| `onAnimationEnd` | Triggered when collect animation finishes |
| `onRespawn` | Triggered when collectable item respawns |
| `isCollected` | Whether item has been collected |
| `collectorEntity` | Entity that collected the item |
| `collectorTag` | Tag of entities that can collect the item |
| `pickupMode` | Pickup detection mode (collision or interact_key) |
| `interactKey` | Key to press for pickup interaction |
| `scoreValue` | Score or value awarded on pickup |
| `canCollect` | Conditional gate whether item is currently collectible |
| `idleClip` | Idle animation clip name |
| `collectClip` | Collection animation clip name |
| `sfxName` | Audio asset played on collection |
| `despawnAction` | Lifecycle action after collection (destroy, deactivate, none) |
| `respawnTime` | Delay in seconds before item respawns |
| `autoBobbing` | Whether item bobs up and down smoothly |
| `totalCount` | Total number of items to generate or count |
| `columns` | Number of columns in a grid layout |
| `spacingX` | Horizontal spacing between items in a grid layout |
| `spacingY` | Vertical spacing between items in a grid layout |
| `startX` | Starting X coordinate for layout or range |
| `startY` | Starting Y coordinate for layout or range |
| `dataList` | List of data objects for data binding or generation |
| `onSpawnItem` | Triggered when an individual item is spawned in a loop or grid |
| `spawnedEntity` | Identifier of the entity that was just spawned |
| `itemIndex` | Index of the current item being processed in a collection |
| `rowIndex` | Row index in a 2D grid layout |
| `colIndex` | Column index in a 2D grid layout |
| `itemData` | Data associated with the current item |
| `spawnedEntities` | List of all spawned entity identifiers |
</details>

---

## 2. Complete Blueprint Node Catalog

<a id="21-flow-logic"></a>
### 2.1 Flow & Logic (`flow_logic`)

- **Module Export:** `BlueprintFlow` ([BlueprintFlow.js](../editor/src/features/nodes/library/blueprints/BlueprintFlow.js))
- **Backward-Compatibility Re-export Aliases:** `BlueprintBoolean`, `BlueprintComparison`, `BlueprintLoop`, `BlueprintHelper`
- **Category Color:** `#3F51B5` | **Icon:** `GitBranch` | **Total Nodes:** **14**

| # | Type (`type`) | Label | Header Title | Role | Dynamic Mode | Description |
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |
| 1 | [`logicBranch`](#node-logicBranch) | **Branch (If/Else)** | `Branch` | `action` | `none` | Splits the execution path based on a boolean condition. |
| 2 | [`logicSwitch`](#node-logicSwitch) | **Switch** | `Switch` | `action` | `switch` | Directs execution to a specific path based on the data type and its value. |
| 3 | [`logicCompare`](#node-logicCompare) | **Compare** | `Compare` | `pure` | `none` | Compares two values (numbers or strings) based on an operator. |
| 4 | [`logicAnd`](#node-logicAnd) | **And** | `And` | `pure` | `sequential` | True if all dynamic inputs are true. |
| 5 | [`logicOr`](#node-logicOr) | **Or** | `Or` | `pure` | `sequential` | True if at least one input is true. |
| 6 | [`logicNot`](#node-logicNot) | **Not** | `Not` | `pure` | `none` | Inverts the boolean value. |
| 7 | [`logicLoop`](#node-logicLoop) | **For Loop** | `For Loop` | `action` | `none` | Repeats execution from a Start value to an End value, incrementing by the specified Step. |
| 8 | [`logicForEach`](#node-logicForEach) | **For Each** | `For Each` | `action` | `none` | Repeats execution for each individual item contained within the List. |
| 9 | [`logicWhile`](#node-logicWhile) | **While Loop** | `While Loop` | `action` | `none` | Continuously loops execution as long as the input condition remains true. |
| 10 | [`logicFlowMerge`](#node-logicFlowMerge) | **Flow Merge** | `Flow Merge` | `action` | `sequential` | Merges multiple execution streams into a single output. |
| 11 | [`logicDelay`](#node-logicDelay) | **Delay** | `Delay` | `action` | `none` | Delays execution for a specified duration in seconds. |
| 12 | [`logicCooldown`](#node-logicCooldown) | **Cooldown / Interval** | `Cooldown` | `action` | `none` | Passes execution only if the cooldown duration in seconds has been reached. |
| 13 | [`logicTimer`](#node-logicTimer) | **Timer** | `Timer` | `action` | `none` | Runs a countdown or looping timer in seconds with update progress and completion triggers. |
| 14 | [`logicTypewriter`](#node-logicTypewriter) | **Typewriter Effect** | `Typewriter` | `action` | `none` | Animates text character by character with skip support and character pulse triggers. |

<a id="node-logicBranch"></a>
#### 2.1.1 `logicBranch` — Branch (If/Else)

> Splits the execution path based on a boolean condition.

- **Type:** `logicBranch` | **Role:** `action` | **Header:** `Branch` (`#3F51B5`) | **Category:** `Flow & Logic` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `condition` | `boolean` | `#E57373` | `false` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `onTrue` | `execution` | `#FFFFFF` |
| `onFalse` | `execution` | `#FFFFFF` |

**Additional Node Data Fields:**
- `data.branches`: `[]`

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const condition = Boolean(inputs.condition);
outputs.onTrue = condition;
outputs.onFalse = !condition;
return;
```
</details>

<a id="node-logicSwitch"></a>
#### 2.1.2 `logicSwitch` — Switch

> Directs execution to a specific path based on the data type and its value.

- **Type:** `logicSwitch` | **Role:** `action` | **Header:** `Switch` (`#3F51B5`) | **Category:** `Flow & Logic` | **Dynamic Mode:** `switch`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `value` | `string` | `#F48FB1` | `""` |
| `case0` | `string` | `#F48FB1` | `"right"` |
| `case1` | `string` | `#F48FB1` | `"left"` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `onCase0` | `execution` | `#FFFFFF` |
| `onCase1` | `execution` | `#FFFFFF` |
| `onDefault` | `execution` | `#FFFFFF` |

**Additional Node Data Fields:**
- `data.dataType`: `"string"`
- `data.cases`: `["right","left"]`

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const rawValue = inputs.value;
let matched = false;

if (rawValue == inputs.case0) {
  outputs.onCase0 = true;
  matched = true;
} else if (rawValue == inputs.case1) {
  outputs.onCase1 = true;
  matched = true;
} else {
  const caseKeys = Object.keys(inputs)
    .filter(k => k.startsWith('case') && k !== 'case0' && k !== 'case1')
    .sort((a, b) => {
      const idxA = parseInt(a.replace('case', ''), 10) || 0;
      const idxB = parseInt(b.replace('case', ''), 10) || 0;
      return idxA - idxB;
    });

  for (let i = 0; i < caseKeys.length; i++) {
    const k = caseKeys[i];
    const caseVal = inputs[k];
    const caseIndex = k.replace('case', '');
    if (rawValue == caseVal) {
      outputs[`onCase${caseIndex}`] = true;
      matched = true;
      break;
    }
  }
}

if (!matched) {
  outputs.onDefault = true;
}
return;
```
</details>

<a id="node-logicCompare"></a>
#### 2.1.3 `logicCompare` — Compare

> Compares two values (numbers or strings) based on an operator.

- **Type:** `logicCompare` | **Role:** `pure` | **Header:** `Compare` (`#3F51B5`) | **Category:** `Flow & Logic` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `a` | `any` | `#B0BEC5` | `0` |
| `b` | `any` | `#B0BEC5` | `0` |
| `compare` | `string` | `#F48FB1` | `"equal"` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `result` | `boolean` | `#E57373` |

**Selectable Options (`data.options`):**

- **`compare`** (default: `"equal"`): `"equal"` (Equal (==)), `"not_equal"` (Not Equal (!=)), `"greater"` (Greater Than (>)), `"less"` (Less Than (<)), `"greater_equal"` (Greater Than or Equal (>=)), `"less_equal"` (Less Than or Equal (<=))

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const a = inputs.a;
const b = inputs.b;
const op = inputs.compare;

let res = false;
switch (op) {
  case 'equal': res = (a == b); break;
  case 'not_equal': res = (a != b); break;
  case 'greater': res = (a > b); break;
  case 'less': res = (a < b); break;
  case 'greater_equal': res = (a >= b); break;
  case 'less_equal': res = (a <= b); break;
  default: res = false;
}

outputs.result = res;
return;
```
</details>

<a id="node-logicAnd"></a>
#### 2.1.4 `logicAnd` — And

> True if all dynamic inputs are true.

- **Type:** `logicAnd` | **Role:** `pure` | **Header:** `And` (`#E57373`) | **Category:** `Flow & Logic` | **Dynamic Mode:** `sequential`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `v0` | `boolean` | `#E57373` | `false` |
| `v1` | `boolean` | `#E57373` | `false` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `result` | `boolean` | `#E57373` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const v0 = inputs.v0;
const v1 = inputs.v1;
const values = Object.values(inputs);
outputs.result = values.length > 0 ? values.every(v => v === true) : false;
return;
```
</details>

<a id="node-logicOr"></a>
#### 2.1.5 `logicOr` — Or

> True if at least one input is true.

- **Type:** `logicOr` | **Role:** `pure` | **Header:** `Or` (`#E57373`) | **Category:** `Flow & Logic` | **Dynamic Mode:** `sequential`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `v0` | `boolean` | `#E57373` | `false` |
| `v1` | `boolean` | `#E57373` | `false` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `result` | `boolean` | `#E57373` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const v0 = inputs.v0;
const v1 = inputs.v1;
const values = Object.values(inputs);
outputs.result = values.some(v => v === true);
return;
```
</details>

<a id="node-logicNot"></a>
#### 2.1.6 `logicNot` — Not

> Inverts the boolean value.

- **Type:** `logicNot` | **Role:** `pure` | **Header:** `Not` (`#E57373`) | **Category:** `Flow & Logic` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `value` | `boolean` | `#E57373` | `false` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `result` | `boolean` | `#E57373` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
outputs.result = !inputs.value;
return;
```
</details>

<a id="node-logicLoop"></a>
#### 2.1.7 `logicLoop` — For Loop

> Repeats execution from a Start value to an End value, incrementing by the specified Step.

- **Type:** `logicLoop` | **Role:** `action` | **Header:** `For Loop` (`#4CAF50`) | **Category:** `Flow & Logic` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `start` | `number` | `#64B5F6` | `0` |
| `end` | `number` | `#64B5F6` | `10` |
| `step` | `number` | `#64B5F6` | `1` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `loopBody` | `execution` | `#FFFFFF` |
| `index` | `number` | `#64B5F6` |
| `completed` | `execution` | `#FFFFFF` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const start = inputs.start;
const end = inputs.end;
let step = inputs.step;

if (step === 0) step = 1;

if (step > 0) {
  for (let i = start; i <= end; i += step) {
    outputs.index = i;
    outputs.loopBody = true;
  }
} else {
  for (let i = start; i >= end; i += step) {
    outputs.index = i;
    outputs.loopBody = true;
  }
}

outputs.completed = true;
return;
```
</details>

<a id="node-logicForEach"></a>
#### 2.1.8 `logicForEach` — For Each

> Repeats execution for each individual item contained within the List.

- **Type:** `logicForEach` | **Role:** `action` | **Header:** `For Each` (`#4CAF50`) | **Category:** `Flow & Logic` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `list` | `list` | `#4DD0E1` | — |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `loopBody` | `execution` | `#FFFFFF` |
| `item` | `any` | `#B0BEC5` |
| `index` | `number` | `#64B5F6` |
| `completed` | `execution` | `#FFFFFF` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const list = inputs.list;

for (let i = 0; i < list.length; i++) {
  outputs.item = list[i];
  outputs.index = i;
  outputs.loopBody = true;
}

outputs.completed = true;
return;
```
</details>

<a id="node-logicWhile"></a>
#### 2.1.9 `logicWhile` — While Loop

> Continuously loops execution as long as the input condition remains true.

- **Type:** `logicWhile` | **Role:** `action` | **Header:** `While Loop` (`#4CAF50`) | **Category:** `Flow & Logic` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `condition` | `boolean` | `#E57373` | `false` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `loopBody` | `execution` | `#FFFFFF` |
| `completed` | `execution` | `#FFFFFF` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
let iterations = 0;
const LIMIT = 5000;
const cond = inputs.condition;

while (cond) {
  iterations++;
  if (iterations > LIMIT) {
    break;
  }
  outputs.loopBody = true;
}

outputs.completed = true;
return;
```
</details>

<a id="node-logicFlowMerge"></a>
#### 2.1.10 `logicFlowMerge` — Flow Merge

> Merges multiple execution streams into a single output.

- **Type:** `logicFlowMerge` | **Role:** `action` | **Header:** `Flow Merge` (`#607D8B`) | **Category:** `Flow & Logic` | **Dynamic Mode:** `sequential`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `v0` | `execution` | `#FFFFFF` | — |
| `v1` | `execution` | `#FFFFFF` | — |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
outputs.execOut = true;
return;
```
</details>

<a id="node-logicDelay"></a>
#### 2.1.11 `logicDelay` — Delay

> Delays execution for a specified duration in seconds.

- **Type:** `logicDelay` | **Role:** `action` | **Header:** `Delay` (`#607D8B`) | **Category:** `Flow & Logic` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `duration` | `number` | `#64B5F6` | `1` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `completed` | `execution` | `#FFFFFF` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const rawDuration = Number(inputs.duration);
const duration = isNaN(rawDuration) ? 1 : Math.max(0, rawDuration);

if (duration <= 0) {
  outputs.completed = true;
  context.triggerFlow('completed');
  return;
}

context.state.delayRemaining = duration;
context.state.isDelayActive = true;

context.onTick((dt) => {
  if (!context.state.isDelayActive) return;
  const deltaSec = typeof dt === 'number' ? dt : Number(context.dt || 0.016);
  context.state.delayRemaining -= deltaSec;

  if (context.state.delayRemaining <= 0) {
    context.state.isDelayActive = false;
    outputs.completed = true;
    context.triggerFlow('completed');
  }
});
return;
```
</details>

<a id="node-logicCooldown"></a>
#### 2.1.12 `logicCooldown` — Cooldown / Interval

> Passes execution only if the cooldown duration in seconds has been reached.

- **Type:** `logicCooldown` | **Role:** `action` | **Header:** `Cooldown` (`#607D8B`) | **Category:** `Flow & Logic` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `duration` | `number` | `#64B5F6` | `0.5` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `onReady` | `execution` | `#FFFFFF` |
| `onCooling` | `execution` | `#FFFFFF` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const rawDuration = Number(inputs.duration);
const targetDuration = isNaN(rawDuration) ? 0.5 : Math.max(0, rawDuration);
const currentTime = Date.now();

const lastTime = typeof context.state.lastExecuteTime === 'number' ? context.state.lastExecuteTime : 0;
const elapsed = (currentTime - lastTime) / 1000;

if (elapsed >= targetDuration) {
  context.state.lastExecuteTime = currentTime;
  outputs.onReady = true;
  outputs.onCooling = false;
  context.triggerFlow('onReady');
} else {
  outputs.onReady = false;
  outputs.onCooling = true;
  context.triggerFlow('onCooling');
}
return;
```
</details>

<a id="node-logicTimer"></a>
#### 2.1.13 `logicTimer` — Timer

> Runs a countdown or looping timer in seconds with update progress and completion triggers.

- **Type:** `logicTimer` | **Role:** `action` | **Header:** `Timer` (`#607D8B`) | **Category:** `Flow & Logic` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `duration` | `number` | `#64B5F6` | `1` |
| `isLooping` | `boolean` | `#E57373` | `false` |
| `reset` | `boolean` | `#E57373` | `false` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `onUpdate` | `execution` | `#FFFFFF` |
| `onComplete` | `execution` | `#FFFFFF` |
| `elapsedTime` | `number` | `#64B5F6` |
| `remainingTime` | `number` | `#64B5F6` |
| `progress` | `number` | `#64B5F6` |
| `isActive` | `boolean` | `#E57373` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const rawDuration = Number(inputs.duration);
const duration = isNaN(rawDuration) ? 1 : Math.max(0, rawDuration);
const isLooping = Boolean(inputs.isLooping);
const isReset = Boolean(inputs.reset);

if (isReset) {
  context.state.isActive = false;
  context.state.elapsedTime = 0;
  outputs.elapsedTime = 0;
  outputs.remainingTime = duration;
  outputs.progress = 0;
  outputs.isActive = false;
  outputs.onUpdate = false;
  outputs.onComplete = false;
  return;
}

if (duration <= 0) {
  outputs.elapsedTime = 0;
  outputs.remainingTime = 0;
  outputs.progress = 1;
  outputs.isActive = false;
  outputs.onUpdate = false;
  outputs.onComplete = true;
  if (typeof context.triggerFlow === 'function') context.triggerFlow('onComplete');
  return;
}

context.state.duration = duration;
context.state.isLooping = isLooping;
context.state.elapsedTime = 0;
context.state.isActive = true;

outputs.elapsedTime = 0;
outputs.remainingTime = duration;
outputs.progress = 0;
outputs.isActive = true;
outputs.onUpdate = false;
outputs.onComplete = false;

if (typeof context.onTick === 'function') {
  context.onTick((dt) => {
    if (!context.state.isActive) return;

    const deltaSec = typeof dt === 'number' ? dt : Number(context.dt || 0.016);
    context.state.elapsedTime += deltaSec;

    const targetDuration = context.state.duration;
    const isFinished = context.state.elapsedTime >= targetDuration;

    let currentElapsed = context.state.elapsedTime;
    if (isFinished && !context.state.isLooping) {
      currentElapsed = targetDuration;
    }

    const clampedElapsed = Math.min(currentElapsed, targetDuration);
    const remaining = Math.max(0, targetDuration - clampedElapsed);
    const ratio = targetDuration > 0 ? Math.min(1, clampedElapsed / targetDuration) : 1;

    outputs.elapsedTime = clampedElapsed;
    outputs.remainingTime = remaining;
    outputs.progress = ratio;
    outputs.isActive = context.state.isActive;

    outputs.onUpdate = true;
    if (typeof context.triggerFlow === 'function') context.triggerFlow('onUpdate');

    if (isFinished) {
      outputs.onComplete = true;
      if (typeof context.triggerFlow === 'function') context.triggerFlow('onComplete');

      if (context.state.isLooping) {
        context.state.elapsedTime = context.state.elapsedTime % targetDuration;
      } else {
        context.state.isActive = false;
        outputs.isActive = false;
      }
    }
  });
}
return;
```
</details>

<a id="node-logicTypewriter"></a>
#### 2.1.14 `logicTypewriter` — Typewriter Effect

> Animates text character by character with skip support and character pulse triggers.

- **Type:** `logicTypewriter` | **Role:** `action` | **Header:** `Typewriter` (`#FFB300`) | **Category:** `Flow & Logic` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `skip` | `execution` | `#FFFFFF` | — |
| `targetEntity` | `string` | `#F48FB1` | `"self"` |
| `text` | `string` | `#F48FB1` | `""` |
| `speed` | `number` | `#64B5F6` | `50` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |
| `onChar` | `execution` | `#FFFFFF` |
| `onComplete` | `execution` | `#FFFFFF` |
| `isTyping` | `boolean` | `#E57373` |
| `currentText` | `string` | `#F48FB1` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const entity = context.assert.exists(context.entity.get(inputs.targetEntity), 'Target entity must exist');
const comp = entity.components && entity.components.TextRenderer ? entity.components.TextRenderer : false;

const speed = Math.max(1, Number(inputs.speed) || 50);
const rawInput = inputs.text;
const isSkip = Boolean(inputs.skip);

if (isSkip && context.state.isTyping) {
  context.state.typewriterIndex = context.state.cachedTarget.length;
  context.state.isTyping = false;
  const fullText = context.state.cachedTarget;
  if (comp) comp.value = fullText;
  outputs.currentText = fullText;
  outputs.isTyping = false;
  outputs.onComplete = true;
  if (typeof context.triggerFlow === 'function') context.triggerFlow('onComplete');
  outputs.execOut = true;
  return;
}

if (!context.state.isTyping) {
  context.state.isTyping = true;
  context.state.cachedTarget = typeof rawInput === 'string' && rawInput.length > 0 ? rawInput : (comp && comp.value ? comp.value : '');
  context.state.typewriterIndex = 0;
  context.state.typewriterTimer = 0;
  if (comp) comp.value = '';
}

function advanceStep(deltaMs) {
  context.state.typewriterTimer += deltaMs;
  let advanced = false;
  while (context.state.typewriterTimer >= speed && context.state.typewriterIndex < context.state.cachedTarget.length) {
    context.state.typewriterTimer -= speed;
    context.state.typewriterIndex++;
    advanced = true;
  }
  const cur = context.state.cachedTarget.slice(0, context.state.typewriterIndex);
  if (comp) comp.value = cur;
  outputs.currentText = cur;
  if (advanced) {
    outputs.onChar = true;
    if (typeof context.triggerFlow === 'function') context.triggerFlow('onChar');
  }
  if (context.state.typewriterIndex >= context.state.cachedTarget.length) {
    context.state.isTyping = false;
    context.state.typewriterTimer = 0;
    outputs.isTyping = false;
    outputs.onComplete = true;
    if (typeof context.triggerFlow === 'function') context.triggerFlow('onComplete');
  } else {
    outputs.isTyping = true;
    outputs.execOut = true;
  }
}

if (typeof context.onTick === 'function') {
  if (!context.state._boundTick) {
    context.state._boundTick = true;
    context.onTick((tickDt) => {
      if (!context.state.isTyping) return;
      const dMs = (typeof tickDt === 'number' ? tickDt : Number(context.dt || 0.016)) * 1000;
      advanceStep(dMs);
    });
  }
} else {
  const dMs = Number(context.dt || context.deltaTime || 0.016) * 1000;
  advanceStep(dMs);
}

outputs.currentText = context.state.cachedTarget.slice(0, context.state.typewriterIndex);
outputs.isTyping = context.state.isTyping;
return;
```
</details>

---

<a id="22-input-controls"></a>
### 2.2 Input & Controls (`input_controls`)

- **Module Export:** `BlueprintInput` ([BlueprintInput.js](../editor/src/features/nodes/library/blueprints/BlueprintInput.js))
- **Backward-Compatibility Re-export Aliases:** `BlueprintKeyboard`, `BlueprintMouse`, `BlueprintPointer`
- **Category Color:** `#4CAF50` | **Icon:** `Gamepad2` | **Total Nodes:** **8**

| # | Type (`type`) | Label | Header Title | Role | Dynamic Mode | Description |
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |
| 1 | [`eventOnKey`](#node-eventOnKey) | **On Key Event** | `On Key Event` | `event` | `keyboard` | Triggers individual execution outputs automatically synced with configured key strings. |
| 2 | [`getKeyState`](#node-getKeyState) | **Get Key State** | `Get Key State` | `pure` | `none` | Returns true if the specified key is currently held down. |
| 3 | [`calculateAxis2d`](#node-calculateAxis2d) | **Calculate Axis 2D** | `Calc Axis 2D` | `action` | `none` | Calculates directional X and Y axes based on assigned key strings. |
| 4 | [`simulateKey`](#node-simulateKey) | **Simulate Key** | `Simulate Key` | `action` | `none` | Dispatches synthetic keyboard events for UI interaction or virtual pads. |
| 5 | [`eventPointerTap`](#node-eventPointerTap) | **On Click / Tap** | `On Click/Tap` | `event` | `none` | Triggered when screen is clicked (PC) or tapped (Mobile) |
| 6 | [`eventPointerDrag`](#node-eventPointerDrag) | **Global Mouse Drag** | `Global Drag` | `event` | `none` | Triggered continuously while mouse is held down and moving. |
| 7 | [`mouseEntityInteract`](#node-mouseEntityInteract) | **Entity Mouse Event** | `Entity Mouse Event` | `action` | `none` | Checks if the mouse is interacting with an entity. Can use Raycast (respects Z-Index/blocking) or Direct bounds check. |
| 8 | [`freezeLayerInput`](#node-freezeLayerInput) | **Freeze Layer Input** | `Freeze Layer Input` | `action` | `none` | Freezes or unfreezes pointer, keyboard, or all inputs for all entities in a layer. |

<a id="node-eventOnKey"></a>
#### 2.2.1 `eventOnKey` — On Key Event

> Triggers individual execution outputs automatically synced with configured key strings.

- **Type:** `eventOnKey` | **Role:** `event` | **Header:** `On Key Event` (`#C2185B`) | **Category:** `Input & Controls` | **Dynamic Mode:** `keyboard` | **Custom Inspector:** `KeyboardMapperInspector.vue`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `action` | `string` | `#F48FB1` | `"pressed"` |
| `key0` | `string` | `#F48FB1` | `"a"` |
| `key1` | `string` | `#F48FB1` | `"space"` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `onKey0` | `execution` | `#FFFFFF` |
| `onKey1` | `execution` | `#FFFFFF` |

**Selectable Options (`data.options`):**

- **`action`** (default: `"pressed"`): `"pressed"` (Pressed (Just Down)), `"released"` (Released (Just Up)), `"hold"` (Hold (Is Down))

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
context.onTick(() => {
  const keyboard = context.input.keyboard;
  const action = inputs.action.toLowerCase();
  const defaultK0 = inputs.key0;
  const defaultK1 = inputs.key1;
  outputs.onKey0 = false;
  outputs.onKey1 = false;

  const keyKeys = Object.keys(inputs)
    .filter(k => k.startsWith('key'))
    .sort((a, b) => {
      const idxA = parseInt(a.replace('key', ''), 10) || 0;
      const idxB = parseInt(b.replace('key', ''), 10) || 0;
      return idxA - idxB;
    });

  for (let i = 0; i < keyKeys.length; i++) {
    const k = keyKeys[i];
    const rawVal = inputs[k];
    if (typeof rawVal !== 'string') continue;
    const keyName = rawVal.trim().toLowerCase();
    if (!keyName) continue;
    const keyIdx = k.replace('key', '');
    const outId = `onKey${keyIdx}`;

    let triggered = false;
    if (action === 'pressed' && keyboard.isPressed(keyName)) {
      triggered = true;
    } else if (action === 'released' && keyboard.isReleased(keyName)) {
      triggered = true;
    } else if (action === 'hold' && keyboard.isDown(keyName)) {
      triggered = true;
    }

    if (triggered) {
      context.triggerFlow(outId);
    }
  }

  const legacyRaw = (node.data && node.data.values && node.data.values.keys) || '';
  if (typeof legacyRaw === 'string' && legacyRaw.length > 0) {
    const legacyTokens = legacyRaw.split(',').map(t => t.trim().toLowerCase());
    const activeOutputs = node.outputs || [];
    activeOutputs.forEach((output, index) => {
      const keyName = legacyTokens[index] || output.id.replace(/^on/, '').toLowerCase();
      let triggered = false;
      if (action === 'pressed' && keyboard.isPressed(keyName)) {
        triggered = true;
      } else if (action === 'released' && keyboard.isReleased(keyName)) {
        triggered = true;
      } else if (action === 'hold' && keyboard.isDown(keyName)) {
        triggered = true;
      }
      if (triggered) {
        context.triggerFlow(output.id);
      }
    });
  }
});
return;
```
</details>

<a id="node-getKeyState"></a>
#### 2.2.2 `getKeyState` — Get Key State

> Returns true if the specified key is currently held down.

- **Type:** `getKeyState` | **Role:** `pure` | **Header:** `Get Key State` (`#C2185B`) | **Category:** `Input & Controls` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `key` | `string` | `#F48FB1` | `"space"` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `isDown` | `boolean` | `#E57373` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const rawKey = inputs.key;
const keyboard = context.input.keyboard;
const formattedKey = rawKey === ' ' ? 'space' : rawKey.toLowerCase();

outputs.isDown = keyboard.isDown(formattedKey);
return;
```
</details>

<a id="node-calculateAxis2d"></a>
#### 2.2.3 `calculateAxis2d` — Calculate Axis 2D

> Calculates directional X and Y axes based on assigned key strings.

- **Type:** `calculateAxis2d` | **Role:** `action` | **Header:** `Calc Axis 2D` (`#C2185B`) | **Category:** `Input & Controls` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `upKey` | `string` | `#F48FB1` | `"w"` |
| `downKey` | `string` | `#F48FB1` | `"s"` |
| `rightKey` | `string` | `#F48FB1` | `"d"` |
| `leftKey` | `string` | `#F48FB1` | `"a"` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |
| `axisX` | `number` | `#64B5F6` |
| `axisY` | `number` | `#64B5F6` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const keyboard = context.input.keyboard;
const upKey = inputs.upKey;
const downKey = inputs.downKey;
const rightKey = inputs.rightKey;
const leftKey = inputs.leftKey;

let x = 0;
let y = 0;

if (keyboard.isDown(rightKey.toLowerCase())) x += 1;
if (keyboard.isDown(leftKey.toLowerCase())) x -= 1;
if (keyboard.isDown(upKey.toLowerCase())) y += 1;
if (keyboard.isDown(downKey.toLowerCase())) y -= 1;

outputs.axisX = x;
outputs.axisY = y;
outputs.execOut = true;
return;
```
</details>

<a id="node-simulateKey"></a>
#### 2.2.4 `simulateKey` — Simulate Key

> Dispatches synthetic keyboard events for UI interaction or virtual pads.

- **Type:** `simulateKey` | **Role:** `action` | **Header:** `Simulate Key` (`#C2185B`) | **Category:** `Input & Controls` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `key` | `string` | `#F48FB1` | `"d"` |
| `isDown` | `boolean` | `#E57373` | `true` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const rawKey = inputs.key;
const isDownVal = inputs.isDown;

const eventType = isDownVal ? 'keydown' : 'keyup';
const formattedKey = rawKey === ' ' ? 'space' : rawKey;
const keyCode = formattedKey.toUpperCase().charCodeAt(0);

const event = new KeyboardEvent(eventType, {
  key: formattedKey,
  code: `Key${formattedKey.toUpperCase()}`,
  keyCode: keyCode,
  which: keyCode,
  bubbles: true,
  cancelable: true
});

context.ui.dispatchEvent(event);

outputs.execOut = true;
return;
```
</details>

<a id="node-eventPointerTap"></a>
#### 2.2.5 `eventPointerTap` — On Click / Tap

> Triggered when screen is clicked (PC) or tapped (Mobile)

- **Type:** `eventPointerTap` | **Role:** `event` | **Header:** `On Click/Tap` (`#0097A7`) | **Category:** `Input & Controls` | **Dynamic Mode:** `none`

- **Input Ports (`inputs`):** *None*

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `onClick` | `execution` | `#FFFFFF` |
| `x` | `number` | `#64B5F6` |
| `y` | `number` | `#64B5F6` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
context.onTick(() => {
  const pointer = context.input.getPointer();
  const mouse = context.input.mouse;
  const isTriggered = (mouse && mouse.isPressed('left')) || (pointer && pointer.down);

  if (isTriggered && pointer) {
    outputs.x = pointer.x;
    outputs.y = pointer.y;
    outputs.onClick = true;
    context.triggerFlow('onClick');
  }
});
return;
```
</details>

<a id="node-eventPointerDrag"></a>
#### 2.2.6 `eventPointerDrag` — Global Mouse Drag

> Triggered continuously while mouse is held down and moving.

- **Type:** `eventPointerDrag` | **Role:** `event` | **Header:** `Global Drag` (`#388E3C`) | **Category:** `Input & Controls` | **Dynamic Mode:** `none`

- **Input Ports (`inputs`):** *None*

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `onDrag` | `execution` | `#FFFFFF` |
| `x` | `number` | `#64B5F6` |
| `y` | `number` | `#64B5F6` |
| `deltaX` | `number` | `#64B5F6` |
| `deltaY` | `number` | `#64B5F6` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
context.onTick(() => {
  const pointer = context.input.getPointer();
  if (!pointer) return;
  const mouse = context.input.mouse;
  const isDown = (pointer && pointer.down) || (mouse && (mouse.isDown('left') || mouse.isPressed('left')));

  if (!context.state.dragState) {
    context.state.dragState = { lastX: pointer.x, lastY: pointer.y };
  }

  const deltaX = pointer.x - context.state.dragState.lastX;
  const deltaY = pointer.y - context.state.dragState.lastY;

  context.state.dragState.lastX = pointer.x;
  context.state.dragState.lastY = pointer.y;

  if (isDown && (deltaX !== 0 || deltaY !== 0)) {
    outputs.x = pointer.x;
    outputs.y = pointer.y;
    outputs.deltaX = deltaX;
    outputs.deltaY = deltaY;
    outputs.onDrag = true;
    context.triggerFlow('onDrag');
  }
});
return;
```
</details>

<a id="node-mouseEntityInteract"></a>
#### 2.2.7 `mouseEntityInteract` — Entity Mouse Event

> Checks if the mouse is interacting with an entity. Can use Raycast (respects Z-Index/blocking) or Direct bounds check.

- **Type:** `mouseEntityInteract` | **Role:** `action` | **Header:** `Entity Mouse Event` (`#2E7D32`) | **Category:** `Input & Controls` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `targetEntity` | `string` | `#F48FB1` | `"self"` |
| `useRaycast` | `boolean` | `#E57373` | `true` |
| `useColliderBounds` | `boolean` | `#E57373` | `false` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |
| `onHover` | `execution` | `#FFFFFF` |
| `onDown` | `execution` | `#FFFFFF` |
| `onHold` | `execution` | `#FFFFFF` |
| `onUp` | `execution` | `#FFFFFF` |
| `isHovering` | `boolean` | `#E57373` |
| `isHolding` | `boolean` | `#E57373` |
| `selfEntity` | `string` | `#F48FB1` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const entity = context.assert.exists(context.entity.get(inputs.targetEntity), 'Target entity must exist');

if (!context.state.interactStates) {
  context.state.interactStates = new Map();
}

if (!context.state.interactStates.has(entity.scriptId)) {
  context.state.interactStates.set(entity.scriptId, { wasHovering: false, wasDown: false });
}
const state = context.state.interactStates.get(entity.scriptId);

outputs.selfEntity = entity.scriptId;
outputs.execOut = true;

const pointer = context.input.getPointer(entity) || context.input.getPointer();
const isLayerFrozen = Boolean(entity.layerId && context.layer && typeof context.layer.isInputFrozen === 'function' && context.layer.isInputFrozen(entity.layerId, 'pointer'));

if (!pointer || isLayerFrozen) {
  outputs.isHovering = false;
  outputs.isHolding = false;
  state.wasHovering = false;
  state.wasDown = false;
  context.state.interactStates.set(entity.scriptId, state);
  return;
}

const isPointerDown = Boolean(pointer.down);
const useColliderBounds = inputs.useColliderBounds;
const isHovering = Boolean(useColliderBounds && context.collider ? context.collider.checkOverlap(entity, 'pointer') : context.input.isPointerOver(entity, inputs.useRaycast));

outputs.isHovering = isHovering;
outputs.isHolding = isHovering && isPointerDown;

if (isHovering) {
  outputs.onHover = true;
}

if (isHovering && isPointerDown) {
  if (!state.wasDown) {
    outputs.onDown = true;
  } else {
    outputs.onHold = true;
  }
}

if (!isPointerDown && state.wasDown) {
  outputs.onUp = true;
}

state.wasHovering = isHovering;
state.wasDown = isPointerDown;
context.state.interactStates.set(entity.scriptId, state);

return;
```
</details>

<a id="node-freezeLayerInput"></a>
#### 2.2.8 `freezeLayerInput` — Freeze Layer Input

> Freezes or unfreezes pointer, keyboard, or all inputs for all entities in a layer.

- **Type:** `freezeLayerInput` | **Role:** `action` | **Header:** `Freeze Layer Input` (`#4CAF50`) | **Category:** `Input & Controls` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `layer` | `string` | `#F48FB1` | `"self"` |
| `inputType` | `string` | `#F48FB1` | `"all"` |
| `active` | `boolean` | `#E57373` | `true` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |

**Selectable Options (`data.options`):**

- **`inputType`** (default: `"all"`): `"pointer"` (Pointer), `"keyboard"` (Keyboard), `"all"` (All)

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const target = inputs.layer;
const layer = context.assert.exists(context.layer.get(target), 'Target layer must exist');
layer.freezeInput = Boolean(inputs.active);
layer.freezeInputType = inputs.inputType;
outputs.execOut = true;
return;
```
</details>

---

<a id="23-game-entity"></a>
### 2.3 Entity & Transform (`game_entity`)

- **Module Export:** `BlueprintEntity` ([BlueprintEntity.js](../editor/src/features/nodes/library/blueprints/BlueprintEntity.js))
- **Backward-Compatibility Re-export Aliases:** `BlueprintObject`, `BlueprintTransform`, `BlueprintLayer`
- **Category Color:** `#64B5F6` | **Icon:** `Box` | **Total Nodes:** **20**

| # | Type (`type`) | Label | Header Title | Role | Dynamic Mode | Description |
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |
| 1 | [`entitySpawn`](#node-entitySpawn) | **Spawn Prefab** | `Spawn Prefab` | `action` | `none` | Instantiates a new entity prefab into the world at specified position. |
| 2 | [`entityDestroy`](#node-entityDestroy) | **Destroy Entity** | `Destroy Entity` | `action` | `none` | Removes an entity from the world. |
| 3 | [`entityDestroyByTag`](#node-entityDestroyByTag) | **Destroy Entities by Tag** | `Destroy by Tag` | `action` | `none` | Removes all entities matching the specified tag from the world. |
| 4 | [`entityClone`](#node-entityClone) | **Clone Entity** | `Clone Entity` | `action` | `none` | Creates a duplicate of an existing entity. |
| 5 | [`entityGetChildren`](#node-entityGetChildren) | **Get Entity Children** | `Get Entity Children` | `action` | `none` | Retrieves all child entities or a specific child by index. |
| 6 | [`entityGetChildByName`](#node-entityGetChildByName) | **Get Child By Name** | `Get Child By Name` | `action` | `none` | Finds a child entity under a parent by its prefab or original script name. |
| 7 | [`entityGetParent`](#node-entityGetParent) | **Get Entity Parent** | `Get Entity Parent` | `action` | `none` | Retrieves the parent entity ID of the target entity. |
| 8 | [`getObject`](#node-getObject) | **Get Object Info** | `Get Object` | `pure` | `outputProperty` | Get entity info like Entity ID, Name, Tag, Active, Visible |
| 9 | [`setObject`](#node-setObject) | **Set Object Info** | `Set Object` | `action` | `inputProperty` | Set entity info like Tag, Active, Visible |
| 10 | [`findClosestByTag`](#node-findClosestByTag) | **Find Closest By Tag** | `Find Closest Tag` | `pure` | `none` | Finds the nearest active entity with a specific tag relative to a 2D position |
| 11 | [`entityCountByTag`](#node-entityCountByTag) | **Count Entities by Tag** | `Count by Tag` | `pure` | `none` | Counts active entities in the scene that have a specific tag. |
| 12 | [`entityHasTag`](#node-entityHasTag) | **Entity Has Tag** | `Has Tag` | `pure` | `none` | Checks if an entity has a specific tag. |
| 13 | [`entityGetAllByTag`](#node-entityGetAllByTag) | **Get All Entities by Tag** | `Get All by Tag` | `pure` | `none` | Finds all active entities in the scene with a specific tag as a list of script IDs. |
| 14 | [`entityAddTag`](#node-entityAddTag) | **Add Tag to Entity** | `Add Tag` | `action` | `none` | Adds a tag to the target entity during runtime. |
| 15 | [`entityRemoveTag`](#node-entityRemoveTag) | **Remove Tag from Entity** | `Remove Tag` | `action` | `none` | Removes a tag from the target entity during runtime. |
| 16 | [`getTransform`](#node-getTransform) | **Get Transform** | `Get Transform` | `pure` | `outputProperty` | Get specific transform properties of Self or Target. |
| 17 | [`setTransform`](#node-setTransform) | **Set Transform** | `Set Transform` | `action` | `inputProperty` | Teleport or modify absolute transform properties. |
| 18 | [`getLayer`](#node-getLayer) | **Get Layer Info** | `Get Layer` | `pure` | `outputProperty` | Get layer info like ID, Name, Visible, Locked, Z-Index, Opacity |
| 19 | [`setLayer`](#node-setLayer) | **Set Layer Info** | `Set Layer` | `action` | `inputProperty` | Set layer info like Visible, Locked, Z-Index, Opacity |
| 20 | [`layerDestroy`](#node-layerDestroy) | **Destroy Layer** | `Destroy Layer` | `action` | `none` | Removes a layer and optionally its entities from the world. |

<a id="node-entitySpawn"></a>
#### 2.3.1 `entitySpawn` — Spawn Prefab

> Instantiates a new entity prefab into the world at specified position.

- **Type:** `entitySpawn` | **Role:** `action` | **Header:** `Spawn Prefab` (`#E91E63`) | **Category:** `Entity & Transform` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `prefabName` | `string` | `#F48FB1` | `""` |
| `x` | `number` | `#64B5F6` | `0` |
| `y` | `number` | `#64B5F6` | `0` |
| `layerId` | `string` | `#F48FB1` | `""` |
| `zIndex` | `number` | `#64B5F6` | `0` |
| `customId` | `string` | `#F48FB1` | `""` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |
| `targetEntity` | `string` | `#F48FB1` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const newEntity = context.prefab.spawn(inputs.prefabName, inputs.x, inputs.y, inputs.layerId, inputs.zIndex, inputs.customId);
outputs.targetEntity = newEntity ? newEntity.scriptId : '';
outputs.execOut = true;
return;
```
</details>

<a id="node-entityDestroy"></a>
#### 2.3.2 `entityDestroy` — Destroy Entity

> Removes an entity from the world.

- **Type:** `entityDestroy` | **Role:** `action` | **Header:** `Destroy Entity` (`#D32F2F`) | **Category:** `Entity & Transform` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `targetEntity` | `string` | `#F48FB1` | `"self"` |
| `destroyParent` | `boolean` | `#E57373` | `false` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const target = inputs.targetEntity;
const entity = context.assert.exists(context.entity.get(target), 'Target entity must exist');
if (inputs.destroyParent && entity.parentId) {
  let topParent = entity;
  while (topParent.parentId) {
    const parent = context.entity.get(topParent.parentId);
    if (parent) {
      topParent = parent;
    } else {
      break;
    }
  }
  context.entity.destroy(topParent);
} else {
  context.entity.destroy(entity);
}
outputs.execOut = true;
return;
```
</details>

<a id="node-entityDestroyByTag"></a>
#### 2.3.3 `entityDestroyByTag` — Destroy Entities by Tag

> Removes all entities matching the specified tag from the world.

- **Type:** `entityDestroyByTag` | **Role:** `action` | **Header:** `Destroy by Tag` (`#D32F2F`) | **Category:** `Entity & Transform` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `tag` | `string` | `#F48FB1` | `""` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |
| `count` | `number` | `#64B5F6` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const tag = inputs.tag;
const count = context.entity && typeof context.entity.destroyByTag === 'function' ? context.entity.destroyByTag(tag) : 0;
outputs.count = count;
outputs.execOut = true;
return;
```
</details>

<a id="node-entityClone"></a>
#### 2.3.4 `entityClone` — Clone Entity

> Creates a duplicate of an existing entity.

- **Type:** `entityClone` | **Role:** `action` | **Header:** `Clone Entity` (`#E91E63`) | **Category:** `Entity & Transform` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `sourceEntity` | `string` | `#F48FB1` | `"self"` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |
| `targetEntity` | `string` | `#F48FB1` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const sourceEntity = context.entity.get(inputs.sourceEntity);
const res = context.entity.clone(sourceEntity);
outputs.targetEntity = res ? res.scriptId : '';
outputs.execOut = true;
return;
```
</details>

<a id="node-entityGetChildren"></a>
#### 2.3.5 `entityGetChildren` — Get Entity Children

> Retrieves all child entities or a specific child by index.

- **Type:** `entityGetChildren` | **Role:** `action` | **Header:** `Get Entity Children` (`#8E24AA`) | **Category:** `Entity & Transform` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `targetEntity` | `string` | `#F48FB1` | `"self"` |
| `index` | `number` | `#64B5F6` | `0` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |
| `childEntities` | `list` | `#4DD0E1` |
| `childEntity` | `string` | `#F48FB1` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const parentEntity = context.entity.get(inputs.targetEntity);
const children = context.entity.getChildren(parentEntity);
const childrenIds = children.map(c => c.scriptId);
const indexVal = Math.floor(inputs.index);

outputs.childEntities = childrenIds;
outputs.childEntity = (indexVal >= 0 && indexVal < childrenIds.length) ? childrenIds[indexVal] : '';
outputs.execOut = true;
return;
```
</details>

<a id="node-entityGetChildByName"></a>
#### 2.3.6 `entityGetChildByName` — Get Child By Name

> Finds a child entity under a parent by its prefab or original script name.

- **Type:** `entityGetChildByName` | **Role:** `action` | **Header:** `Get Child By Name` (`#8E24AA`) | **Category:** `Entity & Transform` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `targetEntity` | `string` | `#F48FB1` | `"self"` |
| `childName` | `string` | `#F48FB1` | `""` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |
| `childEntity` | `string` | `#F48FB1` |
| `found` | `boolean` | `#E57373` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const targetEntity = inputs.targetEntity;
const childName = inputs.childName;

let matched = '';
if (context.entity && typeof context.entity.getChildByName === 'function') {
  const child = context.entity.getChildByName(targetEntity, childName);
  if (child) matched = child.scriptId || child.id || '';
} else if (context.entity && typeof context.entity.getChildren === 'function') {
  const parent = context.entity.get(targetEntity);
  const children = context.entity.getChildren(parent);
  const search = String(childName || '').trim().toLowerCase();
  if (search && children) {
    const item = children.find(c => {
      const sId = String(c.scriptId || '').toLowerCase();
      return sId === search || sId.startsWith(search + '_');
    });
    if (item) matched = item.scriptId || item.id || '';
  }
}

outputs.childEntity = matched;
outputs.found = Boolean(matched);
outputs.execOut = true;
return;
```
</details>

<a id="node-entityGetParent"></a>
#### 2.3.7 `entityGetParent` — Get Entity Parent

> Retrieves the parent entity ID of the target entity.

- **Type:** `entityGetParent` | **Role:** `action` | **Header:** `Get Entity Parent` (`#8E24AA`) | **Category:** `Entity & Transform` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `targetEntity` | `string` | `#F48FB1` | `"self"` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |
| `parentEntity` | `string` | `#F48FB1` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const childEntity = context.entity.get(inputs.targetEntity);
const parent = context.entity.getParent(childEntity);
outputs.parentEntity = parent ? parent.scriptId : '';
outputs.execOut = true;
return;
```
</details>

<a id="node-getObject"></a>
#### 2.3.8 `getObject` — Get Object Info

> Get entity info like Entity ID, Name, Tag, Active, Visible

- **Type:** `getObject` | **Role:** `pure` | **Header:** `Get Object` (`#00838F`) | **Category:** `Entity & Transform` | **Dynamic Mode:** `outputProperty`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `targetEntity` | `string` | `#F48FB1` | `"self"` |

- **Output Ports (`outputs`):** *Empty by default (`[]`). Added dynamically from `data.propertyOptions` below.*

**Dynamic Output Property Options (`data.propertyOptions`):**

| Port ID (`value`) | Inspector Label (`label`) | Data Type (`type`) | Pin Color (`color`) |
| :--- | :--- | :--- | :--- |
| `entityId` | Entity ID | `string` | `#F48FB1` |
| `tagName` | Tag Name | `string` | `#F48FB1` |
| `tags` | Tags | `list` | `#4DD0E1` |
| `active` | Active | `boolean` | `#E57373` |
| `visible` | Visible | `boolean` | `#E57373` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const entity = context.assert.exists(context.entity.get(inputs.targetEntity), 'Target entity must exist');

outputs.entityId = entity.scriptId;
outputs.tagName = entity.tag;
outputs.tags = Array.isArray(entity.tags) ? [...entity.tags] : (entity.tag && entity.tag !== 'untagged' ? [entity.tag] : []);
outputs.active = entity.active;
outputs.visible = entity.visible;
return;
```
</details>

<a id="node-setObject"></a>
#### 2.3.9 `setObject` — Set Object Info

> Set entity info like Tag, Active, Visible

- **Type:** `setObject` | **Role:** `action` | **Header:** `Set Object` (`#00838F`) | **Category:** `Entity & Transform` | **Dynamic Mode:** `inputProperty`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `targetEntity` | `string` | `#F48FB1` | `"self"` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |

**Dynamic Input Property Options (`data.propertyOptions`):**

| Port ID (`value`) | Inspector Label (`label`) | Data Type (`type`) | Pin Color (`color`) |
| :--- | :--- | :--- | :--- |
| `tag` | Tag | `string` | `#F48FB1` |
| `active` | Active | `boolean` | `#E57373` |
| `visible` | Visible | `boolean` | `#E57373` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const entity = context.assert.exists(context.entity.get(inputs.targetEntity), 'Target entity must exist');

const propKeys = ['tag', 'active', 'visible'];
for (const key of propKeys) {
  if (key in inputs) {
    if (key === 'tag') {
      entity.tag = inputs.tag;
    } else {
      entity[key] = inputs[key];
    }
  }
}

outputs.execOut = true;
return;
```
</details>

<a id="node-findClosestByTag"></a>
#### 2.3.10 `findClosestByTag` — Find Closest By Tag

> Finds the nearest active entity with a specific tag relative to a 2D position

- **Type:** `findClosestByTag` | **Role:** `pure` | **Header:** `Find Closest Tag` (`#00838F`) | **Category:** `Entity & Transform` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `tag` | `string` | `#F48FB1` | `"Enemy"` |
| `fromX` | `number` | `#64B5F6` | `0` |
| `fromY` | `number` | `#64B5F6` | `0` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `targetEntity` | `string` | `#F48FB1` |
| `found` | `boolean` | `#E57373` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const closest = context.entity.findClosestByTag(inputs.tag, inputs.fromX, inputs.fromY);

outputs.targetEntity = closest ? closest.scriptId : '';
outputs.found = Boolean(closest);
return;
```
</details>

<a id="node-entityCountByTag"></a>
#### 2.3.11 `entityCountByTag` — Count Entities by Tag

> Counts active entities in the scene that have a specific tag.

- **Type:** `entityCountByTag` | **Role:** `pure` | **Header:** `Count by Tag` (`#00838F`) | **Category:** `Entity & Transform` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `tag` | `string` | `#F48FB1` | `"Enemy"` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `count` | `number` | `#64B5F6` |
| `hasAny` | `boolean` | `#E57373` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const tag = inputs.tag;
const count = context.entity && typeof context.entity.countByTag === 'function'
  ? context.entity.countByTag(tag)
  : (context.entity && typeof context.entity.getAllByTag === 'function' ? context.entity.getAllByTag(tag).length : 0);

outputs.count = count;
outputs.hasAny = count > 0;
return;
```
</details>

<a id="node-entityHasTag"></a>
#### 2.3.12 `entityHasTag` — Entity Has Tag

> Checks if an entity has a specific tag.

- **Type:** `entityHasTag` | **Role:** `pure` | **Header:** `Has Tag` (`#00838F`) | **Category:** `Entity & Transform` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `targetEntity` | `string` | `#F48FB1` | `"self"` |
| `tag` | `string` | `#F48FB1` | `"Enemy"` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `hasTag` | `boolean` | `#E57373` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const entity = context.assert.exists(context.entity.get(inputs.targetEntity), 'Target entity must exist');
const tag = inputs.tag;
const match = typeof entity.hasTag === 'function'
  ? entity.hasTag(tag)
  : (Array.isArray(entity.tags) ? entity.tags.some(t => String(t).trim().toLowerCase() === String(tag).trim().toLowerCase()) : String(entity.tag || '').trim().toLowerCase() === String(tag).trim().toLowerCase());

outputs.hasTag = Boolean(match);
return;
```
</details>

<a id="node-entityGetAllByTag"></a>
#### 2.3.13 `entityGetAllByTag` — Get All Entities by Tag

> Finds all active entities in the scene with a specific tag as a list of script IDs.

- **Type:** `entityGetAllByTag` | **Role:** `pure` | **Header:** `Get All by Tag` (`#00838F`) | **Category:** `Entity & Transform` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `tag` | `string` | `#F48FB1` | `"Enemy"` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `entities` | `list` | `#4DD0E1` |
| `count` | `number` | `#64B5F6` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const tag = inputs.tag;
const list = context.entity && typeof context.entity.getAllByTag === 'function'
  ? context.entity.getAllByTag(tag)
  : [];

outputs.entities = list.map(e => e.scriptId || e.id);
outputs.count = list.length;
return;
```
</details>

<a id="node-entityAddTag"></a>
#### 2.3.14 `entityAddTag` — Add Tag to Entity

> Adds a tag to the target entity during runtime.

- **Type:** `entityAddTag` | **Role:** `action` | **Header:** `Add Tag` (`#00838F`) | **Category:** `Entity & Transform` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `targetEntity` | `string` | `#F48FB1` | `"self"` |
| `tag` | `string` | `#F48FB1` | `""` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |
| `success` | `boolean` | `#E57373` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const entity = context.assert.exists(context.entity.get(inputs.targetEntity), 'Target entity must exist');
const tag = inputs.tag;
let success = false;
if (typeof entity.addTag === 'function') {
  success = entity.addTag(tag);
} else {
  if (!Array.isArray(entity.tags)) entity.tags = entity.tag && entity.tag !== 'untagged' ? [entity.tag] : [];
  const clean = String(tag || '').trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
  if (clean && !entity.tags.some(t => t.toLowerCase() === clean.toLowerCase())) {
    entity.tags.push(clean);
    entity.tag = entity.tags[0];
    success = true;
  }
}

outputs.success = success;
outputs.execOut = true;
return;
```
</details>

<a id="node-entityRemoveTag"></a>
#### 2.3.15 `entityRemoveTag` — Remove Tag from Entity

> Removes a tag from the target entity during runtime.

- **Type:** `entityRemoveTag` | **Role:** `action` | **Header:** `Remove Tag` (`#00838F`) | **Category:** `Entity & Transform` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `targetEntity` | `string` | `#F48FB1` | `"self"` |
| `tag` | `string` | `#F48FB1` | `""` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |
| `success` | `boolean` | `#E57373` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const entity = context.assert.exists(context.entity.get(inputs.targetEntity), 'Target entity must exist');
const tag = inputs.tag;
let success = false;
if (typeof entity.removeTag === 'function') {
  success = entity.removeTag(tag);
} else {
  if (Array.isArray(entity.tags)) {
    const targetLower = String(tag || '').trim().toLowerCase();
    const prevLen = entity.tags.length;
    entity.tags = entity.tags.filter(t => t.toLowerCase() !== targetLower);
    entity.tag = entity.tags[0] || 'untagged';
    success = entity.tags.length !== prevLen;
  }
}

outputs.success = success;
outputs.execOut = true;
return;
```
</details>

<a id="node-getTransform"></a>
#### 2.3.16 `getTransform` — Get Transform

> Get specific transform properties of Self or Target.

- **Type:** `getTransform` | **Role:** `pure` | **Header:** `Get Transform` (`#64B5F6`) | **Category:** `Entity & Transform` | **Dynamic Mode:** `outputProperty`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `targetEntity` | `string` | `#F48FB1` | `"self"` |

- **Output Ports (`outputs`):** *Empty by default (`[]`). Added dynamically from `data.propertyOptions` below.*

**Dynamic Output Property Options (`data.propertyOptions`):**

| Port ID (`value`) | Inspector Label (`label`) | Data Type (`type`) | Pin Color (`color`) |
| :--- | :--- | :--- | :--- |
| `x` | Position X | `number` | `#64B5F6` |
| `y` | Position Y | `number` | `#64B5F6` |
| `rotation` | Rotation | `number` | `#64B5F6` |
| `scaleX` | Scale X | `number` | `#64B5F6` |
| `scaleY` | Scale Y | `number` | `#64B5F6` |
| `width` | Width | `number` | `#64B5F6` |
| `height` | Height | `number` | `#64B5F6` |
| `pivotX` | Pivot X | `number` | `#64B5F6` |
| `pivotY` | Pivot Y | `number` | `#64B5F6` |
| `anchorX` | Anchor X | `number` | `#64B5F6` |
| `anchorY` | Anchor Y | `number` | `#64B5F6` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const targetId = inputs.targetEntity;
const entity = context.assert.exists(context.entity.get(targetId));
const t = entity.components.UITransform || context.assert.hasComponent(entity, 'Transform');

outputs.x = t.x;
outputs.y = t.y;
outputs.rotation = t.rotation;
outputs.scaleX = t.scaleX;
outputs.scaleY = t.scaleY;
outputs.width = t.width;
outputs.height = t.height;
outputs.pivotX = t.pivotX;
outputs.pivotY = t.pivotY;
outputs.anchorX = t.anchorX;
outputs.anchorY = t.anchorY;
return;
```
</details>

<a id="node-setTransform"></a>
#### 2.3.17 `setTransform` — Set Transform

> Teleport or modify absolute transform properties.

- **Type:** `setTransform` | **Role:** `action` | **Header:** `Set Transform` (`#64B5F6`) | **Category:** `Entity & Transform` | **Dynamic Mode:** `inputProperty`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `targetEntity` | `string` | `#F48FB1` | `"self"` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |

**Dynamic Input Property Options (`data.propertyOptions`):**

| Port ID (`value`) | Inspector Label (`label`) | Data Type (`type`) | Pin Color (`color`) |
| :--- | :--- | :--- | :--- |
| `x` | Position X | `number` | `#64B5F6` |
| `y` | Position Y | `number` | `#64B5F6` |
| `rotation` | Rotation | `number` | `#64B5F6` |
| `scaleX` | Scale X | `number` | `#64B5F6` |
| `scaleY` | Scale Y | `number` | `#64B5F6` |
| `width` | Width | `number` | `#64B5F6` |
| `height` | Height | `number` | `#64B5F6` |
| `pivotX` | Pivot X | `number` | `#64B5F6` |
| `pivotY` | Pivot Y | `number` | `#64B5F6` |
| `anchorX` | Anchor X | `number` | `#64B5F6` |
| `anchorY` | Anchor Y | `number` | `#64B5F6` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const targetId = inputs.targetEntity;
const entity = context.assert.exists(context.entity.get(targetId));
const t = entity.components.UITransform || context.assert.hasComponent(entity, 'Transform');

const propKeys = ['x', 'y', 'rotation', 'scaleX', 'scaleY', 'width', 'height', 'pivotX', 'pivotY', 'anchorX', 'anchorY'];
for (const key of propKeys) {
  if (key in inputs) {
    const val = inputs[key];
    if (val !== '' && !isNaN(val)) {
      t[key] = Number(val);
    }
  }
}

outputs.execOut = true;
return;
```
</details>

<a id="node-getLayer"></a>
#### 2.3.18 `getLayer` — Get Layer Info

> Get layer info like ID, Name, Visible, Locked, Z-Index, Opacity

- **Type:** `getLayer` | **Role:** `pure` | **Header:** `Get Layer` (`#6A1B9A`) | **Category:** `Entity & Transform` | **Dynamic Mode:** `outputProperty`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `targetLayer` | `string` | `#F48FB1` | `"self"` |

- **Output Ports (`outputs`):** *Empty by default (`[]`). Added dynamically from `data.propertyOptions` below.*

**Dynamic Output Property Options (`data.propertyOptions`):**

| Port ID (`value`) | Inspector Label (`label`) | Data Type (`type`) | Pin Color (`color`) |
| :--- | :--- | :--- | :--- |
| `layerId` | Layer ID | `string` | `#F48FB1` |
| `visible` | Visible | `boolean` | `#E57373` |
| `active` | Active | `boolean` | `#E57373` |
| `locked` | Locked | `boolean` | `#E57373` |
| `zIndex` | Z-Index | `number` | `#64B5F6` |
| `opacity` | Opacity (%) | `number` | `#64B5F6` |
| `freezeInput` | Freeze Input | `boolean` | `#E57373` |
| `freezeInputType` | Freeze Input Type | `string` | `#F48FB1` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const layer = context.assert.exists(context.layer.get(inputs.targetLayer));

outputs.layerId = layer.scriptId;
outputs.visible = layer.visible;
outputs.active = layer.active;
outputs.locked = layer.locked;
outputs.zIndex = layer.zIndex;
outputs.opacity = Math.round(layer.opacity * 100);
outputs.freezeInput = Boolean(layer.freezeInput);
outputs.freezeInputType = layer.freezeInputType || 'all';
return;
```
</details>

<a id="node-setLayer"></a>
#### 2.3.19 `setLayer` — Set Layer Info

> Set layer info like Visible, Locked, Z-Index, Opacity

- **Type:** `setLayer` | **Role:** `action` | **Header:** `Set Layer` (`#6A1B9A`) | **Category:** `Entity & Transform` | **Dynamic Mode:** `inputProperty`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `targetLayer` | `string` | `#F48FB1` | `"self"` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |

**Dynamic Input Property Options (`data.propertyOptions`):**

| Port ID (`value`) | Inspector Label (`label`) | Data Type (`type`) | Pin Color (`color`) |
| :--- | :--- | :--- | :--- |
| `visible` | Visible | `boolean` | `#E57373` |
| `active` | Active | `boolean` | `#E57373` |
| `locked` | Locked | `boolean` | `#E57373` |
| `zIndex` | Z-Index | `number` | `#64B5F6` |
| `opacity` | Opacity (%) | `number` | `#64B5F6` |
| `freezeInput` | Freeze Input | `boolean` | `#E57373` |
| `freezeInputType` | Freeze Input Type | `string` | `#F48FB1` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const layer = context.assert.exists(context.layer.get(inputs.targetLayer));

const propKeys = ['visible', 'active', 'locked', 'zIndex', 'freezeInput', 'freezeInputType'];
for (const key of propKeys) {
  if (key in inputs) {
    layer[key] = inputs[key];
  }
}
if ('opacity' in inputs) {
  layer.opacity = Math.max(0, Math.min(100, inputs.opacity)) / 100;
}

outputs.execOut = true;
return;
```
</details>

<a id="node-layerDestroy"></a>
#### 2.3.20 `layerDestroy` — Destroy Layer

> Removes a layer and optionally its entities from the world.

- **Type:** `layerDestroy` | **Role:** `action` | **Header:** `Destroy Layer` (`#6A1B9A`) | **Category:** `Entity & Transform` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `targetLayer` | `string` | `#F48FB1` | `"self"` |
| `destroyEntities` | `boolean` | `#E57373` | `true` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |
| `success` | `boolean` | `#E57373` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const target = inputs.targetLayer;
const destroyEnts = inputs.destroyEntities !== false;
const success = context.layer && typeof context.layer.destroy === 'function'
  ? context.layer.destroy(target, destroyEnts)
  : false;
outputs.success = Boolean(success);
outputs.execOut = true;
return;
```
</details>

---

<a id="24-game-physics"></a>
### 2.4 Physics & Collision (`game_physics`)

- **Module Export:** `BlueprintPhysics` ([BlueprintPhysics.js](../editor/src/features/nodes/library/blueprints/BlueprintPhysics.js))
- **Backward-Compatibility Re-export Aliases:** `BlueprintCollider`
- **Category Color:** `#8BC34A` | **Icon:** `Activity` | **Total Nodes:** **9**

| # | Type (`type`) | Label | Header Title | Role | Dynamic Mode | Description |
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |
| 1 | [`moveAndSlide`](#node-moveAndSlide) | **Move and Slide** | `Move and Slide` | `action` | `none` | Move character with collision handling (For Kinematic Bodies) |
| 2 | [`solidCollision`](#node-solidCollision) | **Solid Collision** | `Solid Collision` | `action` | `none` | Check if an object is hitting a solid wall or obstacle. |
| 3 | [`triggerZone`](#node-triggerZone) | **Trigger Zone** | `Trigger Zone` | `action` | `none` | Detects when an object enters, stays, or exits an area. |
| 4 | [`getPhysics`](#node-getPhysics) | **Get Physics Info** | `Get Physics` | `pure` | `outputProperty` | Get physics component properties like Velocity, Grounded, Mass, etc. |
| 5 | [`setPhysics`](#node-setPhysics) | **Set Physics Info** | `Set Physics` | `action` | `inputProperty` | Set physics component properties like Velocity, Mass, etc. |
| 6 | [`setFaceDirection`](#node-setFaceDirection) | **Set Face Direction** | `Set Face Direction` | `action` | `none` | Automatically sets the entity facing direction based on 2D Axis inputs |
| 7 | [`applyKnockback`](#node-applyKnockback) | **Apply Knockback** | `Apply Knockback` | `action` | `none` | Applies impulse knockback force to an entity with deceleration friction over time. |
| 8 | [`raycast2D`](#node-raycast2D) | **Raycast 2D** | `Raycast 2D` | `action` | `none` | Projects a 2D ray in a direction to detect obstacles, colliders, or entities with line of sight. |
| 9 | [`manageCollider`](#node-manageCollider) | **Manage Collider** | `Manage Collider` | `action` | `none` | Dynamically modify, add, remove, or toggle entity colliders and shapes. |

<a id="node-moveAndSlide"></a>
#### 2.4.1 `moveAndSlide` — Move and Slide

> Move character with collision handling (For Kinematic Bodies)

- **Type:** `moveAndSlide` | **Role:** `action` | **Header:** `Move and Slide` (`#2E7D32`) | **Category:** `Physics & Collision` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `targetEntity` | `string` | `#F48FB1` | `"self"` |
| `velocityX` | `number` | `#64B5F6` | `0` |
| `velocityY` | `number` | `#64B5F6` | `0` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |
| `isColliding` | `boolean` | `#E57373` |
| `hitX` | `boolean` | `#E57373` |
| `hitY` | `boolean` | `#E57373` |
| `isGrounded` | `boolean` | `#81C784` |
| `realVelocityX` | `number` | `#64B5F6` |
| `realVelocityY` | `number` | `#64B5F6` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const targetId = inputs.targetEntity || 'self';
const entity = context.assert.exists(context.entity.get(targetId));
const phys = entity.components && entity.components.Physics;

if (phys && phys.isFrozen) {
  outputs.execOut = true;
  outputs.isColliding = false;
  outputs.hitX = false;
  outputs.hitY = false;
  outputs.isGrounded = Boolean(phys.isGrounded);
  outputs.realVelocityX = 0;
  outputs.realVelocityY = 0;
  return;
}

const velX = Number(inputs.velocityX) || 0;
const velY = Number(inputs.velocityY) || 0;
const dt = Number(context.dt || context.deltaTime || 0.016);
const hasPhysics = Boolean(phys && phys.enabled);

if (hasPhysics) {
  phys.velocityX = velX;
  if (phys.gravityScale === 0 || velY !== 0) {
    phys.velocityY = velY;
  }
  phys._isIntentionalMove = Math.abs(velX) > 10 || Math.abs(velY) > 10;

  outputs.isGrounded = Boolean(phys.isGrounded);
  outputs.isColliding = Boolean(phys.collisionInfo && phys.collisionInfo.hitSolid);
  outputs.hitX = Boolean(phys.collisionInfo && phys.collisionInfo.hitSolidX);
  outputs.hitY = Boolean(phys.collisionInfo && phys.collisionInfo.hitSolidY);
  outputs.realVelocityX = phys.velocityX;
  outputs.realVelocityY = phys.velocityY;
} else {
  const moveX = velX * dt;
  const moveY = velY * dt;
  const hitResult = context.collider.moveAndSlide(entity, moveX, moveY);

  const hasHit = Boolean(hitResult);
  outputs.isColliding = hasHit;
  outputs.hitX = Boolean(hitResult && hitResult.x);
  outputs.hitY = Boolean(hitResult && hitResult.y);
  outputs.isGrounded = Boolean(hitResult && hitResult.y && moveY >= 0);
  outputs.realVelocityX = hitResult && hitResult.x ? 0 : velX;
  outputs.realVelocityY = hitResult && hitResult.y ? 0 : velY;
}

outputs.execOut = true;
return;
```
</details>

<a id="node-solidCollision"></a>
#### 2.4.2 `solidCollision` — Solid Collision

> Check if an object is hitting a solid wall or obstacle.

- **Type:** `solidCollision` | **Role:** `action` | **Header:** `Solid Collision` (`#D32F2F`) | **Category:** `Physics & Collision` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `targetEntity` | `string` | `#F48FB1` | `"self"` |
| `tag` | `string` | `#F48FB1` | `""` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |
| `onHit` | `execution` | `#FFFFFF` |
| `isColliding` | `boolean` | `#E57373` |
| `selfEntity` | `string` | `#F48FB1` |
| `otherEntity` | `string` | `#F48FB1` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const entity = context.assert.exists(context.entity.get(inputs.targetEntity));
let hitObject = context.collider.checkSolid(entity);

if (hitObject && inputs.tag && inputs.tag.trim() !== '') {
  const targetLower = inputs.tag.trim().toLowerCase();
  const match = typeof hitObject.hasTag === 'function' ? hitObject.hasTag(targetLower) : (Array.isArray(hitObject.tags) ? hitObject.tags.some(t => String(t).trim().toLowerCase() === targetLower) : String(hitObject.tag || (hitObject.components && hitObject.components.Tags && hitObject.components.Tags.value) || '').trim().toLowerCase() === targetLower);
  if (!match) {
    hitObject = null;
  }
}

const selfScriptId = entity.scriptId;
const hitScriptId = hitObject ? hitObject.scriptId : '';
const isColliding = Boolean(hitObject);

outputs.selfEntity = selfScriptId;
outputs.otherEntity = hitScriptId;
outputs.isColliding = isColliding;
outputs.execOut = true;

if (isColliding) {
  outputs.onHit = true;
}
return;
```
</details>

<a id="node-triggerZone"></a>
#### 2.4.3 `triggerZone` — Trigger Zone

> Detects when an object enters, stays, or exits an area.

- **Type:** `triggerZone` | **Role:** `action` | **Header:** `Trigger Zone` (`#0097A7`) | **Category:** `Physics & Collision` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `targetEntity` | `string` | `#F48FB1` | `"self"` |
| `tag` | `string` | `#F48FB1` | `""` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |
| `onEnter` | `execution` | `#FFFFFF` |
| `onExit` | `execution` | `#FFFFFF` |
| `isInside` | `boolean` | `#E57373` |
| `selfEntity` | `string` | `#F48FB1` |
| `otherEntity` | `string` | `#F48FB1` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const entity = context.assert.exists(context.entity.get(inputs.targetEntity));

if (!context.state.triggerStates) {
  context.state.triggerStates = {};
}

const entityScriptId = entity.scriptId;
let myState = context.state.triggerStates[entityScriptId];
if (!myState) {
  myState = { isOverlapping: false, lastId: '' };
  context.state.triggerStates[entityScriptId] = myState;
}

const overlapObject = context.collider.checkOverlap(entity, inputs.tag);

const currentId = overlapObject ? overlapObject.scriptId : '';

const previousId = myState.lastId;
const isCurrentlyOverlapping = Boolean(currentId);

outputs.selfEntity = entityScriptId;
outputs.otherEntity = currentId || previousId;
outputs.isInside = isCurrentlyOverlapping;

if (!previousId && currentId) {
  myState.lastId = currentId;
  outputs.onEnter = true;
} else if (previousId && currentId && previousId !== currentId) {
  myState.lastId = currentId;
  outputs.onEnter = true;
} else if (previousId && !currentId) {
  myState.lastId = '';
  outputs.otherEntity = previousId;
  outputs.isInside = false;
  outputs.onExit = true;
}

myState.isOverlapping = isCurrentlyOverlapping;
outputs.execOut = true;
return;
```
</details>

<a id="node-getPhysics"></a>
#### 2.4.4 `getPhysics` — Get Physics Info

> Get physics component properties like Velocity, Grounded, Mass, etc.

- **Type:** `getPhysics` | **Role:** `pure` | **Header:** `Get Physics` (`#2E7D32`) | **Category:** `Physics & Collision` | **Dynamic Mode:** `outputProperty`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `targetEntity` | `string` | `#F48FB1` | `"self"` |

- **Output Ports (`outputs`):** *Empty by default (`[]`). Added dynamically from `data.propertyOptions` below.*

**Dynamic Output Property Options (`data.propertyOptions`):**

| Port ID (`value`) | Inspector Label (`label`) | Data Type (`type`) | Pin Color (`color`) |
| :--- | :--- | :--- | :--- |
| `velocityX` | Velocity X | `number` | `#64B5F6` |
| `velocityY` | Velocity Y | `number` | `#64B5F6` |
| `isGrounded` | Is Grounded | `boolean` | `#E57373` |
| `movementState` | Movement State | `string` | `#F48FB1` |
| `facingDirection` | Facing Direction | `string` | `#F48FB1` |
| `mass` | Mass | `number` | `#64B5F6` |
| `gravityScale` | Gravity Scale | `number` | `#64B5F6` |
| `drag` | Drag | `number` | `#64B5F6` |
| `enabled` | Enabled | `boolean` | `#E57373` |
| `isFrozen` | Is Frozen | `boolean` | `#E57373` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const targetId = inputs.targetEntity;
const entity = context.assert.exists(context.entity.get(targetId));
const phys = context.assert.hasComponent(entity, 'Physics');

outputs.velocityX = phys.velocityX;
outputs.velocityY = phys.velocityY;
outputs.isGrounded = phys.isGrounded;
outputs.movementState = phys.movementState;
outputs.facingDirection = phys.facingDirection;
outputs.mass = phys.mass;
outputs.gravityScale = phys.gravityScale;
outputs.drag = phys.drag;
outputs.enabled = phys.enabled;
outputs.isFrozen = phys.isFrozen;
return;
```
</details>

<a id="node-setPhysics"></a>
#### 2.4.5 `setPhysics` — Set Physics Info

> Set physics component properties like Velocity, Mass, etc.

- **Type:** `setPhysics` | **Role:** `action` | **Header:** `Set Physics` (`#2E7D32`) | **Category:** `Physics & Collision` | **Dynamic Mode:** `inputProperty`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `targetEntity` | `string` | `#F48FB1` | `"self"` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |

**Dynamic Input Property Options (`data.propertyOptions`):**

| Port ID (`value`) | Inspector Label (`label`) | Data Type (`type`) | Pin Color (`color`) |
| :--- | :--- | :--- | :--- |
| `velocityX` | Velocity X | `number` | `#64B5F6` |
| `velocityY` | Velocity Y | `number` | `#64B5F6` |
| `mass` | Mass | `number` | `#64B5F6` |
| `gravityScale` | Gravity Scale | `number` | `#64B5F6` |
| `drag` | Drag | `number` | `#64B5F6` |
| `enabled` | Enabled | `boolean` | `#E57373` |
| `isFrozen` | Is Frozen | `boolean` | `#E57373` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const targetId = inputs.targetEntity;
const entity = context.assert.exists(context.entity.get(targetId));
const phys = context.assert.hasComponent(entity, 'Physics');

const numericKeys = ['velocityX', 'velocityY', 'mass', 'gravityScale', 'drag'];
for (const key of numericKeys) {
  if (key in inputs && inputs[key] !== '' && !Number.isNaN(Number(inputs[key]))) {
    phys[key] = Number(inputs[key]);
  }
}

if ('velocityX' in inputs && inputs.velocityX !== '' && !Number.isNaN(Number(inputs.velocityX))) {
  phys._isIntentionalMove = Math.abs(Number(inputs.velocityX)) > 10;
}
if ('velocityY' in inputs && inputs.velocityY !== '' && !Number.isNaN(Number(inputs.velocityY))) {
  phys._isIntentionalMove = Math.abs(Number(inputs.velocityY)) > 10;
}
if ('enabled' in inputs && inputs.enabled !== '') {
  phys.enabled = Boolean(inputs.enabled);
}
if ('isFrozen' in inputs && inputs.isFrozen !== '') {
  phys.isFrozen = Boolean(inputs.isFrozen);
}

outputs.execOut = true;
return;
```
</details>

<a id="node-setFaceDirection"></a>
#### 2.4.6 `setFaceDirection` — Set Face Direction

> Automatically sets the entity facing direction based on 2D Axis inputs

- **Type:** `setFaceDirection` | **Role:** `action` | **Header:** `Set Face Direction` (`#2E7D32`) | **Category:** `Physics & Collision` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `targetEntity` | `string` | `#F48FB1` | `"self"` |
| `axisX` | `number` | `#64B5F6` | `0` |
| `axisY` | `number` | `#64B5F6` | `0` |
| `mode` | `string` | `#F48FB1` | `"horizontal"` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |

**Selectable Options (`data.options`):**

- **`mode`** (default: `"horizontal"`): `"horizontal"` (Horizontal Only), `"vertical"` (Vertical Only), `"4-way"` (4-Direction (Top/Side)), `"8-way"` (8-Direction (Diagonal))

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const targetId = inputs.targetEntity;
const target = context.assert.exists(context.entity.get(targetId));
const phys = context.assert.hasComponent(target, 'Physics');
const axisX = inputs.axisX;
const axisY = inputs.axisY;
const mode = inputs.mode;

phys.customFacing = true;

if (mode === 'horizontal') {
  if (axisX > 0) phys.facingDirection = 'right';
  else if (axisX < 0) phys.facingDirection = 'left';
} else if (mode === 'vertical') {
  if (axisY > 0) phys.facingDirection = 'down';
  else if (axisY < 0) phys.facingDirection = 'up';
} else if (mode === '4-way') {
  if (Math.abs(axisX) > Math.abs(axisY)) {
    phys.facingDirection = axisX > 0 ? 'right' : 'left';
  } else if (Math.abs(axisY) > 0) {
    phys.facingDirection = axisY > 0 ? 'down' : 'up';
  }
} else if (mode === '8-way') {
  if (axisX > 0 && axisY < 0) phys.facingDirection = 'up-right';
  else if (axisX > 0 && axisY > 0) phys.facingDirection = 'down-right';
  else if (axisX < 0 && axisY < 0) phys.facingDirection = 'up-left';
  else if (axisX < 0 && axisY > 0) phys.facingDirection = 'down-left';
  else if (axisX > 0) phys.facingDirection = 'right';
  else if (axisX < 0) phys.facingDirection = 'left';
  else if (axisY < 0) phys.facingDirection = 'up';
  else if (axisY > 0) phys.facingDirection = 'down';
}

outputs.execOut = true;
return;
```
</details>

<a id="node-applyKnockback"></a>
#### 2.4.7 `applyKnockback` — Apply Knockback

> Applies impulse knockback force to an entity with deceleration friction over time.

- **Type:** `applyKnockback` | **Role:** `action` | **Header:** `Apply Knockback` (`#EF5350`) | **Category:** `Physics & Collision` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `targetEntity` | `string` | `#F48FB1` | `"self"` |
| `forceX` | `number` | `#64B5F6` | `200` |
| `forceY` | `number` | `#64B5F6` | `-100` |
| `duration` | `number` | `#64B5F6` | `0.3` |
| `friction` | `number` | `#64B5F6` | `0.9` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |
| `onFinished` | `execution` | `#FFFFFF` |
| `isKnocked` | `boolean` | `#81C784` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const targetId = inputs.targetEntity || 'self';
const entity = context.assert.exists(context.entity.get(targetId));
const phys = entity.components && entity.components.Physics;

const forceX = Number(inputs.forceX) || 0;
const forceY = Number(inputs.forceY) || 0;
const rawDuration = Number(inputs.duration);
const duration = isNaN(rawDuration) ? 0.3 : Math.max(0, rawDuration);
const friction = Number(inputs.friction) || 0.9;

if (phys) {
  phys.velocityX = forceX;
  phys.velocityY = forceY;
  phys._knockbackActive = true;
}

outputs.isKnocked = true;
outputs.execOut = true;

if (duration <= 0) {
  outputs.isKnocked = false;
  outputs.onFinished = true;
  if (typeof context.triggerFlow === 'function') context.triggerFlow('onFinished');
  return;
}

context.state.knockbackRemaining = duration;
context.state.knockbackVx = forceX;
context.state.knockbackVy = forceY;
context.state.isKnocked = true;

if (typeof context.onTick === 'function') {
  context.onTick((dt) => {
    if (!context.state.isKnocked) return;
    const deltaSec = typeof dt === 'number' ? dt : Number(context.dt || 0.016);
    context.state.knockbackRemaining -= deltaSec;
    context.state.knockbackVx *= friction;
    context.state.knockbackVy *= friction;

    if (phys) {
      phys.velocityX = context.state.knockbackVx;
      phys.velocityY = context.state.knockbackVy;
    }

    if (context.state.knockbackRemaining <= 0) {
      context.state.isKnocked = false;
      if (phys) {
        phys._knockbackActive = false;
      }
      outputs.isKnocked = false;
      outputs.onFinished = true;
      if (typeof context.triggerFlow === 'function') context.triggerFlow('onFinished');
    }
  });
}
return;
```
</details>

<a id="node-raycast2D"></a>
#### 2.4.8 `raycast2D` — Raycast 2D

> Projects a 2D ray in a direction to detect obstacles, colliders, or entities with line of sight.

- **Type:** `raycast2D` | **Role:** `action` | **Header:** `Raycast 2D` (`#26A69A`) | **Category:** `Physics & Collision` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `sourceEntity` | `string` | `#F48FB1` | `"self"` |
| `useEntityOrigin` | `boolean` | `#E57373` | `true` |
| `originX` | `number` | `#64B5F6` | `0` |
| `originY` | `number` | `#64B5F6` | `0` |
| `dirX` | `number` | `#64B5F6` | `1` |
| `dirY` | `number` | `#64B5F6` | `0` |
| `distance` | `number` | `#64B5F6` | `100` |
| `stepSize` | `number` | `#64B5F6` | `8` |
| `targetTag` | `string` | `#F48FB1` | `""` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |
| `onHit` | `execution` | `#FFFFFF` |
| `onMiss` | `execution` | `#FFFFFF` |
| `hasHit` | `boolean` | `#81C784` |
| `hitX` | `number` | `#64B5F6` |
| `hitY` | `number` | `#64B5F6` |
| `hitDistance` | `number` | `#64B5F6` |
| `hitEntity` | `string` | `#F48FB1` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const srcId = inputs.sourceEntity || 'self';
const source = (context.entity && typeof context.entity.get === 'function') ? context.entity.get(srcId) : false;
let startX = Number(inputs.originX) || 0;
let startY = Number(inputs.originY) || 0;

if (inputs.useEntityOrigin && source) {
  const tr = source.components && (source.components.Transform || source.components.UITransform);
  if (tr) {
    startX += (typeof tr.x === 'number' ? tr.x : 0);
    startY += (typeof tr.y === 'number' ? tr.y : 0);
  }
}

const rawDx = Number(inputs.dirX) || 0;
const rawDy = Number(inputs.dirY) || 0;
const len = Math.sqrt(rawDx * rawDx + rawDy * rawDy) || 1;
const ndx = rawDx / len;
const ndy = rawDy / len;

const maxDist = Math.max(0, Number(inputs.distance) || 100);
const step = Math.max(1, Number(inputs.stepSize) || 8);
const filterTag = String(inputs.targetTag || '').trim();

let candidates = [];
if (filterTag && context.entity && typeof context.entity.getAllByTag === 'function') {
  candidates = context.entity.getAllByTag(filterTag);
} else if (context.entity && typeof context.entity.getAll === 'function') {
  candidates = context.entity.getAll();
}

let hitFound = false;
let hitDist = maxDist;
let hitPx = startX + ndx * maxDist;
let hitPy = startY + ndy * maxDist;
let hitTarget = '';

for (let d = 0; d <= maxDist; d += step) {
  const px = startX + ndx * d;
  const py = startY + ndy * d;

  for (let i = 0; i < candidates.length; i++) {
    const other = candidates[i];
    if (other.active === false) continue;
    if (source && (other === source || (source.id && other.id === source.id))) continue;
    if (filterTag) {
      const targetLower = String(filterTag).trim().toLowerCase();
      const match = typeof other.hasTag === 'function' ? other.hasTag(targetLower) : (Array.isArray(other.tags) ? other.tags.some(t => String(t).trim().toLowerCase() === targetLower) : String(other.tag || (other.components && other.components.Tags && other.components.Tags.value) || '').trim().toLowerCase() === targetLower);
      if (!match) continue;
    }

    const t = other.components && (other.components.Transform || other.components.UITransform);
    if (!t) continue;

    const shapes = other.components && other.components.Collider && Array.isArray(other.components.Collider.data) ? other.components.Collider.data : false;
    let inside = false;

    if (shapes && shapes.length > 0) {
      for (let s = 0; s < shapes.length; s++) {
        const shape = shapes[s];
        if (!shape.enabled) continue;
        const bw = shape.width || t.width || 32;
        const bh = shape.height || t.height || 32;
        const bx = (t.x || 0) + (shape.offsetX || 0) - bw * 0.5;
        const by = (t.y || 0) + (shape.offsetY || 0) - bh * 0.5;
        if (px >= bx && px <= bx + bw && py >= by && py <= by + bh) {
          inside = true;
          break;
        }
      }
    } else {
      const bw = t.width || 32;
      const bh = t.height || 32;
      const bx = (t.x || 0) - bw * 0.5;
      const by = (t.y || 0) - bh * 0.5;
      if (px >= bx && px <= bx + bw && py >= by && py <= by + bh) {
        inside = true;
      }
    }

    if (inside) {
      hitFound = true;
      hitDist = d;
      hitPx = px;
      hitPy = py;
      hitTarget = other.id || other.scriptId || '';
      break;
    }
  }

  if (hitFound) break;
}

outputs.hasHit = hitFound;
outputs.hitX = Number(hitPx.toFixed(2));
outputs.hitY = Number(hitPy.toFixed(2));
outputs.hitDistance = Number(hitDist.toFixed(2));
outputs.hitEntity = hitTarget;

if (hitFound) {
  outputs.onHit = true;
  if (typeof context.triggerFlow === 'function') context.triggerFlow('onHit');
} else {
  outputs.onMiss = true;
  if (typeof context.triggerFlow === 'function') context.triggerFlow('onMiss');
}

outputs.execOut = true;
return;
```
</details>

<a id="node-manageCollider"></a>
#### 2.4.9 `manageCollider` — Manage Collider

> Dynamically modify, add, remove, or toggle entity colliders and shapes.

- **Type:** `manageCollider` | **Role:** `action` | **Header:** `Manage Collider` (`#689F38`) | **Category:** `Physics & Collision` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `targetEntity` | `string` | `#F48FB1` | `"self"` |
| `operation` | `string` | `#F48FB1` | `"modify"` |
| `shapeId` | `string` | `#F48FB1` | `"default"` |
| `shapeType` | `string` | `#F48FB1` | `"box"` |
| `offsetX` | `number` | `#64B5F6` | `0` |
| `offsetY` | `number` | `#64B5F6` | `0` |
| `width` | `number` | `#64B5F6` | `32` |
| `height` | `number` | `#64B5F6` | `32` |
| `isTrigger` | `boolean` | `#E57373` | `false` |
| `enabled` | `boolean` | `#E57373` | `true` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |
| `success` | `boolean` | `#81C784` |
| `shapeCount` | `number` | `#64B5F6` |

**Selectable Options (`data.options`):**

- **`operation`** (default: `"modify"`): `"modify"` (Modify Shape), `"add"` (Add Shape), `"remove"` (Remove Shape), `"toggle"` (Toggle Collider)
- **`shapeType`** (default: `"box"`): `"box"` (Box / Rectangle), `"circle"` (Circle)

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const targetId = inputs.targetEntity || 'self';
const entity = context.assert.exists(context.entity.get(targetId));

if (!entity.components) {
  entity.components = {};
}
if (!entity.components.Collider) {
  entity.components.Collider = { enabled: true, data: [] };
}
if (!Array.isArray(entity.components.Collider.data)) {
  entity.components.Collider.data = [];
}

const colComp = entity.components.Collider;
const op = String(inputs.operation || 'modify').toLowerCase();
const rawShapeId = inputs.shapeId;
const sId = typeof rawShapeId === 'string' ? rawShapeId.trim() : '';
let success = false;

if (op === 'add') {
  const newShape = {
    id: sId || ('shape_' + Date.now()),
    scriptId: sId || 'shape',
    type: inputs.shapeType || 'box',
    offsetX: Number(inputs.offsetX) || 0,
    offsetY: Number(inputs.offsetY) || 0,
    width: Number(inputs.width) || 32,
    height: Number(inputs.height) || 32,
    radius: (Number(inputs.width) || 32) / 2,
    isTrigger: Boolean(inputs.isTrigger),
    enabled: typeof inputs.enabled === 'boolean' ? inputs.enabled : true,
    autoFit: false
  };
  colComp.data.push(newShape);
  success = true;
} else if (op === 'remove') {
  const prevCount = colComp.data.length;
  if (sId) {
    colComp.data = colComp.data.filter(s => s.id !== sId && s.scriptId !== sId);
  } else {
    colComp.data.pop();
  }
  success = colComp.data.length < prevCount;
} else if (op === 'modify') {
  let targetShape = false;
  if (sId) {
    for (let i = 0; i < colComp.data.length; i++) {
      if (colComp.data[i].id === sId || colComp.data[i].scriptId === sId) {
        targetShape = colComp.data[i];
        break;
      }
    }
  }
  if (!targetShape && colComp.data.length > 0) {
    targetShape = colComp.data[0];
  }
  if (targetShape) {
    if (typeof inputs.width === 'number' && !isNaN(inputs.width)) targetShape.width = inputs.width;
    if (typeof inputs.height === 'number' && !isNaN(inputs.height)) targetShape.height = inputs.height;
    if (typeof inputs.offsetX === 'number' && !isNaN(inputs.offsetX)) targetShape.offsetX = inputs.offsetX;
    if (typeof inputs.offsetY === 'number' && !isNaN(inputs.offsetY)) targetShape.offsetY = inputs.offsetY;
    if (inputs.shapeType) targetShape.type = inputs.shapeType;
    if (typeof inputs.isTrigger === 'boolean') targetShape.isTrigger = inputs.isTrigger;
    if (typeof inputs.enabled === 'boolean') targetShape.enabled = inputs.enabled;
    targetShape.radius = (targetShape.width || 32) / 2;
    success = true;
  }
} else if (op === 'toggle') {
  if (sId) {
    let s = false;
    for (let i = 0; i < colComp.data.length; i++) {
      if (colComp.data[i].id === sId || colComp.data[i].scriptId === sId) {
        s = colComp.data[i];
        break;
      }
    }
    if (s) {
      s.enabled = !s.enabled;
      success = true;
    }
  } else {
    colComp.enabled = !colComp.enabled;
    success = true;
  }
}

outputs.success = success;
outputs.shapeCount = colComp.data.length;
outputs.execOut = true;
return;
```
</details>

---

<a id="25-game-renderer"></a>
### 2.5 Rendering & Camera (`game_renderer`)

- **Module Export:** `BlueprintRenderer` ([BlueprintRenderer.js](../editor/src/features/nodes/library/blueprints/BlueprintRenderer.js))
- **Backward-Compatibility Re-export Aliases:** `BlueprintTransition`, `BlueprintCamera`
- **Category Color:** `#00ACC1` | **Icon:** `Palette` | **Total Nodes:** **14**

| # | Type (`type`) | Label | Header Title | Role | Dynamic Mode | Description |
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |
| 1 | [`getSprite`](#node-getSprite) | **Get Sprite** | `Get Sprite` | `pure` | `outputProperty` | Get properties of the Image Renderer |
| 2 | [`setSprite`](#node-setSprite) | **Set Sprite** | `Set Sprite` | `action` | `inputProperty` | Set properties of the Image Renderer |
| 3 | [`getText`](#node-getText) | **Get Text** | `Get Text` | `pure` | `outputProperty` | Get properties of the Text Renderer |
| 4 | [`setText`](#node-setText) | **Set Text** | `Set Text` | `action` | `inputProperty` | Set properties of the Text Renderer |
| 5 | [`getShape`](#node-getShape) | **Get Shape** | `Get Shape` | `pure` | `outputProperty` | Get properties of the Shape Renderer |
| 6 | [`setShape`](#node-setShape) | **Set Shape** | `Set Shape` | `action` | `inputProperty` | Set properties of the Shape Renderer |
| 7 | [`getTilemap`](#node-getTilemap) | **Get Tilemap** | `Get Tilemap` | `pure` | `outputProperty` | Get properties of the Tilemap Component |
| 8 | [`setTilemap`](#node-setTilemap) | **Set Tilemap** | `Set Tilemap` | `action` | `inputProperty` | Set properties of the Tilemap Component |
| 9 | [`batchSet`](#node-batchSet) | **Batch Set Properties** | `Batch Set` | `action` | `none` | Set multiple properties in one execution node |
| 10 | [`actionFadeScreen`](#node-actionFadeScreen) | **Fade Screen** | `Fade Screen` | `action` | `none` | Fades the screen to black (or any color) and vice versa over duration in seconds. |
| 11 | [`actionCameraFollow`](#node-actionCameraFollow) | **Camera Follow** | `Camera Follow` | `action` | `none` | Makes the camera smoothly follow the target entity. |
| 12 | [`actionCameraStopFollow`](#node-actionCameraStopFollow) | **Stop Camera Follow** | `Stop Follow` | `action` | `none` | Stops the camera from following the target entity. |
| 13 | [`actionCameraSetTransform`](#node-actionCameraSetTransform) | **Set Camera Transform** | `Set Camera Transform` | `action` | `none` | Sets camera position (X, Y), zoom scale, and interpolation speed (smoothness). |
| 14 | [`queryCameraInfo`](#node-queryCameraInfo) | **Get Camera Info** | `Get Camera Info` | `pure` | `none` | Pure node to read current camera coordinates, zoom scale, smoothness, and target scriptId. |

<a id="node-getSprite"></a>
#### 2.5.1 `getSprite` — Get Sprite

> Get properties of the Image Renderer

- **Type:** `getSprite` | **Role:** `pure` | **Header:** `Get Sprite` (`#00ACC1`) | **Category:** `Rendering & Camera` | **Dynamic Mode:** `outputProperty`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `targetEntity` | `string` | `#F48FB1` | `"self"` |

- **Output Ports (`outputs`):** *Empty by default (`[]`). Added dynamically from `data.propertyOptions` below.*

**Dynamic Output Property Options (`data.propertyOptions`):**

| Port ID (`value`) | Inspector Label (`label`) | Data Type (`type`) | Pin Color (`color`) |
| :--- | :--- | :--- | :--- |
| `assetId` | Asset ID | `string` | `#F48FB1` |
| `color` | Tint Color | `string` | `#F48FB1` |
| `opacity` | Opacity | `number` | `#64B5F6` |
| `sourceX` | Source X | `number` | `#64B5F6` |
| `sourceY` | Source Y | `number` | `#64B5F6` |
| `sourceWidth` | Source Width | `number` | `#64B5F6` |
| `sourceHeight` | Source Height | `number` | `#64B5F6` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const targetId = inputs.targetEntity;
const entity = context.assert.exists(context.entity.get(targetId));
const comp = context.assert.hasComponent(entity, 'SpriteRenderer');

outputs.assetId = comp.assetId;
outputs.color = comp.color;
outputs.opacity = comp.opacity;
outputs.sourceX = comp.sourceX;
outputs.sourceY = comp.sourceY;
outputs.sourceWidth = comp.sourceWidth;
outputs.sourceHeight = comp.sourceHeight;
return;
```
</details>

<a id="node-setSprite"></a>
#### 2.5.2 `setSprite` — Set Sprite

> Set properties of the Image Renderer

- **Type:** `setSprite` | **Role:** `action` | **Header:** `Set Sprite` (`#00ACC1`) | **Category:** `Rendering & Camera` | **Dynamic Mode:** `inputProperty`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `targetEntity` | `string` | `#F48FB1` | `"self"` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |

**Dynamic Input Property Options (`data.propertyOptions`):**

| Port ID (`value`) | Inspector Label (`label`) | Data Type (`type`) | Pin Color (`color`) |
| :--- | :--- | :--- | :--- |
| `assetId` | Asset ID | `string` | `#F48FB1` |
| `color` | Tint Color | `string` | `#F48FB1` |
| `opacity` | Opacity | `number` | `#64B5F6` |
| `sourceX` | Source X | `number` | `#64B5F6` |
| `sourceY` | Source Y | `number` | `#64B5F6` |
| `sourceWidth` | Source Width | `number` | `#64B5F6` |
| `sourceHeight` | Source Height | `number` | `#64B5F6` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const targetId = inputs.targetEntity;
const entity = context.assert.exists(context.entity.get(targetId));
const comp = context.assert.hasComponent(entity, 'SpriteRenderer');

if ('assetId' in inputs) {
  let finalAssetId = inputs.assetId;
  if (context.asset && typeof context.asset.resolveId === 'function') {
    const resolved = context.asset.resolveId(inputs.assetId);
    if (resolved) {
      finalAssetId = resolved;
    }
  }
  comp.assetId = finalAssetId;
}
if ('color' in inputs) comp.color = inputs.color;
if ('opacity' in inputs) comp.opacity = inputs.opacity;
if ('sourceX' in inputs) comp.sourceX = inputs.sourceX;
if ('sourceY' in inputs) comp.sourceY = inputs.sourceY;
if ('sourceWidth' in inputs) comp.sourceWidth = inputs.sourceWidth;
if ('sourceHeight' in inputs) comp.sourceHeight = inputs.sourceHeight;

outputs.execOut = true;
return;
```
</details>

<a id="node-getText"></a>
#### 2.5.3 `getText` — Get Text

> Get properties of the Text Renderer

- **Type:** `getText` | **Role:** `pure` | **Header:** `Get Text` (`#FFB300`) | **Category:** `Rendering & Camera` | **Dynamic Mode:** `outputProperty`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `targetEntity` | `string` | `#F48FB1` | `"self"` |

- **Output Ports (`outputs`):** *Empty by default (`[]`). Added dynamically from `data.propertyOptions` below.*

**Dynamic Output Property Options (`data.propertyOptions`):**

| Port ID (`value`) | Inspector Label (`label`) | Data Type (`type`) | Pin Color (`color`) |
| :--- | :--- | :--- | :--- |
| `value` | Content | `string` | `#F48FB1` |
| `mode` | Mode | `string` | `#F48FB1` |
| `assetId` | Font Asset | `string` | `#F48FB1` |
| `fontSize` | Font Size | `number` | `#64B5F6` |
| `color` | Text Color | `string` | `#F48FB1` |
| `opacity` | Opacity (%) | `number` | `#64B5F6` |
| `align` | Align | `string` | `#F48FB1` |
| `alignLine` | Align Line | `string` | `#F48FB1` |
| `autoLine` | Auto Line | `boolean` | `#E57373` |
| `maxLine` | Max Line | `number` | `#64B5F6` |
| `lineSpacing` | Line Spacing | `number` | `#64B5F6` |
| `letterSpacing` | Char Spacing | `number` | `#64B5F6` |
| `overflow` | Overflow | `string` | `#F48FB1` |
| `outlineWidth` | Outline Width | `number` | `#64B5F6` |
| `outlineColor` | Outline Color | `string` | `#F48FB1` |
| `shadowEnabled` | Shadow Enabled | `boolean` | `#E57373` |
| `shadowColor` | Shadow Color | `string` | `#F48FB1` |
| `shadowOpacity` | Shadow Opacity (%) | `number` | `#64B5F6` |
| `shadowOffsetX` | Shadow Offset X | `number` | `#64B5F6` |
| `shadowOffsetY` | Shadow Offset Y | `number` | `#64B5F6` |
| `shadowBlur` | Shadow Blur | `number` | `#64B5F6` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const targetId = inputs.targetEntity;
const entity = context.assert.exists(context.entity.get(targetId));
const comp = context.assert.hasComponent(entity, 'TextRenderer');

outputs.value = comp.value;
outputs.mode = comp.mode;
outputs.assetId = comp.assetId;
outputs.fontSize = comp.fontSize;
outputs.color = comp.color;
outputs.opacity = Math.round(comp.opacity * 100);
outputs.align = comp.align;
outputs.alignLine = comp.alignLine || 'top';
outputs.autoLine = comp.autoLine;
outputs.maxLine = comp.maxLine;
outputs.lineSpacing = comp.lineSpacing;
outputs.letterSpacing = comp.letterSpacing;
outputs.overflow = comp.overflow;
outputs.outlineWidth = comp.outlineWidth;
outputs.outlineColor = comp.outlineColor;
outputs.shadowEnabled = comp.shadowEnabled;
outputs.shadowColor = comp.shadowColor;
outputs.shadowOpacity = Math.round(comp.shadowOpacity * 100);
outputs.shadowOffsetX = comp.shadowOffsetX;
outputs.shadowOffsetY = comp.shadowOffsetY;
outputs.shadowBlur = comp.shadowBlur;
return;
```
</details>

<a id="node-setText"></a>
#### 2.5.4 `setText` — Set Text

> Set properties of the Text Renderer

- **Type:** `setText` | **Role:** `action` | **Header:** `Set Text` (`#FFB300`) | **Category:** `Rendering & Camera` | **Dynamic Mode:** `inputProperty`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `targetEntity` | `string` | `#F48FB1` | `"self"` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |

**Dynamic Input Property Options (`data.propertyOptions`):**

| Port ID (`value`) | Inspector Label (`label`) | Data Type (`type`) | Pin Color (`color`) |
| :--- | :--- | :--- | :--- |
| `value` | Content | `string` | `#F48FB1` |
| `fontSize` | Font Size | `number` | `#64B5F6` |
| `color` | Color | `string` | `#F48FB1` |
| `align` | Align | `string` | `#F48FB1` |
| `alignLine` | Align Line | `string` | `#F48FB1` |
| `autoLine` | Auto Line | `boolean` | `#E57373` |
| `maxLine` | Max Line | `number` | `#64B5F6` |
| `lineSpacing` | Line Spacing | `number` | `#64B5F6` |
| `letterSpacing` | Char Spacing | `number` | `#64B5F6` |
| `overflow` | Overflow | `string` | `#F48FB1` |
| `assetId` | Font Asset | `string` | `#F48FB1` |
| `opacity` | Opacity (%) | `number` | `#64B5F6` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const targetId = inputs.targetEntity;
const entity = context.assert.exists(context.entity.get(targetId));
const comp = context.assert.hasComponent(entity, 'TextRenderer');

if ('value' in inputs) comp.value = inputs.value;
if ('fontSize' in inputs) comp.fontSize = inputs.fontSize;
if ('color' in inputs) comp.color = inputs.color;
if ('align' in inputs) comp.align = inputs.align;
if ('alignLine' in inputs) comp.alignLine = inputs.alignLine;
if ('autoLine' in inputs) comp.autoLine = inputs.autoLine;
if ('maxLine' in inputs) comp.maxLine = inputs.maxLine;
if ('lineSpacing' in inputs) comp.lineSpacing = inputs.lineSpacing;
if ('letterSpacing' in inputs) comp.letterSpacing = inputs.letterSpacing;
if ('overflow' in inputs) comp.overflow = inputs.overflow;
if ('assetId' in inputs) comp.assetId = inputs.assetId;
if ('opacity' in inputs) comp.opacity = inputs.opacity / 100;

outputs.execOut = true;
return;
```
</details>

<a id="node-getShape"></a>
#### 2.5.5 `getShape` — Get Shape

> Get properties of the Shape Renderer

- **Type:** `getShape` | **Role:** `pure` | **Header:** `Get Shape` (`#E91E63`) | **Category:** `Rendering & Camera` | **Dynamic Mode:** `outputProperty`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `targetEntity` | `string` | `#F48FB1` | `"self"` |

- **Output Ports (`outputs`):** *Empty by default (`[]`). Added dynamically from `data.propertyOptions` below.*

**Dynamic Output Property Options (`data.propertyOptions`):**

| Port ID (`value`) | Inspector Label (`label`) | Data Type (`type`) | Pin Color (`color`) |
| :--- | :--- | :--- | :--- |
| `type` | Type | `string` | `#F48FB1` |
| `color` | Color | `string` | `#F48FB1` |
| `width` | Width | `number` | `#64B5F6` |
| `height` | Height | `number` | `#64B5F6` |
| `thickness` | Line Thickness | `number` | `#64B5F6` |
| `opacity` | Opacity | `number` | `#64B5F6` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const targetId = inputs.targetEntity;
const entity = context.assert.exists(context.entity.get(targetId));
const comp = context.assert.hasComponent(entity, 'ShapeRenderer');

outputs.type = comp.type;
outputs.color = comp.color;
outputs.width = comp.width;
outputs.height = comp.height;
outputs.thickness = comp.thickness;
outputs.opacity = comp.opacity;
return;
```
</details>

<a id="node-setShape"></a>
#### 2.5.6 `setShape` — Set Shape

> Set properties of the Shape Renderer

- **Type:** `setShape` | **Role:** `action` | **Header:** `Set Shape` (`#E91E63`) | **Category:** `Rendering & Camera` | **Dynamic Mode:** `inputProperty`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `targetEntity` | `string` | `#F48FB1` | `"self"` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |

**Dynamic Input Property Options (`data.propertyOptions`):**

| Port ID (`value`) | Inspector Label (`label`) | Data Type (`type`) | Pin Color (`color`) |
| :--- | :--- | :--- | :--- |
| `type` | Type | `string` | `#F48FB1` |
| `color` | Color | `string` | `#F48FB1` |
| `width` | Width | `number` | `#64B5F6` |
| `height` | Height | `number` | `#64B5F6` |
| `thickness` | Line Thickness | `number` | `#64B5F6` |
| `opacity` | Opacity | `number` | `#64B5F6` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const targetId = inputs.targetEntity;
const entity = context.assert.exists(context.entity.get(targetId));
const comp = context.assert.hasComponent(entity, 'ShapeRenderer');

if ('type' in inputs) comp.type = inputs.type;
if ('color' in inputs) comp.color = inputs.color;
if ('width' in inputs) comp.width = inputs.width;
if ('height' in inputs) comp.height = inputs.height;
if ('thickness' in inputs) comp.thickness = inputs.thickness;
if ('opacity' in inputs) comp.opacity = inputs.opacity;

outputs.execOut = true;
return;
```
</details>

<a id="node-getTilemap"></a>
#### 2.5.7 `getTilemap` — Get Tilemap

> Get properties of the Tilemap Component

- **Type:** `getTilemap` | **Role:** `pure` | **Header:** `Get Tilemap` (`#689F38`) | **Category:** `Rendering & Camera` | **Dynamic Mode:** `outputProperty`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `targetEntity` | `string` | `#F48FB1` | `"self"` |

- **Output Ports (`outputs`):** *Empty by default (`[]`). Added dynamically from `data.propertyOptions` below.*

**Dynamic Output Property Options (`data.propertyOptions`):**

| Port ID (`value`) | Inspector Label (`label`) | Data Type (`type`) | Pin Color (`color`) |
| :--- | :--- | :--- | :--- |
| `assetId` | Tileset Asset | `string` | `#F48FB1` |
| `width` | Map Width (Grid) | `number` | `#64B5F6` |
| `height` | Map Height (Grid) | `number` | `#64B5F6` |
| `tileWidth` | Tile Width | `number` | `#64B5F6` |
| `tileHeight` | Tile Height | `number` | `#64B5F6` |
| `isSolid` | Is Solid | `boolean` | `#E57373` |
| `opacity` | Opacity | `number` | `#64B5F6` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const targetId = inputs.targetEntity;
const entity = context.assert.exists(context.entity.get(targetId));
const comp = context.assert.hasComponent(entity, 'Tilemap');

outputs.assetId = comp.assetId;
outputs.width = comp.width;
outputs.height = comp.height;
outputs.tileWidth = comp.tileWidth;
outputs.tileHeight = comp.tileHeight;
outputs.isSolid = comp.isSolid;
outputs.opacity = comp.opacity;
return;
```
</details>

<a id="node-setTilemap"></a>
#### 2.5.8 `setTilemap` — Set Tilemap

> Set properties of the Tilemap Component

- **Type:** `setTilemap` | **Role:** `action` | **Header:** `Set Tilemap` (`#689F38`) | **Category:** `Rendering & Camera` | **Dynamic Mode:** `inputProperty`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `targetEntity` | `string` | `#F48FB1` | `"self"` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |

**Dynamic Input Property Options (`data.propertyOptions`):**

| Port ID (`value`) | Inspector Label (`label`) | Data Type (`type`) | Pin Color (`color`) |
| :--- | :--- | :--- | :--- |
| `assetId` | Tileset Asset | `string` | `#F48FB1` |
| `width` | Map Width (Grid) | `number` | `#64B5F6` |
| `height` | Map Height (Grid) | `number` | `#64B5F6` |
| `tileWidth` | Tile Width | `number` | `#64B5F6` |
| `tileHeight` | Tile Height | `number` | `#64B5F6` |
| `isSolid` | Is Solid | `boolean` | `#E57373` |
| `opacity` | Opacity | `number` | `#64B5F6` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const targetId = inputs.targetEntity;
const entity = context.assert.exists(context.entity.get(targetId));
const comp = context.assert.hasComponent(entity, 'Tilemap');

if ('assetId' in inputs) comp.assetId = inputs.assetId;
if ('width' in inputs) comp.width = inputs.width;
if ('height' in inputs) comp.height = inputs.height;
if ('tileWidth' in inputs) comp.tileWidth = inputs.tileWidth;
if ('tileHeight' in inputs) comp.tileHeight = inputs.tileHeight;
if ('isSolid' in inputs) comp.isSolid = inputs.isSolid;
if ('opacity' in inputs) comp.opacity = inputs.opacity;

outputs.execOut = true;
return;
```
</details>

<a id="node-batchSet"></a>
#### 2.5.9 `batchSet` — Batch Set Properties

> Set multiple properties in one execution node

- **Type:** `batchSet` | **Role:** `action` | **Header:** `Batch Set` (`#7E57C2`) | **Category:** `Rendering & Camera` | **Dynamic Mode:** `none` | **Custom Inspector:** `BatchSetInspector.vue`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |

**Additional Node Data Fields:**
- `data.steps`: `[]` (array of `{ component, property }` entries matching `targetEntity0..N` and `value0..N`)

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const steps = node.data.steps || [];

steps.forEach((step, index) => {
  const targetId = inputs[`targetEntity${index}`] || 'self';
  const entity = context.assert.exists(context.entity.get(targetId));

  if (`value${index}` in inputs) {
    const rawVal = inputs[`value${index}`];
    if (step.component === 'Entity') {
      const rootProps = {
        name: v => v,
        tag: v => v,
        type: v => v,
        zIndex: v => v,
        orderIndex: v => v,
        active: v => v,
        visible: v => v,
        locked: v => v
      };

      if (rootProps[step.property]) {
        entity[step.property] = rootProps[step.property](rawVal);
      }
    } else {
      const comp = context.assert.hasComponent(entity, step.component);
      comp[step.property] = rawVal;
    }
  }
});

outputs.execOut = true;
return;
```
</details>

<a id="node-actionFadeScreen"></a>
#### 2.5.10 `actionFadeScreen` — Fade Screen

> Fades the screen to black (or any color) and vice versa over duration in seconds.

- **Type:** `actionFadeScreen` | **Role:** `action` | **Header:** `Fade Screen` (`#7C3AED`) | **Category:** `Rendering & Camera` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `mode` | `string` | `#F48FB1` | `"fade_out"` |
| `duration` | `number` | `#64B5F6` | `1` |
| `color` | `string` | `#F48FB1` | `"#000000"` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |
| `onComplete` | `execution` | `#FFFFFF` |

**Selectable Options (`data.options`):**

- **`mode`** (default: `"fade_out"`): `"fade_out"` (Fade Out), `"fade_in"` (Fade In), `"fade"` (Fade In & Out)

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const rawDuration = Number(inputs.duration);
const duration = isNaN(rawDuration) ? 1.0 : Math.max(0, rawDuration);
outputs.execOut = true;

context.transition.fade(inputs.mode, duration, inputs.color, () => {
  outputs.onComplete = true;
  context.triggerFlow('onComplete');
});
return;
```
</details>

<a id="node-actionCameraFollow"></a>
#### 2.5.11 `actionCameraFollow` — Camera Follow

> Makes the camera smoothly follow the target entity.

- **Type:** `actionCameraFollow` | **Role:** `action` | **Header:** `Camera Follow` (`#F59E0B`) | **Category:** `Rendering & Camera` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `targetEntity` | `string` | `#F48FB1` | `"self"` |
| `smoothSpeed` | `number` | `#64B5F6` | `0.1` |
| `offsetX` | `number` | `#64B5F6` | `0` |
| `offsetY` | `number` | `#64B5F6` | `0` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const targetEntity = context.assert.exists(context.entity.get(inputs.targetEntity), 'Target entity must exist');

context.camera.setTarget(targetEntity, inputs.smoothSpeed, {
  x: inputs.offsetX,
  y: inputs.offsetY
});

outputs.execOut = true;
return;
```
</details>

<a id="node-actionCameraStopFollow"></a>
#### 2.5.12 `actionCameraStopFollow` — Stop Camera Follow

> Stops the camera from following the target entity.

- **Type:** `actionCameraStopFollow` | **Role:** `action` | **Header:** `Stop Follow` (`#F59E0B`) | **Category:** `Rendering & Camera` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
context.camera.clearTarget();

outputs.execOut = true;
return;
```
</details>

<a id="node-actionCameraSetTransform"></a>
#### 2.5.13 `actionCameraSetTransform` — Set Camera Transform

> Sets camera position (X, Y), zoom scale, and interpolation speed (smoothness).

- **Type:** `actionCameraSetTransform` | **Role:** `action` | **Header:** `Set Camera Transform` (`#F59E0B`) | **Category:** `Rendering & Camera` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `x` | `number` | `#64B5F6` | `0` |
| `y` | `number` | `#64B5F6` | `0` |
| `scale` | `number` | `#64B5F6` | `1` |
| `smoothSpeed` | `number` | `#64B5F6` | `0.1` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
context.camera.setTransform(inputs.x, inputs.y, inputs.scale, inputs.smoothSpeed);

outputs.execOut = true;
return;
```
</details>

<a id="node-queryCameraInfo"></a>
#### 2.5.14 `queryCameraInfo` — Get Camera Info

> Pure node to read current camera coordinates, zoom scale, smoothness, and target scriptId.

- **Type:** `queryCameraInfo` | **Role:** `pure` | **Header:** `Get Camera Info` (`#F59E0B`) | **Category:** `Rendering & Camera` | **Dynamic Mode:** `none`

- **Input Ports (`inputs`):** *None*

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `x` | `number` | `#64B5F6` |
| `y` | `number` | `#64B5F6` |
| `scale` | `number` | `#64B5F6` |
| `smoothSpeed` | `number` | `#64B5F6` |
| `targetEntity` | `string` | `#F48FB1` |
| `hasTarget` | `boolean` | `#E57373` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const info = context.camera.getInfo();

outputs.x = info.x;
outputs.y = info.y;
outputs.scale = info.scale;
outputs.smoothSpeed = info.smoothSpeed;
outputs.targetEntity = info.targetEntity;
outputs.hasTarget = info.hasTarget;
return;
```
</details>

---

<a id="26-game-animation"></a>
### 2.6 Animation (`game_animation`)

- **Module Export:** `BlueprintAnimation` ([BlueprintAnimation.js](../editor/src/features/nodes/library/blueprints/BlueprintAnimation.js))
- **Backward-Compatibility Re-export Aliases:** `BlueprintAnimator`
- **Category Color:** `#E91E63` | **Icon:** `Film` | **Total Nodes:** **17**

| # | Type (`type`) | Label | Header Title | Role | Dynamic Mode | Description |
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |
| 1 | [`logicTweenValue`](#node-logicTweenValue) | **Tween Value** | `Tween Value` | `action` | `none` | Generates interpolated numeric values over time with a single execution trigger. |
| 2 | [`tweenMoveTo`](#node-tweenMoveTo) | **Move To** | `Move To` | `action` | `none` | Animates entity position towards target coordinates over a duration. |
| 3 | [`tweenScaleTo`](#node-tweenScaleTo) | **Scale To** | `Scale To` | `action` | `none` | Animates entity scale towards target values over a duration. |
| 4 | [`tweenRotateTo`](#node-tweenRotateTo) | **Rotate To** | `Rotate To` | `action` | `none` | Animates entity rotation (degrees) towards target angle over a duration. |
| 5 | [`tweenResizeTo`](#node-tweenResizeTo) | **Resize To** | `Resize To` | `action` | `none` | Animates entity width and height towards target size over a duration. |
| 6 | [`tweenFadeTo`](#node-tweenFadeTo) | **Fade To** | `Fade To` | `action` | `none` | Animates opacity (0.0 - 1.0) for SpriteRenderer, ShapeRenderer, and TextRenderer over a duration. |
| 7 | [`tweenCropTo`](#node-tweenCropTo) | **Crop Image** | `Crop Image` | `action` | `none` | Animates sprite source rect (sourceX, sourceY, sourceWidth, sourceHeight) over a duration. |
| 8 | [`tweenFillAmount`](#node-tweenFillAmount) | **Fill Amount** | `Fill Amount` | `action` | `none` | Sets or animates fill percentage (0 to 100%) with 4-directional wipe (Left to Right, Right to Left, Top to Bottom, Bottom to Top). Set duration to 0 for instant fill. |
| 9 | [`actionShakeTransform`](#node-actionShakeTransform) | **Shake Transform** | `Shake Transform` | `action` | `none` | Procedural shake effect with decay, perfect for impacts, explosions, or UI feedback. |
| 10 | [`uiButtonScaleEffect`](#node-uiButtonScaleEffect) | **Button Scale Effect** | `Button Scale` | `action` | `none` | Handles button hover, click, and scale interpolation (Lerp) automatically within a single node. |
| 11 | [`playAnimation`](#node-playAnimation) | **Play Animation** | `Play Animation` | `action` | `none` | Plays the animation. Use On Complete for logic execution after the animation finishes. |
| 12 | [`pauseAnimation`](#node-pauseAnimation) | **Pause Animation** | `Pause Animation` | `action` | `none` | Temporarily pauses the animation at the current frame. |
| 13 | [`getAnimator`](#node-getAnimator) | **Get Animator** | `Get Animator` | `pure` | `outputProperty` | Retrieves SpriteAnimator component properties from the target entity. |
| 14 | [`setAnimator`](#node-setAnimator) | **Set Animator** | `Set Animator` | `action` | `inputProperty` | Sets SpriteAnimator component properties on the target entity. |
| 15 | [`getClipProp`](#node-getClipProp) | **Get Clip Prop** | `Get Clip Property` | `pure` | `outputProperty` | Retrieves specific properties (FPS, looping, frame count) of an animation clip on the owner entity. |
| 16 | [`setClipProp`](#node-setClipProp) | **Set Clip Prop** | `Set Clip Property` | `action` | `inputProperty` | Sets specific properties (FPS, looping) of an animation clip on the owner entity. |
| 17 | [`onAnimationFrame`](#node-onAnimationFrame) | **On Animation Frame** | `On Animation Frame` | `action` | `none` | Fires execution triggers when an animation clip enters, stays active in, or exits a specific frame range. |

<a id="node-logicTweenValue"></a>
#### 2.6.1 `logicTweenValue` — Tween Value

> Generates interpolated numeric values over time with a single execution trigger.

- **Type:** `logicTweenValue` | **Role:** `action` | **Header:** `Tween Value` (`#E91E63`) | **Category:** `Animation & Tweens` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `startValue` | `number` | `#64B5F6` | `0` |
| `endValue` | `number` | `#64B5F6` | `100` |
| `duration` | `number` | `#64B5F6` | `1` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `onUpdate` | `execution` | `#FFFFFF` |
| `value` | `number` | `#64B5F6` |
| `onComplete` | `execution` | `#FFFFFF` |

**Selectable Options (`data.options`):**

- **`easing`** (default: `"smooth"`): `"linear"` (Linear), `"smooth"` (Smooth (Ease In-Out)), `"ease_in"` (Ease In), `"ease_out"` (Ease Out)

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const start = Number(inputs.startValue) || 0;
const end = Number(inputs.endValue) || 0;
const rawDuration = Number(inputs.duration);
const duration = isNaN(rawDuration) ? 1 : Math.max(0, rawDuration);
const easing = (node.data && node.data.values && node.data.values.easing) ? node.data.values.easing : 'smooth';

if (duration <= 0) {
  outputs.value = end;
  outputs.onUpdate = true;
  outputs.onComplete = true;
  context.triggerFlow('onUpdate');
  context.triggerFlow('onComplete');
  return;
}

context.state.start = start;
context.state.end = end;
context.state.duration = duration;
context.state.elapsed = 0;
context.state.isActive = true;

function easeFactor(type, p) {
  if (type === 'smooth') return p * p * (3 - 2 * p);
  if (type === 'ease_in') return p * p;
  if (type === 'ease_out') return p * (2 - p);
  return p;
}

context.onTick((dt) => {
  if (!context.state.isActive) return;
  const deltaSec = typeof dt === 'number' ? dt : Number(context.dt || 0.016);
  context.state.elapsed += deltaSec;

  const progress = Math.min(context.state.elapsed / context.state.duration, 1.0);
  const factor = easeFactor(easing, progress);

  outputs.value = context.state.start + (context.state.end - context.state.start) * factor;
  outputs.onUpdate = true;
  context.triggerFlow('onUpdate');

  if (progress >= 1.0) {
    context.state.isActive = false;
    outputs.value = context.state.end;
    outputs.onComplete = true;
    context.triggerFlow('onComplete');
  }
});

outputs.value = start;
outputs.onUpdate = false;
outputs.onComplete = false;
return;
```
</details>

<a id="node-tweenMoveTo"></a>
#### 2.6.2 `tweenMoveTo` — Move To

> Animates entity position towards target coordinates over a duration.

- **Type:** `tweenMoveTo` | **Role:** `action` | **Header:** `Move To` (`#E91E63`) | **Category:** `Animation & Tweens` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `targetEntity` | `string` | `#F48FB1` | `"self"` |
| `x` | `number` | `#64B5F6` | `0` |
| `y` | `number` | `#64B5F6` | `0` |
| `duration` | `number` | `#64B5F6` | `1` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |
| `onComplete` | `execution` | `#FFFFFF` |

**Selectable Options (`data.options`):**

- **`easing`** (default: `"smooth"`): `"linear"` (Linear), `"smooth"` (Smooth (Ease In-Out)), `"ease_in"` (Ease In), `"ease_out"` (Ease Out), `"ease_out_bounce"` (Ease Out Bounce)

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const targetId = inputs.targetEntity;
const targetX = Number(inputs.x) || 0;
const targetY = Number(inputs.y) || 0;
const rawDuration = Number(inputs.duration);
const duration = isNaN(rawDuration) ? 1 : Math.max(0, rawDuration);
const easing = (node.data && node.data.values && node.data.values.easing) ? node.data.values.easing : 'smooth';

const entity = context.assert.exists(context.entity.get(targetId), 'Target entity must exist');
const t = entity.components.UITransform || context.assert.hasComponent(entity, 'Transform');

if (duration <= 0) {
  t.x = targetX;
  t.y = targetY;
  outputs.execOut = true;
  outputs.onComplete = true;
  context.triggerFlow('onComplete');
  return;
}

context.state.startX = t.x;
context.state.startY = t.y;
context.state.targetX = targetX;
context.state.targetY = targetY;
context.state.duration = duration;
context.state.elapsed = 0;
context.state.isActive = true;

function easeFactor(type, p) {
  if (type === 'smooth') return p * p * (3 - 2 * p);
  if (type === 'ease_in') return p * p;
  if (type === 'ease_out') return p * (2 - p);
  if (type === 'ease_out_bounce') {
    const n1 = 7.5625, d1 = 2.75;
    let s = p;
    if (s < 1 / d1) return n1 * s * s;
    if (s < 2 / d1) return n1 * (s -= 1.5 / d1) * s + 0.75;
    if (s < 2.5 / d1) return n1 * (s -= 2.25 / d1) * s + 0.9375;
    return n1 * (s -= 2.625 / d1) * s + 0.984375;
  }
  return p;
}

context.onTick((dt) => {
  if (!context.state.isActive) return;
  const deltaSec = typeof dt === 'number' ? dt : Number(context.dt || 0.016);
  context.state.elapsed += deltaSec;

  const progress = Math.min(context.state.elapsed / context.state.duration, 1.0);
  const factor = easeFactor(easing, progress);

  t.x = context.state.startX + (context.state.targetX - context.state.startX) * factor;
  t.y = context.state.startY + (context.state.targetY - context.state.startY) * factor;

  if (progress >= 1.0) {
    context.state.isActive = false;
    t.x = context.state.targetX;
    t.y = context.state.targetY;
    outputs.onComplete = true;
    context.triggerFlow('onComplete');
  }
});

outputs.execOut = true;
outputs.onComplete = false;
return;
```
</details>

<a id="node-tweenScaleTo"></a>
#### 2.6.3 `tweenScaleTo` — Scale To

> Animates entity scale towards target values over a duration.

- **Type:** `tweenScaleTo` | **Role:** `action` | **Header:** `Scale To` (`#E91E63`) | **Category:** `Animation & Tweens` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `targetEntity` | `string` | `#F48FB1` | `"self"` |
| `scaleX` | `number` | `#64B5F6` | `1` |
| `scaleY` | `number` | `#64B5F6` | `1` |
| `duration` | `number` | `#64B5F6` | `0.5` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |
| `onComplete` | `execution` | `#FFFFFF` |

**Selectable Options (`data.options`):**

- **`easing`** (default: `"smooth"`): `"linear"` (Linear), `"smooth"` (Smooth (Ease In-Out)), `"ease_in"` (Ease In), `"ease_out"` (Ease Out), `"ease_out_bounce"` (Ease Out Bounce)

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const targetId = inputs.targetEntity;
const targetScaleX = Number(inputs.scaleX) || 1;
const targetScaleY = Number(inputs.scaleY) || 1;
const rawDuration = Number(inputs.duration);
const duration = isNaN(rawDuration) ? 0.5 : Math.max(0, rawDuration);
const easing = (node.data && node.data.values && node.data.values.easing) ? node.data.values.easing : 'smooth';

const entity = context.assert.exists(context.entity.get(targetId), 'Target entity must exist');
const t = entity.components.UITransform || context.assert.hasComponent(entity, 'Transform');

if (duration <= 0) {
  t.scaleX = targetScaleX;
  t.scaleY = targetScaleY;
  outputs.execOut = true;
  outputs.onComplete = true;
  context.triggerFlow('onComplete');
  return;
}

context.state.startScaleX = typeof t.scaleX === 'number' ? t.scaleX : 1;
context.state.startScaleY = typeof t.scaleY === 'number' ? t.scaleY : 1;
context.state.targetScaleX = targetScaleX;
context.state.targetScaleY = targetScaleY;
context.state.duration = duration;
context.state.elapsed = 0;
context.state.isActive = true;

function easeFactor(type, p) {
  if (type === 'smooth') return p * p * (3 - 2 * p);
  if (type === 'ease_in') return p * p;
  if (type === 'ease_out') return p * (2 - p);
  if (type === 'ease_out_bounce') {
    const n1 = 7.5625, d1 = 2.75;
    let s = p;
    if (s < 1 / d1) return n1 * s * s;
    if (s < 2 / d1) return n1 * (s -= 1.5 / d1) * s + 0.75;
    if (s < 2.5 / d1) return n1 * (s -= 2.25 / d1) * s + 0.9375;
    return n1 * (s -= 2.625 / d1) * s + 0.984375;
  }
  return p;
}

context.onTick((dt) => {
  if (!context.state.isActive) return;
  const deltaSec = typeof dt === 'number' ? dt : Number(context.dt || 0.016);
  context.state.elapsed += deltaSec;

  const progress = Math.min(context.state.elapsed / context.state.duration, 1.0);
  const factor = easeFactor(easing, progress);

  t.scaleX = context.state.startScaleX + (context.state.targetScaleX - context.state.startScaleX) * factor;
  t.scaleY = context.state.startScaleY + (context.state.targetScaleY - context.state.startScaleY) * factor;

  if (progress >= 1.0) {
    context.state.isActive = false;
    t.scaleX = context.state.targetScaleX;
    t.scaleY = context.state.targetScaleY;
    outputs.onComplete = true;
    context.triggerFlow('onComplete');
  }
});

outputs.execOut = true;
outputs.onComplete = false;
return;
```
</details>

<a id="node-tweenRotateTo"></a>
#### 2.6.4 `tweenRotateTo` — Rotate To

> Animates entity rotation (degrees) towards target angle over a duration.

- **Type:** `tweenRotateTo` | **Role:** `action` | **Header:** `Rotate To` (`#E91E63`) | **Category:** `Animation & Tweens` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `targetEntity` | `string` | `#F48FB1` | `"self"` |
| `rotation` | `number` | `#64B5F6` | `0` |
| `duration` | `number` | `#64B5F6` | `0.5` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |
| `onComplete` | `execution` | `#FFFFFF` |

**Selectable Options (`data.options`):**

- **`easing`** (default: `"smooth"`): `"linear"` (Linear), `"smooth"` (Smooth (Ease In-Out)), `"ease_in"` (Ease In), `"ease_out"` (Ease Out), `"ease_out_bounce"` (Ease Out Bounce)

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const targetId = inputs.targetEntity;
const targetRotation = Number(inputs.rotation) || 0;
const rawDuration = Number(inputs.duration);
const duration = isNaN(rawDuration) ? 0.5 : Math.max(0, rawDuration);
const easing = (node.data && node.data.values && node.data.values.easing) ? node.data.values.easing : 'smooth';

const entity = context.assert.exists(context.entity.get(targetId), 'Target entity must exist');
const t = entity.components.UITransform || context.assert.hasComponent(entity, 'Transform');

if (duration <= 0) {
  t.rotation = targetRotation;
  outputs.execOut = true;
  outputs.onComplete = true;
  context.triggerFlow('onComplete');
  return;
}

context.state.startRotation = typeof t.rotation === 'number' ? t.rotation : 0;
context.state.targetRotation = targetRotation;
context.state.duration = duration;
context.state.elapsed = 0;
context.state.isActive = true;

function easeFactor(type, p) {
  if (type === 'smooth') return p * p * (3 - 2 * p);
  if (type === 'ease_in') return p * p;
  if (type === 'ease_out') return p * (2 - p);
  if (type === 'ease_out_bounce') {
    const n1 = 7.5625, d1 = 2.75;
    let s = p;
    if (s < 1 / d1) return n1 * s * s;
    if (s < 2 / d1) return n1 * (s -= 1.5 / d1) * s + 0.75;
    if (s < 2.5 / d1) return n1 * (s -= 2.25 / d1) * s + 0.9375;
    return n1 * (s -= 2.625 / d1) * s + 0.984375;
  }
  return p;
}

context.onTick((dt) => {
  if (!context.state.isActive) return;
  const deltaSec = typeof dt === 'number' ? dt : Number(context.dt || 0.016);
  context.state.elapsed += deltaSec;

  const progress = Math.min(context.state.elapsed / context.state.duration, 1.0);
  const factor = easeFactor(easing, progress);

  t.rotation = context.state.startRotation + (context.state.targetRotation - context.state.startRotation) * factor;

  if (progress >= 1.0) {
    context.state.isActive = false;
    t.rotation = context.state.targetRotation;
    outputs.onComplete = true;
    context.triggerFlow('onComplete');
  }
});

outputs.execOut = true;
outputs.onComplete = false;
return;
```
</details>

<a id="node-tweenResizeTo"></a>
#### 2.6.5 `tweenResizeTo` — Resize To

> Animates entity width and height towards target size over a duration.

- **Type:** `tweenResizeTo` | **Role:** `action` | **Header:** `Resize To` (`#E91E63`) | **Category:** `Animation & Tweens` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `targetEntity` | `string` | `#F48FB1` | `"self"` |
| `width` | `number` | `#64B5F6` | `100` |
| `height` | `number` | `#64B5F6` | `100` |
| `duration` | `number` | `#64B5F6` | `0.5` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |
| `onComplete` | `execution` | `#FFFFFF` |

**Selectable Options (`data.options`):**

- **`easing`** (default: `"smooth"`): `"linear"` (Linear), `"smooth"` (Smooth (Ease In-Out)), `"ease_in"` (Ease In), `"ease_out"` (Ease Out), `"ease_out_bounce"` (Ease Out Bounce)

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const targetId = inputs.targetEntity;
const targetWidth = Number(inputs.width) || 0;
const targetHeight = Number(inputs.height) || 0;
const rawDuration = Number(inputs.duration);
const duration = isNaN(rawDuration) ? 0.5 : Math.max(0, rawDuration);
const easing = (node.data && node.data.values && node.data.values.easing) ? node.data.values.easing : 'smooth';

const entity = context.assert.exists(context.entity.get(targetId), 'Target entity must exist');
const t = entity.components.UITransform || context.assert.hasComponent(entity, 'Transform');

if (duration <= 0) {
  t.width = targetWidth;
  t.height = targetHeight;
  outputs.execOut = true;
  outputs.onComplete = true;
  context.triggerFlow('onComplete');
  return;
}

context.state.startWidth = typeof t.width === 'number' ? t.width : 0;
context.state.startHeight = typeof t.height === 'number' ? t.height : 0;
context.state.targetWidth = targetWidth;
context.state.targetHeight = targetHeight;
context.state.duration = duration;
context.state.elapsed = 0;
context.state.isActive = true;

function easeFactor(type, p) {
  if (type === 'smooth') return p * p * (3 - 2 * p);
  if (type === 'ease_in') return p * p;
  if (type === 'ease_out') return p * (2 - p);
  if (type === 'ease_out_bounce') {
    const n1 = 7.5625, d1 = 2.75;
    let s = p;
    if (s < 1 / d1) return n1 * s * s;
    if (s < 2 / d1) return n1 * (s -= 1.5 / d1) * s + 0.75;
    if (s < 2.5 / d1) return n1 * (s -= 2.25 / d1) * s + 0.9375;
    return n1 * (s -= 2.625 / d1) * s + 0.984375;
  }
  return p;
}

context.onTick((dt) => {
  if (!context.state.isActive) return;
  const deltaSec = typeof dt === 'number' ? dt : Number(context.dt || 0.016);
  context.state.elapsed += deltaSec;

  const progress = Math.min(context.state.elapsed / context.state.duration, 1.0);
  const factor = easeFactor(easing, progress);

  t.width = context.state.startWidth + (context.state.targetWidth - context.state.startWidth) * factor;
  t.height = context.state.startHeight + (context.state.targetHeight - context.state.startHeight) * factor;

  if (progress >= 1.0) {
    context.state.isActive = false;
    t.width = context.state.targetWidth;
    t.height = context.state.targetHeight;
    outputs.onComplete = true;
    context.triggerFlow('onComplete');
  }
});

outputs.execOut = true;
outputs.onComplete = false;
return;
```
</details>

<a id="node-tweenFadeTo"></a>
#### 2.6.6 `tweenFadeTo` — Fade To

> Animates opacity (0.0 - 1.0) for SpriteRenderer, ShapeRenderer, and TextRenderer over a duration.

- **Type:** `tweenFadeTo` | **Role:** `action` | **Header:** `Fade To` (`#E91E63`) | **Category:** `Animation & Tweens` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `targetEntity` | `string` | `#F48FB1` | `"self"` |
| `opacity` | `number` | `#64B5F6` | `1` |
| `duration` | `number` | `#64B5F6` | `0.5` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |
| `onComplete` | `execution` | `#FFFFFF` |

**Selectable Options (`data.options`):**

- **`easing`** (default: `"smooth"`): `"linear"` (Linear), `"smooth"` (Smooth (Ease In-Out)), `"ease_in"` (Ease In), `"ease_out"` (Ease Out)

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const targetId = inputs.targetEntity;
const targetOpacity = Math.max(0, Math.min(1, Number(inputs.opacity) || 0));
const rawDuration = Number(inputs.duration);
const duration = isNaN(rawDuration) ? 0.5 : Math.max(0, rawDuration);
const easing = (node.data && node.data.values && node.data.values.easing) ? node.data.values.easing : 'smooth';

const entity = context.assert.exists(context.entity.get(targetId), 'Target entity must exist');

const comps = [];
if ((entity.components && entity.components.SpriteRenderer)) comps.push(entity.components.SpriteRenderer);
if ((entity.components && entity.components.ShapeRenderer)) comps.push(entity.components.ShapeRenderer);
if ((entity.components && entity.components.TextRenderer)) comps.push(entity.components.TextRenderer);

context.assert.isTrue(comps.length > 0, 'Target entity must have SpriteRenderer, ShapeRenderer, or TextRenderer');

const initialOpacity = typeof comps[0].opacity === 'number' ? comps[0].opacity : 1;

if (duration <= 0) {
  for (let i = 0; i < comps.length; i++) {
    comps[i].opacity = targetOpacity;
  }
  outputs.execOut = true;
  outputs.onComplete = true;
  context.triggerFlow('onComplete');
  return;
}

context.state.startOpacity = initialOpacity;
context.state.targetOpacity = targetOpacity;
context.state.duration = duration;
context.state.elapsed = 0;
context.state.isActive = true;

function easeFactor(type, p) {
  if (type === 'smooth') return p * p * (3 - 2 * p);
  if (type === 'ease_in') return p * p;
  if (type === 'ease_out') return p * (2 - p);
  return p;
}

context.onTick((dt) => {
  if (!context.state.isActive) return;
  const deltaSec = typeof dt === 'number' ? dt : Number(context.dt || 0.016);
  context.state.elapsed += deltaSec;

  const progress = Math.min(context.state.elapsed / context.state.duration, 1.0);
  const factor = easeFactor(easing, progress);
  const currentOpacity = context.state.startOpacity + (context.state.targetOpacity - context.state.startOpacity) * factor;

  for (let i = 0; i < comps.length; i++) {
    comps[i].opacity = currentOpacity;
  }

  if (progress >= 1.0) {
    context.state.isActive = false;
    for (let i = 0; i < comps.length; i++) {
      comps[i].opacity = context.state.targetOpacity;
    }
    outputs.onComplete = true;
    context.triggerFlow('onComplete');
  }
});

outputs.execOut = true;
outputs.onComplete = false;
return;
```
</details>

<a id="node-tweenCropTo"></a>
#### 2.6.7 `tweenCropTo` — Crop Image

> Animates sprite source rect (sourceX, sourceY, sourceWidth, sourceHeight) over a duration.

- **Type:** `tweenCropTo` | **Role:** `action` | **Header:** `Crop Image` (`#E91E63`) | **Category:** `Animation & Tweens` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `targetEntity` | `string` | `#F48FB1` | `"self"` |
| `sourceX` | `number` | `#64B5F6` | `0` |
| `sourceY` | `number` | `#64B5F6` | `0` |
| `sourceWidth` | `number` | `#64B5F6` | `100` |
| `sourceHeight` | `number` | `#64B5F6` | `100` |
| `duration` | `number` | `#64B5F6` | `0.5` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |
| `onComplete` | `execution` | `#FFFFFF` |

**Selectable Options (`data.options`):**

- **`easing`** (default: `"linear"`): `"linear"` (Linear), `"smooth"` (Smooth (Ease In-Out)), `"ease_in"` (Ease In), `"ease_out"` (Ease Out)

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const targetId = inputs.targetEntity;
const targetSX = Number(inputs.sourceX) || 0;
const targetSY = Number(inputs.sourceY) || 0;
const targetSW = Number(inputs.sourceWidth) || 0;
const targetSH = Number(inputs.sourceHeight) || 0;
const rawDuration = Number(inputs.duration);
const duration = isNaN(rawDuration) ? 0.5 : Math.max(0, rawDuration);
const easing = (node.data && node.data.values && node.data.values.easing) ? node.data.values.easing : 'linear';

const entity = context.assert.exists(context.entity.get(targetId), 'Target entity must exist');
const comp = context.assert.hasComponent(entity, 'SpriteRenderer');

if (duration <= 0) {
  comp.sourceX = targetSX;
  comp.sourceY = targetSY;
  comp.sourceWidth = targetSW;
  comp.sourceHeight = targetSH;
  outputs.execOut = true;
  outputs.onComplete = true;
  context.triggerFlow('onComplete');
  return;
}

context.state.startSX = typeof comp.sourceX === 'number' ? comp.sourceX : 0;
context.state.startSY = typeof comp.sourceY === 'number' ? comp.sourceY : 0;
context.state.startSW = typeof comp.sourceWidth === 'number' ? comp.sourceWidth : 0;
context.state.startSH = typeof comp.sourceHeight === 'number' ? comp.sourceHeight : 0;
context.state.targetSX = targetSX;
context.state.targetSY = targetSY;
context.state.targetSW = targetSW;
context.state.targetSH = targetSH;
context.state.duration = duration;
context.state.elapsed = 0;
context.state.isActive = true;

function easeFactor(type, p) {
  if (type === 'smooth') return p * p * (3 - 2 * p);
  if (type === 'ease_in') return p * p;
  if (type === 'ease_out') return p * (2 - p);
  return p;
}

context.onTick((dt) => {
  if (!context.state.isActive) return;
  const deltaSec = typeof dt === 'number' ? dt : Number(context.dt || 0.016);
  context.state.elapsed += deltaSec;

  const progress = Math.min(context.state.elapsed / context.state.duration, 1.0);
  const factor = easeFactor(easing, progress);

  comp.sourceX = context.state.startSX + (context.state.targetSX - context.state.startSX) * factor;
  comp.sourceY = context.state.startSY + (context.state.targetSY - context.state.startSY) * factor;
  comp.sourceWidth = context.state.startSW + (context.state.targetSW - context.state.startSW) * factor;
  comp.sourceHeight = context.state.startSH + (context.state.targetSH - context.state.startSH) * factor;

  if (progress >= 1.0) {
    context.state.isActive = false;
    comp.sourceX = context.state.targetSX;
    comp.sourceY = context.state.targetSY;
    comp.sourceWidth = context.state.targetSW;
    comp.sourceHeight = context.state.targetSH;
    outputs.onComplete = true;
    context.triggerFlow('onComplete');
  }
});

outputs.execOut = true;
outputs.onComplete = false;
return;
```
</details>

<a id="node-tweenFillAmount"></a>
#### 2.6.8 `tweenFillAmount` — Fill Amount

> Sets or animates fill percentage (0 to 100%) with 4-directional wipe (Left to Right, Right to Left, Top to Bottom, Bottom to Top). Set duration to 0 for instant fill.

- **Type:** `tweenFillAmount` | **Role:** `action` | **Header:** `Fill Amount` (`#E91E63`) | **Category:** `Animation & Tweens` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `targetEntity` | `string` | `#F48FB1` | `"self"` |
| `fill` | `number` | `#64B5F6` | `100` |
| `direction` | `string` | `#F48FB1` | `"left_to_right"` |
| `duration` | `number` | `#64B5F6` | `0` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |
| `onComplete` | `execution` | `#FFFFFF` |

**Selectable Options (`data.options`):**

- **`direction`** (default: `"left_to_right"`): `"left_to_right"` (Left to Right), `"right_to_left"` (Right to Left), `"top_to_bottom"` (Top to Bottom), `"bottom_to_top"` (Bottom to Top)
- **`easing`** (default: `"linear"`): `"linear"` (Linear), `"smooth"` (Smooth (Ease In-Out))

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const targetId = inputs.targetEntity;
const rawFill = Number(inputs.fill);
const targetPercent = isNaN(rawFill) ? 100 : Math.max(0, Math.min(100, rawFill));
const targetFill = targetPercent / 100;
let dir = inputs.direction || 'left_to_right';
if (dir === 'horizontal') dir = 'left_to_right';
if (dir === 'vertical') dir = 'bottom_to_top';

const rawDuration = Number(inputs.duration);
const duration = isNaN(rawDuration) ? 0 : Math.max(0, rawDuration);
const easing = (node.data && node.data.values && node.data.values.easing) ? node.data.values.easing : 'linear';

const entity = context.assert.exists(context.entity.get(targetId), 'Target entity must exist');
const t = (entity.components && entity.components.UITransform) || (entity.components && entity.components.Transform);
context.assert.exists(t, 'Target entity must have Transform or UITransform component');

const sprite = (entity.components && entity.components.SpriteRenderer) || false;
const shape = (entity.components && entity.components.ShapeRenderer) || false;

if (typeof context.state.baseW !== 'number') {
  context.state.baseX = typeof t.x === 'number' ? t.x : 0;
  context.state.baseY = typeof t.y === 'number' ? t.y : 0;
  context.state.baseW = t.width || 100;
  context.state.baseH = t.height || 100;
  context.state.pivotX = typeof t.pivotX === 'number' ? t.pivotX : 0.5;
  context.state.pivotY = typeof t.pivotY === 'number' ? t.pivotY : 0.5;

  if (sprite) {
    context.state.baseSX = typeof sprite.sourceX === 'number' ? sprite.sourceX : 0;
    context.state.baseSY = typeof sprite.sourceY === 'number' ? sprite.sourceY : 0;
    context.state.baseSW = sprite.sourceWidth || context.state.baseW;
    context.state.baseSH = sprite.sourceHeight || context.state.baseH;
  }
}

const baseW = context.state.baseW;
const baseH = context.state.baseH;
const baseX = context.state.baseX;
const baseY = context.state.baseY;
const px = context.state.pivotX;
const py = context.state.pivotY;
const baseSX = context.state.baseSX || 0;
const baseSY = context.state.baseSY || 0;
const baseSW = context.state.baseSW || baseW;
const baseSH = context.state.baseSH || baseH;

function applyFill(currentFill) {
  const f = Math.max(0, Math.min(1, currentFill));

  if (dir === 'left_to_right') {
    const w = baseW * f;
    t.width = w;
    t.x = baseX - px * baseW * (1 - f);
    if (shape) shape.width = w;
    if (sprite) {
      sprite.sourceX = baseSX;
      sprite.sourceWidth = baseSW * f;
    }
  } else if (dir === 'right_to_left') {
    const w = baseW * f;
    t.width = w;
    t.x = baseX + (1 - px) * baseW * (1 - f);
    if (shape) shape.width = w;
    if (sprite) {
      sprite.sourceX = baseSX + baseSW * (1 - f);
      sprite.sourceWidth = baseSW * f;
    }
  } else if (dir === 'bottom_to_top') {
    const h = baseH * f;
    t.height = h;
    t.y = baseY + (1 - py) * baseH * (1 - f);
    if (shape) shape.height = h;
    if (sprite) {
      sprite.sourceY = baseSY + baseSH * (1 - f);
      sprite.sourceHeight = baseSH * f;
    }
  } else if (dir === 'top_to_bottom') {
    const h = baseH * f;
    t.height = h;
    t.y = baseY - py * baseH * (1 - f);
    if (shape) shape.height = h;
    if (sprite) {
      sprite.sourceY = baseSY;
      sprite.sourceHeight = baseSH * f;
    }
  }
}

const currentFill = (dir === 'left_to_right' || dir === 'right_to_left')
  ? (baseW > 0 ? (t.width / baseW) : 1)
  : (baseH > 0 ? (t.height / baseH) : 1);

if (duration <= 0) {
  applyFill(targetFill);
  outputs.execOut = true;
  outputs.onComplete = true;
  context.triggerFlow('onComplete');
  return;
}

context.state.startFill = currentFill;
context.state.targetFill = targetFill;
context.state.duration = duration;
context.state.elapsed = 0;
context.state.isActive = true;

function easeFactor(type, p) {
  if (type === 'smooth') return p * p * (3 - 2 * p);
  return p;
}

context.onTick((dt) => {
  if (!context.state.isActive) return;
  const deltaSec = typeof dt === 'number' ? dt : Number(context.dt || 0.016);
  context.state.elapsed += deltaSec;

  const progress = Math.min(context.state.elapsed / context.state.duration, 1.0);
  const factor = easeFactor(easing, progress);
  const fillNow = context.state.startFill + (context.state.targetFill - context.state.startFill) * factor;

  applyFill(fillNow);

  if (progress >= 1.0) {
    context.state.isActive = false;
    applyFill(context.state.targetFill);
    outputs.onComplete = true;
    context.triggerFlow('onComplete');
  }
});

outputs.execOut = true;
outputs.onComplete = false;
return;
```
</details>

<a id="node-actionShakeTransform"></a>
#### 2.6.9 `actionShakeTransform` — Shake Transform

> Procedural shake effect with decay, perfect for impacts, explosions, or UI feedback.

- **Type:** `actionShakeTransform` | **Role:** `action` | **Header:** `Shake Transform` (`#E91E63`) | **Category:** `Animation & Tweens` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `targetEntity` | `string` | `#F48FB1` | `"self"` |
| `intensity` | `number` | `#64B5F6` | `10` |
| `duration` | `number` | `#64B5F6` | `0.5` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |
| `onComplete` | `execution` | `#FFFFFF` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const targetId = inputs.targetEntity;
const intensity = Number(inputs.intensity) || 10;
const rawDuration = Number(inputs.duration);
const duration = isNaN(rawDuration) ? 0.5 : Math.max(0, rawDuration);

const entity = context.assert.exists(context.entity.get(targetId), 'Target entity must exist');
const t = entity.components.UITransform || context.assert.hasComponent(entity, 'Transform');

if (duration <= 0 || intensity <= 0) {
  outputs.execOut = true;
  outputs.onComplete = true;
  context.triggerFlow('onComplete');
  return;
}

context.state.baseX = typeof context.state.baseX === 'number' ? context.state.baseX : t.x;
context.state.baseY = typeof context.state.baseY === 'number' ? context.state.baseY : t.y;
context.state.intensity = intensity;
context.state.duration = duration;
context.state.elapsed = 0;
context.state.isActive = true;

context.onTick((dt) => {
  if (!context.state.isActive) return;
  const deltaSec = typeof dt === 'number' ? dt : Number(context.dt || 0.016);
  context.state.elapsed += deltaSec;

  const progress = Math.min(context.state.elapsed / context.state.duration, 1.0);
  const currentIntensity = context.state.intensity * (1.0 - progress);

  const offsetX = (Math.random() * 2 - 1) * currentIntensity;
  const offsetY = (Math.random() * 2 - 1) * currentIntensity;

  t.x = context.state.baseX + offsetX;
  t.y = context.state.baseY + offsetY;

  if (progress >= 1.0) {
    context.state.isActive = false;
    t.x = context.state.baseX;
    t.y = context.state.baseY;
    delete context.state.baseX;
    delete context.state.baseY;
    outputs.onComplete = true;
    context.triggerFlow('onComplete');
  }
});

outputs.execOut = true;
outputs.onComplete = false;
return;
```
</details>

<a id="node-uiButtonScaleEffect"></a>
#### 2.6.10 `uiButtonScaleEffect` — Button Scale Effect

> Handles button hover, click, and scale interpolation (Lerp) automatically within a single node.

- **Type:** `uiButtonScaleEffect` | **Role:** `action` | **Header:** `Button Scale` (`#E91E63`) | **Category:** `Animation & Tweens` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `targetEntity` | `string` | `#F48FB1` | `"self"` |
| `useRaycast` | `boolean` | `#E57373` | `true` |
| `scaleNormal` | `number` | `#64B5F6` | `1` |
| `scaleHover` | `number` | `#64B5F6` | `1.1` |
| `scalePressed` | `number` | `#64B5F6` | `0.9` |
| `lerpSpeed` | `number` | `#64B5F6` | `0.2` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |
| `onClick` | `execution` | `#FFFFFF` |
| `selfEntity` | `string` | `#F48FB1` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const entity = context.assert.exists(context.entity.get(inputs.targetEntity), 'Target entity must exist');
const t = entity.components.UITransform || entity.components.Transform;
context.assert.exists(t, 'Entity must have UITransform or Transform component');

if (!context.state.wasDownMap) context.state.wasDownMap = new Map();
if (!context.state.scaleMap) context.state.scaleMap = new Map();

let currentScale = context.state.scaleMap.get(entity.scriptId) || t.scaleX || inputs.scaleNormal;
let wasDown = context.state.wasDownMap.get(entity.scriptId) || false;

outputs.selfEntity = entity.scriptId;
outputs.execOut = true;

const pointer = context.input.getPointer(entity) || context.input.getPointer();
const isLayerFrozen = Boolean(entity.layerId && context.layer && typeof context.layer.isInputFrozen === 'function' && context.layer.isInputFrozen(entity.layerId, 'pointer'));
const isFrozen = !pointer || isLayerFrozen;

if (isFrozen) {
  currentScale += (inputs.scaleNormal - currentScale) * inputs.lerpSpeed;
  t.scaleX = currentScale;
  t.scaleY = currentScale;
  context.state.scaleMap.set(entity.scriptId, currentScale);
  context.state.wasDownMap.set(entity.scriptId, false);
  return;
}

const isHovering = Boolean(context.input.isPointerOver(entity, inputs.useRaycast));
const isPointerDown = pointer ? Boolean(pointer.down) : false;

let targetScale = inputs.scaleNormal;
if (isHovering) {
  targetScale = isPointerDown ? inputs.scalePressed : inputs.scaleHover;
}

currentScale += (targetScale - currentScale) * inputs.lerpSpeed;
t.scaleX = currentScale;
t.scaleY = currentScale;

context.state.scaleMap.set(entity.scriptId, currentScale);

let clicked = false;
if (isHovering && !isPointerDown && wasDown) {
  clicked = true;
}

context.state.wasDownMap.set(entity.scriptId, isPointerDown);

if (clicked) {
  outputs.onClick = true;
}
return;
```
</details>

<a id="node-playAnimation"></a>
#### 2.6.11 `playAnimation` — Play Animation

> Plays the animation. Use On Complete for logic execution after the animation finishes.

- **Type:** `playAnimation` | **Role:** `action` | **Header:** `Play Animation` (`#8E24AA`) | **Category:** `Animation & Tweens` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `targetEntity` | `string` | `#F48FB1` | `"self"` |
| `clipId` | `string` | `#F48FB1` | `""` |
| `reset` | `boolean` | `#E57373` | `true` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |
| `onStart` | `execution` | `#FFFFFF` |
| `onComplete` | `execution` | `#FFFFFF` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const targetId = inputs.targetEntity;
const clipIdInput = inputs.clipId;
const reset = inputs.reset;
const entity = context.assert.exists(context.entity.get(targetId));
const animator = context.assert.hasComponent(entity, 'SpriteAnimator');
const targetStr = clipIdInput;

const rawClips = animator.clips;
const clips = Array.isArray(rawClips) ? rawClips : (rawClips && typeof rawClips === 'object' ? Object.values(rawClips) : []);
const targetClip = clips.find(c => c.scriptId === targetStr || c.id === targetStr);

animator.currentClip = targetClip ? targetClip.id : targetStr;
animator.isPlaying = true;

if (reset !== false) {
  animator._activeClipId = null;
  if (targetClip) {
    targetClip.frameIndex = 0;
  }
}

animator._onCompleteCallback = () => {
  outputs.onComplete = true;
  context.triggerFlow('onComplete');
};

outputs.execOut = true;
outputs.onStart = true;
return;
```
</details>

<a id="node-pauseAnimation"></a>
#### 2.6.12 `pauseAnimation` — Pause Animation

> Temporarily pauses the animation at the current frame.

- **Type:** `pauseAnimation` | **Role:** `action` | **Header:** `Pause Animation` (`#8E24AA`) | **Category:** `Animation & Tweens` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `targetEntity` | `string` | `#F48FB1` | `"self"` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const targetId = inputs.targetEntity;
const entity = context.assert.exists(context.entity.get(targetId));
const animator = context.assert.hasComponent(entity, 'SpriteAnimator');

animator.isPlaying = false;

outputs.execOut = true;
return;
```
</details>

<a id="node-getAnimator"></a>
#### 2.6.13 `getAnimator` — Get Animator

> Retrieves SpriteAnimator component properties from the target entity.
> *(Original description: "Mendapatkan properti animator dari entity target.")*

- **Type:** `getAnimator` | **Role:** `pure` | **Header:** `Get Animator` (`#8E24AA`) | **Category:** `Animation & Tweens` | **Dynamic Mode:** `outputProperty`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `targetEntity` | `string` | `#F48FB1` | `"self"` |

- **Output Ports (`outputs`):** *Empty by default (`[]`). Added dynamically from `data.propertyOptions` below.*

**Dynamic Output Property Options (`data.propertyOptions`):**

| Port ID (`value`) | Inspector Label (`label`) | Data Type (`type`) | Pin Color (`color`) |
| :--- | :--- | :--- | :--- |
| `currentClip` | Current Clip ID | `string` | `#F48FB1` |
| `isPlaying` | Is Playing? | `boolean` | `#E57373` |
| `active` | Is Enabled? | `boolean` | `#E57373` |
| `flipX` | Flip Horizontal | `boolean` | `#E57373` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const targetId = inputs.targetEntity;
const entity = context.assert.exists(context.entity.get(targetId));
const comp = context.assert.hasComponent(entity, 'SpriteAnimator');
const rawClips = comp.clips;
const clips = Array.isArray(rawClips) ? rawClips : (rawClips && typeof rawClips === 'object' ? Object.values(rawClips) : []);
const clip = clips.find(c => c.scriptId === comp.currentClip || c.id === comp.currentClip);

outputs.currentClip = comp.currentClip;
outputs.isPlaying = comp.isPlaying;
outputs.active = comp.active;
outputs.flipX = clip ? clip.flipX : false;
return;
```
</details>

<a id="node-setAnimator"></a>
#### 2.6.14 `setAnimator` — Set Animator

> Sets SpriteAnimator component properties on the target entity.
> *(Original description: "Mengatur properti animator pada entity target.")*

- **Type:** `setAnimator` | **Role:** `action` | **Header:** `Set Animator` (`#8E24AA`) | **Category:** `Animation & Tweens` | **Dynamic Mode:** `inputProperty`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `targetEntity` | `string` | `#F48FB1` | `"self"` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |

**Dynamic Input Property Options (`data.propertyOptions`):**

| Port ID (`value`) | Inspector Label (`label`) | Data Type (`type`) | Pin Color (`color`) |
| :--- | :--- | :--- | :--- |
| `currentClip` | Set Current Clip | `string` | `#F48FB1` |
| `active` | Is Enabled | `boolean` | `#E57373` |
| `flipX` | Flip Horizontal | `boolean` | `#E57373` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const targetId = inputs.targetEntity;
const entity = context.assert.exists(context.entity.get(targetId));
const comp = context.assert.hasComponent(entity, 'SpriteAnimator');
const rawClips = comp.clips;
const clips = Array.isArray(rawClips) ? rawClips : (rawClips && typeof rawClips === 'object' ? Object.values(rawClips) : []);

if ('currentClip' in inputs) {
  const targetStr = inputs.currentClip;
  const targetClip = clips.find(c => c.scriptId === targetStr || c.id === targetStr);
  const resolvedId = targetClip ? targetClip.id : targetStr;

  if (comp.currentClip !== resolvedId) {
    comp.currentClip = resolvedId;
    comp._elapsedTime = 0;
    comp.isPlaying = true;
    if (targetClip) targetClip.frameIndex = 0;
  }
}

if ('active' in inputs) {
  comp.active = inputs.active;
}

if ('flipX' in inputs) {
  const clip = clips.find(c => c.scriptId === comp.currentClip || c.id === comp.currentClip);
  if (clip) clip.flipX = inputs.flipX;
}

outputs.execOut = true;
return;
```
</details>

<a id="node-getClipProp"></a>
#### 2.6.15 `getClipProp` — Get Clip Prop

> Retrieves specific properties (FPS, looping, frame count) of an animation clip on the owner entity.
> *(Original description: "Mendapatkan properti spesifik dari animasi clip.")*

- **Type:** `getClipProp` | **Role:** `pure` | **Header:** `Get Clip Property` (`#8E24AA`) | **Category:** `Animation & Tweens` | **Dynamic Mode:** `outputProperty`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `clipId` | `string` | `#F48FB1` | `""` |

- **Output Ports (`outputs`):** *Empty by default (`[]`). Added dynamically from `data.propertyOptions` below.*

**Dynamic Output Property Options (`data.propertyOptions`):**

| Port ID (`value`) | Inspector Label (`label`) | Data Type (`type`) | Pin Color (`color`) |
| :--- | :--- | :--- | :--- |
| `fps` | Frame Rate | `number` | `#64B5F6` |
| `isLooping` | Is Looping? | `boolean` | `#E57373` |
| `frameCount` | Total Frames | `number` | `#64B5F6` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const clipIdInput = inputs.clipId;
const entity = context.assert.exists(context.owner);
const comp = context.assert.hasComponent(entity, 'SpriteAnimator');
const clips = comp.clips || [];
const targetStr = clipIdInput;
const clip = clips.find(c => c.scriptId === targetStr || c.id === targetStr);

if (clip) {
  outputs.fps = clip.fps;
  outputs.isLooping = clip.isLooping;
  outputs.frameCount = clip.frames ? clip.frames.length : 0;
}
return;
```
</details>

<a id="node-setClipProp"></a>
#### 2.6.16 `setClipProp` — Set Clip Prop

> Sets specific properties (FPS, looping) of an animation clip on the owner entity.
> *(Original description: "Mengatur properti spesifik dari animasi clip.")*

- **Type:** `setClipProp` | **Role:** `action` | **Header:** `Set Clip Property` (`#8E24AA`) | **Category:** `Animation & Tweens` | **Dynamic Mode:** `inputProperty`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `clipId` | `string` | `#F48FB1` | `""` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |

**Dynamic Input Property Options (`data.propertyOptions`):**

| Port ID (`value`) | Inspector Label (`label`) | Data Type (`type`) | Pin Color (`color`) |
| :--- | :--- | :--- | :--- |
| `fps` | Set FPS | `number` | `#64B5F6` |
| `isLooping` | Set Looping | `boolean` | `#E57373` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const clipIdInput = inputs.clipId;
const entity = context.assert.exists(context.owner);
const comp = context.assert.hasComponent(entity, 'SpriteAnimator');
const clips = comp.clips || [];
const targetStr = clipIdInput;
const clip = clips.find(c => c.scriptId === targetStr || c.id === targetStr);

if (clip) {
  if ('fps' in inputs) clip.fps = inputs.fps;
  if ('isLooping' in inputs) clip.isLooping = inputs.isLooping;
}

outputs.execOut = true;
return;
```
</details>

<a id="node-onAnimationFrame"></a>
#### 2.6.17 `onAnimationFrame` — On Animation Frame

> Fires execution triggers when an animation clip enters, stays active in, or exits a specific frame range.

- **Type:** `onAnimationFrame` | **Role:** `action` | **Header:** `On Animation Frame` (`#AB47BC`) | **Category:** `Animation & Tween` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `targetEntity` | `string` | `#F48FB1` | `"self"` |
| `clipId` | `string` | `#F48FB1` | `""` |
| `frameIndex` | `number` | `#64B5F6` | `1` |
| `endFrame` | `number` | `#64B5F6` | — |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |
| `onFrameEnter` | `execution` | `#FFFFFF` |
| `onFrameActive` | `execution` | `#FFFFFF` |
| `onFrameExit` | `execution` | `#FFFFFF` |
| `currentFrame` | `number` | `#64B5F6` |
| `isActive` | `boolean` | `#81C784` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const targetId = inputs.targetEntity || 'self';
let entity = false;
if (context.entity && typeof context.entity.get === 'function') {
  entity = context.entity.get(targetId);
}
if (!entity && context.owner && (targetId === 'self' || targetId === '')) {
  entity = context.owner;
}
if (!entity) {
  outputs.execOut = true;
  outputs.isActive = false;
  outputs.currentFrame = 0;
  return;
}

const anim = entity.components && entity.components.SpriteAnimator;
if (!anim) {
  outputs.execOut = true;
  outputs.isActive = false;
  outputs.currentFrame = 0;
  return;
}

const rawClips = anim.clips;
const clips = Array.isArray(rawClips) ? rawClips : (rawClips && typeof rawClips === 'object' ? Object.values(rawClips) : []);
const currentClipId = anim.currentClip;
let activeClip = false;
for (let i = 0; i < clips.length; i++) {
  const c = clips[i];
  if (c.id === currentClipId || c.scriptId === currentClipId || c.name === currentClipId) {
    activeClip = c;
    break;
  }
}

const curFrame = (activeClip && typeof activeClip.frameIndex === 'number') ? activeClip.frameIndex : 0;
outputs.currentFrame = curFrame;

let clipMatches = true;
const targetClip = String(inputs.clipId || '').trim();
if (targetClip) {
  clipMatches = Boolean(
    activeClip && (
      activeClip.id === targetClip ||
      activeClip.scriptId === targetClip ||
      activeClip.name === targetClip
    )
  );
}

const startFrame = Number(inputs.frameIndex) || 0;
const rawEnd = Number(inputs.endFrame);
const endFrame = isNaN(rawEnd) ? startFrame : rawEnd;

const isWithinRange = Boolean(clipMatches && curFrame >= startFrame && curFrame <= endFrame);
outputs.isActive = isWithinRange;

const stateKey = '_animFrame_' + (entity.id || targetId);
const prevState = Boolean(context.state[stateKey]);
context.state[stateKey] = isWithinRange;

if (isWithinRange && !prevState) {
  outputs.onFrameEnter = true;
  if (typeof context.triggerFlow === 'function') context.triggerFlow('onFrameEnter');
}
if (isWithinRange) {
  outputs.onFrameActive = true;
  if (typeof context.triggerFlow === 'function') context.triggerFlow('onFrameActive');
}
if (!isWithinRange && prevState) {
  outputs.onFrameExit = true;
  if (typeof context.triggerFlow === 'function') context.triggerFlow('onFrameExit');
}

outputs.execOut = true;
return;
```
</details>

---

<a id="27-data-collections"></a>
### 2.7 Collections & Data (`data_collections`)

- **Module Export:** `BlueprintCollections` ([BlueprintCollections.js](../editor/src/features/nodes/library/blueprints/BlueprintCollections.js))
- **Backward-Compatibility Re-export Aliases:** `BlueprintList`, `BlueprintMap`, `BlueprintCollectionHelper`
- **Category Color:** `#FF8A65` | **Icon:** `Database` | **Total Nodes:** **20**

| # | Type (`type`) | Label | Header Title | Role | Dynamic Mode | Description |
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |
| 1 | [`listGet`](#node-listGet) | **List Get** | `Get Item` | `pure` | `none` | Retrieves an item from the List by its index. |
| 2 | [`listSet`](#node-listSet) | **List Set** | `Set Item` | `action` | `none` | Updates the value of an item at a specified index. |
| 3 | [`listPush`](#node-listPush) | **List Push** | `Push` | `action` | `none` | Appends a new item to the end of the List. |
| 4 | [`listInsert`](#node-listInsert) | **List Insert** | `Insert` | `action` | `none` | Inserts an item into the List at a specified index. |
| 5 | [`listRemoveAt`](#node-listRemoveAt) | **List Remove At** | `Remove At` | `action` | `none` | Removes an item from the List at a specified index. |
| 6 | [`listLength`](#node-listLength) | **List Length** | `Length` | `pure` | `none` | Returns the total number of items contained in the List. |
| 7 | [`listContains`](#node-listContains) | **List Contains** | `Contains` | `pure` | `none` | Checks whether a specified value exists inside the List. |
| 8 | [`listIndexOf`](#node-listIndexOf) | **List IndexOf** | `IndexOf` | `pure` | `none` | Finds the index of a specified value within the List. Returns -1 if not found. |
| 9 | [`listConcat`](#node-listConcat) | **List Concat** | `Concat` | `pure` | `none` | Merges two Lists together into a single new List. |
| 10 | [`listShuffle`](#node-listShuffle) | **List Shuffle** | `Shuffle` | `action` | `none` | Randomly shuffles the order of elements within the List. |
| 11 | [`mapGet`](#node-mapGet) | **Map Get** | `Get` | `pure` | `none` | Retrieves a value from the Map based on its key. |
| 12 | [`mapSet`](#node-mapSet) | **Map Set** | `Set` | `action` | `none` | Adds or updates a value for a specific key within the Map. |
| 13 | [`mapRemove`](#node-mapRemove) | **Map Remove** | `Remove` | `action` | `none` | Removes the specified key and its associated value from the Map. |
| 14 | [`mapHas`](#node-mapHas) | **Map Has** | `Has Key` | `pure` | `none` | Checks whether a specified key exists inside the Map. |
| 15 | [`mapMerge`](#node-mapMerge) | **Map Merge** | `Merge` | `pure` | `none` | Merges two Maps into a new single Map (keys in Map B overwrite matching keys in Map A). |
| 16 | [`mapKeys`](#node-mapKeys) | **Map Keys** | `Keys` | `pure` | `none` | Returns a List containing all the keys found inside the Map. |
| 17 | [`mapValues`](#node-mapValues) | **Map Values** | `Values` | `pure` | `none` | Returns a List containing all the values found inside the Map. |
| 18 | [`mapSize`](#node-mapSize) | **Map Size** | `Size` | `pure` | `none` | Counts the total number of key-value pairs stored in the Map. |
| 19 | [`getFromPath`](#node-getFromPath) | **Get Value by Path** | `Get from Path` | `pure` | `none` | Reads a specific nested value inside a List or Map using a dot/bracket path string (e.g., "users.0.name" or "items[1].id"). |
| 20 | [`setFromPath`](#node-setFromPath) | **Set Value by Path** | `Set by Path` | `action` | `none` | Sets or updates a nested value inside a List or Map using a dot/bracket path string, auto-creating intermediate containers. |

<a id="node-listGet"></a>
#### 2.7.1 `listGet` — List Get

> Retrieves an item from the List by its index.

- **Type:** `listGet` | **Role:** `pure` | **Header:** `Get Item` (`#4DD0E1`) | **Category:** `Collections & Data` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `list` | `list` | `#4DD0E1` | — |
| `index` | `number` | `#64B5F6` | `0` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `item` | `any` | `#B0BEC5` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const list = inputs.list;
const index = inputs.index;

outputs.item = list[index];
return;
```
</details>

<a id="node-listSet"></a>
#### 2.7.2 `listSet` — List Set

> Updates the value of an item at a specified index.

- **Type:** `listSet` | **Role:** `action` | **Header:** `Set Item` (`#4DD0E1`) | **Category:** `Collections & Data` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `list` | `list` | `#4DD0E1` | — |
| `index` | `number` | `#64B5F6` | `0` |
| `value` | `any` | `#B0BEC5` | `""` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |
| `listOut` | `list` | `#4DD0E1` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const list = inputs.list;
const index = inputs.index;
const value = inputs.value;

list[index] = value;

outputs.listOut = list;
outputs.execOut = true;
return;
```
</details>

<a id="node-listPush"></a>
#### 2.7.3 `listPush` — List Push

> Appends a new item to the end of the List.

- **Type:** `listPush` | **Role:** `action` | **Header:** `Push` (`#4DD0E1`) | **Category:** `Collections & Data` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `list` | `list` | `#4DD0E1` | — |
| `value` | `any` | `#B0BEC5` | `""` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |
| `listOut` | `list` | `#4DD0E1` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const list = inputs.list;
const value = inputs.value;

list.push(value);

outputs.listOut = list;
outputs.execOut = true;
return;
```
</details>

<a id="node-listInsert"></a>
#### 2.7.4 `listInsert` — List Insert

> Inserts an item into the List at a specified index.

- **Type:** `listInsert` | **Role:** `action` | **Header:** `Insert` (`#4DD0E1`) | **Category:** `Collections & Data` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `list` | `list` | `#4DD0E1` | — |
| `index` | `number` | `#64B5F6` | `0` |
| `value` | `any` | `#B0BEC5` | `""` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |
| `listOut` | `list` | `#4DD0E1` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const list = inputs.list;
const index = inputs.index;
const value = inputs.value;

list.splice(index, 0, value);

outputs.listOut = list;
outputs.execOut = true;
return;
```
</details>

<a id="node-listRemoveAt"></a>
#### 2.7.5 `listRemoveAt` — List Remove At

> Removes an item from the List at a specified index.

- **Type:** `listRemoveAt` | **Role:** `action` | **Header:** `Remove At` (`#4DD0E1`) | **Category:** `Collections & Data` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `list` | `list` | `#4DD0E1` | — |
| `index` | `number` | `#64B5F6` | `0` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |
| `listOut` | `list` | `#4DD0E1` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const list = inputs.list;
const index = inputs.index;

list.splice(index, 1);

outputs.listOut = list;
outputs.execOut = true;
return;
```
</details>

<a id="node-listLength"></a>
#### 2.7.6 `listLength` — List Length

> Returns the total number of items contained in the List.

- **Type:** `listLength` | **Role:** `pure` | **Header:** `Length` (`#4DD0E1`) | **Category:** `Collections & Data` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `list` | `list` | `#4DD0E1` | — |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `length` | `number` | `#64B5F6` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const list = inputs.list;
outputs.length = list.length;
return;
```
</details>

<a id="node-listContains"></a>
#### 2.7.7 `listContains` — List Contains

> Checks whether a specified value exists inside the List.

- **Type:** `listContains` | **Role:** `pure` | **Header:** `Contains` (`#4DD0E1`) | **Category:** `Collections & Data` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `list` | `list` | `#4DD0E1` | — |
| `value` | `any` | `#B0BEC5` | `""` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `result` | `boolean` | `#E57373` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const list = inputs.list;
const value = inputs.value;

outputs.result = list.includes(value);
return;
```
</details>

<a id="node-listIndexOf"></a>
#### 2.7.8 `listIndexOf` — List IndexOf

> Finds the index of a specified value within the List. Returns -1 if not found.

- **Type:** `listIndexOf` | **Role:** `pure` | **Header:** `IndexOf` (`#4DD0E1`) | **Category:** `Collections & Data` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `list` | `list` | `#4DD0E1` | — |
| `value` | `any` | `#B0BEC5` | `""` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `index` | `number` | `#64B5F6` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const list = inputs.list;
const value = inputs.value;

outputs.index = list.indexOf(value);
return;
```
</details>

<a id="node-listConcat"></a>
#### 2.7.9 `listConcat` — List Concat

> Merges two Lists together into a single new List.

- **Type:** `listConcat` | **Role:** `pure` | **Header:** `Concat` (`#4DD0E1`) | **Category:** `Collections & Data` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `listA` | `list` | `#4DD0E1` | — |
| `listB` | `list` | `#4DD0E1` | — |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `result` | `list` | `#4DD0E1` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const listA = inputs.listA;
const listB = inputs.listB;

outputs.result = listA.concat(listB);
return;
```
</details>

<a id="node-listShuffle"></a>
#### 2.7.10 `listShuffle` — List Shuffle

> Randomly shuffles the order of elements within the List.

- **Type:** `listShuffle` | **Role:** `action` | **Header:** `Shuffle` (`#4DD0E1`) | **Category:** `Collections & Data` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `list` | `list` | `#4DD0E1` | — |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |
| `listOut` | `list` | `#4DD0E1` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const list = inputs.list;

for (let i = list.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [list[i], list[j]] = [list[j], list[i]];
}

outputs.listOut = list;
outputs.execOut = true;
return;
```
</details>

<a id="node-mapGet"></a>
#### 2.7.11 `mapGet` — Map Get

> Retrieves a value from the Map based on its key.

- **Type:** `mapGet` | **Role:** `pure` | **Header:** `Get` (`#FF8A65`) | **Category:** `Collections & Data` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `map` | `map` | `#FF8A65` | — |
| `key` | `string` | `#F48FB1` | `""` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `value` | `any` | `#B0BEC5` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const mapData = inputs.map;
const key = inputs.key;

outputs.value = mapData[key];
return;
```
</details>

<a id="node-mapSet"></a>
#### 2.7.12 `mapSet` — Map Set

> Adds or updates a value for a specific key within the Map.

- **Type:** `mapSet` | **Role:** `action` | **Header:** `Set` (`#FF8A65`) | **Category:** `Collections & Data` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `map` | `map` | `#FF8A65` | — |
| `key` | `string` | `#F48FB1` | `""` |
| `value` | `any` | `#B0BEC5` | `""` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |
| `mapOut` | `map` | `#FF8A65` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const mapData = inputs.map;
const key = inputs.key;
const value = inputs.value;

mapData[key] = value;

outputs.mapOut = mapData;
outputs.execOut = true;
return;
```
</details>

<a id="node-mapRemove"></a>
#### 2.7.13 `mapRemove` — Map Remove

> Removes the specified key and its associated value from the Map.

- **Type:** `mapRemove` | **Role:** `action` | **Header:** `Remove` (`#FF8A65`) | **Category:** `Collections & Data` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `map` | `map` | `#FF8A65` | — |
| `key` | `string` | `#F48FB1` | `""` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |
| `mapOut` | `map` | `#FF8A65` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const mapData = inputs.map;
const key = inputs.key;

delete mapData[key];

outputs.mapOut = mapData;
outputs.execOut = true;
return;
```
</details>

<a id="node-mapHas"></a>
#### 2.7.14 `mapHas` — Map Has

> Checks whether a specified key exists inside the Map.

- **Type:** `mapHas` | **Role:** `pure` | **Header:** `Has Key` (`#FF8A65`) | **Category:** `Collections & Data` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `map` | `map` | `#FF8A65` | — |
| `key` | `string` | `#F48FB1` | `""` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `result` | `boolean` | `#E57373` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const mapData = inputs.map;
const key = inputs.key;

outputs.result = Object.prototype.hasOwnProperty.call(mapData, key);
return;
```
</details>

<a id="node-mapMerge"></a>
#### 2.7.15 `mapMerge` — Map Merge

> Merges two Maps into a new single Map (keys in Map B overwrite matching keys in Map A).

- **Type:** `mapMerge` | **Role:** `pure` | **Header:** `Merge` (`#FF8A65`) | **Category:** `Collections & Data` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `mapA` | `map` | `#FF8A65` | — |
| `mapB` | `map` | `#FF8A65` | — |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `result` | `map` | `#FF8A65` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const mapA = inputs.mapA;
const mapB = inputs.mapB;

outputs.result = { ...mapA, ...mapB };
return;
```
</details>

<a id="node-mapKeys"></a>
#### 2.7.16 `mapKeys` — Map Keys

> Returns a List containing all the keys found inside the Map.

- **Type:** `mapKeys` | **Role:** `pure` | **Header:** `Keys` (`#FF8A65`) | **Category:** `Collections & Data` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `map` | `map` | `#FF8A65` | — |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `keysList` | `list` | `#4DD0E1` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const mapData = inputs.map;
outputs.keysList = Object.keys(mapData);
return;
```
</details>

<a id="node-mapValues"></a>
#### 2.7.17 `mapValues` — Map Values

> Returns a List containing all the values found inside the Map.

- **Type:** `mapValues` | **Role:** `pure` | **Header:** `Values` (`#FF8A65`) | **Category:** `Collections & Data` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `map` | `map` | `#FF8A65` | — |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `valuesList` | `list` | `#4DD0E1` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const mapData = inputs.map;
outputs.valuesList = Object.values(mapData);
return;
```
</details>

<a id="node-mapSize"></a>
#### 2.7.18 `mapSize` — Map Size

> Counts the total number of key-value pairs stored in the Map.

- **Type:** `mapSize` | **Role:** `pure` | **Header:** `Size` (`#FF8A65`) | **Category:** `Collections & Data` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `map` | `map` | `#FF8A65` | — |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `size` | `number` | `#64B5F6` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const mapData = inputs.map;
outputs.size = Object.keys(mapData).length;
return;
```
</details>

<a id="node-getFromPath"></a>
#### 2.7.19 `getFromPath` — Get Value by Path

> Reads a specific nested value inside a List or Map using a dot/bracket path string (e.g., "users.0.name" or "items[1].id").
> *(Original description: "Membaca nilai spesifik di dalam List atau Map menggunakan path string (cth: "users.0.name" atau "items[1].id").")*

- **Type:** `getFromPath` | **Role:** `pure` | **Header:** `Get from Path` (`#0891B2`) | **Category:** `Collections & Data` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `collection` | `any` | `#B0BEC5` | — |
| `path` | `string` | `#F48FB1` | `""` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `value` | `any` | `#B0BEC5` |
| `found` | `boolean` | `#E57373` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
let col = inputs.collection;
if (typeof col === 'string') {
  const trimmed = col.trim();
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      col = JSON.parse(trimmed);
    } catch (_) {}
  }
}

const pathString = inputs.path ? String(inputs.path) : '';
const parts = pathString.split(/[.\[\]]+/).map(p => p.replace(/^['"]|['"]$/g, '')).filter(p => p !== '');
let current = col;
let isFound = true;

if (parts.length === 0) {
  outputs.value = current ? current : null;
  outputs.found = Boolean(current);
  return;
}

for (let i = 0; i < parts.length; i++) {
  const part = parts[i];
  if (!current || typeof current !== 'object') {
    isFound = false;
    current = null;
    break;
  }

  if (current instanceof Map) {
    if (current.has(part)) {
      current = current.get(part);
    } else if (/^\d+$/.test(part) && current.has(Number(part))) {
      current = current.get(Number(part));
    } else {
      isFound = false;
      current = null;
      break;
    }
  } else if (Array.isArray(current)) {
    const idx = Number(part);
    if (Number.isInteger(idx) && idx >= 0 && idx < current.length) {
      current = current[idx];
    } else if (part in current) {
      current = current[part];
    } else {
      isFound = false;
      current = null;
      break;
    }
  } else if (typeof current === 'object') {
    if (Object.prototype.hasOwnProperty.call(current, part) || part in current) {
      current = current[part];
    } else {
      isFound = false;
      current = null;
      break;
    }
  } else {
    isFound = false;
    current = null;
    break;
  }
}

outputs.value = isFound ? current : null;
outputs.found = isFound;
return;
```
</details>

<a id="node-setFromPath"></a>
#### 2.7.20 `setFromPath` — Set Value by Path

> Sets or updates a nested value inside a List or Map using a dot/bracket path string, auto-creating intermediate containers.
> *(Original description: "Menetapkan atau memperbarui nilai di dalam List atau Map bersarang (nested) menggunakan path string.")*

- **Type:** `setFromPath` | **Role:** `action` | **Header:** `Set by Path` (`#0891B2`) | **Category:** `Collections & Data` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `collection` | `any` | `#B0BEC5` | — |
| `path` | `string` | `#F48FB1` | `""` |
| `value` | `any` | `#B0BEC5` | — |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |
| `collectionOut` | `any` | `#B0BEC5` |
| `valueOut` | `any` | `#B0BEC5` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
let targetCol = inputs.collection;
if (typeof targetCol === 'string') {
  const trimmed = targetCol.trim();
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      targetCol = JSON.parse(trimmed);
    } catch (_) {}
  }
}

targetCol = context.assert.exists(targetCol, 'Target collection must not be null or undefined');
const pathString = inputs.path ? String(inputs.path) : '';
const newVal = inputs.value;
const parts = pathString.split(/[.\[\]]+/).map(p => p.replace(/^['"]|['"]$/g, '')).filter(p => p !== '');

function getProp(obj, key) {
  if (obj instanceof Map) {
    if (obj.has(key)) return obj.get(key);
    if (/^\d+$/.test(key) && obj.has(Number(key))) return obj.get(Number(key));
    return undefined;
  }
  return obj[key];
}

function setProp(obj, key, val) {
  if (obj instanceof Map) {
    if (/^\d+$/.test(key) && obj.has(Number(key))) {
      obj.set(Number(key), val);
    } else {
      obj.set(key, val);
    }
  } else {
    obj[key] = val;
  }
}

let current = targetCol;

for (let i = 0; i < parts.length - 1; i++) {
  const part = parts[i];
  const nextPart = parts[i + 1];
  const isNextIndex = /^\d+$/.test(nextPart);

  let nextVal = getProp(current, part);
  if (!nextVal || typeof nextVal !== 'object') {
    nextVal = isNextIndex ? [] : {};
    setProp(current, part, nextVal);
  }
  current = nextVal;
}

if (parts.length > 0) {
  const lastPart = parts[parts.length - 1];
  setProp(current, lastPart, newVal);
}

outputs.collectionOut = targetCol;
outputs.valueOut = newVal;
outputs.execOut = true;
return;
```
</details>

---

<a id="28-math-operations"></a>
### 2.8 Math & Random (`math_operations`)

- **Module Export:** `BlueprintMath` ([BlueprintMath.js](../editor/src/features/nodes/library/blueprints/BlueprintMath.js))
- **Backward-Compatibility Re-export Aliases:** `BlueprintRandom`
- **Category Color:** `#009688` | **Icon:** `Calculator` | **Total Nodes:** **16**

| # | Type (`type`) | Label | Header Title | Role | Dynamic Mode | Description |
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |
| 1 | [`mathAdd`](#node-mathAdd) | **Add (+)** | `Add` | `pure` | `sequential` | Add numbers together (Val 1 + Val 2 + ...) |
| 2 | [`mathSubtract`](#node-mathSubtract) | **Subtract (-)** | `Subtract` | `pure` | `sequential` | Subtract numbers (Val 1 - Val 2 - ...) |
| 3 | [`mathMultiply`](#node-mathMultiply) | **Multiply (*)** | `Multiply` | `pure` | `sequential` | Multiply numbers together (Val 1 * Val 2 * ...) |
| 4 | [`mathDivide`](#node-mathDivide) | **Divide (/)** | `Divide` | `pure` | `sequential` | Divide numbers (Val 1 / Val 2 / ...) |
| 5 | [`mathNegate`](#node-mathNegate) | **Negate** | `Negate` | `pure` | `none` | Invert (-A) |
| 6 | [`mathRound`](#node-mathRound) | **Rounding (Floor/Ceil)** | `Rounding` | `pure` | `none` | Round, floor, or ceil a number |
| 7 | [`mathInRange`](#node-mathInRange) | **In Range** | `In Range` | `pure` | `none` | Check if a number is within a min and max range (min <= value <= max) |
| 8 | [`mathClamp`](#node-mathClamp) | **Clamp** | `Clamp` | `pure` | `none` | Clamp a number between a minimum and maximum limit |
| 9 | [`mathDistance2d`](#node-mathDistance2d) | **Distance 2D** | `Distance 2D` | `pure` | `none` | Calculate distance between two 2D points |
| 10 | [`mathDirection2d`](#node-mathDirection2d) | **Direction 2D** | `Direction 2D` | `pure` | `none` | Get normalized direction vector and angle from A to B |
| 11 | [`randomSmart`](#node-randomSmart) | **Random Number** | `Random Number` | `pure` | `none` | Generates a random number. Outputs an integer if inputs are integers, or a float if inputs are decimals. |
| 12 | [`randomChance`](#node-randomChance) | **Random Chance** | `Random Chance` | `pure` | `none` | Outputs true (Success) or false (Failure) based on a specified probability percentage (0 - 100). |
| 13 | [`randomFromList`](#node-randomFromList) | **List Get Random** | `Random From List` | `pure` | `none` | Retrieves a single random item from within the provided List or Array. |
| 14 | [`randomColor`](#node-randomColor) | **Random Color** | `Random Color` | `pure` | `none` | Generates a random color formatted as a Hex string (e.g., #A3F10C). |
| 15 | [`snapValue`](#node-snapValue) | **Snap Value** | `Snap Value` | `pure` | `none` | Snaps a numeric value to the nearest step increment with optional min and max limits. |
| 16 | [`mathChain`](#node-mathChain) | **Math Chain** | `Math Chain` | `pure` | `sequential` | Sequential calculation pipeline combining multiple math steps |

<a id="node-mathAdd"></a>
#### 2.8.1 `mathAdd` — Add (+)

> Add numbers together (Val 1 + Val 2 + ...)

- **Type:** `mathAdd` | **Role:** `pure` | **Header:** `Add` (`#00796B`) | **Category:** `Math & Random` | **Dynamic Mode:** `sequential`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `v0` | `number` | `#64B5F6` | `0` |
| `v1` | `number` | `#64B5F6` | `0` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `result` | `number` | `#64B5F6` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const v0 = inputs.v0;
const v1 = inputs.v1;
const numbers = Object.values(inputs);
const sum = numbers.reduce((acc, curr) => acc + curr, 0);
outputs.result = sum;
return;
```
</details>

<a id="node-mathSubtract"></a>
#### 2.8.2 `mathSubtract` — Subtract (-)

> Subtract numbers (Val 1 - Val 2 - ...)

- **Type:** `mathSubtract` | **Role:** `pure` | **Header:** `Subtract` (`#00796B`) | **Category:** `Math & Random` | **Dynamic Mode:** `sequential`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `v0` | `number` | `#64B5F6` | `0` |
| `v1` | `number` | `#64B5F6` | `0` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `result` | `number` | `#64B5F6` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const v0 = inputs.v0;
const v1 = inputs.v1;
const numbers = Object.values(inputs);
const diff = numbers.reduce((acc, curr, idx) => idx === 0 ? curr : acc - curr, 0);
outputs.result = diff;
return;
```
</details>

<a id="node-mathMultiply"></a>
#### 2.8.3 `mathMultiply` — Multiply (*)

> Multiply numbers together (Val 1 * Val 2 * ...)

- **Type:** `mathMultiply` | **Role:** `pure` | **Header:** `Multiply` (`#00796B`) | **Category:** `Math & Random` | **Dynamic Mode:** `sequential`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `v0` | `number` | `#64B5F6` | `1` |
| `v1` | `number` | `#64B5F6` | `1` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `result` | `number` | `#64B5F6` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const v0 = inputs.v0;
const v1 = inputs.v1;
const numbers = Object.values(inputs);
const product = numbers.reduce((acc, curr) => acc * curr, 1);
outputs.result = product;
return;
```
</details>

<a id="node-mathDivide"></a>
#### 2.8.4 `mathDivide` — Divide (/)

> Divide numbers (Val 1 / Val 2 / ...)

- **Type:** `mathDivide` | **Role:** `pure` | **Header:** `Divide` (`#00796B`) | **Category:** `Math & Random` | **Dynamic Mode:** `sequential`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `v0` | `number` | `#64B5F6` | `0` |
| `v1` | `number` | `#64B5F6` | `1` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `result` | `number` | `#64B5F6` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const v0 = inputs.v0;
const v1 = inputs.v1;
const numbers = Object.values(inputs);
const quotient = numbers.reduce((acc, curr, idx) => {
  if (idx === 0) return curr;
  return curr !== 0 ? acc / curr : 0;
}, 0);
outputs.result = quotient;
return;
```
</details>

<a id="node-mathNegate"></a>
#### 2.8.5 `mathNegate` — Negate

> Invert (-A)

- **Type:** `mathNegate` | **Role:** `pure` | **Header:** `Negate` (`#00796B`) | **Category:** `Math & Random` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `a` | `number` | `#64B5F6` | `0` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `result` | `number` | `#64B5F6` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const val = inputs.a;
const inverted = -val;
outputs.result = inverted;
return;
```
</details>

<a id="node-mathRound"></a>
#### 2.8.6 `mathRound` — Rounding (Floor/Ceil)

> Round, floor, or ceil a number

- **Type:** `mathRound` | **Role:** `pure` | **Header:** `Rounding` (`#00796B`) | **Category:** `Math & Random` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `value` | `number` | `#64B5F6` | `0` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `result` | `number` | `#64B5F6` |

**Additional Node Data Fields:**
- `data.method`: `"floor"` (`"floor"`, `"ceil"`, or `"round"`)

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const val = inputs.value;
const method = node.data.method;
const result = typeof Math[method] === 'function' ? Math[method](val) : Math.floor(val);

outputs.result = result;
return;
```
</details>

<a id="node-mathInRange"></a>
#### 2.8.7 `mathInRange` — In Range

> Check if a number is within a min and max range (min <= value <= max)

- **Type:** `mathInRange` | **Role:** `pure` | **Header:** `In Range` (`#00796B`) | **Category:** `Math & Random` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `value` | `number` | `#64B5F6` | `0` |
| `min` | `number` | `#64B5F6` | `0` |
| `max` | `number` | `#64B5F6` | `100` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `result` | `boolean` | `#E57373` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const val = inputs.value;
const min = inputs.min;
const max = inputs.max;

outputs.result = val >= min && val <= max;
return;
```
</details>

<a id="node-mathClamp"></a>
#### 2.8.8 `mathClamp` — Clamp

> Clamp a number between a minimum and maximum limit

- **Type:** `mathClamp` | **Role:** `pure` | **Header:** `Clamp` (`#00796B`) | **Category:** `Math & Random` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `value` | `number` | `#64B5F6` | `0` |
| `min` | `number` | `#64B5F6` | `0` |
| `max` | `number` | `#64B5F6` | `100` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `result` | `number` | `#64B5F6` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const val = inputs.value;
const min = inputs.min;
const max = inputs.max;

outputs.result = Math.min(Math.max(val, min), max);
return;
```
</details>

<a id="node-mathDistance2d"></a>
#### 2.8.9 `mathDistance2d` — Distance 2D

> Calculate distance between two 2D points

- **Type:** `mathDistance2d` | **Role:** `pure` | **Header:** `Distance 2D` (`#00796B`) | **Category:** `Math & Random` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `x1` | `number` | `#64B5F6` | `0` |
| `y1` | `number` | `#64B5F6` | `0` |
| `x2` | `number` | `#64B5F6` | `0` |
| `y2` | `number` | `#64B5F6` | `0` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `result` | `number` | `#64B5F6` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const x1 = inputs.x1;
const y1 = inputs.y1;
const x2 = inputs.x2;
const y2 = inputs.y2;

outputs.result = Math.hypot(x2 - x1, y2 - y1);
return;
```
</details>

<a id="node-mathDirection2d"></a>
#### 2.8.10 `mathDirection2d` — Direction 2D

> Get normalized direction vector and angle from A to B

- **Type:** `mathDirection2d` | **Role:** `pure` | **Header:** `Direction 2D` (`#00796B`) | **Category:** `Math & Random` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `fromX` | `number` | `#64B5F6` | `0` |
| `fromY` | `number` | `#64B5F6` | `0` |
| `toX` | `number` | `#64B5F6` | `0` |
| `toY` | `number` | `#64B5F6` | `0` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `directionX` | `number` | `#64B5F6` |
| `directionY` | `number` | `#64B5F6` |
| `angle` | `number` | `#64B5F6` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const fromX = inputs.fromX;
const fromY = inputs.fromY;
const toX = inputs.toX;
const toY = inputs.toY;

const dx = toX - fromX;
const dy = toY - fromY;
const dist = Math.hypot(dx, dy);

const deg = Math.atan2(dy, dx) * (180 / Math.PI);
const dirX = dist > 0 ? dx / dist : 0;
const dirY = dist > 0 ? dy / dist : 0;

outputs.angle = deg;
outputs.directionX = dirX;
outputs.directionY = dirY;
return;
```
</details>

<a id="node-randomSmart"></a>
#### 2.8.11 `randomSmart` — Random Number

> Generates a random number. Outputs an integer if inputs are integers, or a float if inputs are decimals.

- **Type:** `randomSmart` | **Role:** `pure` | **Header:** `Random Number` (`#FF5722`) | **Category:** `Math & Random` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `min` | `number` | `#64B5F6` | `1` |
| `max` | `number` | `#64B5F6` | `10` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `result` | `number` | `#64B5F6` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const min = inputs.min;
const max = inputs.max;

let res = 0;
if (Number.isInteger(min) && Number.isInteger(max)) {
  res = Math.floor(Math.random() * (max - min + 1)) + min;
} else {
  res = Math.random() * (max - min) + min;
}

outputs.result = res;
return;
```
</details>

<a id="node-randomChance"></a>
#### 2.8.12 `randomChance` — Random Chance

> Outputs true (Success) or false (Failure) based on a specified probability percentage (0 - 100).

- **Type:** `randomChance` | **Role:** `pure` | **Header:** `Random Chance` (`#FF5722`) | **Category:** `Math & Random` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `chance` | `number` | `#64B5F6` | `25` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `result` | `boolean` | `#E57373` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
outputs.result = (Math.random() * 100) < inputs.chance;
return;
```
</details>

<a id="node-randomFromList"></a>
#### 2.8.13 `randomFromList` — List Get Random

> Retrieves a single random item from within the provided List or Array.

- **Type:** `randomFromList` | **Role:** `pure` | **Header:** `Random From List` (`#FF5722`) | **Category:** `Math & Random` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `list` | `list` | `#4DD0E1` | — |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `item` | `any` | `#B0BEC5` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const list = inputs.list;
outputs.item = list[Math.floor(Math.random() * list.length)];
return;
```
</details>

<a id="node-randomColor"></a>
#### 2.8.14 `randomColor` — Random Color

> Generates a random color formatted as a Hex string (e.g., #A3F10C).

- **Type:** `randomColor` | **Role:** `pure` | **Header:** `Random Color` (`#FF5722`) | **Category:** `Math & Random` | **Dynamic Mode:** `none`

- **Input Ports (`inputs`):** *None*

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `color` | `string` | `#F48FB1` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
outputs.color = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
return;
```
</details>

<a id="node-snapValue"></a>
#### 2.8.15 `snapValue` — Snap Value

> Snaps a numeric value to the nearest step increment with optional min and max limits.

- **Type:** `snapValue` | **Role:** `pure` | **Header:** `Snap Value` (`#00796B`) | **Category:** `Math & Random` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `value` | `number` | `#64B5F6` | `0` |
| `step` | `number` | `#64B5F6` | `10` |
| `min` | `number` | `#64B5F6` | — |
| `max` | `number` | `#64B5F6` | — |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `result` | `number` | `#64B5F6` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const val = Number(inputs.value) || 0;
const step = Math.abs(Number(inputs.step)) || 1;
let res = Math.round(val / step) * step;
const min = Number(inputs.min);
const max = Number(inputs.max);
if (!isNaN(min)) res = Math.max(min, res);
if (!isNaN(max)) res = Math.min(max, res);
outputs.result = Number(res.toFixed(6));
return;
```
</details>

<a id="node-mathChain"></a>
#### 2.8.16 `mathChain` — Math Chain

> Sequential calculation pipeline combining multiple math steps

- **Type:** `mathChain` | **Role:** `pure` | **Header:** `Math Chain` (`#009688`) | **Category:** `Math & Random` | **Dynamic Mode:** `sequential` | **Custom Inspector:** `MathChainInspector.vue`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `v0` | `number` | `#64B5F6` | `0` |
| `v1` | `number` | `#64B5F6` | `0` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `result` | `number` | `#64B5F6` |

**Additional Node Data Fields:**
- `data.ops`: `["add"]` (sequence of operators between `v0..vN`)

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
let res = Number(inputs.v0) || 0;
res = res + (Number(inputs.v1) || 0);
outputs.result = Number(res.toFixed(6));
return;
```
</details>

---

<a id="29-game-lifecycle"></a>
### 2.9 Scene & Lifecycle (`game_lifecycle`)

- **Module Export:** `BlueprintLifecycle` ([BlueprintLifecycle.js](../editor/src/features/nodes/library/blueprints/BlueprintLifecycle.js))
- **Backward-Compatibility Re-export Aliases:** `BlueprintScene`
- **Category Color:** `#9C27B0` | **Icon:** `PlayCircle` | **Total Nodes:** **13**

| # | Type (`type`) | Label | Header Title | Role | Dynamic Mode | Description |
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |
| 1 | [`eventTick`](#node-eventTick) | **On Tick** | `On Tick` | `event` | `none` | Runs every frame. Use for continuous logic. |
| 2 | [`eventGameStart`](#node-eventGameStart) | **On Game Start** | `On Game Start` | `event` | `none` | Triggered once when the game begins. |
| 3 | [`eventGamePause`](#node-eventGamePause) | **On Game Pause** | `On Game Pause` | `event` | `none` | Triggered when the game is paused. |
| 4 | [`eventGameResume`](#node-eventGameResume) | **On Game Resume** | `On Game Resume` | `event` | `none` | Triggered when the game is resumed. |
| 5 | [`eventGameRestart`](#node-eventGameRestart) | **On Game Restart** | `On Game Restart` | `event` | `none` | Triggered when the entire game is restarted. |
| 6 | [`eventGameQuit`](#node-eventGameQuit) | **On Game Quit** | `On Game Quit` | `event` | `none` | Triggered when the game begins quitting or closing. |
| 7 | [`actionSetGameState`](#node-actionSetGameState) | **Set Game State** | `Set Game State` | `action` | `none` | Controls game state (pause, resume, restart, or quit). |
| 8 | [`changeScreen`](#node-changeScreen) | **Change Screen** | `Change Screen` | `action` | `none` | Changes display mode between windowed and fullscreen. |
| 9 | [`eventSceneStart`](#node-eventSceneStart) | **On Scene Start** | `On Scene Start` | `event` | `none` | Triggered exactly once when the scene has successfully loaded and started. |
| 10 | [`changeScene`](#node-changeScene) | **Change Scene** | `Change Scene` | `action` | `none` | Switches to another scene using the specified Scene Name. |
| 11 | [`restartScene`](#node-restartScene) | **Restart Scene** | `Restart Scene` | `action` | `none` | Reloads the currently active scene. |
| 12 | [`getCurrentScene`](#node-getCurrentScene) | **Get Current Scene** | `Get Current Scene` | `pure` | `none` | Retrieves the name of the currently active scene. |
| 13 | [`injectLayer`](#node-injectLayer) | **Inject Layer** | `Inject Layer` | `action` | `none` | Injects a reusable layer and its entities from another scene into the active scene with optional state inheritance. |

<a id="node-eventTick"></a>
#### 2.9.1 `eventTick` — On Tick

> Runs every frame. Use for continuous logic.

- **Type:** `eventTick` | **Role:** `event` | **Header:** `On Tick` (`#3B82F6`) | **Category:** `Scene & Lifecycle` | **Dynamic Mode:** `none`

- **Input Ports (`inputs`):** *None*

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |
| `deltaTime` | `number` | `#64B5F6` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
context.onTick((dt) => {
  outputs.deltaTime = dt;
  outputs.execOut = true;
  context.triggerFlow('execOut');
});
return;
```
</details>

<a id="node-eventGameStart"></a>
#### 2.9.2 `eventGameStart` — On Game Start

> Triggered once when the game begins.

- **Type:** `eventGameStart` | **Role:** `event` | **Header:** `On Game Start` (`#10B981`) | **Category:** `Scene & Lifecycle` | **Dynamic Mode:** `none`

- **Input Ports (`inputs`):** *None*

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
context.onGameStart(() => {
  outputs.execOut = true;
  context.triggerFlow('execOut');
});
return;
```
</details>

<a id="node-eventGamePause"></a>
#### 2.9.3 `eventGamePause` — On Game Pause

> Triggered when the game is paused.

- **Type:** `eventGamePause` | **Role:** `event` | **Header:** `On Game Pause` (`#EF4444`) | **Category:** `Scene & Lifecycle` | **Dynamic Mode:** `none`

- **Input Ports (`inputs`):** *None*

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
context.onGamePause(() => {
  outputs.execOut = true;
  context.triggerFlow('execOut');
});
return;
```
</details>

<a id="node-eventGameResume"></a>
#### 2.9.4 `eventGameResume` — On Game Resume

> Triggered when the game is resumed.

- **Type:** `eventGameResume` | **Role:** `event` | **Header:** `On Game Resume` (`#10B981`) | **Category:** `Scene & Lifecycle` | **Dynamic Mode:** `none`

- **Input Ports (`inputs`):** *None*

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
context.onGameResume(() => {
  outputs.execOut = true;
  context.triggerFlow('execOut');
});
return;
```
</details>

<a id="node-eventGameRestart"></a>
#### 2.9.5 `eventGameRestart` — On Game Restart

> Triggered when the entire game is restarted.

- **Type:** `eventGameRestart` | **Role:** `event` | **Header:** `On Game Restart` (`#F59E0B`) | **Category:** `Scene & Lifecycle` | **Dynamic Mode:** `none`

- **Input Ports (`inputs`):** *None*

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
context.onGameRestart(() => {
  outputs.execOut = true;
  context.triggerFlow('execOut');
});
return;
```
</details>

<a id="node-eventGameQuit"></a>
#### 2.9.6 `eventGameQuit` — On Game Quit

> Triggered when the game begins quitting or closing.

- **Type:** `eventGameQuit` | **Role:** `event` | **Header:** `On Game Quit` (`#EF4444`) | **Category:** `Scene & Lifecycle` | **Dynamic Mode:** `none`

- **Input Ports (`inputs`):** *None*

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
context.onGameQuit(() => {
  outputs.execOut = true;
  context.triggerFlow('execOut');
});
return;
```
</details>

<a id="node-actionSetGameState"></a>
#### 2.9.7 `actionSetGameState` — Set Game State

> Controls game state (pause, resume, restart, or quit).

- **Type:** `actionSetGameState` | **Role:** `action` | **Header:** `Set Game State` (`#9C27B0`) | **Category:** `Scene & Lifecycle` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `action` | `string` | `#F48FB1` | `"pause"` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |

**Selectable Options (`data.options`):**

- **`action`** (default: `"pause"`): `"pause"` (Pause), `"resume"` (Resume), `"restart"` (Restart), `"quit"` (Quit)

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const act = inputs.action;
if (act === 'pause') {
  context.lifecycle.pause();
} else if (act === 'resume') {
  context.lifecycle.resume();
} else if (act === 'restart') {
  context.lifecycle.restart();
} else if (act === 'quit') {
  context.lifecycle.quit();
}
outputs.execOut = true;
return;
```
</details>

<a id="node-changeScreen"></a>
#### 2.9.8 `changeScreen` — Change Screen

> Changes display mode between windowed and fullscreen.

- **Type:** `changeScreen` | **Role:** `action` | **Header:** `Change Screen` (`#9C27B0`) | **Category:** `Scene & Lifecycle` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `mode` | `string` | `#F48FB1` | `"window"` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |

**Selectable Options (`data.options`):**

- **`mode`** (default: `"window"`): `"window"` (Window), `"fullscreen"` (Full Screen)

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const targetMode = String(inputs.mode);
if (targetMode === 'fullscreen' || targetMode === 'Full Screen') {
  context.lifecycle.changeScreen('fullscreen');
} else {
  context.lifecycle.changeScreen('window');
}
outputs.execOut = true;
return;
```
</details>

<a id="node-eventSceneStart"></a>
#### 2.9.9 `eventSceneStart` — On Scene Start

> Triggered exactly once when the scene has successfully loaded and started.

- **Type:** `eventSceneStart` | **Role:** `event` | **Header:** `On Scene Start` (`#059669`) | **Category:** `Scene & Lifecycle` | **Dynamic Mode:** `none`

- **Input Ports (`inputs`):** *None*

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |
| `sceneName` | `string` | `#F48FB1` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
context.onSceneStart((sceneName) => {
  outputs.sceneName = sceneName;
  outputs.execOut = true;
  context.triggerFlow('execOut');
});
return;
```
</details>

<a id="node-changeScene"></a>
#### 2.9.10 `changeScene` — Change Scene

> Switches to another scene using the specified Scene Name.

- **Type:** `changeScene` | **Role:** `action` | **Header:** `Change Scene` (`#8E24AA`) | **Category:** `Scene & Lifecycle` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `sceneName` | `string` | `#F48FB1` | `""` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const sceneName = inputs.sceneName;

outputs.execOut = true;

context.scene.load(sceneName);
return;
```
</details>

<a id="node-restartScene"></a>
#### 2.9.11 `restartScene` — Restart Scene

> Reloads the currently active scene.

- **Type:** `restartScene` | **Role:** `action` | **Header:** `Restart Scene` (`#8E24AA`) | **Category:** `Scene & Lifecycle` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
outputs.execOut = true;
context.scene.restart();
return;
```
</details>

<a id="node-getCurrentScene"></a>
#### 2.9.12 `getCurrentScene` — Get Current Scene

> Retrieves the name of the currently active scene.

- **Type:** `getCurrentScene` | **Role:** `pure` | **Header:** `Get Current Scene` (`#8E24AA`) | **Category:** `Scene & Lifecycle` | **Dynamic Mode:** `none`

- **Input Ports (`inputs`):** *None*

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `sceneName` | `string` | `#F48FB1` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const currentScene = context.scene.getCurrentName();
outputs.sceneName = currentScene;
return;
```
</details>

<a id="node-injectLayer"></a>
#### 2.9.13 `injectLayer` — Inject Layer

> Injects a reusable layer and its entities from another scene into the active scene with optional state inheritance.

- **Type:** `injectLayer` | **Role:** `action` | **Header:** `Inject Layer` (`#8E24AA`) | **Category:** `Scene & Lifecycle` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `sceneName` | `string` | `#F48FB1` | `""` |
| `layerName` | `string` | `#F48FB1` | `""` |
| `targetLayer` | `string` | `#F48FB1` | `""` |
| `inheritState` | `boolean` | `#4CAF50` | `true` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |
| `success` | `boolean` | `#4CAF50` |
| `isFirstLoad` | `boolean` | `#4CAF50` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const sceneName = String(inputs.sceneName);
const layerName = String(inputs.layerName);
const targetLayer = inputs.targetLayer ? String(inputs.targetLayer) : '';
const inheritState = inputs.inheritState !== false && inputs.inheritState !== 'false';

const res = context.scene.injectLayer(sceneName, layerName, inheritState, targetLayer);
outputs.success = Boolean(res.success);
outputs.isFirstLoad = Boolean(res.isFirstLoad);
outputs.execOut = true;
return;
```
</details>

---

<a id="210-system-utilities"></a>
### 2.10 Audio & System (`system_utilities`)

- **Module Export:** `BlueprintSystem` ([BlueprintSystem.js](../editor/src/features/nodes/library/blueprints/BlueprintSystem.js))
- **Backward-Compatibility Re-export Aliases:** `BlueprintAudio`, `BlueprintVariable`, `BlueprintString`, `BlueprintEvent`
- **Category Color:** `#06B6D4` | **Icon:** `Sliders` | **Total Nodes:** **15**

| # | Type (`type`) | Label | Header Title | Role | Dynamic Mode | Description |
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |
| 1 | [`playAudio`](#node-playAudio) | **Play Audio** | `Play Audio` | `action` | `none` | Plays audio on the specified entity with an Audio component. |
| 2 | [`stopAudio`](#node-stopAudio) | **Stop Audio** | `Stop Audio` | `action` | `none` | Stops audio playback on the specified entity. |
| 3 | [`setAudioVolume`](#node-setAudioVolume) | **Set Volume** | `Set Volume` | `action` | `none` | Sets volume for an audio channel (master, background, sfx, or voice) in range 0 - 100. |
| 4 | [`getAudioVolume`](#node-getAudioVolume) | **Get Volume** | `Get Volume` | `pure` | `none` | Retrieves current volume of an audio channel (master, background, sfx, or voice) in range 0 - 100. |
| 5 | [`setAudioMute`](#node-setAudioMute) | **Set Channel Mute** | `Set Channel Mute` | `action` | `none` | Mutes or unmutes a specific audio channel (master, background, sfx, or voice). |
| 6 | [`variableGet`](#node-variableGet) | **Get Variable** | `Get Variable` | `pure` | `none` | Reads the value of a script-local or project-wide global variable. |
| 7 | [`variableSet`](#node-variableSet) | **Set Variable** | `Set Variable` | `action` | `none` | Assigns a new value to a script-local or project-wide global variable. |
| 8 | [`stringFormat`](#node-stringFormat) | **Format String** | `Format String` | `pure` | `sequential` | Hub for multiple text formats using {variables} |
| 9 | [`stringJoin`](#node-stringJoin) | **Join Strings** | `Join Strings` | `pure` | `sequential` | Join multiple strings with a separator |
| 10 | [`stringLength`](#node-stringLength) | **String Length** | `Length` | `pure` | `none` | Get the number of characters in a string |
| 11 | [`anyToString`](#node-anyToString) | **Any To String** | `Any > Str` | `pure` | `none` | Convert any data type (including List & Map) to a readable string |
| 12 | [`actionEmitSignal`](#node-actionEmitSignal) | **Emit Signal** | `Emit Signal` | `action` | `none` | Broadcasts a message to the entire system listening for this signal. |
| 13 | [`eventOnSignal`](#node-eventOnSignal) | **On Signal Received** | `On Signal` | `event` | `none` | Triggers the flow when a matching global signal is received. |
| 14 | [`uiNotification`](#node-uiNotification) | **Notification** | `Notification` | `action` | `none` | Display a UI notification toast to the player when triggered by execution flow |
| 15 | [`debugNotification`](#node-debugNotification) | **Debug Notification** | `Debug Notification` | `event` | `none` | Automatically evaluates and displays notification on tick update loop without execution pin |

<a id="node-playAudio"></a>
#### 2.10.1 `playAudio` — Play Audio

> Plays audio on the specified entity with an Audio component.

- **Type:** `playAudio` | **Role:** `action` | **Header:** `Play Audio` (`#06B6D4`) | **Category:** `Audio & System` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `targetEntity` | `string` | `#F48FB1` | `"self"` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const entity = context.assert.exists(context.entity.get(inputs.targetEntity), 'Entity not found');
context.assert.hasComponent(entity, 'Audio', 'Entity does not have Audio component');
context.audio.play(entity);
outputs.execOut = true;
return;
```
</details>

<a id="node-stopAudio"></a>
#### 2.10.2 `stopAudio` — Stop Audio

> Stops audio playback on the specified entity.

- **Type:** `stopAudio` | **Role:** `action` | **Header:** `Stop Audio` (`#06B6D4`) | **Category:** `Audio & System` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `targetEntity` | `string` | `#F48FB1` | `"self"` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const entity = context.assert.exists(context.entity.get(inputs.targetEntity), 'Entity not found');
context.audio.stop(entity);
outputs.execOut = true;
return;
```
</details>

<a id="node-setAudioVolume"></a>
#### 2.10.3 `setAudioVolume` — Set Volume

> Sets volume for an audio channel (master, background, sfx, or voice) in range 0 - 100.

- **Type:** `setAudioVolume` | **Role:** `action` | **Header:** `Set Volume` (`#06B6D4`) | **Category:** `Audio & System` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `audioType` | `string` | `#F48FB1` | `"master"` |
| `volume` | `number` | `#64B5F6` | `100` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |

**Selectable Options (`data.options`):**

- **`audioType`** (default: `"master"`): `"master"` (Master), `"background"` (Background), `"sfx"` (SFX), `"voice"` (Voice)

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const channel = context.assert.isString(inputs.audioType, 'Audio channel must be string');
const vol = context.assert.isNumber(inputs.volume, 'Volume must be number');
context.audio.setVolume(channel, vol);
outputs.execOut = true;
return;
```
</details>

<a id="node-getAudioVolume"></a>
#### 2.10.4 `getAudioVolume` — Get Volume

> Retrieves current volume of an audio channel (master, background, sfx, or voice) in range 0 - 100.

- **Type:** `getAudioVolume` | **Role:** `pure` | **Header:** `Get Volume` (`#06B6D4`) | **Category:** `Audio & System` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `audioType` | `string` | `#F48FB1` | `"master"` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `result` | `number` | `#64B5F6` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const channel = context.assert.isString(inputs.audioType, 'Audio channel must be string');
outputs.result = context.audio.getVolume(channel);
return;
```
</details>

<a id="node-setAudioMute"></a>
#### 2.10.5 `setAudioMute` — Set Channel Mute

> Mutes or unmutes a specific audio channel (master, background, sfx, or voice).

- **Type:** `setAudioMute` | **Role:** `action` | **Header:** `Set Channel Mute` (`#06B6D4`) | **Category:** `Audio & System` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `audioType` | `string` | `#F48FB1` | `"master"` |
| `isMute` | `boolean` | `#E57373` | `true` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const channel = context.assert.isString(inputs.audioType, 'Audio channel must be string');
const mute = context.assert.isBoolean(inputs.isMute, 'isMute must be boolean');
context.audio.setMute(channel, mute);
outputs.execOut = true;
return;
```
</details>

<a id="node-variableGet"></a>
#### 2.10.6 `variableGet` — Get Variable

> Reads the value of a script-local or project-wide global variable.
> *(Original description: "Membaca nilai dari variabel lokal atau global.")*

- **Type:** `variableGet` | **Role:** `pure` | **Header:** `Get Variable` (`#B0BEC5`) | **Category:** `Audio & System` | **Dynamic Mode:** `none`

- **Input Ports (`inputs`):** *None*

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `value` | `any` | `#B0BEC5` |

**Additional Node Data Fields:**
- `data.scope`: `"Local"` (`"Local"` or `"Global"`), `data.variableId`: `null`, `data.items`: `[{"variableId":null,"value":null,"dataType":"any"}]`

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
outputs.value = null;
return;
```
</details>

<a id="node-variableSet"></a>
#### 2.10.7 `variableSet` — Set Variable

> Assigns a new value to a script-local or project-wide global variable.
> *(Original description: "Menetapkan nilai ke variabel lokal atau global.")*

- **Type:** `variableSet` | **Role:** `action` | **Header:** `Set Variable` (`#B0BEC5`) | **Category:** `Audio & System` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `value` | `any` | `#B0BEC5` | — |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |
| `valueOut` | `any` | `#B0BEC5` |

**Additional Node Data Fields:**
- `data.scope`: `"Local"` (`"Local"` or `"Global"`), `data.variableId`: `null`, `data.items`: `[{"variableId":null,"value":null,"dataType":"any"}]`

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const val = inputs.value;
outputs.valueOut = val;
outputs.execOut = true;
return;
```
</details>

<a id="node-stringFormat"></a>
#### 2.10.8 `stringFormat` — Format String

> Hub for multiple text formats using {variables}

- **Type:** `stringFormat` | **Role:** `pure` | **Header:** `Format String` (`#F57C00`) | **Category:** `Audio & System` | **Dynamic Mode:** `sequential` | **Custom Inspector:** `StringFormatInspector.vue`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `format` | `string` | `#F48FB1` | `"Score: {v0} / {v1}"` |
| `v0` | `any` | `#B0BEC5` | — |
| `v1` | `any` | `#B0BEC5` | — |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `result` | `string` | `#F48FB1` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const formatStr = inputs.format;
const v0 = inputs.v0;
const v1 = inputs.v1;

const formatted = formatStr.replace(/{([^{}]+)}/g, (_, path) => {
  const parts = path.split('.');
  const rootKey = parts[0].trim();
  let val = inputs[rootKey];

  for (let i = 1; i < parts.length; i++) {
    val = val[parts[i].trim()];
  }

  return typeof val === 'object' ? JSON.stringify(val) : String(val);
});

outputs.result = formatted;
return;
```
</details>

<a id="node-stringJoin"></a>
#### 2.10.9 `stringJoin` — Join Strings

> Join multiple strings with a separator

- **Type:** `stringJoin` | **Role:** `pure` | **Header:** `Join Strings` (`#F57C00`) | **Category:** `Audio & System` | **Dynamic Mode:** `sequential`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `separator` | `string` | `#F48FB1` | `", "` |
| `v0` | `string` | `#F48FB1` | `""` |
| `v1` | `string` | `#F48FB1` | `""` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `result` | `string` | `#F48FB1` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const sep = inputs.separator;
const v0 = inputs.v0;
const v1 = inputs.v1;

const collection = Object.entries(inputs)
  .filter(([key]) => key !== 'separator')
  .map(([, val]) => val);

outputs.result = collection.join(sep);
return;
```
</details>

<a id="node-stringLength"></a>
#### 2.10.10 `stringLength` — String Length

> Get the number of characters in a string

- **Type:** `stringLength` | **Role:** `pure` | **Header:** `Length` (`#F57C00`) | **Category:** `Audio & System` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `value` | `string` | `#F48FB1` | `""` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `length` | `number` | `#64B5F6` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const val = inputs.value;
outputs.length = val.length;
return;
```
</details>

<a id="node-anyToString"></a>
#### 2.10.11 `anyToString` — Any To String

> Convert any data type (including List & Map) to a readable string

- **Type:** `anyToString` | **Role:** `pure` | **Header:** `Any > Str` (`#F57C00`) | **Category:** `Audio & System` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `value` | `any` | `#B0BEC5` | `""` |
| `pretty` | `boolean` | `#E57373` | `true` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `result` | `string` | `#F48FB1` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const val = inputs.value;
const isPretty = inputs.pretty;

const formatted = typeof val === 'object' ? JSON.stringify(val, null, isPretty ? 2 : 0) : String(val);

outputs.result = formatted;
return;
```
</details>

<a id="node-actionEmitSignal"></a>
#### 2.10.12 `actionEmitSignal` — Emit Signal

> Broadcasts a message to the entire system listening for this signal.

- **Type:** `actionEmitSignal` | **Role:** `action` | **Header:** `Emit Signal` (`#0288D1`) | **Category:** `Audio & System` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `signalName` | `string` | `#F48FB1` | `""` |
| `value` | `any` | `#B0BEC5` | `null` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
context.signal.emit(inputs.signalName, inputs.value);
outputs.execOut = true;
return;
```
</details>

<a id="node-eventOnSignal"></a>
#### 2.10.13 `eventOnSignal` — On Signal Received

> Triggers the flow when a matching global signal is received.

- **Type:** `eventOnSignal` | **Role:** `event` | **Header:** `On Signal` (`#0288D1`) | **Category:** `Audio & System` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `signalName` | `string` | `#F48FB1` | `""` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |
| `value` | `any` | `#B0BEC5` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
if (!context.state.signalRegistered) {
  context.state.signalRegistered = true;
  context.signal.on(inputs.signalName, (val) => {
    outputs.value = val;
    outputs.execOut = true;
    context.triggerFlow('execOut');
  });
}
return;
```
</details>

<a id="node-uiNotification"></a>
#### 2.10.14 `uiNotification` — Notification

> Display a UI notification toast to the player when triggered by execution flow

- **Type:** `uiNotification` | **Role:** `action` | **Header:** `Notification` (`#37474F`) | **Category:** `Audio & System` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `source` | `string` | `#F48FB1` | `"Notification"` |
| `message` | `any` | `#B0BEC5` | `"Hello World"` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
context.ui.notify(inputs.message, inputs.source);
outputs.execOut = true;
return;
```
</details>

<a id="node-debugNotification"></a>
#### 2.10.15 `debugNotification` — Debug Notification

> Automatically evaluates and displays notification on tick update loop without execution pin

- **Type:** `debugNotification` | **Role:** `event` | **Header:** `Debug Notification` (`#37474F`) | **Category:** `Audio & System` | **Dynamic Mode:** `none`

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `source` | `string` | `#F48FB1` | `"Debug"` |
| `data` | `any` | `#B0BEC5` | `""` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `result` | `string` | `#F48FB1` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
context.onTick(() => {
  context.ui.notify(inputs.data, inputs.source);
  outputs.result = typeof inputs.data === 'object' ? JSON.stringify(inputs.data) : ('' + inputs.data);
});
return;
```
</details>

---

<a id="211-helper-tool"></a>
### 2.11 Helper & Tool (`helper_tool`)

- **Module Export:** `BlueprintHelperTool` ([BlueprintHelperTool.js](../editor/src/features/nodes/library/blueprints/BlueprintHelperTool.js))
- **Backward-Compatibility Re-export Aliases:** `BlueprintVisualNovelHelper`
- **Category Color:** `#AB47BC` | **Icon:** `Wrench` | **Total Nodes:** **19**

| # | Type (`type`) | Label | Header Title | Role | Dynamic Mode | Description |
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |
| 1 | [`volumeSliderManager`](#node-volumeSliderManager) | **Volume Slider Manager** | `Volume Slider Manager` | `action` | `none` | Unified 4-channel automatic volume slider manager with auto crop & handle positioning. |
| 2 | [`atomicSlider`](#node-atomicSlider) | **Atomic Slider** | `Atomic Slider` | `action` | `none` | Configures a modular value slider (e.g., 0–160) supporting shape/sprite bars, independent or child knob handles, step rounding, and reverse direction. |
| 3 | [`switchButtonShape`](#node-switchButtonShape) | **Switch Button Shape** | `Switch Button (Shape)` | `action` | `none` | Manages a ShapeRenderer-based toggle switch with sliding knob animation, interactive click bounds, and dual ON/OFF text support. |
| 4 | [`switchButtonImage`](#node-switchButtonImage) | **Switch Button Image** | `Switch Button (Image)` | `action` | `none` | Manages a SpriteRenderer-based toggle switch with sliding knob animation, ON/OFF sprite swapping (1–4 assets), and interactive click bounds. |
| 5 | [`uiGridSpawner`](#node-uiGridSpawner) | **UI Grid Spawner** | `UI Grid Spawner` | `action` | `none` | Spawns and positions entity prefabs into a 2D grid layout with per-item callback flow. |
| 6 | [`uiPrefabBinder`](#node-uiPrefabBinder) | **UI Prefab Data Binder** | `UI Prefab Binder` | `action` | `none` | Automates data hydration for child entities and components (Sprite, Text, Transform, Audio, Collider, Physics, Animator, Shape, Tilemap, Script) on a prefab instance from a data item or collection. |
| 7 | [`vnDialogueRunner`](#node-vnDialogueRunner) | **Dialogue Runner** | `Dialogue Runner` | `action` | `none` | Runs visual novel dialogue sequences including typewriter text effects, speaker name, character portraits, and variable interpolation. |
| 8 | [`vnChoicePresenter`](#node-vnChoicePresenter) | **Choice Presenter** | `Choice Presenter` | `action` | `none` | Dynamically presents interactive choice buttons, manages player click selection with activation delay, and dispatches the chosen dialogue branch. |
| 9 | [`interpolateVariables`](#node-interpolateVariables) | **Interpolate Variables** | `Interpolate Variables` | `pure` | `none` | Replaces {variable} tokens in text with values from custom map, local state, or global variables. |
| 10 | [`platformerController`](#node-platformerController) | **Platformer Controller** | `Platformer Controller` | `action` | `none` | All-in-one platformer movement helper (Left, Right, Jump, Drop-Through Platform, Land Detection). |
| 11 | [`platformerAnimator`](#node-platformerAnimator) | **Platformer Animator** | `Platformer Animator` | `action` | `none` | Smart platformer animator helper (idle, run, jump, fall, auto left/right orientation and auto-flip). |
| 12 | [`platformerCombat`](#node-platformerCombat) | **Platformer Combat** | `Platformer Combat` | `action` | `none` | Robust melee combo attack manager with buffer window, cooldowns, and automatic hitbox overlaps. |
| 13 | [`topDownController`](#node-topDownController) | **Top-Down Controller** | `Top-Down Controller` | `action` | `none` | Keyboard-driven top-down movement controller with diagonal normalization, sprint, and direction facing. |
| 14 | [`topDownAnimator`](#node-topDownAnimator) | **Top-Down Animator** | `Top-Down Animator` | `action` | `none` | Smart 4-way, 8-way, and angle-based animator helper for top-down characters. |
| 15 | [`enemyChaser`](#node-enemyChaser) | **Enemy Chaser** | `Enemy Chaser` | `action` | `none` | AI enemy navigation helper: distance checking, auto chase/patrol, and range alerts. |
| 16 | [`enemyCombat`](#node-enemyCombat) | **Enemy Combat** | `Enemy Combat` | `action` | `none` | Hostile attack helper with cooldowns, range verification, and hitbox execution against target player. |
| 17 | [`proximitySensor`](#node-proximitySensor) | **Proximity Sensor** | `Proximity Sensor` | `action` | `none` | Detects entities within a 2D radius, calculates distance, direction vector, and facing direction. |
| 18 | [`pingPongStepper`](#node-pingPongStepper) | **Ping Pong Stepper** | `Ping Pong Stepper` | `action` | `none` | Steps an entity position or value back and forth between min and max limits, triggering onBounce. |
| 19 | [`collectableItem`](#node-collectableItem) | **Collectable Item** | `Collectable Item` | `action` | `none` | Extensible collectable helper with auto-pickup, bobbing effect, collection animation, SFX, and respawn/destroy lifecycle. |

<a id="node-volumeSliderManager"></a>
#### 2.11.1 `volumeSliderManager` — Volume Slider Manager

> Unified 4-channel automatic volume slider manager with auto crop & handle positioning.

- **Type:** `volumeSliderManager` | **Role:** `action` | **Header:** `Volume Slider Manager` (`#00ACC1`) | **Category:** `Helper & Tool` | **Dynamic Mode:** `none` | **Sub-Module:** `BlueprintUI` (`ui_tool`)

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `config` | `map` | `#FF8A65` | `{"master":{"bar":"VolumeMasterBar","handler":"VolumeMasterHandler","indicator":"VolumeMasterIndicator"},"vocal":{"bar":"VolumeVocalBar","handler":"VolumeVocalHandler","indicator":"VolumeVocalIndicator"},"sfx":{"bar":"VolumeSFXBar","handler":"VolumeSFXHandler","indicator":"VolumeSFXIndicator"},"background":{"bar":"VolumeBGMBar","handler":"VolumeBGMHandler","indicator":"VolumeBGMIndicator"}}` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |
| `onChanged` | `execution` | `#FFFFFF` |
| `changedChannel` | `string` | `#F48FB1` |
| `currentVolume` | `number` | `#64B5F6` |
| `masterVolume` | `number` | `#64B5F6` |
| `vocalVolume` | `number` | `#64B5F6` |
| `sfxVolume` | `number` | `#64B5F6` |
| `backgroundVolume` | `number` | `#64B5F6` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const config = inputs.config;
const cfg = config || (node.data && node.data.values && node.data.values.config) || false;
const ui = context.ui;
if (ui) {
  const res = ui.processVolumeSliders(context.state, cfg, inputs, outputs, context);
  outputs.changedChannel = res.changedChannel;
  outputs.currentVolume = res.currentVolume;
  outputs.masterVolume = res.masterVolume;
  outputs.vocalVolume = res.vocalVolume;
  outputs.sfxVolume = res.sfxVolume;
  outputs.backgroundVolume = res.backgroundVolume;
  outputs.onChanged = res.onChanged;
}
outputs.execOut = true;
return;
```
</details>

<a id="node-atomicSlider"></a>
#### 2.11.2 `atomicSlider` — Atomic Slider

> Configures a modular value slider (e.g., 0–160) supporting shape/sprite bars, independent or child knob handles, step rounding, and reverse direction.
> *(Original description: "Mengatur slider modular berbasis nilai bebas (misal 0-160), mendukung bar shape/sprite, knob independen atau child, pembulatan step, serta arah reverse.")*

- **Type:** `atomicSlider` | **Role:** `action` | **Header:** `Atomic Slider` (`#00ACC1`) | **Category:** `Helper & Tool` | **Dynamic Mode:** `none` | **Sub-Module:** `BlueprintUI` (`ui_tool`)

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `barEntity` | `string` | `#F48FB1` | `""` |
| `handlerEntity` | `string` | `#F48FB1` | `""` |
| `value` | `number` | `#64B5F6` | `100` |
| `min` | `number` | `#64B5F6` | `0` |
| `max` | `number` | `#64B5F6` | `100` |
| `step` | `number` | `#64B5F6` | `1` |
| `isInteractive` | `boolean` | `#81C784` | `true` |
| `reverse` | `boolean` | `#81C784` | `false` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |
| `onChanged` | `execution` | `#FFFFFF` |
| `value` | `number` | `#64B5F6` |
| `normalized` | `number` | `#64B5F6` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const barEntity = inputs.barEntity;
const handlerEntity = inputs.handlerEntity;
const value = inputs.value;
const min = inputs.min;
const max = inputs.max;
const step = inputs.step;
const isInteractive = inputs.isInteractive;
const reverse = inputs.reverse;
const ui = context.ui;
if (ui) {
  const res = ui.processAtomicSlider(context.state, inputs, outputs, context);
  outputs.value = res.value;
  outputs.normalized = res.normalized;
  outputs.onChanged = res.onChanged;
}
outputs.execOut = true;
return;
```
</details>

<a id="node-switchButtonShape"></a>
#### 2.11.3 `switchButtonShape` — Switch Button Shape

> Manages a ShapeRenderer-based toggle switch with sliding knob animation, interactive click bounds, and dual ON/OFF text support.
> *(Original description: "Mengatur interaksi switch toggle berbasis ShapeRenderer dengan animasi geser knob, area klik slide distance, dan dukungan 2 teks (ON/OFF).")*

- **Type:** `switchButtonShape` | **Role:** `action` | **Header:** `Switch Button (Shape)` (`#AB47BC`) | **Category:** `Helper & Tool` | **Dynamic Mode:** `none` | **Sub-Module:** `BlueprintUI` (`ui_tool`)

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `knobEntity` | `string` | `#F48FB1` | `""` |
| `trackEntity` | `string` | `#F48FB1` | `""` |
| `onTextEntity` | `string` | `#F48FB1` | `""` |
| `offTextEntity` | `string` | `#F48FB1` | `""` |
| `textEntity` | `string` | `#F48FB1` | `""` |
| `isOn` | `boolean` | `#81C784` | `false` |
| `duration` | `number` | `#64B5F6` | `0.15` |
| `slideDist` | `number` | `#64B5F6` | `40` |
| `knobOnColor` | `string` | `#F48FB1` | `"#FFFFFF"` |
| `knobOffColor` | `string` | `#F48FB1` | `"#E0E0E0"` |
| `trackOnColor` | `string` | `#F48FB1` | `"#4CAF50"` |
| `trackOffColor` | `string` | `#F48FB1` | `"#757575"` |
| `onText` | `string` | `#F48FB1` | `"ON"` |
| `offText` | `string` | `#F48FB1` | `"OFF"` |
| `onTextColor` | `string` | `#F48FB1` | `"#FFFFFF"` |
| `offTextColor` | `string` | `#F48FB1` | `"#BDBDBD"` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |
| `isOn` | `boolean` | `#E57373` |
| `onOn` | `execution` | `#FFFFFF` |
| `onOff` | `execution` | `#FFFFFF` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const knobEntity = inputs.knobEntity;
const trackEntity = inputs.trackEntity;
const onTextEntity = inputs.onTextEntity;
const offTextEntity = inputs.offTextEntity;
const textEntity = inputs.textEntity;
const isOn = inputs.isOn;
const duration = inputs.duration;
const slideDist = inputs.slideDist;
const knobOnColor = inputs.knobOnColor;
const knobOffColor = inputs.knobOffColor;
const trackOnColor = inputs.trackOnColor;
const trackOffColor = inputs.trackOffColor;
const onText = inputs.onText;
const offText = inputs.offText;
const onTextColor = inputs.onTextColor;
const offTextColor = inputs.offTextColor;

const ui = context.ui;
if (ui) {
  const res = ui.processSwitchButton(context.state, inputs, outputs, false, context);
  outputs.isOn = res.isOn;
  outputs.onOn = res.onOn;
  outputs.onOff = res.onOff;
}
outputs.execOut = true;
return;
```
</details>

<a id="node-switchButtonImage"></a>
#### 2.11.4 `switchButtonImage` — Switch Button Image

> Manages a SpriteRenderer-based toggle switch with sliding knob animation, ON/OFF sprite swapping (1–4 assets), and interactive click bounds.
> *(Original description: "Mengatur interaksi switch toggle berbasis SpriteRenderer dengan animasi geser knob, pergantian gambar ON/OFF, dan area klik interaktif.")*

- **Type:** `switchButtonImage` | **Role:** `action` | **Header:** `Switch Button (Image)` (`#AB47BC`) | **Category:** `Helper & Tool` | **Dynamic Mode:** `none` | **Sub-Module:** `BlueprintUI` (`ui_tool`)

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `knobEntity` | `string` | `#F48FB1` | `""` |
| `trackEntity` | `string` | `#F48FB1` | `""` |
| `onTextEntity` | `string` | `#F48FB1` | `""` |
| `offTextEntity` | `string` | `#F48FB1` | `""` |
| `textEntity` | `string` | `#F48FB1` | `""` |
| `isOn` | `boolean` | `#81C784` | `false` |
| `duration` | `number` | `#64B5F6` | `0.15` |
| `slideDist` | `number` | `#64B5F6` | `40` |
| `knobOnImage` | `string` | `#F48FB1` | `""` |
| `knobOffImage` | `string` | `#F48FB1` | `""` |
| `trackOnImage` | `string` | `#F48FB1` | `""` |
| `trackOffImage` | `string` | `#F48FB1` | `""` |
| `onText` | `string` | `#F48FB1` | `"ON"` |
| `offText` | `string` | `#F48FB1` | `"OFF"` |
| `onTextColor` | `string` | `#F48FB1` | `"#FFFFFF"` |
| `offTextColor` | `string` | `#F48FB1` | `"#BDBDBD"` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |
| `isOn` | `boolean` | `#E57373` |
| `onOn` | `execution` | `#FFFFFF` |
| `onOff` | `execution` | `#FFFFFF` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const knobEntity = inputs.knobEntity;
const trackEntity = inputs.trackEntity;
const onTextEntity = inputs.onTextEntity;
const offTextEntity = inputs.offTextEntity;
const textEntity = inputs.textEntity;
const isOn = inputs.isOn;
const duration = inputs.duration;
const slideDist = inputs.slideDist;
const knobOnImage = inputs.knobOnImage;
const knobOffImage = inputs.knobOffImage;
const trackOnImage = inputs.trackOnImage;
const trackOffImage = inputs.trackOffImage;
const onText = inputs.onText;
const offText = inputs.offText;
const onTextColor = inputs.onTextColor;
const offTextColor = inputs.offTextColor;

const ui = context.ui;
if (ui) {
  const res = ui.processSwitchButton(context.state, inputs, outputs, true, context);
  outputs.isOn = res.isOn;
  outputs.onOn = res.onOn;
  outputs.onOff = res.onOff;
}
outputs.execOut = true;
return;
```
</details>

<a id="node-uiGridSpawner"></a>
#### 2.11.5 `uiGridSpawner` — UI Grid Spawner

> Spawns and positions entity prefabs into a 2D grid layout with per-item callback flow.

- **Type:** `uiGridSpawner` | **Role:** `action` | **Header:** `UI Grid Spawner` (`#00ACC1`) | **Category:** `Helper & Tool` | **Dynamic Mode:** `none` | **Sub-Module:** `BlueprintUI` (`ui_tool`)

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `prefabName` | `string` | `#F48FB1` | `""` |
| `totalCount` | `number` | `#64B5F6` | `15` |
| `columns` | `number` | `#64B5F6` | `5` |
| `spacingX` | `number` | `#64B5F6` | `120` |
| `spacingY` | `number` | `#64B5F6` | `120` |
| `startX` | `number` | `#64B5F6` | `0` |
| `startY` | `number` | `#64B5F6` | `0` |
| `parentEntity` | `string` | `#F48FB1` | `""` |
| `layerId` | `string` | `#F48FB1` | `""` |
| `dataList` | `list` | `#4DD0E1` | `[]` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |
| `onSpawnItem` | `execution` | `#FFFFFF` |
| `spawnedEntity` | `string` | `#F48FB1` |
| `itemIndex` | `number` | `#64B5F6` |
| `rowIndex` | `number` | `#64B5F6` |
| `colIndex` | `number` | `#64B5F6` |
| `itemData` | `any` | `#B0BEC5` |
| `spawnedEntities` | `list` | `#4DD0E1` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const prefabName = inputs.prefabName;
const totalCount = inputs.totalCount;
const columns = inputs.columns;
const spacingX = inputs.spacingX;
const spacingY = inputs.spacingY;
const startX = inputs.startX;
const startY = inputs.startY;
const parentEntity = inputs.parentEntity;
const layerId = inputs.layerId;
const dataList = inputs.dataList;

const ui = context.ui;
if (ui) {
  const res = ui.processGridSpawner(context.state, inputs, outputs, context);
  outputs.spawnedEntity = res.spawnedEntity;
  outputs.itemIndex = res.itemIndex;
  outputs.rowIndex = res.rowIndex;
  outputs.colIndex = res.colIndex;
  outputs.itemData = res.itemData;
  outputs.spawnedEntities = res.spawnedEntities;
  outputs.onSpawnItem = res.onSpawnItem;
}
outputs.execOut = true;
return;
```
</details>

<a id="node-uiPrefabBinder"></a>
#### 2.11.6 `uiPrefabBinder` — UI Prefab Data Binder

> Automates data hydration for child entities and components (Sprite, Text, Transform, Audio, Collider, Physics, Animator, Shape, Tilemap, Script) on a prefab instance from a data item or collection.
> *(Original description: "God node untuk otomatisasi hidrasi child entity & komponen (Sprite, Text, Transform, Audio, Collider, Physics, Animator, Shape, Tilemap, Script) pada prefab berdasarkan item data / collection.")*

- **Type:** `uiPrefabBinder` | **Role:** `action` | **Header:** `UI Prefab Binder` (`#00ACC1`) | **Category:** `Helper & Tool` | **Dynamic Mode:** `none` | **Sub-Module:** `BlueprintUI` (`ui_tool`)

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `targetEntity` | `string` | `#F48FB1` | `"self"` |
| `data` | `any` | `#B0BEC5` | `null` |
| `itemIndex` | `number` | `#64B5F6` | `0` |
| `bindings` | `list` | `#4DD0E1` | `[]` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |
| `targetEntity` | `string` | `#F48FB1` |
| `boundCount` | `number` | `#64B5F6` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const targetEntity = inputs.targetEntity;
const data = inputs.data;
const itemIndex = inputs.itemIndex;
const bindings = inputs.bindings;

const ui = context.ui;
if (ui && typeof ui.processPrefabBinder === 'function') {
  const res = ui.processPrefabBinder(context.state, inputs, outputs, context);
  outputs.targetEntity = res.targetEntity;
  outputs.boundCount = res.boundCount;
}
outputs.execOut = true;
return;
```
</details>

<a id="node-vnDialogueRunner"></a>
#### 2.11.7 `vnDialogueRunner` — Dialogue Runner

> Runs visual novel dialogue sequences including typewriter text effects, speaker name, character portraits, and variable interpolation.
> *(Original description: "Menjalankan alur dialog visual novel: efek typewriter, nama pembicara, potret karakter, dan interpolasi variabel.")*

- **Type:** `vnDialogueRunner` | **Role:** `action` | **Header:** `Dialogue Runner` (`#EC407A`) | **Category:** `Helper & Tool` | **Dynamic Mode:** `none` | **Sub-Module:** `BlueprintDialogue` (`dialogue_tool`)

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `dialogMap` | `map` | `#FF8A65` | — |
| `charMap` | `map` | `#FF8A65` | — |
| `dialogId` | `string` | `#F48FB1` | `""` |
| `textEntity` | `string` | `#F48FB1` | `"dialogText"` |
| `speakerEntity` | `string` | `#F48FB1` | `"characterName"` |
| `portraitEntity` | `string` | `#F48FB1` | `"spriteCharacter"` |
| `nameEntity` | `string` | `#F48FB1` | `"nameBox"` |
| `clickEntity` | `string` | `#F48FB1` | `""` |
| `speed` | `number` | `#64B5F6` | `40` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `onNext` | `execution` | `#FFFFFF` |
| `onChoice` | `execution` | `#FFFFFF` |
| `onEnd` | `execution` | `#FFFFFF` |
| `nextDialogId` | `string` | `#F48FB1` |
| `choices` | `list` | `#81C784` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const dialogMap = inputs.dialogMap;
const charMap = inputs.charMap;
const dialogId = inputs.dialogId;
const textEntity = inputs.textEntity;
const speakerEntity = inputs.speakerEntity;
const portraitEntity = inputs.portraitEntity;
const nameEntity = inputs.nameEntity;
const clickEntity = inputs.clickEntity;
const speed = inputs.speed;

const helper = context.toolkit && context.toolkit.dialogue;
if (helper) {
  const res = helper.runDialogue(context.state, inputs, outputs, context);
  if (res) {
    outputs.onNext = res.onNext;
    outputs.onChoice = res.onChoice;
    outputs.onEnd = res.onEnd;
    outputs.nextDialogId = res.nextDialogId;
    outputs.choices = res.choices;
  }
}
return;
```
</details>

<a id="node-vnChoicePresenter"></a>
#### 2.11.8 `vnChoicePresenter` — Choice Presenter

> Dynamically presents interactive choice buttons, manages player click selection with activation delay, and dispatches the chosen dialogue branch.
> *(Original description: "Menampilkan tombol pilihan secara dinamis, mengelola interaksi klik pemain, dan memicu sinyal aksi.")*

- **Type:** `vnChoicePresenter` | **Role:** `action` | **Header:** `Choice Presenter` (`#AB47BC`) | **Category:** `Helper & Tool` | **Dynamic Mode:** `none` | **Sub-Module:** `BlueprintDialogue` (`dialogue_tool`)

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `choices` | `list` | `#81C784` | `[]` |
| `buttonEntities` | `list` | `#81C784` | `["btnChoice1","btnChoice2","btnChoice3"]` |
| `textEntities` | `list` | `#81C784` | `["btnChoice1Text","btnChoice2Text","btnChoice3Text"]` |
| `activationDelay` | `number` | `#64B5F6` | `0.25` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |
| `nextDialogId` | `string` | `#F48FB1` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const choices = inputs.choices;
const buttonEntities = inputs.buttonEntities;
const textEntities = inputs.textEntities;
const activationDelay = inputs.activationDelay;

const helper = context.toolkit && context.toolkit.dialogue;
if (helper) {
  const res = helper.presentChoices(context.state, inputs, outputs, context);
  if (res) {
    outputs.execOut = res.execOut;
    outputs.nextDialogId = res.nextDialogId;
  }
}
return;
```
</details>

<a id="node-interpolateVariables"></a>
#### 2.11.9 `interpolateVariables` — Interpolate Variables

> Replaces {variable} tokens in text with values from custom map, local state, or global variables.

- **Type:** `interpolateVariables` | **Role:** `pure` | **Header:** `Interpolate Variables` (`#AB47BC`) | **Category:** `Helper & Tool` | **Dynamic Mode:** `none` | **Sub-Module:** `BlueprintDialogue` (`dialogue_tool`)

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `text` | `string` | `#F48FB1` | `"Hello {playerName}!"` |
| `customMap` | `map` | `#FF8A65` | — |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `result` | `string` | `#F48FB1` |
| `tokenCount` | `number` | `#64B5F6` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const rawText = String(inputs.text || '');
const map = (inputs.customMap && typeof inputs.customMap === 'object') ? inputs.customMap : {};
let count = 0;

function resolveToken(key) {
  if (key in map) return { found: true, val: map[key] };
  if (context.state && (key in context.state)) return { found: true, val: context.state[key] };
  if (context.global && typeof context.global.get === 'function') {
    const gVal = context.global.get(key);
    if (gVal || gVal === 0 || gVal === false) return { found: true, val: gVal };
  }
  if (context.local && typeof context.local.get === 'function') {
    const lVal = context.local.get(key);
    if (lVal || lVal === 0 || lVal === false) return { found: true, val: lVal };
  }
  if (typeof context.getGlobal === 'function') {
    const gVal = context.getGlobal(key);
    if (gVal || gVal === 0 || gVal === false) return { found: true, val: gVal };
  }
  if (typeof context.getLocal === 'function') {
    const lVal = context.getLocal(key);
    if (lVal || lVal === 0 || lVal === false) return { found: true, val: lVal };
  }
  if (typeof context.hasVariable === 'function' && context.hasVariable(key)) {
    return { found: true, val: context.getVariable(key) };
  }
  return { found: false, val: '' };
}

const res = rawText.replace(/{([^{}]+)}/g, (match, token) => {
  count++;
  const trimmed = token.trim();
  const resObj = resolveToken(trimmed);
  if (resObj.found) {
    return String(resObj.val);
  }
  return match;
});

outputs.result = res;
outputs.tokenCount = count;
return;
```
</details>

<a id="node-platformerController"></a>
#### 2.11.10 `platformerController` — Platformer Controller

> All-in-one platformer movement helper (Left, Right, Jump, Drop-Through Platform, Land Detection).

- **Type:** `platformerController` | **Role:** `action` | **Header:** `Platformer Controller` (`#2E7D32`) | **Category:** `Helper & Tool` | **Dynamic Mode:** `none` | **Sub-Module:** `BlueprintPlatformer` (`platformer_tool`)

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `targetEntity` | `string` | `#F48FB1` | `"self"` |
| `speed` | `number` | `#64B5F6` | `260` |
| `jumpForce` | `number` | `#64B5F6` | `520` |
| `keyLeft` | `string` | `#F48FB1` | `"a"` |
| `keyRight` | `string` | `#F48FB1` | `"d"` |
| `keyJump` | `string` | `#F48FB1` | `"space"` |
| `keyDown` | `string` | `#F48FB1` | `"s"` |
| `oneWayTag` | `string` | `#F48FB1` | `"platform"` |
| `dropNudge` | `number` | `#64B5F6` | `6` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |
| `onJump` | `execution` | `#FFFFFF` |
| `onLand` | `execution` | `#FFFFFF` |
| `onDrop` | `execution` | `#FFFFFF` |
| `isGrounded` | `boolean` | `#81C784` |
| `isGroundedOnOneWay` | `boolean` | `#81C784` |
| `groundType` | `string` | `#F48FB1` |
| `movementState` | `string` | `#F48FB1` |
| `facingDirection` | `string` | `#F48FB1` |
| `velocityX` | `number` | `#64B5F6` |
| `velocityY` | `number` | `#64B5F6` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const targetEntity = inputs.targetEntity;
const speed = inputs.speed;
const jumpForce = inputs.jumpForce;
const keyLeft = inputs.keyLeft;
const keyRight = inputs.keyRight;
const keyJump = inputs.keyJump;
const keyDown = inputs.keyDown;
const oneWayTag = inputs.oneWayTag;
const dropNudge = inputs.dropNudge;

const helper = context.toolkit && context.toolkit.platformer;
if (helper) {
  const res = helper.processController({
    targetEntity,
    speed,
    jumpForce,
    keyLeft,
    keyRight,
    keyJump,
    keyDown,
    oneWayTag,
    dropNudge
  }, context);
  outputs.isGrounded = res.isGrounded;
  outputs.isGroundedOnOneWay = res.isGroundedOnOneWay;
  outputs.groundType = res.groundType;
  outputs.movementState = res.movementState;
  outputs.facingDirection = res.facingDirection;
  outputs.velocityX = res.velocityX;
  outputs.velocityY = res.velocityY;
  outputs.onJump = res.onJump;
  outputs.onLand = res.onLand;
  outputs.onDrop = res.onDrop;
}
outputs.execOut = true;
return;
```
</details>

<a id="node-platformerAnimator"></a>
#### 2.11.11 `platformerAnimator` — Platformer Animator

> Smart platformer animator helper (idle, run, jump, fall, auto left/right orientation and auto-flip).

- **Type:** `platformerAnimator` | **Role:** `action` | **Header:** `Platformer Animator` (`#AB47BC`) | **Category:** `Helper & Tool` | **Dynamic Mode:** `none` | **Sub-Module:** `BlueprintPlatformer` (`platformer_tool`)

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `targetEntity` | `string` | `#F48FB1` | `"self"` |
| `idleClips` | `string` | `#F48FB1` | `""` |
| `walkClips` | `string` | `#F48FB1` | `""` |
| `runClips` | `string` | `#F48FB1` | `""` |
| `jumpClips` | `string` | `#F48FB1` | `""` |
| `fallClips` | `string` | `#F48FB1` | `""` |
| `hitClips` | `string` | `#F48FB1` | `""` |
| `isHit` | `boolean` | `#E57373` | `false` |
| `movementState` | `string` | `#F48FB1` | `""` |
| `facingDirection` | `string` | `#F48FB1` | `""` |
| `autoFlipX` | `boolean` | `#E57373` | `true` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |
| `onClipChanged` | `execution` | `#FFFFFF` |
| `currentClip` | `string` | `#F48FB1` |
| `activeState` | `string` | `#F48FB1` |
| `facingDirection` | `string` | `#F48FB1` |
| `isFlipped` | `boolean` | `#81C784` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const targetEntity = inputs.targetEntity;
const idleClips = inputs.idleClips;
const walkClips = inputs.walkClips;
const runClips = inputs.runClips;
const jumpClips = inputs.jumpClips;
const fallClips = inputs.fallClips;
const hitClips = inputs.hitClips;
const isHit = inputs.isHit;
const movementState = inputs.movementState;
const facingDirection = inputs.facingDirection;
const autoFlipX = inputs.autoFlipX;

const helper = context.toolkit && context.toolkit.platformer;
if (helper) {
  const res = helper.processAnimator(context.state, inputs, outputs, context);
  outputs.currentClip = res.currentClip;
  outputs.activeState = res.activeState;
  outputs.facingDirection = res.facingDirection;
  outputs.isFlipped = res.isFlipped;
  outputs.onClipChanged = res.onClipChanged;
}
outputs.execOut = true;
return;
```
</details>

<a id="node-platformerCombat"></a>
#### 2.11.12 `platformerCombat` — Platformer Combat

> Robust melee combo attack manager with buffer window, cooldowns, and automatic hitbox overlaps.

- **Type:** `platformerCombat` | **Role:** `action` | **Header:** `Platformer Combat` (`#D32F2F`) | **Category:** `Helper & Tool` | **Dynamic Mode:** `none` | **Sub-Module:** `BlueprintPlatformer` (`platformer_tool`)

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `targetEntity` | `string` | `#F48FB1` | `"self"` |
| `triggerAttack` | `boolean` | `#81C784` | `false` |
| `keyAttack` | `string` | `#F48FB1` | `"j"` |
| `targetTag` | `string` | `#F48FB1` | `"enemy"` |
| `facingDirection` | `string` | `#F48FB1` | `""` |
| `isGrounded` | `boolean` | `#81C784` | `true` |
| `attacksConfig` | `map` | `#FF8A65` | `{"ground":[{"clip":"attack1","startFrame":1,"endFrame":3,"hitbox":{"offsetX":32,"offsetY":0,"width":40,"height":32},"damage":10,"knockbackX":150,"knockbackY":-50,"forwardStep":20},{"clip":"attack2","startFrame":2,"endFrame":4,"hitbox":{"offsetX":36,"offsetY":0,"width":44,"height":32},"damage":15,"knockbackX":250,"knockbackY":-80,"forwardStep":30}],"air":[{"clip":"airAttack","startFrame":1,"endFrame":4,"hitbox":{"offsetX":25,"offsetY":5,"width":44,"height":44},"damage":12,"knockbackX":120,"knockbackY":80,"forwardStep":0}]}` |
| `attackCooldown` | `number` | `#64B5F6` | `0` |
| `comboBufferTime` | `number` | `#64B5F6` | `0.35` |
| `autoLockMovement` | `boolean` | `#E57373` | `true` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |
| `onAttackStart` | `execution` | `#FFFFFF` |
| `onHitboxActive` | `execution` | `#FFFFFF` |
| `onHit` | `execution` | `#FFFFFF` |
| `onAttackEnd` | `execution` | `#FFFFFF` |
| `isAttacking` | `boolean` | `#81C784` |
| `canMove` | `boolean` | `#81C784` |
| `isCoolingDown` | `boolean` | `#81C784` |
| `cooldownRemaining` | `number` | `#64B5F6` |
| `currentCombo` | `number` | `#64B5F6` |
| `currentClip` | `string` | `#F48FB1` |
| `hitTarget` | `string` | `#F48FB1` |
| `damage` | `number` | `#64B5F6` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const targetEntity = inputs.targetEntity;
const triggerAttack = inputs.triggerAttack;
const keyAttack = inputs.keyAttack;
const targetTag = inputs.targetTag;
const facingDirection = inputs.facingDirection;
const isGrounded = inputs.isGrounded;
const attacksConfig = inputs.attacksConfig;
const attackCooldown = inputs.attackCooldown;
const comboBufferTime = inputs.comboBufferTime;
const autoLockMovement = inputs.autoLockMovement;

const helper = context.toolkit && context.toolkit.combat;
if (helper) {
  const res = helper.processPlatformerCombat(context.state, inputs, outputs, context);
  outputs.isAttacking = res.isAttacking;
  outputs.canMove = res.canMove;
  outputs.isCoolingDown = res.isCoolingDown;
  outputs.cooldownRemaining = res.cooldownRemaining;
  outputs.currentCombo = res.currentCombo;
  outputs.currentClip = res.currentClip;
  outputs.hitTarget = res.hitTarget;
  outputs.damage = res.damage;
  outputs.onAttackStart = res.onAttackStart;
  outputs.onHitboxActive = res.onHitboxActive;
  outputs.onHit = res.onHit;
  outputs.onAttackEnd = res.onAttackEnd;
}
outputs.execOut = true;
return;
```
</details>

<a id="node-topDownController"></a>
#### 2.11.13 `topDownController` — Top-Down Controller

> Keyboard-driven top-down movement controller with diagonal normalization, sprint, and direction facing.

- **Type:** `topDownController` | **Role:** `action` | **Header:** `Top-Down Controller` (`#00897B`) | **Category:** `Helper & Tool` | **Dynamic Mode:** `none` | **Sub-Module:** `BlueprintTopDown` (`topdown_tool`)

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `targetEntity` | `string` | `#F48FB1` | `"self"` |
| `speed` | `number` | `#64B5F6` | `200` |
| `sprintMultiplier` | `number` | `#64B5F6` | `1.5` |
| `keyUp` | `string` | `#F48FB1` | `"w"` |
| `keyDown` | `string` | `#F48FB1` | `"s"` |
| `keyLeft` | `string` | `#F48FB1` | `"a"` |
| `keyRight` | `string` | `#F48FB1` | `"d"` |
| `keySprint` | `string` | `#F48FB1` | `"shift"` |
| `normalizeDiagonal` | `boolean` | `#81C784` | `true` |
| `faceMouse` | `boolean` | `#81C784` | `false` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |
| `onMove` | `execution` | `#FFFFFF` |
| `onStop` | `execution` | `#FFFFFF` |
| `onSprint` | `execution` | `#FFFFFF` |
| `isMoving` | `boolean` | `#81C784` |
| `isSprinting` | `boolean` | `#81C784` |
| `movementState` | `string` | `#F48FB1` |
| `facingDirection` | `string` | `#F48FB1` |
| `facingAngle` | `number` | `#64B5F6` |
| `velocityX` | `number` | `#64B5F6` |
| `velocityY` | `number` | `#64B5F6` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const targetEntity = inputs.targetEntity;
const speed = inputs.speed;
const sprintMultiplier = inputs.sprintMultiplier;
const keyUp = inputs.keyUp;
const keyDown = inputs.keyDown;
const keyLeft = inputs.keyLeft;
const keyRight = inputs.keyRight;
const keySprint = inputs.keySprint;
const normalizeDiagonal = inputs.normalizeDiagonal;
const faceMouse = inputs.faceMouse;

const helper = context.toolkit && context.toolkit.topdown;
if (helper) {
  const res = helper.processController({
    targetEntity,
    speed,
    sprintMultiplier,
    keyUp,
    keyDown,
    keyLeft,
    keyRight,
    keySprint,
    normalizeDiagonal,
    faceMouse
  }, context);
  outputs.isMoving = res.isMoving;
  outputs.isSprinting = res.isSprinting;
  outputs.movementState = res.movementState;
  outputs.facingDirection = res.facingDirection;
  outputs.facingAngle = res.facingAngle;
  outputs.velocityX = res.velocityX;
  outputs.velocityY = res.velocityY;
  outputs.onMove = res.onMove;
  outputs.onStop = res.onStop;
  outputs.onSprint = res.onSprint;
}
outputs.execOut = true;
return;
```
</details>

<a id="node-topDownAnimator"></a>
#### 2.11.14 `topDownAnimator` — Top-Down Animator

> Smart 4-way, 8-way, and angle-based animator helper for top-down characters.

- **Type:** `topDownAnimator` | **Role:** `action` | **Header:** `Top-Down Animator` (`#AB47BC`) | **Category:** `Helper & Tool` | **Dynamic Mode:** `none` | **Sub-Module:** `BlueprintTopDown` (`topdown_tool`)

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `targetEntity` | `string` | `#F48FB1` | `"self"` |
| `movementState` | `string` | `#F48FB1` | `""` |
| `facingDirection` | `string` | `#F48FB1` | `""` |
| `facingAngle` | `number` | `#64B5F6` | `0` |
| `idleClips` | `string` | `#F48FB1` | `""` |
| `walkClips` | `string` | `#F48FB1` | `""` |
| `runClips` | `string` | `#F48FB1` | `""` |
| `hitClips` | `string` | `#F48FB1` | `""` |
| `isHit` | `boolean` | `#81C784` | `false` |
| `directionMode` | `string` | `#F48FB1` | `"4way"` |
| `autoFlipX` | `boolean` | `#81C784` | `true` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |
| `onClipChanged` | `execution` | `#FFFFFF` |
| `currentClip` | `string` | `#F48FB1` |
| `activeState` | `string` | `#F48FB1` |
| `facingDirection` | `string` | `#F48FB1` |
| `isFlipped` | `boolean` | `#81C784` |

**Selectable Options (`data.options`):**

- **`directionMode`** (default: `"4way"`): `"4way"` (4-Way (Cardinal)), `"8way"` (8-Way (Cardinal + Diagonals)), `"rotation"` (Rotation (Angle-Based))

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const targetEntity = inputs.targetEntity;
const movementState = inputs.movementState;
const facingDirection = inputs.facingDirection;
const facingAngle = inputs.facingAngle;
const idleClips = inputs.idleClips;
const walkClips = inputs.walkClips;
const runClips = inputs.runClips;
const hitClips = inputs.hitClips;
const isHit = inputs.isHit;
const directionMode = inputs.directionMode;
const autoFlipX = inputs.autoFlipX;

const helper = context.toolkit && context.toolkit.topdown;
if (helper) {
  const res = helper.processAnimator(context.state, {
    targetEntity,
    movementState,
    facingDirection,
    facingAngle,
    idleClips,
    walkClips,
    runClips,
    hitClips,
    isHit,
    directionMode,
    autoFlipX
  }, outputs, context);
  outputs.currentClip = res.currentClip;
  outputs.activeState = res.activeState;
  outputs.facingDirection = res.facingDirection;
  outputs.isFlipped = res.isFlipped;
  outputs.onClipChanged = res.onClipChanged;
}
outputs.execOut = true;
return;
```
</details>

<a id="node-enemyChaser"></a>
#### 2.11.15 `enemyChaser` — Enemy Chaser

> AI enemy navigation helper: distance checking, auto chase/patrol, and range alerts.

- **Type:** `enemyChaser` | **Role:** `action` | **Header:** `Enemy Chaser` (`#FF6F00`) | **Category:** `Helper & Tool` | **Dynamic Mode:** `none` | **Sub-Module:** `BlueprintAI` (`ai_tool`)

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `targetEntity` | `string` | `#F48FB1` | `"self"` |
| `playerTag` | `string` | `#F48FB1` | `"player"` |
| `detectRadius` | `number` | `#64B5F6` | `250` |
| `loseRadius` | `number` | `#64B5F6` | `350` |
| `stopRadius` | `number` | `#64B5F6` | `45` |
| `chaseSpeed` | `number` | `#64B5F6` | `160` |
| `patrolSpeed` | `number` | `#64B5F6` | `70` |
| `patrolDistance` | `number` | `#64B5F6` | `100` |
| `autoFlipX` | `boolean` | `#E57373` | `true` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |
| `onTargetAcquired` | `execution` | `#FFFFFF` |
| `onTargetLost` | `execution` | `#FFFFFF` |
| `onInAttackRange` | `execution` | `#FFFFFF` |
| `isChasing` | `boolean` | `#81C784` |
| `inAttackRange` | `boolean` | `#81C784` |
| `movementState` | `string` | `#F48FB1` |
| `distanceToTarget` | `number` | `#64B5F6` |
| `facingDirection` | `string` | `#F48FB1` |
| `targetPlayer` | `string` | `#F48FB1` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const targetEntity = inputs.targetEntity;
const playerTag = inputs.playerTag;
const detectRadius = inputs.detectRadius;
const loseRadius = inputs.loseRadius;
const stopRadius = inputs.stopRadius;
const chaseSpeed = inputs.chaseSpeed;
const patrolSpeed = inputs.patrolSpeed;
const patrolDistance = inputs.patrolDistance;
const autoFlipX = inputs.autoFlipX;

const helper = context.toolkit && context.toolkit.ai;
if (helper) {
  const res = helper.processChaser({
    targetEntity,
    playerTag,
    detectRadius,
    loseRadius,
    stopRadius,
    chaseSpeed,
    patrolSpeed,
    patrolDistance,
    autoFlipX
  }, context) || {};
  outputs.isChasing = res.isChasing;
  outputs.inAttackRange = res.inAttackRange;
  outputs.movementState = res.movementState;
  outputs.distanceToTarget = res.distanceToTarget;
  outputs.facingDirection = res.facingDirection;
  outputs.targetPlayer = res.targetPlayer;
  outputs.onTargetAcquired = res.onTargetAcquired;
  outputs.onTargetLost = res.onTargetLost;
  outputs.onInAttackRange = res.onInAttackRange;
}
outputs.execOut = true;
return;
```
</details>

<a id="node-enemyCombat"></a>
#### 2.11.16 `enemyCombat` — Enemy Combat

> Hostile attack helper with cooldowns, range verification, and hitbox execution against target player.

- **Type:** `enemyCombat` | **Role:** `action` | **Header:** `Enemy Combat` (`#C2185B`) | **Category:** `Helper & Tool` | **Dynamic Mode:** `none` | **Sub-Module:** `BlueprintAI` (`ai_tool`)

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `triggerAttack` | `execution` | `#FFFFFF` | — |
| `targetEntity` | `string` | `#F48FB1` | `"self"` |
| `playerTag` | `string` | `#F48FB1` | `"player"` |
| `attackClip` | `string` | `#F48FB1` | `"attack"` |
| `attackCooldown` | `number` | `#64B5F6` | `1.5` |
| `startFrame` | `number` | `#64B5F6` | `1` |
| `endFrame` | `number` | `#64B5F6` | `3` |
| `hitboxConfig` | `map` | `#FF8A65` | `{"offsetX":30,"offsetY":0,"width":36,"height":32}` |
| `damage` | `number` | `#64B5F6` | `10` |
| `knockbackX` | `number` | `#64B5F6` | `180` |
| `knockbackY` | `number` | `#64B5F6` | `-60` |
| `autoTriggerInRange` | `boolean` | `#E57373` | `true` |
| `facingDirection` | `string` | `#F48FB1` | `""` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |
| `onAttackStart` | `execution` | `#FFFFFF` |
| `onHitboxActive` | `execution` | `#FFFFFF` |
| `onHit` | `execution` | `#FFFFFF` |
| `onAttackEnd` | `execution` | `#FFFFFF` |
| `isAttacking` | `boolean` | `#81C784` |
| `isCoolingDown` | `boolean` | `#81C784` |
| `cooldownRemaining` | `number` | `#64B5F6` |
| `currentClip` | `string` | `#F48FB1` |
| `damageDealt` | `number` | `#64B5F6` |
| `hitPlayer` | `string` | `#F48FB1` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const targetEntity = inputs.targetEntity;
const playerTag = inputs.playerTag;
const attackClip = inputs.attackClip;
const attackCooldown = inputs.attackCooldown;
const startFrame = inputs.startFrame;
const endFrame = inputs.endFrame;
const hitboxConfig = inputs.hitboxConfig;
const damage = inputs.damage;
const knockbackX = inputs.knockbackX;
const knockbackY = inputs.knockbackY;
const autoTriggerInRange = inputs.autoTriggerInRange;
const facingDirection = inputs.facingDirection;
const triggerAttack = inputs.triggerAttack;

const helper = context.toolkit && context.toolkit.combat;
if (helper) {
  const res = helper.processEnemyCombat(context.state, inputs, outputs, context);
  outputs.isAttacking = res.isAttacking;
  outputs.isCoolingDown = res.isCoolingDown;
  outputs.cooldownRemaining = res.cooldownRemaining;
  outputs.currentClip = res.currentClip;
  outputs.damageDealt = res.damageDealt;
  outputs.hitPlayer = res.hitPlayer;
  outputs.onAttackStart = res.onAttackStart;
  outputs.onHitboxActive = res.onHitboxActive;
  outputs.onHit = res.onHit;
  outputs.onAttackEnd = res.onAttackEnd;
}
outputs.execOut = true;
return;
```
</details>

<a id="node-proximitySensor"></a>
#### 2.11.17 `proximitySensor` — Proximity Sensor

> Detects entities within a 2D radius, calculates distance, direction vector, and facing direction.

- **Type:** `proximitySensor` | **Role:** `action` | **Header:** `Proximity Sensor` (`#FF9800`) | **Category:** `Enemy & AI` | **Dynamic Mode:** `none` | **Sub-Module:** `BlueprintAI` (`ai_tool`)

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `sourceEntity` | `string` | `#F48FB1` | `"self"` |
| `targetEntity` | `string` | `#F48FB1` | `""` |
| `targetTag` | `string` | `#F48FB1` | `"player"` |
| `radius` | `number` | `#64B5F6` | `200` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |
| `onDetected` | `execution` | `#FFFFFF` |
| `onLost` | `execution` | `#FFFFFF` |
| `inRange` | `boolean` | `#81C784` |
| `distance` | `number` | `#64B5F6` |
| `directionX` | `number` | `#64B5F6` |
| `directionY` | `number` | `#64B5F6` |
| `facingDirection` | `string` | `#F48FB1` |
| `detectedEntity` | `string` | `#F48FB1` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const srcId = inputs.sourceEntity || 'self';
const source = context.assert.exists(context.entity.get(srcId), 'Source entity must exist');
const st = source.components && (source.components.Transform || source.components.UITransform);
const sx = st && typeof st.x === 'number' ? st.x : 0;
const sy = st && typeof st.y === 'number' ? st.y : 0;

let target = false;
const targetId = inputs.targetEntity;
if (targetId) {
  target = context.entity.get(targetId);
}
if (!target && inputs.targetTag) {
  target = context.entity.findClosestByTag(inputs.targetTag, source);
}

if (!target) {
  outputs.inRange = false;
  outputs.distance = 999999;
  outputs.directionX = 0;
  outputs.directionY = 0;
  outputs.facingDirection = '';
  outputs.detectedEntity = '';
  outputs.execOut = true;
  return;
}

const tt = target.components && (target.components.Transform || target.components.UITransform);
const tx = tt && typeof tt.x === 'number' ? tt.x : 0;
const ty = tt && typeof tt.y === 'number' ? tt.y : 0;
const dx = tx - sx;
const dy = ty - sy;
const dist = Math.sqrt(dx * dx + dy * dy);
const radius = Math.max(0, Number(inputs.radius) || 200);
const isInside = dist <= radius;

const dirX = dx > 0 ? 1 : (dx < 0 ? -1 : 0);
const dirY = dy > 0 ? 1 : (dy < 0 ? -1 : 0);
let facing = 'right';
if (Math.abs(dx) >= Math.abs(dy)) {
  facing = dx < 0 ? 'left' : 'right';
} else {
  facing = dy < 0 ? 'up' : 'down';
}

outputs.inRange = isInside;
outputs.distance = Math.round(dist * 100) / 100;
outputs.directionX = dirX;
outputs.directionY = dirY;
outputs.facingDirection = facing;
outputs.detectedEntity = target.id || target.scriptId || '';

const stateKey = '_prox_' + (source.id || srcId);
const wasInside = Boolean(context.state[stateKey]);
context.state[stateKey] = isInside;

if (isInside && !wasInside) {
  outputs.onDetected = true;
  if (typeof context.triggerFlow === 'function') context.triggerFlow('onDetected');
}
if (!isInside && wasInside) {
  outputs.onLost = true;
  if (typeof context.triggerFlow === 'function') context.triggerFlow('onLost');
}
outputs.execOut = true;
return;
```
</details>

<a id="node-pingPongStepper"></a>
#### 2.11.18 `pingPongStepper` — Ping Pong Stepper

> Steps an entity position or value back and forth between min and max limits, triggering onBounce.

- **Type:** `pingPongStepper` | **Role:** `action` | **Header:** `Ping Pong Stepper` (`#FF8F00`) | **Category:** `Enemy & AI` | **Dynamic Mode:** `none` | **Sub-Module:** `BlueprintAI` (`ai_tool`)

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `currentPos` | `number` | `#64B5F6` | `0` |
| `minPos` | `number` | `#64B5F6` | `0` |
| `maxPos` | `number` | `#64B5F6` | `200` |
| `speed` | `number` | `#64B5F6` | `2` |
| `direction` | `number` | `#64B5F6` | `1` |
| `targetEntity` | `string` | `#F48FB1` | `""` |
| `axis` | `string` | `#F48FB1` | `"x"` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |
| `onBounce` | `execution` | `#FFFFFF` |
| `nextPos` | `number` | `#64B5F6` |
| `nextDirection` | `number` | `#64B5F6` |
| `isAtBoundary` | `boolean` | `#81C784` |

**Selectable Options (`data.options`):**

- **`axis`** (default: `"x"`): `"x"` (X Axis (Horizontal)), `"y"` (Y Axis (Vertical))

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
let pos = Number(inputs.currentPos) || 0;
let entity = false;
if (inputs.targetEntity) {
  entity = context.entity.get(inputs.targetEntity);
  if (entity && entity.components && entity.components.Transform) {
    pos = inputs.axis === 'y' ? entity.components.Transform.y : entity.components.Transform.x;
  }
}
const min = Number(inputs.minPos) || 0;
const max = Number(inputs.maxPos) || 100;
let dir = Number(inputs.direction);
if (dir === 0 || isNaN(dir)) dir = 1;
dir = dir > 0 ? 1 : -1;
const spd = Math.abs(Number(inputs.speed) || 1);

let next = pos + dir * spd;
let bounced = false;

if (next >= max) {
  next = max;
  dir = -1;
  bounced = true;
} else if (next <= min) {
  next = min;
  dir = 1;
  bounced = true;
}

if (entity && entity.components && entity.components.Transform) {
  if (inputs.axis === 'y') {
    entity.components.Transform.y = next;
  } else {
    entity.components.Transform.x = next;
  }
}

outputs.nextPos = next;
outputs.nextDirection = dir;
outputs.isAtBoundary = bounced;

if (bounced) {
  outputs.onBounce = true;
  if (typeof context.triggerFlow === 'function') context.triggerFlow('onBounce');
}
outputs.execOut = true;
return;
```
</details>

<a id="node-collectableItem"></a>
#### 2.11.19 `collectableItem` — Collectable Item

> Extensible collectable helper with auto-pickup, bobbing effect, collection animation, SFX, and respawn/destroy lifecycle.

- **Type:** `collectableItem` | **Role:** `action` | **Header:** `Collectable Item` (`#FFB300`) | **Category:** `Helper & Tool` | **Dynamic Mode:** `none` | **Sub-Module:** `BlueprintCollectable` (`collectable_tool`)

**Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) | Default Value (`defaultValue` / `data.values`) |
| :--- | :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` | — |
| `targetEntity` | `string` | `#F48FB1` | `"self"` |
| `collectorTag` | `string` | `#F48FB1` | `"player"` |
| `pickupMode` | `string` | `#F48FB1` | `"collision"` |
| `interactKey` | `string` | `#F48FB1` | `"e"` |
| `scoreValue` | `number` | `#64B5F6` | `1` |
| `canCollect` | `boolean` | `#81C784` | `true` |
| `idleClip` | `string` | `#F48FB1` | `""` |
| `collectClip` | `string` | `#F48FB1` | `""` |
| `sfxName` | `string` | `#F48FB1` | `""` |
| `despawnAction` | `string` | `#F48FB1` | `"destroy"` |
| `respawnTime` | `number` | `#64B5F6` | `0` |
| `autoBobbing` | `boolean` | `#81C784` | `true` |

**Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |
| `onCollected` | `execution` | `#FFFFFF` |
| `onAnimationEnd` | `execution` | `#FFFFFF` |
| `onRespawn` | `execution` | `#FFFFFF` |
| `isCollected` | `boolean` | `#81C784` |
| `collectorEntity` | `string` | `#F48FB1` |
| `value` | `number` | `#64B5F6` |

**Selectable Options (`data.options`):**

- **`pickupMode`** (default: `"collision"`): `"collision"` (Collision), `"interact_key"` (Interact Key)
- **`despawnAction`** (default: `"destroy"`): `"destroy"` (Destroy), `"deactivate"` (Deactivate), `"none"` (None)

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
const targetEntity = inputs.targetEntity;
const collectorTag = inputs.collectorTag;
const pickupMode = inputs.pickupMode;
const interactKey = inputs.interactKey;
const scoreValue = inputs.scoreValue;
const canCollect = inputs.canCollect;
const idleClip = inputs.idleClip;
const collectClip = inputs.collectClip;
const sfxName = inputs.sfxName;
const despawnAction = inputs.despawnAction;
const respawnTime = inputs.respawnTime;
const autoBobbing = inputs.autoBobbing;

const helper = context.toolkit && context.toolkit.collectable;
if (helper) {
  const res = helper.processCollectable(context.state, inputs, outputs, context);
  if (res) {
    outputs.isCollected = res.isCollected;
    outputs.collectorEntity = res.collectorEntity;
    outputs.value = res.value;
    outputs.onCollected = res.onCollected;
    outputs.onAnimationEnd = res.onAnimationEnd;
    outputs.onRespawn = res.onRespawn;
  }
}
outputs.execOut = true;
return;
```
</details>

---

<a id="212-custom"></a>
### 2.12 Custom (`custom`)

- **Module Export:** `BlueprintCustom` & `CUSTOM_NODE_TEMPLATE` ([`BlueprintCustom.js`](../editor/src/features/nodes/library/blueprints/BlueprintCustom.js))
- **Category Color:** `#8B5CF6` | **Icon:** `Cpu`
- **Purpose:** Houses user-authored custom nodes saved to `project.customBlueprints` and provides the base `customScript` template when adding a new Custom Node on the graph canvas.

<a id="node-customScript"></a>
#### 2.12.1 `customScript` — Custom Node

> Custom script node with user-defined ports and logic code

- **Type:** `customScript` (`isCustomScript: true`) | **Role:** `action` | **Header:** `Custom Node` (`#8B5CF6`) | **Category:** `Custom` | **Dynamic Mode:** `none` (User-managed ports via `CustomScriptInspector.vue`)

**Default Input Ports (`inputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execIn` | `execution` | `#FFFFFF` |

**Default Output Ports (`outputs`):**

| Port ID (`id`) | Data Type (`dataType`) | Pin Color (`color`) |
| :--- | :--- | :--- |
| `execOut` | `execution` | `#FFFFFF` |

<details>
<summary>Default Runtime Code (<code>data.code</code>)</summary>

```javascript
return;
```
</details>
