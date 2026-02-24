import { createLayer } from '@schemas/sceneSchema/layerSchema.js';
import { createEntity } from '@schemas/sceneSchema/entitySchema.js';
import { GenerateUUID } from '@/commons/utils/generateUUID.js'; 

export const createScene = (data = {}, projectId = null) => {
  const sceneId = data._id || `scene_${GenerateUUID()}`;
  const scriptId = data.scriptId || `script_${GenerateUUID()}`;

  return {
    _id: sceneId,
    projectId: projectId || data.projectId,
    scriptId: scriptId,
    name: data.name || "Untitled Scene",
    
    settings: {
      backgroundColor: data.settings?.backgroundColor || '#222222',
      
      physics: {
        gravity: Number(data.settings?.physics?.gravity ?? 2000), 
        drag: Number(data.settings?.physics?.drag ?? 5),          
      },

      worldBounds: {
        x1: Number(data.settings?.worldBounds?.x1 ?? -1920),
        x2: Number(data.settings?.worldBounds?.x2 ?? 1920),
        y1: Number(data.settings?.worldBounds?.y1 ?? -1080),
        y2: Number(data.settings?.worldBounds?.y2 ?? 1080),
        active: data.settings?.worldBounds?.active ?? true,
      },

      showRulers: data.settings?.showRulers ?? true
    },

    layersWorld: Array.isArray(data.layersWorld) 
      ? data.layersWorld.map(l => createLayer(l))
      : [createLayer({ _id: 'layer_world_root', scriptId: 'world_root', name: 'World Root' })],

    layersUI: Array.isArray(data.layersUI) 
      ? data.layersUI.map(l => createLayer(l))
      : [createLayer({ _id: 'layer_ui_root', scriptId: 'ui_root', name: 'UI Root' })],

    entities: Array.isArray(data.entities) 
      ? data.entities.map(e => createEntity(e)) 
      : []
  };
};