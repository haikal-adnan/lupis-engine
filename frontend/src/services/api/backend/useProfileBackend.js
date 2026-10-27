import { useBackend } from '@/services/api/useBackend.js';

export function useProfileBackend() {
  const { API_URL, fetchWithTimeout } = useBackend();

  const handleResponse = async (response) => {
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error || 'Terjadi kesalahan.');
    return result;
  };

  const uploadAvatarToServer = async (file, userId) => {
    const formData = new FormData();
    formData.append('avatar', file);
    formData.append('userId', userId);

    const response = await fetchWithTimeout(`${API_URL}/profile/upload-avatar`, {
      method: 'POST',
      body: formData
    });
    return await handleResponse(response);
  };

  const updateProfileToServer = async (profileData) => {
    const response = await fetchWithTimeout(`${API_URL}/profile/update`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData)
    });
    return await handleResponse(response);
  };

  return { uploadAvatarToServer, updateProfileToServer };
}