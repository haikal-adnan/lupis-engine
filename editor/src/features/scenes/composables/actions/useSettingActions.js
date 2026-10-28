// Scene environment, physics parameters, world bounds, and canvas ruler settings.

import { useSceneStore } from '@scenes/useSceneStore.js';
import { useProjectStore } from '@projects/projects.js';
import { useWorkspaceStore } from '@workspaces/workspaces.js';
import { engineBridge } from "@engines/engines.js";

export function useSettingActions() {
  const store = useSceneStore();

  const markDirtyIfReady = () => {
    const workspaceStore = useWorkspaceStore();
    const projectStore = useProjectStore();
    if (!workspaceStore.isLoading && !workspaceStore.isSaving && projectStore.isProjectLoaded) {
      projectStore.markAsDirty();
    }
  };

  const setBackgroundColor = (color) => {
    const s = store.activeScene?.settings;
    if (s) {
      s.backgroundColor = color;
      engineBridge.updateSceneSettings?.({ backgroundColor: color });
      markDirtyIfReady();
    }
  };

  const updateWorldBounds = (updates) => {
    const s = store.activeScene?.settings;
    if (s?.worldBounds) {
      Object.assign(s.worldBounds, updates);
      engineBridge.updateSceneSettings?.({ worldBounds: updates });
      markDirtyIfReady();
    }
  };

  const updatePhysicsSettings = (updates) => {
    const s = store.activeScene?.settings;
    if (s) {
      if (!s.physics) s.physics = { gravity: 1200, drag: 5 };
      Object.assign(s.physics, updates);
      engineBridge.updateSceneSettings?.({ physics: updates });
      markDirtyIfReady();
    }
  };

  const toggleRulers = () => {
    const s = store.activeScene?.settings;
    if (s) {
      s.showRulers = !s.showRulers;
      engineBridge.updateSceneSettings?.({ showRulers: s.showRulers });
      markDirtyIfReady();
    }
  };

  return {
    setBackgroundColor,
    updateWorldBounds,
    updatePhysicsSettings,
    toggleRulers
  };
}
