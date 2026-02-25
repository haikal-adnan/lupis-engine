import mongoose from 'mongoose';
import dotenv from 'dotenv';

import Project from '../models/nosql/Project.js';
import Folder from '../models/nosql/Folder.js';
import Asset from '../models/nosql/Asset.js';
import Scene from '../models/nosql/Scene.js';
import Prefab from '../models/nosql/Prefab.js';
import Script from '../models/nosql/Script.js';

import { GenerateUUID } from '../utils/GenerateUUID.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing in .env file");
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    
    console.log("Clearing existing data...");
    await Promise.all([
        Project.deleteMany({}),
        Folder.deleteMany({}),
        Asset.deleteMany({}),
        Scene.deleteMany({}),
        Prefab.deleteMany({}),
        Script.deleteMany({}),
    ]);

    const projectId = "jzA6wmUT6ubGNYJq";
    
    const sceneId = GenerateUUID();
    const layerWorldId = GenerateUUID();      
    const layerUIId = GenerateUUID();      

    console.log("Seeding Project...");
    await Project.create({
      _id: projectId,
      ownerId: "dev_2026",
      name: "New Empty Project",
      settings: { 
        tickRate: 60,
        ui: { width: 1920, height: 1080, showUIBorder: true, active: true },
        grid: { width: 32, height: 32, color: "#ffffff", opacity: 0.1, visible: true, snap: true }
      },
      scenes: [sceneId],
      globalVariables: [],
      tags: ['Untagged', 'Player', 'Enemy', 'Terrain', 'UI'], 
    });

    console.log("Seeding Empty Scene...");
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
        { 
          _id: layerWorldId, 
          scriptId: "layer_world_editor", 
          name: "World", 
          zIndex: 10,
          orderIndex: 0,
          locked: false,
          visible: true
        } 
      ],
      
      layersUI: [
        { 
          _id: layerUIId, 
          scriptId: "layer_ui_editor", 
          name: "HUD", 
          zIndex: 100,
          orderIndex: 1,
          locked: false,
          visible: true
        }          
      ],

      entities: [] 
    });

    console.log("\n--- Seed Summary ---");
    console.log(`Project ID : ${projectId}`);
    console.log(`Scene ID   : ${sceneId}`);
    console.log("Database seeded successfully! (Scripts collection is empty)");

  } catch (err) {
    console.error("Seeding Failed:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
    process.exit(0);
  }
};

seedDatabase();