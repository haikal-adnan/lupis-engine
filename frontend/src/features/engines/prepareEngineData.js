import { toRaw } from "vue";
import { useProjectStore } from '@projects/projects.js'
import { useAssetStore } from '@assets/assets.js'
import { useSceneStore } from '@scenes/scenes.js';
import { usePrefabStore } from '@prefabs/prefabs.js';
import { useWorkspaceStore } from '@workspaces/workspaces.js';
import { useScriptStore } from '@scripts/scripts.js';

export async function prepareEngineData() {
    const projectStore = useProjectStore();
    const assetStore = useAssetStore();
    const sceneStore = useSceneStore();
    const prefabStore = usePrefabStore();
    const workspaceStore = useWorkspaceStore();
    const scriptStore = useScriptStore(); 
    
    const projectId = workspaceStore.activeProjectId;
    if (!projectId) throw new Error("No Active Project ID in WorkspaceStore");

    if (!projectStore.isProjectLoaded || projectStore.project?.id !== projectId) {
        await projectStore.loadProject(projectId);
    }

    if (!projectStore.project) throw new Error("Failed to load project metadata from OPFS");

    if (!sceneStore.scenes || sceneStore.scenes.length === 0) {
        sceneStore.createDefaultScene();
    }

    const { engine, ...cleanWorkspaceConfig } = toRaw(workspaceStore.$state);

    const rawPayload = {
        project: toRaw(projectStore.project),
        assets: toRaw(assetStore.assets),
        scenes: toRaw(sceneStore.scenes), 
        prefabs: toRaw(prefabStore.prefabs),
        scripts: toRaw(scriptStore.scripts), 
        workspaceConfig: cleanWorkspaceConfig 
    };

    try {
        return JSON.parse(JSON.stringify(rawPayload));
    } catch (err) {
        console.error("Critical: Failed to serialize engine payload", err);
        throw new Error("Engine Payload Serialization Failed");
    }
}