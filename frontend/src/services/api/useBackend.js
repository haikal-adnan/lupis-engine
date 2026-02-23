export function useBackend() {
  const API_URL = import.meta.env.VITE_API_BASE_URL;
  const CDN_URL = import.meta.env.VITE_STORAGE_URL;

  /**
   * Wrapper fetch standar dengan batas waktu maksimal (timeout)
   */
  const fetchWithTimeout = async (url, options = {}, timeoutMs = 10000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout. Koneksi terputus setelah ${timeoutMs / 1000} detik.`);
      }
      throw error;
    }
  };

  return {
    API_URL,
    CDN_URL,
    fetchWithTimeout
  };
}