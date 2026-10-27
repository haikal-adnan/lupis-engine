// Scene environment, physics parameters, world bounds, and canvas ruler settings.

import { useSceneStore } from '@scenes/useSceneStore.js';
import { engineBridge } from "@engines/engines.js";

export function useSettingActions() {
  const store = useSceneStore();

  const setBackgroundColor = (color) => {
    const s = store.activeScene?.settings;
    if (s) {
      s.backgroundColor = color;
      engineBridge.updateSceneSettings?.({ backgroundColor: color });
    }
  };

  const updateWorldBounds = (updates) => {
    const s = store.activeScene?.settings;
    if (s?.worldBounds) {
      Object.assign(s.worldBounds, updates);
      engineBridge.updateSceneSettings?.({ worldBounds: updates });
    }
  };

  const updatePhysicsSettings = (updates) => {
    const s = store.activeScene?.settings;
    if (s) {
      if (!s.physics) s.physics = { gravity: 1200, drag: 5 };
      Object.assign(s.physics, updates);
      engineBridge.updateSceneSettings?.({ physics: updates });
    }
  };

  const toggleRulers = () => {
    const s = store.activeScene?.settings;
    if (s) {
      s.showRulers = !s.showRulers;
      engineBridge.updateSceneSettings?.({ showRulers: s.showRulers });
    }
  };

  return {
    setBackgroundColor,
    updateWorldBounds,
    updatePhysicsSettings,
    toggleRulers
  };
}
