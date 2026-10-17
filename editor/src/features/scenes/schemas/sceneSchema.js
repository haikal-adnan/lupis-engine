import { entitySchema, layerSchema } from '@scenes/scenes.js';
import { GenerateUUID, sanitizeScriptId } from '@utils/utils.js';

export const sceneSchema = (data = {}, projectId = null) => {
  const sceneId = data.id || `scene_${GenerateUUID()}`;
  const scriptId = sanitizeScriptId(
    data.scriptId || `scene_${GenerateUUID().slice(0, 8)}`,
    `scene_${GenerateUUID().slice(0, 8)}`
  );

  const scene = {
    id: sceneId,
    projectId: projectId || data.projectId || null,
    scriptId: scriptId,
    
    settings: {
      backgroundColor: data.settings?.backgroundColor || '#222222',
      
      physics: {
        gravity: Number(data.settings?.physics?.gravity ?? 1200), 
        drag: Number(data.settings?.physics?.drag ?? 5),          
      },

      worldBounds: {
        x1: Number(data.settings?.worldBounds?.x1 ?? -960),
        x2: Number(data.settings?.worldBounds?.x2 ?? 2880),
        y1: Number(data.settings?.worldBounds?.y1 ?? -540),
        y2: Number(data.settings?.worldBounds?.y2 ?? 1620),
        active: data.settings?.worldBounds?.active ?? true,
      },

      showRulers: data.settings?.showRulers ?? true
    },

    layersWorld: Array.isArray(data.layersWorld) 
      ? data.layersWorld.map(l => layerSchema(l))
      : [layerSchema({ id: `layer_world_${GenerateUUID()}`, scriptId: 'world_root' })],

    layersUI: Array.isArray(data.layersUI) 
      ? data.layersUI.map(l => layerSchema(l))
      : [layerSchema({ id: `layer_ui_${GenerateUUID()}`, scriptId: 'ui_root' })],

    entities: Array.isArray(data.entities) 
      ? data.entities.map(e => entitySchema(e)) 
      : []
  };

  return scene;
};