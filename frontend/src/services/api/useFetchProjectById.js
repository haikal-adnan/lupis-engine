export const API_URL = import.meta.env.VITE_API_BASE_URL
export const CDN_URL = import.meta.env.VITE_STORAGE_URL

export async function fetchProjectById(projectId) {
  const res = await fetch(`${API_URL}/projects/${projectId}`)
  if (!res.ok) throw new Error("Project not found")
  return await res.json()
}

export async function fetchProjectResources(projectId) {
  const [scenesMetaRes, assetsRes, prefabsRes, foldersRes, scriptsRes] = await Promise.all([
    fetch(`${API_URL}/scenes/project/${projectId}`),
    fetch(`${API_URL}/assets/${projectId}`),
    fetch(`${API_URL}/prefabs/${projectId}`),
    fetch(`${API_URL}/folders/${projectId}`),
    fetch(`${API_URL}/scripts/${projectId}`)
  ])

  const scenesMeta = await scenesMetaRes.json()

  const fullScenes = await Promise.all(
    scenesMeta.map(async (meta) => {
      const sceneId = meta._id; 
      const res = await fetch(`${API_URL}/scenes/${sceneId}`)
      return await res.json()
    })
  )

  return {
    scenes: fullScenes,
    assets: await assetsRes.json(),
    prefabs: await prefabsRes.json(),
    folders: await foldersRes.json(),
    scripts: await scriptsRes.json()
  }
}