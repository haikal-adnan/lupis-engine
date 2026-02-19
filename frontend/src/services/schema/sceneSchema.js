// src/schemas/sceneSchema/createScene.js

import { createLayer } from '@schemas/sceneSchema/layerSchema.js';
import { createEntity } from '@schemas/sceneSchema/entitySchema.js';
import { GenerateUUID } from '@/commons/utils/generateUUID.js'; 

export const createScene = (data = {}, projectId = null) => {
  const sceneId = data._id || `scene_${GenerateUUID()}`;
  const scriptId = data.scriptId || `script_${GenerateUUID()}`;
  console.log(data)

  return {
    _id: sceneId,
    projectId: projectId || data.projectId,
    scriptId: scriptId,
    name: data.name || "Untitled Scene",
    version: data.version || 1,
    
    settings: {
      backgroundColor: data.settings?.backgroundColor || '#222222',
      tickRate: data.settings?.tickRate || 60,
      
      physics: {
        gravity: data.settings?.physics?.gravity ?? 2000, 
        drag: data.settings?.physics?.drag ?? 5,          
      },

      worldBounds: {
        x1: data.settings?.worldBounds?.x1 ?? -1920,
        x2: data.settings?.worldBounds?.x2 ?? 1920,
        y1: data.settings?.worldBounds?.y1 ?? -1080,
        y2: data.settings?.worldBounds?.y2 ?? 1080,
        active: data.settings?.worldBounds?.active ?? true,
      },

      ui: {
        referenceWidth: data.settings?.ui?.referenceWidth ?? 1920,
        referenceHeight: data.settings?.ui?.referenceHeight ?? 1080,
        scaleMode: data.settings?.ui?.scaleMode || 'constant',
        showUIBorder: data.settings?.ui?.showUIBorder ?? true,
        active: data.settings?.ui?.active ?? true
      },

      grid: {
        width: data.settings?.grid?.width ?? 32,
        height: data.settings?.grid?.height ?? 32,
        color: data.settings?.grid?.color || '#ffffff',
        opacity: data.settings?.grid?.opacity ?? 0.1,
        visible: data.settings?.grid?.visible ?? true,
        snap: data.settings?.grid?.snap ?? true       
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