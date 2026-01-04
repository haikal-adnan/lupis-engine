export default {
  // Mock fetch size: Selalu return 512x512
  async fetchImageSize(url) {
    return new Promise((resolve) => {
      setTimeout(() => resolve({ width: 512, height: 512 }), 100);
    });
  },

  // Mock style generator
  getThumbnailStyle(url, rect, meta, size) {
    // Return simple background style
    return {
      backgroundImage: `url('${url}')`,
      backgroundSize: 'cover', // Simplifikasi untuk dummy
      backgroundPosition: 'center',
      imageRendering: 'pixelated'
    };
  }
};