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

    const scriptPlayerMoveId = "script_player_movement_001";  
    const varSpeedId = "var_speed_001";

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
    const sceneId = "scene_prefab_test";
    const prefabBoxId = "prefab_box_green";

    const layerUIHUD = "layer_ui_hud";      
    const layerUIMenu = "layer_ui_menu";    

    const layerMain = "layer_main";
    const fFontsId = "folder_fonts_main";
    const entUITextId = "ent_ui_score_text";
    const assetFontId = "gaegu";

    console.log("Seeding Project...");
    await Project.create({
      _id: projectId,
      ownerId: "dev_2025",
      name: "Prefab System Test",
      settings: { width: 1280, height: 720 },
      scenes: [sceneId],
      globalVariables: [],
    });

    await Script.create({
      _id: scriptPlayerMoveId,
      projectId,
      name: "Player Movement",
      type: "component",
      exposedVariables: [{ _id: varSpeedId, name: "Speed", type: "number", defaultValue: 300 }],
      nodes: [], edges: [] 
    });

    await Asset.create({
      _id: assetFontId,
      projectId,
      folderId: fFontsId,
      name: "gaegu_regular",
      type: "font",
      fileKey: "gaegu",
      meta: { extension: ".fnt" }
    });

    

    console.log("Seeding Prefab...");
    await Prefab.create({
      _id: prefabBoxId,
      projectId,
      name: "Green Box Prefab",
      data: {
        scriptId: "prefab_green_box",
        tag: "Untagged",
        layerId: layerMain, 
        zIndex: 5, 
        isOverridden: false, 
        components: {
          Transform: { 
            x: 0, y: 0, scaleX: 1, scaleY: 1, width: 100, height: 100, flipX: false, flipY: false,
            isOverridden: false 
          },
          ShapeRenderer: { 
            type: "rectangle", color: "#00FF00", width: 100, height: 100,
            isOverridden: false
          },
          ScriptController: {
            data: [
              { _id: "inst_player_move_001", assetId: scriptPlayerMoveId, isActive: true, variables: { [varSpeedId]: 300 } }
            ],
            isOverridden: false
          }
        }
      }
    });

    console.log("Seeding Scene...");
    await Scene.create({
      _id: sceneId,
      projectId,
      scriptId: "scene_test_01",
      name: "Prefab Test Scene",
      
      settings: {
        backgroundColor: "#222222",
        tickRate: 60,
        physics: {
            gravity: 1200,
            drag: 10
        },
        worldBounds: { x1: -960, x2: 2880, y1: -540, y2: 1620, active: true },
        ui: { width: 1920, height: 1080, showUIBorder: true, active: true },
        grid: { width: 32, height: 32, color: "#ffffff", opacity: 0.1, visible: true, snap: true },
        showRulers: true
      },
      
      layersWorld: [
        { _id: layerMain, scriptId: "layer_main", name: "Main", zIndex: 0 } 
      ],
      
      layersUI: [
        { _id: layerUIHUD, scriptId: "layer_hud", name: "HUD", zIndex: 0 },          
      ],

      entities: [
        {
          _id: "ent_box_synced",
          scriptId: "inst_box_01",
          type: "entity",
          name: "Green Box (Synced)",
          tag: "Untagged",
          layerId: layerMain, 
          zIndex: 5, 
          parentId: null,
          isActive: true,
          prefabId: prefabBoxId,
          isOverridden: false,
          components: {
            Transform: { 
              x: 200, y: 360,
              scaleX: 1, scaleY: 1, width: 100, height: 100, flipX: false, flipY: false,
              isOverridden: false
            },
            ShapeRenderer: { 
              type: "rectangle", color: "#00FF00", width: 100, height: 100,
              isOverridden: false
            },
            ScriptController: {
              data: [
              ],
              isOverridden: true
            }
          }
        },
        {
          _id: "ent_box_modified",
          scriptId: "inst_box_02",
          type: "entity",
          name: "Red Big Box",
          tag: "Untagged",
          layerId: layerMain, 
          zIndex: 5, 
          parentId: null,
          isActive: true,
          prefabId: prefabBoxId,
          isOverridden: true,
          components: {
            Transform: { 
              x: 600, y: 360,
              scaleX: 1, scaleY: 1, width: 200, height: 200,
              flipX: false, flipY: false,
              isOverridden: true
            },
            ShapeRenderer: { 
              type: "rectangle", color: "#FF0000", width: 100, height: 100,
              isOverridden: true
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
