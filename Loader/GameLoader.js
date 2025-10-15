import GameLoop from "../Loop/GameLoop.js";
import GLRenderer from "../Renderer/GLRenderer.js";
import UIRenderer from "../Renderer/UIRenderer.js";
import InputHandler from "../Interaction/InputHandler.js";
import TouchHandler from "../Interaction/TouchHandler.js";
import World from "../World/World.js";
import { initializeTilesets } from "./InitializeTilesets.js";
import { initializeAtlases } from "./InitializeAtlases.js";
import { initializeTilemap } from "./InitializeTilemap.js";
import { game } from "../main.js";
import Grid from "../Util/Grid.js";

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

    game.grid = new Grid(game.uiContext, 64)

    const [tilesets, images, tilemap] = await Promise.all([
      initializeTilesets(),            
      initializeAtlases(game.glContext), 
      initializeTilemap()
    ]);

    const world = new World(tilemap, tilesets, images, game.glRenderer, game.glContext, game.input);
    await world.load();
    game.attachWorld(world);

    game.loop = new GameLoop(game);
  }

  gameStart() {
    console.log("✅ Semua data berhasil dimuat. Memulai game...");
    game.loop?.start();
  }
}
