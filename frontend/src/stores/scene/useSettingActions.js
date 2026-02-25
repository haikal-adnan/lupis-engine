export const settingActions = {
  setBackgroundColor(color) {
    const s = this.activeScene?.settings;
    if (s) s.backgroundColor = color;
  },

  updateWorldBounds(updates) {
    const s = this.activeScene?.settings;
    if (s?.worldBounds) Object.assign(s.worldBounds, updates);
  },

  updatePhysicsSettings(updates) {
    const s = this.activeScene?.settings;
    if (s) {
        if (!s.physics) s.physics = { gravity: 1200, drag: 5 };
        Object.assign(s.physics, updates);
    }
  },

  toggleRulers() {
    const s = this.activeScene?.settings;
    if (s) s.showRulers = !s.showRulers;
  }
};