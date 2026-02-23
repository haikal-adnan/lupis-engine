export default {
  async fetchImageSize(url) {
    return new Promise((resolve) => {
      setTimeout(() => resolve({ width: 512, height: 512 }), 100);
    });
  },

  getThumbnailStyle(url, rect, meta, size) {
    return {
      backgroundImage: `url('${url}')`,
      backgroundSize: 'cover', 
      backgroundPosition: 'center',
      imageRendering: 'pixelated'
    };
  }
};