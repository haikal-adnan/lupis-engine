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
    
    // 1. Validasi Project ID
    const projectId = editorStore.activeProjectId;
    if (!projectId) throw new Error("No Active Project ID in EditorStore");

    // 2. Pastikan Project Data Ter-load
    if (!projectStore.isProjectLoaded || projectStore.project?._id !== projectId) {
        await projectStore.loadProject(projectId);
    }

    if (!projectStore.project) throw new Error("Failed to load project metadata");

    // 3. Tentukan Scene yang akan dijalankan
    let targetSceneId = sceneStore.activeSceneId;
    
    // Fallback: Jika tidak ada scene aktif, ambil scene pertama
    if (!targetSceneId && sceneStore.scenes.length > 0) {
        const firstScene = sceneStore.scenes[0];
        targetSceneId = firstScene._id || firstScene.id; 
        sceneStore.setActiveScene(targetSceneId);
    }
    
    if (!targetSceneId) throw new Error("No scenes found in project");
    
    // 4. Ambil Referensi Scene dari Store
    const storeSceneRef = sceneStore.getSceneById(targetSceneId);

    if (!storeSceneRef) {
        throw new Error(`Scene data for ID ${targetSceneId} not found in Store`);
    }

    // 5. Persiapkan Config Editor
    const editorConfig = editorStore.$state;

    // 6. Sanitasi Data (FIX untuk Error: DataCloneError / ComputedRefImpl)
    // Kita kumpulkan semua data dalam satu object raw, lalu lakukan deep cloning
    // menggunakan JSON serialize untuk membuang semua Proxy Vue, Computed Ref, dan Function.
    const rawPayload = {
        project: projectStore.project,
        assets: assetStore.assets,
        scene: storeSceneRef, // Scene aktif
        prefabs: prefabStore.prefabs,
        scripts: scriptStore.scripts, 
        editorConfig: editorConfig
    };

    // Ini adalah langkah terpenting:
    // JSON.stringify akan menghapus 'computed', 'function', dan 'Vue internals'
    // JSON.parse akan mengembalikannya menjadi objek JavaScript murni (Plain Object)
    return JSON.parse(JSON.stringify(rawPayload));
}