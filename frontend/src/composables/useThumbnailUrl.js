// src/composables/useThumbnailUrl.js

export function useThumbnailUrl() {
  const CDN_URL = import.meta.env.VITE_STORAGE_URL || '';

  const getThumbnailUrl = (url) => {
    if (!url) return null;

    if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) {
      return url;
    }

    const baseUrl = CDN_URL.replace(/\/$/, '');

    // Gabungkan CDN_URL dengan nama file di folder profiles
    return `${baseUrl}/thumbnails/${url}`;
  };

  return {
    getThumbnailUrl
  };
}