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

    const projectId = "project_dungeon_demo_01";
    const sceneId = "scene_level_1_demo";
    
    const fSpritesId = "folder_sprites_main";
    const fFontsId = "folder_fonts_main";
    const fScriptsId = "folder_scripts_main";
    
    const assetDungeonId = "dungeon_sheet_fixed_key";
    const assetFontId = "gaegu";
    const scriptPlayerMoveId = "script_player_movement_001";
    const varSpeedId = "var_speed_001";
    const prefabChestId = "prefab_chest_001";
    
    const layerWorldBg = "layer_w_bg";      
    const layerWorldMain = "layer_w_main";  
    const layerUIHUD = "layer_ui_hud";      
    const layerUIMenu = "layer_ui_menu";    

    const entTilemapId = "ent_main_tilemap";
    const entGroundId = "ent_static_floor"; 
    const entItemId = "ent_item_inner";
    const entUITextId = "ent_ui_score_text";

    console.log("Seeding Project & Folders...");
    await Project.create({
      _id: projectId,
      ownerId: "dev_2025",
      name: "Dungeon Project",
      settings: { width: 1280, height: 720 },
      scenes: [sceneId],
      globalVariables: [],
      tags: ['Untagged', 'Player', 'Enemy', 'Ground', 'UI'], 
    });

    await Folder.create([
      { _id: fSpritesId, projectId, name: "Sprites" },
      { _id: fFontsId, projectId, name: "Fonts" },
      { _id: fScriptsId, projectId, name: "Scripts" }
    ]);

    console.log("Seeding Assets...");
    await Asset.create({
      _id: assetDungeonId,
      projectId,
      folderId: fSpritesId,
      name: "dungeon_sheet",
      type: "texture",
      fileKey: "dungeon_sheet_fixed_key",
      fileUrl: null,
      meta: { extension: ".png", dimensions: { w: 352, h: 176 }, filterMode: "nearest" }
    });

    await Asset.create({
      _id: assetFontId,
      projectId,
      folderId: fFontsId,
      name: "gaegu_regular",
      type: "font",
      fileKey: "gaegu",
      fileUrl: null,
      meta: { extension: ".fnt" }
    });

    console.log("Seeding Scripts...");
    await Script.create({
      _id: scriptPlayerMoveId,
      projectId,
      name: "Player Movement",
      type: "component",
      exposedVariables: [{ _id: varSpeedId, name: "Speed", type: "number", defaultValue: 300 }],
      nodes: [], edges: [] 
    });

    console.log("Seeding Prefab...");
    await Prefab.create({
      _id: prefabChestId,
      projectId,
      name: "Wooden Chest",
      thumbnailUrl: "",
      data: {
        scriptId: "prefab_script_chest",
        tag: "interactable",
        layerId: layerWorldMain, 
        zIndex: 5, 
        isOverridden: false, 
        components: {
          Transform: { 
            x: 0, y: 0, scaleX: 2, scaleY: 2, width: 50, height: 50, flipX: false, flipY: false,
            isOverridden: false 
          },
          SpriteRenderer: { 
            assetId: assetDungeonId, sourceX: 128, sourceY: 0, sourceWidth: 32, sourceHeight: 32, color: "#FFFFFF", opacity: 1,
            isOverridden: false
          },
          Collider: { 
            type: "solid", width: 32, height: 32,
            isOverridden: false
          }
        }
      }
    });

    console.log("Seeding Scene...");
    await Scene.create({
      _id: sceneId,
      projectId,
      scriptId: "level_1_demo",
      name: "Level 1 Demo",
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
        { _id: layerWorldBg, scriptId: "l_bg", name: "Background", zIndex: 0 }, 
        { _id: layerWorldMain, scriptId: "l_main", name: "Gameplay", zIndex: 10 } 
      ],
      
      layersUI: [
        { _id: layerUIHUD, scriptId: "l_hud", name: "HUD", zIndex: 0 },          
        { _id: layerUIMenu, scriptId: "l_menu", name: "Menus", zIndex: 100 }     
      ],

      entities: [
        {
          _id: entTilemapId,
          scriptId: "level_ground",
          type: "entity",
          name: "Level Terrain",
          tag: "ground",
          
          layerId: layerWorldBg, 
          zIndex: 0, 
          
          parentId: null,
          isActive: true,
          isOverridden: false,
          components: {
            Transform: { 
              x: 0, y: 0, width: 640, height: 480, scaleX: 1, scaleY: 1, flipX: false, flipY: false,
              isOverridden: false
            },
            Tilemap: {
              tileWidth: 16, tileHeight: 16, width: 40, height: 30,
              assetId: assetDungeonId, isSolid: true,
              data: Array(1200).fill(0).map((_, i) => i < 40 ? 8 : 0),
              isOverridden: false
            }
          }
        },

        {
            _id: entGroundId,
            scriptId: "static_ground_001",
            type: "entity",
            name: "Static Floor",
            tag: "ground",
            
            layerId: layerWorldMain,
            zIndex: 0, 
            
            parentId: null,
            isActive: true,
            isOverridden: false,
            components: {
              Transform: { 
                x: 300, y: 500, width: 800, height: 32, pivotX: 0.5, pivotY: 0.5, flipX: false, flipY: false,
                isOverridden: false
              },
              ShapeRenderer: { 
                type: "rectangle", color: "#4CAF50", width: 800, height: 32,
                isOverridden: false
              },
              Collider: { 
                type: "solid", width: 800, height: 32,
                isOverridden: false
              }
            }
        },

        {
          _id: entItemId,
          scriptId: "inner_item_debug",
          type: "entity",
          name: "Hero Player",
          
          layerId: layerWorldMain,
          zIndex: 10,
          
          parentId: null,
          isActive: true,
          isOverridden: false,
          components: {
            Transform: { 
              x: 300, y: 300, width: 64, height: 64, pivotX: 0.5, pivotY: 0.5, flipX: false, flipY: false,
              isOverridden: false
            },
            ShapeRenderer: { 
              type: "rectangle", color: "#FF0000", width: 64, height: 64,
              isOverridden: false
            },
            Collider: { 
              type: "solid", width: 64, height: 64,
              isOverridden: false
            },
            Physics: { 
              enabled: true, type: "dynamic", mass: 1, gravityScale: 2,
              isOverridden: false
            },
            ScriptController: {
              data: [
                { _id: "inst_player_move_001", assetId: scriptPlayerMoveId, isActive: true, variables: { [varSpeedId]: 300 } }
              ],
              isOverridden: false
            }
          }
        },

        {
            _id: entUITextId,
            scriptId: "ui_score_text",
            type: "ui",
            name: "Score Text",
            tag: "UI",
            
            layerId: layerUIHUD,
            zIndex: 999,
            
            parentId: null,
            isActive: true,
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