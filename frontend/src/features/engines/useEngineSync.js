import { useProjectStore } from '@projects/projects.js'
import { useSceneStore } from '@scenes/scenes.js';
import { useAssetStore } from '@assets/assets.js'
import { useWorkspaceStore } from '@workspaces/workspaces.js';
import { useScriptStore } from '@scripts/scripts.js';
import { usePrefabStore } from '@prefabs/prefabs.js';

import { useEditorToEngine, useEngineToEditor } from '@engines/engines.js';

export function useEngineSync() {
  const projectStore = useProjectStore();
  const sceneStore = useSceneStore();
  const assetStore = useAssetStore();
  const workspaceStore = useWorkspaceStore();
  const scriptStore = useScriptStore();
  const prefabStore = usePrefabStore();


  const outgoing = useEditorToEngine(projectStore, sceneStore, assetStore, workspaceStore, scriptStore, prefabStore);
  const incoming = useEngineToEditor(sceneStore);

  const initSync = () => {
    outgoing.listen();

    incoming.listen();

  };

  return { initSync };
}