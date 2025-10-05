import GameLoop from "../Loop/GameLoop.js";
import GLRenderer from "../Renderer/GLRenderer.js";
import UIRenderer from "../Renderer/UIRenderer.js";
import Game from "../Entity/Game.js";
import InputHandler from "../Interaction/InputHandler.js";
import TouchHandler from "../Interaction/TouchHandler.js";
import { game } from "../main.js";

export default class GameLoader {
  constructor() {
    
  }

  async initializeGame() {
    // Setup event listener (misalnya untuk input sentuhan)
    // touch.startEventListener();
    game.glRenderer = new GLRenderer(document.getElementById("glCanvas"));
    game.glContext = document.getElementById("glCanvas").getContext("webgl");

    game.uiRenderer = new UIRenderer(document.getElementById("uiCanvas"));
    game.uiContext = document.getElementById("uiCanvas").getContext("2d");

    game.input = new InputHandler();
    game.input.initListeners();

    game.touch = new TouchHandler();
    game.touch.initListeners();

    // Buat loop
    game.loop = new GameLoop(game)
    game.init()
  }

  gameStart() {
    console.log("Semua data berhasil dimuat. Memulai game...");
    
    if (game.loop) {
      game.loop.start();
    } else {
      console.error("GameLoop belum diinisialisasi!");
    }
  }
}
