# Core API

Public API of the runtime in `core/`. Data shapes are defined in [schema-contract.md](schema-contract.md); this page covers how to use them.

## Start the engine

`startEngine` is exported from [`core/Runtime.js`](../core/Runtime.js).

```javascript
import { startEngine } from "./Runtime.js";

const canvas = document.getElementById("game-canvas");

const { game, bus } = await startEngine(
    canvas,
    "./",            // base URL of the project assets
    payload,         // optional project payload (scenes, entities, prefabs)
    "runtime",       // mode: "runtime" | "editor"
    (msg, pct) => console.log(`${pct}% ${msg}`)   // optional progress callback
);
```

The payload format is `EngineRuntimePayload` ([schema-contract §9](schema-contract.md#9-engine-initialization-payload-contract)).

## Game

Defined in [`core/Core/Game.js`](../core/Core/Game.js). `Game` owns every subsystem.

| Member | Type | Description |
| :--- | :--- | :--- |
| `world` | `World` | Entities, layers, prefabs |
| `camera` | `Camera` | 2D camera: `x`, `y`, `zoom`, `rotation` |
| `physicsSystem` | `PhysicsSystem` | Gravity, drag, velocity |
| `colliderSystem` | `ColliderSystem` | Solid collisions and triggers |
| `audioSystem` | `AudioSystem` | Sound and music playback |
| `animatorSystem` | `AnimatorSystem` | Sprite clip playback |
| `sceneSystem` | `SceneSystem` | Scene loading, switching, caching |
| `prefabSystem` | `PrefabSystem` | Instantiates entities from prefabs |
| `entitySystem` | `EntitySystem` | Lookup, cloning, recursive destruction |
| `events` | `EventManager` | Engine events (`game:start`, `game:restart`, ...) |
| `input` | `InputManager` | Mouse, touch, keyboard |
| `contextSystem` | `ContextSystem` | Blueprint execution context, variable scopes, and domain facades |
| `start()` | method | Start the game loop |
| `restartGame()` | method | Reset globals and reload the initial scene |
| `quitGame()` | method | Stop the loop and pause all systems |

## World and entities

Defined in [`core/Core/World.js`](../core/Core/World.js) and [`core/Core/Entity.js`](../core/Core/Entity.js).

Every entity has a UUID `id` and a unique-per-scene `scriptId`. Parent and layer references use UUIDs. See the [identity model](schema-contract.md#identity-model).

```javascript
import Entity from "./Core/Entity.js";

const player = new Entity(crypto.randomUUID());
player.scriptId = "player_hero";
player.tag = "Player";
player.layerId = worldLayerId;   // `id` of an existing world layer

player.addComponent("Transform", { x: 100, y: 200, width: 64, height: 64 });

player.addComponent("ShapeRenderer", {
    points: [
        { x: -32, y: -32 }, { x: 32, y: -32 },
        { x: 32, y: 32 },   { x: -32, y: 32 }
    ],
    fillColor: "#3498db"
});

player.addComponent("Physics", { type: "dynamic", gravityScale: 1.0, drag: 0.1 });

player.addComponent("Collider", {
    data: [{ type: "solid", width: 64, height: 64 }]
});

game.world.addEntity(player);
```

Omitted component fields take the defaults listed in the schema contract.

## Components

| Component | Purpose | Schema |
| :--- | :--- | :--- |
| `Transform`, `UITransform` | Position, rotation, scale, pivot, size, UI anchors | [§5.1](schema-contract.md#51-transform-and-uitransform) |
| `SpriteRenderer` | Textured sprite with atlas cropping | [§5.2](schema-contract.md#52-spriterenderer) |
| `ShapeRenderer` | Filled or stroked polygon | [§5.3](schema-contract.md#53-shaperenderer) |
| `Tilemap` | Tile grid | [§5.4](schema-contract.md#54-tilemap) |
| `TextRenderer` | MSDF text | [§5.5](schema-contract.md#55-textrenderer) |
| `Physics` | Body type, velocity, gravity, drag | [§5.6](schema-contract.md#56-physics) |
| `Collider` | One or more solid or trigger boxes | [§5.7](schema-contract.md#57-collider) |
| `SpriteAnimator` | Clip playback | [§5.8](schema-contract.md#58-spriteanimator-and-animationclipschema) |
| `Audio` | Sound source | [§5.9](schema-contract.md#59-audio) |
| `ScriptController` | Blueprint bindings | [§5.10](schema-contract.md#510-scriptcontroller) |

## Subsystems

### Collisions

```javascript
const hit = game.colliderSystem.moveAndSlide(entity, dx, dy);
if (hit) {
    console.log("Blocked by", hit);
}

const rayHit = game.pointerRaycast.cast(worldX, worldY);
```

### Audio

```javascript
game.audioSystem.playSound("sfx_jump", { volume: 0.8, pitch: 1.0 });
game.audioSystem.playMusic("bgm_overworld", { loop: true, volume: 0.5 });
```

Sounds are referenced by the asset `scriptId`.

### Camera

```javascript
const t = player.components.Transform;
game.camera.x = t.x;
game.camera.y = t.y;
game.camera.zoom = 1.5;
```

### Context System

```javascript
const ctx = game.contextSystem.createContext(entity);
ctx.variables.set("score", 100);
ctx.audio.playSound("sfx_coin");
```

`ContextSystem` provides 15 isolated runtime facades for visual scripting graphs and custom scripting panels without leaking internal engine state. See [Context System Reference](context-system.md) for complete facade APIs.
