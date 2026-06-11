export function useAvatarUrl() {
  const CDN_URL = import.meta.env.VITE_STORAGE_URL || '';

  const getAvatarUrl = (url) => {
    if (!url) return null;

    if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) {
      return url;
    }

    const baseUrl = CDN_URL.replace(/\/$/, '');

    return `${baseUrl}/profiles/${url}`;
  };

  return {
    getAvatarUrl
  };
}