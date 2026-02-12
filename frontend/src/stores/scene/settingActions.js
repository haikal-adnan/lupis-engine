// src/stores/scene/settingActions.js

export const useSettingActions = (activeScene) => {
  
  const _getSettings = () => activeScene.value?.settings;

  const toggleGrid = () => {
    const s = _getSettings();
    if (s) s.grid.visible = !s.grid.visible;
  };

  const toggleMagnet = () => {
    const s = _getSettings();
    if (s) s.grid.snap = !s.grid.snap;
  };

  const setGridSize = (width, height) => {
    const s = _getSettings();
    if (s) {
      s.grid.width = width;
      s.grid.height = height || width; 
    }
  };

  const setGridColor = (color) => {
    const s = _getSettings();
    if (s) s.grid.color = color;
  };

  const setGridOpacity = (opacity) => {
    const s = _getSettings();
    if (s) s.grid.opacity = opacity;
  };

  const setBackgroundColor = (color) => {
    const s = _getSettings();
    if (s) s.backgroundColor = color;
  };

  const setTickRate = (rate) => {
    const s = _getSettings();
    if (s) s.tickRate = rate;
  };

  const updateWorldBounds = (updates) => {
    const s = _getSettings();
    if (s && s.worldBounds) {
      Object.assign(s.worldBounds, updates);
    }
  };

  // --- UI Settings ---
  
  const updateUISettings = (updates) => {
    const s = _getSettings();
    if (s && s.ui) {
      Object.assign(s.ui, updates);
    }
  };

  // [NEW] Toggle UI Border Action
  const toggleUIBorder = () => {
    const s = _getSettings();
    if (s && s.ui) {
        s.ui.showUIBorder = !s.ui.showUIBorder;
    }
  };

  const toggleRulers = () => {
    const s = _getSettings();
    if (s) s.showRulers = !s.showRulers;
  };

  return {
    toggleGrid,
    toggleMagnet,
    setGridSize,
    setGridColor,
    setGridOpacity,
    setBackgroundColor,
    setTickRate,
    updateWorldBounds,
    updateUISettings,
    toggleUIBorder, // Exported
    toggleRulers
  };
}