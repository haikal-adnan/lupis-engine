export const createScene = (data = {}) => {
  return {
    _id: data._id || `scene_${Date.now()}`, 
    projectId: data.projectId,
    name: data.name || "New Scene",
    version: 1,
    
    settings: {
      backgroundColor: data.settings?.backgroundColor || '#222222',
      gravity: {
        x: data.settings?.gravity?.x ?? 0,
        y: data.settings?.gravity?.y ?? 9.8
      },
      worldBounds: {
        x: data.settings?.worldBounds?.x ?? 0,
        y: data.settings?.worldBounds?.y ?? 0,
        width: data.settings?.worldBounds?.width ?? 2000,
        height: data.settings?.worldBounds?.height ?? 2000
      }
    },

    layers: [{
      _id: 'layer_root', 
      name: 'Default Layer', 
      locked: false, 
      visible: true 
    }],

    entities: [] 
  };
};