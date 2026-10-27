export function useBackend() {
  const API_URL = import.meta.env.VITE_API_BASE_URL;
  const CDN_URL = import.meta.env.VITE_STORAGE_URL;

  const fetchWithTimeout = async (url, options = {}, timeoutMs = 10000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);

    const token = localStorage.getItem('lupis_auth_token');
    const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          ...authHeaders
        },
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