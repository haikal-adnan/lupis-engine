import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Project from './models/nosql/Project.js';
import Folder from './models/nosql/Folder.js';
import Asset from './models/nosql/Asset.js';
import Scene from './models/nosql/Scene.js';
import Prefab from './models/nosql/Prefab.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("🔥 Connected to MongoDB...");

    // 1. BERSIHKAN DATA LAMA
    await Project.deleteMany({});
    await Folder.deleteMany({});
    await Asset.deleteMany({});
    await Scene.deleteMany({});
    await Prefab.deleteMany({});
    
    // --- ID CONSTANTS ---
    const projectId = "project_dungeon_demo_01";
    
    const fSpritesId = "folder_sprites_main";
    const fFontsId = "folder_fonts_main";
    
    const assetDungeonId = "asset_tex_dungeon_sheet";
    const assetFontId = "asset_font_gaegu_reg";
    
    const prefabChestId = "prefab_chest_001";

    const sceneId = "scene_level_1_demo";
    
    const entBgId = "ent_background_map";
    const entGroupId = "ent_group_dungeon";
    const entItemId = "ent_item_inner";
    const entBoxId = "ent_debug_redbox";
    const entTextId = "ent_ui_text_label";
    
    const entChestStandardId = "ent_chest_std"; 
    const entChestBigId = "ent_chest_big"; 

    // 2. BUAT PROJECT
    await Project.create({
      _id: projectId, 
      ownerId: "dev_2025",
      name: "Dungeon Project",
      settings: { width: 1280, height: 720 },
      layers: [
        { id: "layer_root", name: "Root Layer", order: 0 },
        { id: "layer_hero", name: "Hero Layer", order: 1 }
      ]
    });

    // 3. BUAT FOLDER
    await Folder.create([
        { _id: fSpritesId, projectId: projectId, name: "Sprites" },
        { _id: fFontsId, projectId: projectId, name: "Fonts" }
    ]);

    // HAPUS MOCK CDN URL. Biarkan Engine yang menentukan Base URL nya.

    // 4. BUAT ASSETS
    await Asset.create({
      _id: assetDungeonId,
      projectId: projectId,
      folderId: fSpritesId,
      name: "dungeon_sheet",
      type: "texture",
      fileKey: "dungeon_sheet_fixed_key",
      
      // --- PERBAIKAN: SET NULL ---
      // Biarkan null agar engine menggunakan logika: CDN + ProjectID + FileKey
      fileUrl: null, 
      
      meta: { extension: ".png", filterMode: "nearest", dimensions: { w: 352, h: 176 } }
    });
    
    await Asset.create({
      _id: assetFontId,
      projectId: projectId,
      folderId: fFontsId, 
      name: "gaegu",      
      type: "font",
      fileKey: "gaegu_fixed_key",
      
      // --- PERBAIKAN: SET NULL ---
      fileUrl: null,

      meta: { extension: ".ttf", originalName: "Gaegu-Regular.ttf"}
    });
    
    await Asset.create({
      _id: "crop",
      projectId: projectId,
      folderId: fSpritesId,
      name: "crop",
      type: "texture",
      fileKey: "crop",
      
      // --- PERBAIKAN: SET NULL ---
      fileUrl: null,
      
      meta: { extension: ".png", filterMode: "nearest", dimensions: { w: 1440, h: 2736 }  }
    });
    
    const chestPrefabData = {
        transform: {
            translate: { x: 0, y: 0 },
            width: 50,
            height: 50,
            scale: { x: 2, y: 2 },
            rotation: 0,
            pivot: { x: 0.5, y: 0.5 },
            zIndex: 0
        },
        components: {
            "SpriteRenderer": {
                "assetId": assetDungeonId,
                "source": { "x": 128, "y": 0, "w": 32, "h": 32 } 
            }
        }
    };

    await Prefab.create({
      _id: prefabChestId,
      projectId: projectId,
      name: "Wooden Chest",
      thumbnailUrl: "", 
      data: {
        tag: "interactable",
        layerId: "layer_hero",
        components: chestPrefabData.components,
        transform: {
            ...chestPrefabData.transform,
            translate: { x: 200, y: 300 } 
        }
      }
    });

    console.log("✅ Project, Assets & Prefab created.");

    await Scene.create({
      _id: sceneId,
      projectId: projectId,
      name: "Level 1",
      settings: { backgroundColor: "#222222" },
      entities: [
        {
          _id: entBgId,
          name: "Background Map",
          tag: "background", 
          layerId: "layer_root",
          parentId: null,
          opacity: 100, 
          transform: {
            translate: { x: 0, y: 0 },
            width: 800, height: 600,
            rotation: 0, 
            pivot: { x: 0, y: 0 }, 
            scale: { x: 1, y: 1 }, 
            zIndex: 0
          },
          components: {
            "SpriteRenderer": {
              "assetId": assetDungeonId, 
              "source": { "x": 0, "y": 0, "w": 256, "h": 256 }
            }
          }
        },
        
        {
          _id: entGroupId,
          name: "Dungeon Room",
          tag: "untagged",
          layerId: "layer_hero",
          parentId: null,
          opacity: 100,
          transform: { 
            translate: { x: 100, y: 100 },
            width: 0, height: 0, 
            pivot: { x: 0, y: 0 },
            scale: { x: 1, y: 1 }, 
            zIndex: 1 
          },
          components: {}
        },

        {
          _id: entItemId,
          name: "Inner Dungeon Item",
          tag: "props",
          layerId: "layer_hero",
          parentId: entGroupId, 
          opacity: 100,
          transform: {
            translate: { x: 50, y: 50 },
            width: 64, height: 64, 
            rotation: 0,
            pivot: { x: 0.5, y: 1.0 }, 
            scale: { x: 1, y: 1 },
            zIndex: 0
          },
          components: {
            "SpriteRenderer": {
              "assetId": assetDungeonId,
              "source": { "x": 32, "y": 0, "w": 16, "h": 16 }
            }
          }
        },

        {
          _id: entBoxId,
          name: "Red Rectangle",
          tag: "untagged",
          layerId: "layer_hero",
          parentId: entGroupId,
          opacity: 100,
          transform: {
            translate: { x: 0, y: 150 }, 
            width: 100, height: 100,
            rotation: 45, 
            pivot: { x: 0.5, y: 0.5 }, 
            scale: { x: 1, y: 1 },
            zIndex: 0
          },
          components: {
            "ShapeRenderer": {
              "type": "rectangle",
              "color": "#FF0000",
              "width": 100,
              "height": 100
            }
          }
        },

        {
          _id: entTextId,
          name: "Text Label",
          tag: "ui",
          layerId: "layer_hero",
          parentId: entGroupId,
          opacity: 100,
          transform: {
            translate: { x: 0, y: 250 }, 
            width: 200, height: 50, 
            pivot: { x: 0.5, y: 0.5 },
            scale: { x: 1, y: 1 },
            zIndex: 10
          },
          components: {
            "TextRenderer": {
              "value": "Testing", 
              "fontSize": 50,      
              "color": "#FFFFFF",    
              "assetId": assetFontId,
              "align": "center"
            }
          }
        },

        {
            _id: entChestStandardId,
            name: "Chest 1 (Standard)",
            prefabId: prefabChestId, 
            parentId: entGroupId,
            layerId: "layer_hero",
            
            transform: {
                ...chestPrefabData.transform,
                translate: { x: 200, y: 0 },
                zIndex: 5
            },
            
            components: { 
                ...chestPrefabData.components 
            } 
        },

        {
            _id: entChestBigId,
            name: "Chest 2 (Big & Red)",
            prefabId: prefabChestId,
            parentId: entGroupId,
            layerId: "layer_hero",
            
            transform: {
                ...chestPrefabData.transform, 
                translate: { x: 400, y: 0 },  
                zIndex: 6
            },
            components: {
                "SpriteRenderer": {
                    ...chestPrefabData.components["SpriteRenderer"],
                    "color": "#FF0000"
                }
            }
        }
      ]
    });

    console.log("✅ Database seeded successfully with FULL ENTITY structure.");
    process.exit();
  } catch (err) {
    console.error("❌ Seed Error:", err);
    process.exit(1);
  }
};

seedDatabase();