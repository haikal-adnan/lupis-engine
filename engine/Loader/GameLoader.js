// src/engine/Loader/GameLoader.js
import GameLoop from "../Loop/GameLoop.js";
import GLRenderer from "../Renderer/GLRenderer.js";
import UIRenderer from "../Renderer/UIRenderer.js";
import InputHandler from "../Input/InputHandler.js";
import TouchHandler from "../Input/TouchHandler.js";
import World from "../World/World.js";
import Config from "../Config/Config.js";
import { game } from "../main.js";
import CameraController from "../Editor/CameraController.js";
import SelectionOutline from "../Editor/SelectionOutline.js";

export default class GameLoader {
  async initializeGame(glCanvas, uiCanvas, mode) {
    game.glRenderer = new GLRenderer(glCanvas);
    game.glContext  = glCanvas.getContext("webgl", { alpha: false, antialias: true });

    game.uiRenderer = new UIRenderer(uiCanvas);
    game.uiContext  = uiCanvas.getContext("2d");

    game.input = new InputHandler();
    game.input.initListeners();

    // game.touch = new TouchHandler();
    // game.touch.initListeners();

    game.project = game.project ?? "template-platformer";
    game.level = game.level ?? "level1";

    const baseURL = `http://api.lupis.calk.cloud/projects/${game.project}`;

    try {
      const res = await fetch(`${baseURL}/tree`);
      if (!res.ok) throw new Error(`Gagal ambil tree: ${res.status}`);
      const tree = await res.json();

      const configFolder = tree.find(n => n.name === "config" && n.type === "folder");
      if (configFolder?.children?.length) {
        for (const file of configFolder.children) {
          if (file.type !== "file" || !file.name.endsWith(".json")) continue;

          const fileURL = `${baseURL}/file/config/${file.name}`;
          try {
            const jsonRes = await fetch(fileURL);
            if (!jsonRes.ok) throw new Error(`HTTP ${jsonRes.status} ${jsonRes.statusText}`);
            const data = await jsonRes.json();
            const key = file.name.replace(/\.json$/i, "").toUpperCase();

            if (Array.isArray(data)) {
              Config[key] = data; 
            } else if (data && typeof data === "object") {
              if (Config[key] && typeof Config[key] === "object") {
                Object.assign(Config[key], data);
              } else {
                Config[key] = data;
              }
            } else {
              Config[key] = data;
            }

            console.log(`📦 Config dimuat: ${file.name} -> Config.${key}`);
          } catch (err) {
            console.warn(`⚠️ Gagal baca ${file.name}:`, err.message);
          }
        }
      }
    } catch (err) {
      console.warn("⚠️ Lewati config dinamis (pakai default minimal):", err.message);
    }

    // console.log(Config)
    Config.ENGINE_MODE = mode;
    console.log(Config.ENGINE_MODE)

    const world = new World(game.glRenderer, game.uiRenderer);
    await world.load();      
    game.attachWorld(world);
    if (Config.ENGINE_MODE === "editor") {
      game.cameraController = new CameraController(world.camera, glCanvas);
      game.selectionOutline = new SelectionOutline(world, glCanvas, game.glRenderer);
    }

    game.loop = new GameLoop(game);
  }

  gameStart() {

    game.loop?.start();
  }
}
