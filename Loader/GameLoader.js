import GameLoop from "../Loop/GameLoop.js";
import GLRenderer from "../Renderer/GLRenderer.js";
import UIRenderer from "../Renderer/UIRenderer.js";
import InputHandler from "../Interaction/InputHandler.js";
import TouchHandler from "../Interaction/TouchHandler.js";
import World from "../World/World.js";
import { initializeTileset } from "./InitializeTileset.js";
import { initializeAtlas } from "./InitializeAtlas.js";
import { initializeTilemap } from "./InitializeTilemap.js";
import { game } from "../main.js";

export default class GameLoader {
  async initializeGame() {
    const glCanvas = document.getElementById("glCanvas");
    const uiCanvas = document.getElementById("uiCanvas");

    game.glRenderer = new GLRenderer(glCanvas);
    game.glContext = glCanvas.getContext("webgl");
    game.uiRenderer = new UIRenderer(uiCanvas);
    game.uiContext = uiCanvas.getContext("2d");

    game.input = new InputHandler();
    game.input.initListeners();

    game.touch = new TouchHandler();
    game.touch.initListeners();

    const [tileset, image, tilemap] = await Promise.all([
      initializeTileset(),
      initializeAtlas(game.glContext),
      initializeTilemap()
    ]);

    const world = new World(tilemap, tileset, image, game.glRenderer, game.glContext, game.input);
    await world.load();
    game.attachWorld(world);

    game.loop = new GameLoop(game);
  }

  gameStart() {
    console.log("✅ Semua data berhasil dimuat. Memulai game...");
    game.loop?.start();
  }
}
