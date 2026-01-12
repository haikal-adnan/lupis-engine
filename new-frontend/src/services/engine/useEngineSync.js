// src/modules/engine/composables/useEngineSync.js
import { useSceneStore } from '@/stores/scene/useSceneStore.js';
import { useAssetStore } from '@/stores/useAssetStore.js';

// Import sub-modules
import { useEditorToEngine } from './sync/useEditorToEngine.js';
import { useEngineToEditor } from './sync/useEngineToEditor.js';

export function useEngineSync() {
  const sceneStore = useSceneStore();
  const assetStore = useAssetStore();

  // Initialize Sub-modules
  const outgoing = useEditorToEngine(sceneStore, assetStore);
  const incoming = useEngineToEditor(sceneStore);

  const initSync = () => {
    outgoing.listen();

    incoming.listen();

  };

  return { initSync };
}