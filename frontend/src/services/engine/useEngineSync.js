// src/modules/engine/composables/useEngineSync.js
import { useSceneStore } from '@/stores/scene/useSceneStore.js';
import { useAssetStore } from '@/stores/useAssetStore.js';
import { useEditorStore } from '@/stores/useEditorStore.js';
import { useScriptStore } from '@/stores/useScriptStore.js';
import { usePrefabStore } from '@/stores/usePrefabStore.js';

// Import sub-modules
import { useEditorToEngine } from './sync/useEditorToEngine.js';
import { useEngineToEditor } from './sync/useEngineToEditor.js';

export function useEngineSync() {
  const sceneStore = useSceneStore();
  const assetStore = useAssetStore();
  const editorStore = useEditorStore();
  const scriptStore = useScriptStore();
  const prefabStore = usePrefabStore();


  const outgoing = useEditorToEngine(sceneStore, assetStore, editorStore, scriptStore, prefabStore);
  const incoming = useEngineToEditor(sceneStore);

  const initSync = () => {
    outgoing.listen();

    incoming.listen();

  };

  return { initSync };
}