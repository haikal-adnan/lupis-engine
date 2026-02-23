import { toRaw } from "vue";
import { useProjectStore } from "@/stores/useProjectStore.js";
import { useAssetStore } from "@/stores/useAssetStore.js";
import { useSceneStore } from "@/stores/scene/useSceneStore.js";
import { usePrefabStore } from "@/stores/usePrefabStore.js";
import { useEditorStore } from "@/stores/useEditorStore.js";
import { useScriptStore } from "@/stores/useScriptStore.js"; 

export async function prepareEngineData() {
    const projectStore = useProjectStore();
    const assetStore = useAssetStore();
    const sceneStore = useSceneStore();
    const prefabStore = usePrefabStore();
    const editorStore = useEditorStore();
    const scriptStore = useScriptStore(); 
    
    const projectId = editorStore.activeProjectId;
    if (!projectId) throw new Error("No Active Project ID in EditorStore");

    if (!projectStore.isProjectLoaded || projectStore.project?._id !== projectId) {
        await projectStore.loadProject(projectId);
    }

    if (!projectStore.project) throw new Error("Failed to load project metadata");

    let targetSceneId = sceneStore.activeSceneId;
    
    if (!targetSceneId && sceneStore.scenes.length > 0) {
        const firstScene = sceneStore.scenes[0];
        targetSceneId = firstScene._id || firstScene.id; 
        sceneStore.setActiveScene(targetSceneId);
    }
    
    if (!targetSceneId) throw new Error("No scenes found in project");
    
    const storeSceneRef = sceneStore.getSceneById(targetSceneId);

    if (!storeSceneRef) {
        throw new Error(`Scene data for ID ${targetSceneId} not found in Store`);
    }

    const editorConfig = editorStore.$state;

    const rawPayload = {
        project: toRaw(projectStore.project),
        assets: toRaw(assetStore.assets),
        scene: toRaw(storeSceneRef), 
        prefabs: toRaw(prefabStore.prefabs),
        scripts: toRaw(scriptStore.scripts), 
        editorConfig: toRaw(editorConfig)
    };

    try {
        return JSON.parse(JSON.stringify(rawPayload));
    } catch (err) {
        console.error("Critical: Failed to serialize engine payload", err);
        throw new Error("Engine Payload Serialization Failed");
    }
}