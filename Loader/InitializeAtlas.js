import GLImage from "../Renderer/GLImage.js";

export async function initializeAtlas(glContext, path = "Asset/Atlas/terrain.png") {
  const image = new GLImage(glContext);
  await image.loadImage(path);
  return image;
}
