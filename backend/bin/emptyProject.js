import Project from '../models/nosql/Project.js';
import Scene from '../models/nosql/Scene.js';
import { GenerateUUID } from '../utils/GenerateUUID.js';

export const createEmptyProject = async (ownerId, projectName, description) => {
  try {
    const projectId = GenerateUUID();
    const sceneId = GenerateUUID();
    const layerWorldId = GenerateUUID();      
    const layerUIId = GenerateUUID();      

    console.log(`[Project] Seeding New Project: ${projectId}`);
    
    const project = await Project.create({
      _id: projectId,
      ownerId: ownerId, 
      name: projectName,
      description: description,
      settings: { 
        tickRate: 60,
        ui: { width: 1920, height: 1080, showUIBorder: true, active: true },
        camera: { x: 960, y: 540, zoom: 1, lerp: 0.1 },
        grid: { width: 32, height: 32, color: "#ffffff", opacity: 0.1, visible: true, snap: true }
      },
      scenes: [sceneId],
      globalVariables: [],
      tags: ['Untagged', 'Player', 'Enemy', 'Terrain', 'UI'], 
    });

    await Scene.create({
      _id: sceneId,
      projectId,
      scriptId: "scene_logic_root", 
      name: "Main Scene",
      settings: {
        backgroundColor: "#222222",
        physics: { gravity: 1200, drag: 5 },
        worldBounds: { x1: -960, x2: 2880, y1: -540, y2: 1620, active: true },
        showRulers: true
      },
      layersWorld: [
        // Tambahkan opacity di sini
        { _id: layerWorldId, scriptId: "layer_world_editor", name: "World", zIndex: 10, orderIndex: 0, locked: false, visible: true, opacity: 1.0 } 
      ],
      layersUI: [
        // Tambahkan opacity di sini
        { _id: layerUIId, scriptId: "layer_ui_editor", name: "HUD", zIndex: 100, orderIndex: 1, locked: false, visible: true, opacity: 1.0 }          
      ],
      entities: [] 
    });

    return project; 
  } catch (err) {
    console.error("Failed to create empty project:", err);
    throw err;
  }
};