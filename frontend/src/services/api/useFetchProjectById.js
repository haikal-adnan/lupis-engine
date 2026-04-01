// src/services/api/useFetchProjectById.js

import { useBackend } from '@/services/api/useBackend.js';

export const API_URL = import.meta.env.VITE_API_BASE_URL
export const CDN_URL = import.meta.env.VITE_STORAGE_URL

export async function fetchProjectById(projectId) {
  const { fetchWithTimeout } = useBackend();
  
  const res = await fetchWithTimeout(`${API_URL}/projects/${projectId}`);
  
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error("Sesi tidak valid atau akses ditolak.");
    }
    throw new Error("Project not found");
  }
  
  const jsonResponse = await res.json();
  
  if (jsonResponse.success && jsonResponse.data) {
    return jsonResponse.data; 
  }
  
  return jsonResponse; 
}

export async function fetchProjectResources(projectId) {
  const { fetchWithTimeout } = useBackend();

  const [scenesMetaRes, assetsRes, prefabsRes, foldersRes, scriptsRes] = await Promise.all([
    fetchWithTimeout(`${API_URL}/scenes/project/${projectId}`),
    fetchWithTimeout(`${API_URL}/assets/${projectId}`),
    fetchWithTimeout(`${API_URL}/prefabs/${projectId}`),
    fetchWithTimeout(`${API_URL}/folders/${projectId}`),
    fetchWithTimeout(`${API_URL}/scripts/${projectId}`)
  ]);

  const scenesMeta = await scenesMetaRes.json();

  const fullScenes = await Promise.all(
    scenesMeta.map(async (meta) => {
      const sceneId = meta._id; 
      const res = await fetchWithTimeout(`${API_URL}/scenes/${sceneId}`);
      return await res.json();
    })
  );

  return {
    scenes: fullScenes,
    assets: await assetsRes.json(),
    prefabs: await prefabsRes.json(),
    folders: await foldersRes.json(),
    scripts: await scriptsRes.json()
  };
}