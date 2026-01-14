// src/modules/engine/composables/useEngineSync.js
import { useSceneStore } from '@/stores/scene/useSceneStore.js';
import { useAssetStore } from '@/stores/useAssetStore.js';
import { useEditorStore } from '@/stores/useEditorStore.js';

// Import sub-modules
import { useEditorToEngine } from './sync/useEditorToEngine.js';
import { useEngineToEditor } from './sync/useEngineToEditor.js';

export function useEngineSync() {
  const sceneStore = useSceneStore();
  const assetStore = useAssetStore();
  const editorStore = useEditorStore();

  const outgoing = useEditorToEngine(sceneStore, assetStore, editorStore);
  const incoming = useEngineToEditor(sceneStore);

  const initSync = () => {
    outgoing.listen();

    incoming.listen();

  };

  return { initSync };
}