// src/stores/settingActions.js

export const useSettingActions = (activeScene) => {
  
  // Helper internal untuk memastikan scene aktif dan settings ada
  const _getSettings = () => activeScene.value?.settings;

  // --- Grid Actions ---
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

  // --- World & Engine Actions ---
  const setBackgroundColor = (color) => {
    const s = _getSettings();
    if (s) s.backgroundColor = color;
  };

  const setTickRate = (rate) => {
    const s = _getSettings();
    if (s) s.tickRate = rate;
  };

  // --- World Bounds ---
  // Menerima partial updates, misal: { width: 4000 } atau { x: -100, y: -100 }
  const updateWorldBounds = (updates) => {
    const s = _getSettings();
    if (s && s.worldBounds) {
      Object.assign(s.worldBounds, updates);
    }
  };

  // --- UI System Settings (BARU) ---
  const updateUISettings = (updates) => {
    const s = _getSettings();
    if (s && s.ui) {
      Object.assign(s.ui, updates);
    }
  };

  // --- Editor Visuals ---
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
    updateUISettings, // <--- Pastikan ini di-export
    toggleRulers
  };
};