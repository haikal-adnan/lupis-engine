import { econsole } from "@engine/Core/EngineConsole.js";
import Polygon from "@utils/Entity/Polygon.js";
import Player from "@utils/Entity/Player.js";
import Config from "@engine/Core/Config.js";

export async function initPlayer(glContext) {

  const poly = new Polygon(glContext);
  const image = await poly.createRect(32, 32, "#2196F3");

  const startX = Config.PLAYER?.X ?? 200;
  const startY = Config.PLAYER?.Y ?? 64;

  const options = {
    width: 32,
    height: 32,
    speed: 160,
    jumpVelocity: 600,
    cutJumpFactor: 0.5,
    pixelArt: Config.PIXEL_ART ?? true,
  };

  const player = new Player(image, startX, startY, options);

  econsole.log(`Player polygon siap di posisi (${startX}, ${startY})`);
  return player;
}
