export async function initializeTilemap(path = "Tilemap/level1/meta.json") {
  const response = await fetch(path);
  return await response.json();
}
