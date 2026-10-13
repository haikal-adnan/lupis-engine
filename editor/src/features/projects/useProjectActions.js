import { APP_STORAGE_DIR } from '@utils/constanta.js';

export function useProjectActions() {
  const getUserProjectsDir = async () => {
    const root = await navigator.storage.getDirectory();
    const appDir = await root.getDirectoryHandle(APP_STORAGE_DIR, { create: true });
    return await appDir.getDirectoryHandle('projects', { create: true });
  };

  const _readJsonFile = async (dirHandle, fileName) => {
    const fileHandle = await dirHandle.getFileHandle(fileName);
    const file = await fileHandle.getFile();
    const text = await file.text();
    return JSON.parse(text);
  };

  const _writeJsonFile = async (dirHandle, fileName, data) => {
    const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(data, null, 2));
    await writable.close();
  };

  const getProjects = async () => {
    const projectsDir = await getUserProjectsDir();
    const projectsList = [];

    for await (const [projectId, handle] of projectsDir.entries()) {
      if (handle.kind === 'directory') {
        const projectData = await _readJsonFile(handle, 'project.json');
        projectsList.push(projectData);
      }
    }

    return projectsList.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  };

  const getProjectById = async (projectId) => {
    const projectsDir = await getUserProjectsDir();
    const projectDir = await projectsDir.getDirectoryHandle(projectId);

    const project = await _readJsonFile(projectDir, 'project.json');

    project.id = projectId;
    project.projectId = projectId;

    await projectDir.getDirectoryHandle('assets', { create: true });
    const scenesDir = await projectDir.getDirectoryHandle('scenes', { create: true });
    const prefabsDir = await projectDir.getDirectoryHandle('prefabs', { create: true });
    const scriptsDir = await projectDir.getDirectoryHandle('scripts', { create: true });
    const workspacesDir = await projectDir.getDirectoryHandle('workspaces', { create: true });

    const assets = await _readJsonFile(workspacesDir, 'assets.json');
    const sceneMetas = await _readJsonFile(workspacesDir, 'scenes.json');
    const prefabMetas = await _readJsonFile(workspacesDir, 'prefabs.json');
    const scriptMetas = await _readJsonFile(workspacesDir, 'scripts.json');
    const folders = await _readJsonFile(workspacesDir, 'folders.json');

    const scenes = await Promise.all(
      sceneMetas.map(async (meta) => {
        const sceneId = meta.id;
        const detail = await _readJsonFile(scenesDir, `${sceneId}.json`);
        return {
          ...detail,
          id: sceneId,
          name: meta.name,
          folderId: meta.folderId,
          projectId: meta.projectId
        };
      })
    );

    const prefabs = await Promise.all(
      prefabMetas.map(async (meta) => {
        const prefabId = meta.id;
        const detail = await _readJsonFile(prefabsDir, `${prefabId}.json`);
        return {
          ...detail,
          folderId: meta.folderId,
          projectId: meta.projectId
        };
      })
    );

    const scripts = await Promise.all(
      scriptMetas.map(async (meta) => {
        const scriptId = meta.id;
        const detail = await _readJsonFile(scriptsDir, `${scriptId}.json`);
        return {
          ...detail,
          id: scriptId,
          name: meta.name,
          type: meta.type,
          folderId: meta.folderId,
          projectId: meta.projectId
        };
      })
    );

    return {
      project,
      assets,
      scenes,
      prefabs,
      scripts,
      folders
    };
  };

  const createProject = async ({ projectName, description = ""}) => {
    const projectId = 'proj_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    const projectsDir = await getUserProjectsDir();
    const newProjectDir = await projectsDir.getDirectoryHandle(projectId, { create: true });
    const scenesDir = await newProjectDir.getDirectoryHandle('scenes', { create: true });
    await newProjectDir.getDirectoryHandle('assets', { create: true });
    await newProjectDir.getDirectoryHandle('prefabs', { create: true });
    await newProjectDir.getDirectoryHandle('scripts', { create: true });
    const workspacesDir = await newProjectDir.getDirectoryHandle('workspaces', { create: true });

    const defaultSceneId = 'scene_main_' + Date.now();

    const defaultSceneMeta = [{
      id: defaultSceneId,
      name: 'Main Scene',
      projectId: projectId,
      folderId: null
    }];

    const defaultSceneData = {
      id: defaultSceneId,
      name: 'Main Scene',
      entities: [],
      layersWorld: [
        { id: 'layer_world_default', name: 'World Layer', visible: true, locked: false }
      ],
      layersUI: [
        { id: 'layer_ui_default', name: 'UI Layer', visible: true, locked: false }
      ],
      settings: { backgroundColor: '#1a1a1a' }
    };

    const newProjectData = {
      id: projectId,
      projectId: projectId,
      name: projectName,
      description: description,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      settings: {
        initialSceneId: defaultSceneId, // Set initialSceneId ke default scene
        tickRate: 60,
        grid: { visible: true, snap: true, width: 32, height: 32, color: '#333333', opacity: 0.5 },
        ui: { showUIBorder: true },
        camera: { zoom: 1 },
        debug: { active: true, position: 'top-right', width: 360, height: 220, maxLogs: 50 }
      },
      tags: ['Untagged']
    };

    await _writeJsonFile(newProjectDir, 'project.json', newProjectData);
    await _writeJsonFile(workspacesDir, 'assets.json', []);
    await _writeJsonFile(workspacesDir, 'scenes.json', defaultSceneMeta);
    await _writeJsonFile(scenesDir, `${defaultSceneId}.json`, defaultSceneData);
    await _writeJsonFile(workspacesDir, 'prefabs.json', []);
    await _writeJsonFile(workspacesDir, 'scripts.json', []);
    await _writeJsonFile(workspacesDir, 'folders.json', []);

    return newProjectData;
  };

  const updateProject = async (projectId, updateData) => {
    const { project } = await getProjectById(projectId);
    const updatedData = {
      ...project,
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    const projectsDir = await getUserProjectsDir();
    const projectDir = await projectsDir.getDirectoryHandle(projectId);
    await _writeJsonFile(projectDir, 'project.json', updatedData);

    return updatedData;
  };

  const deleteProject = async (projectId) => {
    const projectsDir = await getUserProjectsDir();
    await projectsDir.removeEntry(projectId, { recursive: true });
    return true;
  };

  const syncProject = async (projectId, syncPayload) => {
    const projectsDir = await getUserProjectsDir();
    const projectDir = await projectsDir.getDirectoryHandle(projectId, { create: true });
    const workspacesDir = await projectDir.getDirectoryHandle('workspaces', { create: true });
    const scenesDir = await projectDir.getDirectoryHandle('scenes', { create: true });
    const prefabsDir = await projectDir.getDirectoryHandle('prefabs', { create: true });
    const scriptsDir = await projectDir.getDirectoryHandle('scripts', { create: true });

    const updatedProject = {
      ...syncPayload.project,
      updatedAt: new Date().toISOString()
    };
    await _writeJsonFile(projectDir, 'project.json', updatedProject);
    await _writeJsonFile(workspacesDir, 'assets.json', syncPayload.assets);

    const sceneMetas = syncPayload.scenes.map(s => ({
      id: s.id,
      projectId: projectId,
      folderId: s.folderId,
      name: s.name
    }));
    await _writeJsonFile(workspacesDir, 'scenes.json', sceneMetas);

    for (const scene of syncPayload.scenes) {
      const cleanScene = JSON.parse(JSON.stringify(scene));
      delete cleanScene.projectId;
      delete cleanScene.folderId;
      await _writeJsonFile(scenesDir, `${scene.id}.json`, cleanScene);
    }

    const prefabMetas = syncPayload.prefabs.map(p => ({
      id: p.id,
      projectId: projectId,
      folderId: p.folderId,
      name: p.name,
      type: p.type
    }));
    await _writeJsonFile(workspacesDir, 'prefabs.json', prefabMetas);

    for (const prefab of syncPayload.prefabs) {
      const cleanPrefab = JSON.parse(JSON.stringify(prefab));
      delete cleanPrefab.projectId;
      delete cleanPrefab.folderId;
      await _writeJsonFile(prefabsDir, `${prefab.id}.json`, cleanPrefab);
    }

    const scriptMetas = syncPayload.scripts.map(s => ({
      id: s.id,
      projectId: projectId,
      folderId: s.folderId,
      name: s.name,
      type: s.type
    }));
    await _writeJsonFile(workspacesDir, 'scripts.json', scriptMetas);

    for (const script of syncPayload.scripts) {
      const cleanScript = JSON.parse(JSON.stringify(script));
      delete cleanScript.projectId;
      delete cleanScript.folderId;
      await _writeJsonFile(scriptsDir, `${script.id}.json`, cleanScript);
    }

    await _writeJsonFile(workspacesDir, 'folders.json', syncPayload.folders);

    return { success: true };
  };

  return {
    getUserProjectsDir,
    getProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
    syncProject
  };
}