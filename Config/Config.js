const Config = {
  // Virtual screen
  VIRTUAL_WIDTH: 1920,
  VIRTUAL_HEIGHT: 1080,

  // Tile info
  TILE_SIZE: 16,
  SCALE: 4,
  PIXEL_ART: true, // <— aktifkan mode pixel-perfect

  // World size (contoh: 2x layar)
  WORLD_WIDTH: 1920 ,
  WORLD_HEIGHT: 1080 ,

  // Physics & timing
  TICK_RATE: 60,

  PLAYER: {
    WIDTH: 16 * 4,  // 64 px di layar
    HEIGHT: 16 * 4,
    SPEED: 400
  },

  CAMERA: {
    DEADZONE_X: [0.5, 0.5],
    DEADZONE_Y: [0.5, 0.5],
    LERP: 6.0,          
    PIXEL_LOCK: false  
  }

};

export default Config;
