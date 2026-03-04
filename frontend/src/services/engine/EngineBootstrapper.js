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

    if (!sceneStore.scenes || sceneStore.scenes.length === 0) {
        throw new Error("No scenes found in project");
    }

    const { engine, ...cleanEditorConfig } = toRaw(editorStore.$state);

    const rawPayload = {
        project: toRaw(projectStore.project),
        assets: toRaw(assetStore.assets),
        scenes: toRaw(sceneStore.scenes), 
        prefabs: toRaw(prefabStore.prefabs),
        scripts: toRaw(scriptStore.scripts), 
        editorConfig: cleanEditorConfig 
    };

    try {
        return JSON.parse(JSON.stringify(rawPayload));
    } catch (err) {
        console.error("Critical: Failed to serialize engine payload", err);
        throw new Error("Engine Payload Serialization Failed");
    }
}