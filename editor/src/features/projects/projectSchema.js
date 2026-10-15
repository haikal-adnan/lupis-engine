import { GenerateUUID } from '@utils/utils.js';

export const projectSchema = (data = {}) => {
  const defaultScenes = data.scenes || [];
  const firstSceneId = defaultScenes.length > 0 
    ? (typeof defaultScenes[0] === 'object' ? defaultScenes[0].id : defaultScenes[0]) 
    : null;

  return {
    id: data.id, 
    name: data.name || "Untitled Project",
    description: data.description || "",
    version: data.version || "1.0.0",
    createdAt: data.createdAt || new Date().toISOString(),
    thumbnailUrl: data.thumbnailUrl || null,
    snapshotUrl: data.snapshotUrl || null,
    
    settings: {
      initialSceneId: data.settings?.initialSceneId || firstSceneId,
      tickRate: Number(data.settings?.tickRate || 60),
      
      autoSave: {
        enabled: data.settings?.autoSave?.enabled ?? false,
        interval: Number(data.settings?.autoSave?.interval ?? 10)
      },
      
      debug: {
        active: data.settings?.debug?.active ?? true,
        position: data.settings?.debug?.position || 'top-right', 
        width: Number(data.settings?.debug?.width ?? 360),
        height: Number(data.settings?.debug?.height ?? 220),
        maxLogs: Number(data.settings?.debug?.maxLogs ?? 50)
      },

      ui: {
        width: Number(data.settings?.ui?.width ?? 1920),
        height: Number(data.settings?.ui?.height ?? 1080),
        showUIBorder: data.settings?.ui?.showUIBorder ?? true,
        active: data.settings?.ui?.active ?? true
      },

      camera: {
        x: Number(data.settings?.camera?.x ?? 960),
        y: Number(data.settings?.camera?.y ?? 540),
        zoom: Number(data.settings?.camera?.zoom ?? 1),
        lerp: Number(data.settings?.camera?.lerp ?? 0.1)
      },

      grid: {
        width: Number(data.settings?.grid?.width ?? 32),
        height: Number(data.settings?.grid?.height ?? 32),
        color: data.settings?.grid?.color || '#ffffff',
        opacity: Number(data.settings?.grid?.opacity ?? 0.1),
        visible: data.settings?.grid?.visible ?? true,
        snap: data.settings?.grid?.snap ?? true       
      },
    },

    globalVariables: Array.isArray(data.globalVariables) 
      ? data.globalVariables.map(v => ({
          id: v.id || GenerateUUID(),
          name: v.name || "NewGlobalVar",
          type: v.type || "String",
          defaultValue: v.defaultValue ?? null
        }))
      : [],

    tags: Array.isArray(data.tags) && data.tags.length > 0 
      ? data.tags 
      : ['Untagged', 'Player', 'Enemy'],

    scenes: defaultScenes 
  };
};