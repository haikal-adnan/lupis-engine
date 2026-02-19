import mongoose from 'mongoose';
import dotenv from 'dotenv';

import Project from './models/nosql/Project.js';
import Folder from './models/nosql/Folder.js';
import Asset from './models/nosql/Asset.js';
import Scene from './models/nosql/Scene.js';
import Prefab from './models/nosql/Prefab.js';
import Script from './models/nosql/Script.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing in .env file");
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    
    console.log("Clearing existing data...");
    await Project.deleteMany({});
    await Folder.deleteMany({});
    await Asset.deleteMany({});
    await Scene.deleteMany({});
    await Prefab.deleteMany({});
    await Script.deleteMany({});

    // --- ID DEFINITIONS (Menggabungkan ID Seeder Baru & Lama) ---
    const projectId = "project_dungeon_demo_01";
    const sceneId = "scene_main_gameplay";
    
    const fSpritesId = "folder_sprites";
    const fFontsId = "folder_fonts";
    
    // Menggunakan ID Asset dari seeder lama agar konsisten dengan fileKey
    const assetDungeonId = "dungeon_sheet_fixed_key"; 
    const assetFontId = "gaegu";
    
    const layerWorld = "layer_world_gameplay";      
    const layerUI = "layer_ui_main";      

    const entGroundId = "ent_platform_ground"; 
    const entPlayerId = "ent_player_hero";
    const entScoreId = "ent_ui_score_label";

    // --- SEEDING PROJECT ---
    console.log("Seeding Project & Folders...");
    await Project.create({
      _id: projectId,
      ownerId: "dev_2025",
      name: "Dungeon Visual Demo",
      settings: { width: 1280, height: 720 },
      scenes: [sceneId],
      globalVariables: [],
      tags: ['Player', 'Environment', 'UI'], 
    });

    await Folder.create([
      { _id: fSpritesId, projectId, name: "Sprites" },
      { _id: fFontsId, projectId, name: "Fonts" },
    ]);

    // --- SEEDING ASSETS (Diambil dari Seeder Lama) ---
    console.log("Seeding Assets...");
    await Asset.create([
      {
        _id: assetDungeonId,
        projectId,
        folderId: fSpritesId,
        name: "dungeon_sheet",
        type: "texture",
        fileKey: "dungeon_sheet_fixed_key",
        fileUrl: null,
        meta: { extension: ".png", dimensions: { w: 352, h: 176 }, filterMode: "nearest" }
      },
      {
        _id: assetFontId,
        projectId,
        folderId: fFontsId,
        name: "gaegu_regular",
        type: "font",
        fileKey: "gaegu",
        fileUrl: null,
        meta: { extension: ".fnt" }
      }
    ]);

    // --- SEEDING SCENE (Tetap Menggunakan Logika Seeder Baru) ---
    console.log("Seeding Scene...");
    await Scene.create({
      _id: sceneId,
      projectId,
      scriptId: "scene_gameplay_logic",
      name: "Gameplay Scene",
      version: 1,
      
      settings: {
        backgroundColor: "#222222",
        tickRate: 60,
        worldBounds: { x1: -960, x2: 2880, y1: -540, y2: 1620, active: true },
        ui: { referenceWidth: 1920, referenceHeight: 1080, scaleMode: "constant", showUIBorder: true, active: true },
        grid: { width: 32, height: 32, color: "#ffffff", opacity: 0.1, visible: true, snap: true },
        showRulers: true
      },
      
      layersWorld: [
        { _id: layerWorld, scriptId: "l_world", name: "World", zIndex: 10 } 
      ],
      
      layersUI: [
        { _id: layerUI, scriptId: "l_ui", name: "HUD", zIndex: 100 }          
      ],

      entities: [
        {
            _id: entGroundId,
            scriptId: "inst_ground",
            type: "entity",
            name: "Ground Platform",
            tag: "Environment",
            layerId: layerWorld,
            zIndex: 0, 
            parentId: null,
            isActive: true,
            prefabId: null,
            isOverridden: false,
            components: {
              Transform: { 
                x: 640, y: 600,
                width: 800, height: 32, 
                scaleX: 1, scaleY: 1, 
                pivotX: 0.5, pivotY: 0.5, flipX: false, flipY: false,
                isOverridden: false
              },
              ShapeRenderer: { 
                type: "rectangle", color: "#4CAF50", width: 800, height: 32,
                isOverridden: false
              }
            }
        },
        {
          _id: entPlayerId,
          scriptId: "inst_player",
          type: "entity",
          name: "Hero Player",
          tag: "Player",
          layerId: layerWorld,
          zIndex: 10,
          parentId: null,
          isActive: true,
          prefabId: null,
          isOverridden: false,
          components: {
            Transform: { 
              x: 640, y: 500,
              width: 64, height: 64, 
              scaleX: 1, scaleY: 1,
              pivotX: 0.5, pivotY: 0.5, flipX: false, flipY: false,
              isOverridden: false
            },
            ShapeRenderer: { 
              type: "rectangle", color: "#FF0000", width: 64, height: 64,
              isOverridden: false
            }
          }
        },
        {
            _id: entScoreId,
            scriptId: "inst_ui_score",
            type: "ui",
            name: "Score Label",
            tag: "UI",
            layerId: layerUI,
            zIndex: 999,
            parentId: null,
            isActive: true,
            prefabId: null,
            isOverridden: false,
            components: {
                UITransform: {
                    x: 50, y: 50, width: 200, height: 50, scaleX: 1, scaleY: 1, rotation: 0,
                    pivotX: 0, pivotY: 0, anchorX: 0, anchorY: 0, flipX: false, flipY: false,
                    isOverridden: false
                },
                TextRenderer: {
                    value: "Score: 0", fontSize: 32, color: "#FFFFFF", align: "left",
                    assetId: assetFontId, opacity: 1,
                    isOverridden: false
                }
            }
        }
      ]
    });

    console.log("Database seeded successfully!");
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