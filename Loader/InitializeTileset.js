export async function initializeTileset(path = "Tileset/terrain.json") {
  const response = await fetch(path);
  return await response.json();
}