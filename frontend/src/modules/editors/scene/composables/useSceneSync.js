import { useProjectStore } from '@/stores/useProjectStore.js';
import { useSceneStore } from '@/stores/scene/useSceneStore.js';
import { useAssetStore } from '@/stores/useAssetStore.js'; 
import { useScriptStore } from '@/stores/useScriptStore.js'; 
import { usePrefabStore } from '@/stores/usePrefabStore.js'; 
import { EngineBridge } from '@/services/engine/EngineBridge.js';

export function useSceneSync() {
    const projectStore = useProjectStore();
    const sceneStore = useSceneStore();
    const assetStore = useAssetStore();
    const scriptStore = useScriptStore();
    const prefabStore = usePrefabStore();

    const syncSceneToEngine = () => {
        const activeScene = sceneStore.activeScene;
        if (!activeScene) return;

        const payload = {
            project: projectStore.project,
            scene: activeScene,
            prefabs: prefabStore.prefabs || {}, 
            scripts: scriptStore.scripts || {},
            assets: assetStore.assets || []
        };

        EngineBridge.reloadScene(payload);

        if (activeScene.settings) {
            EngineBridge.updateSceneSettings(activeScene.settings);
        }

        sceneStore.clearSelection();
    };

    const switchScene = (sceneId) => {
        sceneStore.setActiveScene(sceneId);
        syncSceneToEngine();
    };

    return { syncSceneToEngine, switchScene };
}