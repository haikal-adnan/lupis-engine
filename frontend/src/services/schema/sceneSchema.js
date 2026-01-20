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
    version: data.version || 1,
    
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

    layers: Array.isArray(data.layers) 
      ? data.layers.map(l => createLayer(l))
      : [createLayer({ _id: 'layer_root', scriptId: 'root', name: 'Root' })],

    entities: Array.isArray(data.entities) 
      ? data.entities.map(e => createEntity(e)) 
      : []
  };
};