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
    const entTilemapId = "ent_main_tilemap";
    const entItemId = "ent_item_inner";

    console.log("Seeding Project...");
    await Project.create({
      _id: projectId,
      ownerId: "dev_2025",
      name: "Dungeon Project",
      settings: { width: 1280, height: 720 },
      scenes: [sceneId],
      globalVariables: [
        { _id: "gvar_score_001", name: "GlobalScore", type: "Number", defaultValue: 0 },
        { _id: "gvar_night_mode_001", name: "IsNightMode", type: "Boolean", defaultValue: false }
      ],
      tags: ['Untagged', 'Player', 'Enemy'],
    });

    console.log("Seeding Folders...");
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
      name: "Player Movement (WASD)",
      type: "component",
      exposedVariables: [
        { _id: varSpeedId, name: "Speed", type: "number", defaultValue: 300 }
      ],
      nodes: [
        {
          _id: "node_input_pos",
          type: "event_advanced_key",
          position: { x: 50, y: 50 },
          settings: { headerTitle: 'POSITIVE MOVEMENT', headerColor: '#C2185B', category: 'Keyboard Events' },
          data: {
            mappings: [
              { _id: "move_right", key: "D", trigger: "hold", threshold: 0, repeat: true },
              { _id: "move_down", key: "S", trigger: "hold", threshold: 0, repeat: true }
            ]
          },
          inputs: [],
          outputs: [
            { _id: "out_move_right", label: "D (Right)", dataType: "execution", color: "#FFEB3B" },
            { _id: "out_move_down", label: "S (Down)", dataType: "execution", color: "#FFEB3B" }
          ]
        },

        {
          _id: "node_speed_pos",
          type: "variable_get",
          position: { x: 50, y: 300 },
          settings: { headerTitle: 'GET SPEED', headerColor: '#424242', category: 'Variables' },
          data: { variableId: varSpeedId },
          inputs: [],
          outputs: [
            { _id: "val", label: "Value", dataType: "number", color: "#B2FF59" }
          ]
        },

        {
          _id: "node_trans_right",
          type: "translate",
          position: { x: 500, y: 50 },
          settings: { headerTitle: 'TRANSLATE', headerColor: '#2E7D32', category: 'Transform' },
          data: {},
          inputs: [
            { _id: "exec_in", label: "In", dataType: "execution", color: "#ffffff" },
            { _id: "in_target", label: "Target ID (Self)", dataType: "string", color: "#E040FB" },
            { _id: "dx", label: "Delta X", dataType: "number", color: "#69F0AE", defaultValue: 0 },
            { _id: "dy", label: "Delta Y", dataType: "number", color: "#69F0AE", defaultValue: 0 }
          ],
          outputs: [
            { _id: "exec_out", label: "Out", dataType: "execution", color: "#ffffff" }
          ]
        },

        {
          _id: "node_trans_down",
          type: "translate",
          position: { x: 500, y: 250 },
          settings: { headerTitle: 'TRANSLATE', headerColor: '#2E7D32', category: 'Transform' },
          data: {},
          inputs: [
            { _id: "exec_in", label: "In", dataType: "execution", color: "#ffffff" },
            { _id: "in_target", label: "Target ID (Self)", dataType: "string", color: "#E040FB" },
            { _id: "dx", label: "Delta X", dataType: "number", color: "#69F0AE", defaultValue: 0 },
            { _id: "dy", label: "Delta Y", dataType: "number", color: "#69F0AE", defaultValue: 0 }
          ],
          outputs: [
            { _id: "exec_out", label: "Out", dataType: "execution", color: "#ffffff" }
          ]
        },

        {
          _id: "node_input_neg",
          type: "event_advanced_key",
          position: { x: 50, y: 500 },
          settings: { headerTitle: 'NEGATIVE MOVEMENT', headerColor: '#C2185B', category: 'Keyboard Events' },
          data: {
            mappings: [
              { _id: "move_up", key: "W", trigger: "hold", threshold: 0, repeat: true },
              { _id: "move_left", key: "A", trigger: "hold", threshold: 0, repeat: true }
            ]
          },
          inputs: [],
          outputs: [
            { _id: "out_move_up", label: "W (Up)", dataType: "execution", color: "#FFEB3B" },
            { _id: "out_move_left", label: "A (Left)", dataType: "execution", color: "#FFEB3B" }
          ]
        },

        {
          _id: "node_speed_neg",
          type: "variable_get",
          position: { x: 50, y: 750 },
          settings: { headerTitle: 'GET SPEED', headerColor: '#424242', category: 'Variables' },
          data: { variableId: varSpeedId },
          inputs: [],
          outputs: [
            { _id: "val", label: "Value", dataType: "number", color: "#B2FF59" }
          ]
        },

        {
          _id: "node_neg_left",
          type: "math_negate",
          position: { x: 350, y: 550 },
          settings: { headerTitle: 'NEGATE', headerColor: '#00796B', category: 'Math' },
          data: {},
          inputs: [
            { _id: "in", label: "In", dataType: "execution", color: "#fff" },
            { _id: "a", label: "A", dataType: "number", color: "#B2FF59" }
          ],
          outputs: [
            { _id: "out", label: "Trigger", dataType: "execution", color: "#fff" },
            { _id: "res", label: "Result", dataType: "number", color: "#B2FF59" }
          ]
        },

        {
          _id: "node_neg_up",
          type: "math_negate",
          position: { x: 350, y: 750 },
          settings: { headerTitle: 'NEGATE', headerColor: '#00796B', category: 'Math' },
          data: {},
          inputs: [
            { _id: "in", label: "In", dataType: "execution", color: "#fff" },
            { _id: "a", label: "A", dataType: "number", color: "#B2FF59" }
          ],
          outputs: [
            { _id: "out", label: "Trigger", dataType: "execution", color: "#fff" },
            { _id: "res", label: "Result", dataType: "number", color: "#B2FF59" }
          ]
        },

        {
          _id: "node_trans_left",
          type: "translate",
          position: { x: 650, y: 500 },
          settings: { headerTitle: 'TRANSLATE', headerColor: '#2E7D32', category: 'Transform' },
          data: {},
          inputs: [
            { _id: "exec_in", label: "In", dataType: "execution", color: "#ffffff" },
            { _id: "in_target", label: "Target ID (Self)", dataType: "string", color: "#E040FB" },
            { _id: "dx", label: "Delta X", dataType: "number", color: "#69F0AE", defaultValue: 0 },
            { _id: "dy", label: "Delta Y", dataType: "number", color: "#69F0AE", defaultValue: 0 }
          ],
          outputs: [
            { _id: "exec_out", label: "Out", dataType: "execution", color: "#ffffff" }
          ]
        },

        {
          _id: "node_trans_up",
          type: "translate",
          position: { x: 650, y: 700 },
          settings: { headerTitle: 'TRANSLATE', headerColor: '#2E7D32', category: 'Transform' },
          data: {},
          inputs: [
            { _id: "exec_in", label: "In", dataType: "execution", color: "#ffffff" },
            { _id: "in_target", label: "Target ID (Self)", dataType: "string", color: "#E040FB" },
            { _id: "dx", label: "Delta X", dataType: "number", color: "#69F0AE", defaultValue: 0 },
            { _id: "dy", label: "Delta Y", dataType: "number", color: "#69F0AE", defaultValue: 0 }
          ],
          outputs: [
            { _id: "exec_out", label: "Out", dataType: "execution", color: "#ffffff" }
          ]
        }
      ],

      edges: [
        { _id: "e_pos_1", source: "node_input_pos", sourceHandle: "out_move_right", target: "node_trans_right", targetHandle: "exec_in" },
        { _id: "e_pos_2", source: "node_speed_pos", sourceHandle: "val", target: "node_trans_right", targetHandle: "dx" },

        { _id: "e_pos_3", source: "node_input_pos", sourceHandle: "out_move_down", target: "node_trans_down", targetHandle: "exec_in" },
        { _id: "e_pos_4", source: "node_speed_pos", sourceHandle: "val", target: "node_trans_down", targetHandle: "dy" },

        { _id: "e_neg_1", source: "node_input_neg", sourceHandle: "out_move_left", target: "node_neg_left", targetHandle: "in" },
        { _id: "e_neg_2", source: "node_speed_neg", sourceHandle: "val", target: "node_neg_left", targetHandle: "a" },
        
        { _id: "e_neg_3", source: "node_neg_left", sourceHandle: "out", target: "node_trans_left", targetHandle: "exec_in" },
        { _id: "e_neg_4", source: "node_neg_left", sourceHandle: "res", target: "node_trans_left", targetHandle: "dx" },

        { _id: "e_neg_5", source: "node_input_neg", sourceHandle: "out_move_up", target: "node_neg_up", targetHandle: "in" },
        { _id: "e_neg_6", source: "node_speed_neg", sourceHandle: "val", target: "node_neg_up", targetHandle: "a" },

        { _id: "e_neg_7", source: "node_neg_up", sourceHandle: "out", target: "node_trans_up", targetHandle: "exec_in" },
        { _id: "e_neg_8", source: "node_neg_up", sourceHandle: "res", target: "node_trans_up", targetHandle: "dy" },
      ]
    });

    console.log("Seeding Prefabs...");
    await Prefab.create({
      _id: prefabChestId,
      projectId,
      name: "Wooden Chest",
      thumbnailUrl: "",
      data: {
        tag: "interactable",
        layerId: "layer_hero",
        components: {
          Transform: { 
            x: 0, y: 0, scaleX: 2, scaleY: 2, rotation: 0, width: 50, height: 50,
            isRatioLocked: false // [ADDED]
          },
          SpriteRenderer: { assetId: assetDungeonId, source: { x: 128, y: 0, w: 32, h: 32 }, color: "#FFFFFF", opacity: 1 },
          BoxCollider: { isTrigger: false, offset: { x: 0, y: 0 }, size: { x: 32, y: 32 } }
        }
      }
    });

    console.log("Seeding Scenes...");
    await Scene.create({
      _id: sceneId,
      projectId,
      scriptId: "level_1_demo",
      name: "Level 1 Demo",
      settings: {
        backgroundColor: "#222222",
        tickRate: 60,
        worldBounds: { 
          x1: -960, 
          x2: 2880, 
          y1: -540, 
          y2: 1620,
          active: true
        },
        ui: {
          referenceWidth: 1920,
          referenceHeight: 1080,
          scaleMode: "constant",
          showUIBorder: true,
          active: true
        },
        grid: {
          width: 32,
          height: 32,
          color: "#ffffff",
          opacity: 0.1,
          visible: true,
          snap: true
        },
        showRulers: true
      },
      layers: [
        { _id: "layer_root", scriptId: "root", name: "Root" },
        { _id: "layer_hero", scriptId: "hero", name: "Hero" },
        { _id: "layer_ui", scriptId: "ui", name: "UI" }
      ],
      entities: [
        {
          _id: entTilemapId,
          scriptId: "level_ground",
          type: "entity",
          name: "Level Terrain",
          tag: "ground",
          layerId: "layer_hero",
          parentId: null,
          isActive: true,
          isVisible: true,
          components: {
            Transform: { 
              x: 0, y: 0, width: 640, height: 480, rotation: 0, scaleX: 1, scaleY: 1,
              isRatioLocked: false // [ADDED]
            },
            Tilemap: {
              tileWidth: 16,
              tileHeight: 16,
              width: 40,
              height: 30,
              assetId: assetDungeonId,
              opacity: 1,
              isSolid: true,
              data: Array(1200).fill(0).map((_, i) => i < 40 ? 8 : 0)
            }
          }
        },
        {
          _id: entItemId,
          scriptId: "inner_item_debug",
          type: "entity",
          name: "Hero Player",
          parentId: null,
          layerId: "layer_hero",
          isActive: true,
          isVisible: true,
          components: {
            Transform: { 
              x: 300, y: 300, width: 64, height: 64, pivotX: 0.5, pivotY: 0.5,
              isRatioLocked: false // [ADDED]
            },
            ShapeRenderer: { type: "rectangle", color: "#FF0000", width: 64, height: 64, opacity: 1 },
            ScriptController: {
              data: [
                { 
                  _id: "inst_player_move_001", 
                  assetId: scriptPlayerMoveId, 
                  isActive: true,
                  variables: { [varSpeedId]: 300 } 
                }
              ]
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