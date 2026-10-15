# 🧩 Core Engine API Reference

This document provides a comprehensive technical reference for the public APIs in the Lupis Engine Core (`core/`).

---

## 1. Initializing the Engine: `startEngine`

Located in [`core/Runtime.js`](file:///D:/Project/Lupis%20Engine/core/Runtime.js):

```javascript
import { startEngine } from "./Runtime.js";

const canvasElement = document.getElementById("game-canvas");
const baseURL = "./"; // Project assets root folder

const { game, bus } = await startEngine(
    canvasElement,
    baseURL,
    payloadData,      // Optional project payload (scenes, entities, prefabs)
    "runtime",        // Mode: "runtime" or "editor"
    (msg, pct) => {   // Optional progress callback
        console.log(`Loading: ${pct}% - ${msg}`);
    }
);
```

---

## 2. The `Game` Coordinator

Located in [`core/Core/Game.js`](file:///D:/Project/Lupis%20Engine/core/Core/Game.js):

| Property / Method | Type | Description |
| :--- | :--- | :--- |
| `world` | `World` | Entity container, scene hierarchy, and layer storage |
| `camera` | `Camera` | Active 2D viewport camera (x, y, zoom, rotation) |
| `physicsSystem` | `PhysicsSystem` | Evaluates gravity, drag, velocity, and kinematics |
| `colliderSystem` | `ColliderSystem` | Resolves solid AABB/Circle collisions and triggers |
| `audioSystem` | `AudioSystem` | Web Audio sound player and volume controller |
| `animatorSystem`| `AnimatorSystem`| Sprite clip player and keyframe updater |
| `sceneSystem` | `SceneSystem` | Handles scene loading, switching, and caching |
| `prefabSystem` | `PrefabSystem` | Instantiates entities from saved prefab templates |
| `entitySystem` | `EntitySystem` | Lookup, cloning, and recursive entity destruction |
| `events` | `EventManager` | Engine event bus (`game:start`, `game:restart`, etc.) |
| `input` | `InputManager` | Mouse, touch, and keyboard input polling |
| `start()` | `Function` | Starts the internal `GameLoop` |
| `restartGame()` | `Function` | Resets globals and reloads the initial scene |
| `quitGame()` | `Function` | Stops the game loop and pauses all systems |

---

## 3. The `World` & Entity Model

Located in [`core/Core/World.js`](file:///D:/Project/Lupis%20Engine/core/Core/World.js) and [`core/Core/Entity.js`](file:///D:/Project/Lupis%20Engine/core/Core/Entity.js):

### Creating an Entity programmatically:
```javascript
import Entity from "./Core/Entity.js";

const player = new Entity("player_01");
player.name = "Hero";
player.tag = "Player";
player.layerId = "layer_w_root";

// Add components
player.addComponent("Transform", {
    x: 100,
    y: 200,
    rotation: 0,
    scaleX: 1,
    scaleY: 1
});

player.addComponent("ShapeRenderer", {
    shapeType: "rectangle",
    width: 64,
    height: 64,
    color: "#3498db"
});

player.addComponent("Physics", {
    enabled: true,
    velocityX: 0,
    velocityY: 0,
    gravityScale: 1.0,
    drag: 0.1,
    isFrozen: false
});

player.addComponent("Collider", {
    enabled: true,
    type: "box",
    width: 64,
    height: 64,
    isSolid: true,
    isTrigger: false
});

game.world.addEntity(player);
```

---

## 4. Built-in Component Schemas

### `Transform`
Defines 2D world positioning, rotation, and scaling:
```json
{
  "x": 0,
  "y": 0,
  "rotation": 0,
  "scaleX": 1,
  "scaleY": 1
}
```

### `ShapeRenderer`
Draws GPU-accelerated vector primitives:
```json
{
  "shapeType": "rectangle", // "rectangle" | "circle" | "polygon"
  "width": 64,
  "height": 64,
  "radius": 32,
  "color": "#e74c3c",
  "stroke": true,
  "strokeColor": "#ffffff",
  "strokeWidth": 2
}
```

### `ImageRenderer`
Draws 2D sprite textures:
```json
{
  "assetId": "asset_hero_sprite",
  "width": 128,
  "height": 128,
  "flipX": false,
  "flipY": false,
  "tint": "#ffffff"
}
```

### `Physics`
Controls kinematic and dynamic forces in `PhysicsSystem`:
```json
{
  "enabled": true,
  "velocityX": 0,
  "velocityY": 0,
  "gravityScale": 1.0,
  "drag": 0.5,
  "isFrozen": false
}
```

### `Collider`
Defines physical collision boundaries:
```json
{
  "enabled": true,
  "type": "box", // "box" | "circle"
  "width": 64,
  "height": 64,
  "radius": 32,
  "offsetX": 0,
  "offsetY": 0,
  "isSolid": true,
  "isTrigger": false
}
```

---

## 5. Subsystems Reference

### 5.1 `PhysicsSystem` & `ColliderSystem`
- **Move and Slide**:
  ```javascript
  const hitResult = game.colliderSystem.moveAndSlide(entity, dx, dy);
  if (hitResult) {
      console.log("Collided with solid object:", hitResult);
  }
  ```
- **Raycasting**:
  ```javascript
  const rayHit = game.pointerRaycast.cast(worldX, worldY);
  ```

### 5.2 `AudioSystem`
- **Playing Sound FX**:
  ```javascript
  game.audioSystem.playSound("sfx_jump", { volume: 0.8, pitch: 1.0 });
  ```
- **Background Music**:
  ```javascript
  game.audioSystem.playMusic("bgm_overworld", { loop: true, volume: 0.5 });
  ```

### 5.3 `Camera`
- **Panning & Zooming**:
  ```javascript
  game.camera.x = player.components.Transform.x;
  game.camera.y = player.components.Transform.y;
  game.camera.zoom = 1.5;
  ```
