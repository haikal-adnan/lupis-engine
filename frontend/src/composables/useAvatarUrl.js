// src/composables/useAvatarUrl.js

export function useAvatarUrl() {
  // Ambil CDN_URL langsung dari environment variable
  const CDN_URL = import.meta.env.VITE_STORAGE_URL || '';

  const getAvatarUrl = (url) => {
    if (!url) return null;

    // Jika URL sudah lengkap (dari Google/GitHub) atau berupa preview blob/base64
    if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) {
      return url;
    }

    // Bersihkan garis miring (slash) di akhir CDN_URL untuk mencegah double slash (//)
    const baseUrl = CDN_URL.replace(/\/$/, '');

    // Gabungkan CDN_URL dengan nama file di folder profiles
    return `${baseUrl}/profiles/${url}`;
  };

  return {
    getAvatarUrl
  };
}