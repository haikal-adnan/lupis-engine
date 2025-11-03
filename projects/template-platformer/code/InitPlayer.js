import { econsole } from "@engine/Core/EngineConsole.js";
import Polygon from "@utils/Entity/Polygon.js";
import Player from "@utils/Entity/Player.js";
import Config from "@engine/Config/Config.js";

export async function initPlayer(glContext) {

  const poly = new Polygon(glContext);
  const image = await poly.createRect(32, 32, "#2196F3");

  const start = Config.PLAYER?.START_POS ?? { X: 64, Y: 64 };
  const options = {
    width: 32,
    height: 32,
    speed: 160,
    jumpVelocity: 600,
    cutJumpFactor: 0.5,
    pixelArt: Config.PIXEL_ART ?? true,
  };

  const player = new Player(image, start.X, start.Y, options);

  econsole.log(`Player polygon siap di posisi (${start.X}, ${start.Y})`);
  return player;
}
