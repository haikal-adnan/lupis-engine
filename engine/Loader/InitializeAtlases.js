// Loader/InitializeAtlases.js
import GLImage from "../Renderer/GLImage.js";
import Config from "../Config/Config.js";

function makeSolidBitmap(w = 16, h = 16, color = "#FFFFFF") {
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);
  return canvas;
}

export async function initializeAtlases(glContext, list = Config.TILESETS) {
  const out = {};
  for (const t of list) {
    if (t?.image) {
      const img = new GLImage(glContext);
      await img.loadImage(t.image);
      out[t.name] = img;
    } else {
      // procedural (untuk "rectangle")
      const color = t?.procedural?.color ?? "#FFFFFF";
      const size  = t?.procedural?.size  ?? 16;
      const bmp = makeSolidBitmap(size, size, color);
      const img = new GLImage(glContext);
      await img.loadFromBitmap(bmp);
      out[t.name] = img;
    }
  }
  return out;
}