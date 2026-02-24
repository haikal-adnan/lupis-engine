export const useSettingActions = (activeScene) => {
  
  const _getSettings = () => activeScene.value?.settings;

  const setBackgroundColor = (color) => {
    const s = _getSettings();
    if (s) s.backgroundColor = color;
  };

  const updateWorldBounds = (updates) => {
    const s = _getSettings();
    if (s && s.worldBounds) {
      Object.assign(s.worldBounds, updates);
    }
  };

  const updatePhysicsSettings = (updates) => {
    const s = _getSettings();
    if (s) {
        if (!s.physics) s.physics = { gravity: 1200, drag: 5 };
        Object.assign(s.physics, updates);
    }
  };

  const toggleRulers = () => {
    const s = _getSettings();
    if (s) s.showRulers = !s.showRulers;
  };

  return {
    setBackgroundColor,
    updateWorldBounds,
    updatePhysicsSettings,
    toggleRulers
  };
}