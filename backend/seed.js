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

    // --- 1. PROJECT ---
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

    // --- 2. FOLDERS ---
    console.log("Seeding Folders...");
    await Folder.create([
      { _id: fSpritesId, projectId, name: "Sprites" },
      { _id: fFontsId, projectId, name: "Fonts" },
      { _id: fScriptsId, projectId, name: "Scripts" }
    ]);

    // --- 3. ASSETS ---
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

    // --- 4. SCRIPTS ---
    console.log("Seeding Scripts...");

    await Script.create({
      _id: scriptPlayerMoveId,
      projectId,
      name: "Player Movement",
      type: "component",
      exposedVariables: [
        { _id: varSpeedId, name: "Speed", type: "Number", defaultValue: 10 }
      ],
      nodes: [
        // 1. KEYBOARD INPUT
        {
          _id: "node_input",
          type: "event_key_press",
          position: { x: 50, y: 50 },
          settings: { headerTitle: 'Keyboard Input', headerColor: '#C2185B', category: 'Events' },
          data: { key: 'Space' },
          inputs: [],
          outputs: [{ _id: 'out', label: 'Pressed', dataType: 'execution', color: '#fff' }]
        },
        // 2. GET SPEED
        {
          _id: "node_get_speed",
          type: "variable_get", 
          position: { x: 50, y: 200 },
          settings: { headerTitle: 'Get Speed', headerColor: '#00C853', category: 'Variables' },
          data: { variableId: varSpeedId },
          inputs: [],
          outputs: [{ _id: 'val', label: 'Value', dataType: 'number', color: '#B2FF59' }]
        },
        // 3. GET TRANSFORM (Target: String ID)
        {
          _id: "node_get_trans",
          type: "get_transform",
          position: { x: 50, y: 350 },
          settings: { headerTitle: 'Get Transform', headerColor: '#2E7D32', category: 'Game Object' },
          inputs: [
             // UPDATE: DataType 'string', Color '#E040FB'
            { _id: 'target', label: 'Target ID (Self)', dataType: 'string', color: '#E040FB' }
          ],
          outputs: [
            { _id: 'x', label: 'X', dataType: 'number', color: '#69F0AE' },
            { _id: 'y', label: 'Y', dataType: 'number', color: '#69F0AE' },
            { _id: 'rotation', label: 'Rotation', dataType: 'number', color: '#B2FF59' },
            { _id: 'width', label: 'Width', dataType: 'number', color: '#40C4FF' },
            { _id: 'height', label: 'Height', dataType: 'number', color: '#40C4FF' },
            { _id: 'pivotX', label: 'Pivot X', dataType: 'number', color: '#FFB74D' },
            { _id: 'pivotY', label: 'Pivot Y', dataType: 'number', color: '#FFB74D' }
          ]
        },
        // 4. ADD
        {
          _id: "node_add",
          type: "math_add",
          position: { x: 350, y: 200 },
          settings: { headerTitle: 'Add', headerColor: '#00796B', category: 'Math' },
          inputs: [
            { _id: 'in', label: 'In', dataType: 'execution', color: '#fff' },
            { _id: 'a', label: 'A', dataType: 'number', color: '#B2FF59' },
            { _id: 'b', label: 'B', dataType: 'number', color: '#B2FF59' }
          ],
          outputs: [
            { _id: 'out', label: 'Trigger', dataType: 'execution', color: '#fff' },
            { _id: 'res', label: 'Result', dataType: 'number', color: '#B2FF59' }
          ]
        },
        {
          _id: "node_set_trans",
          type: "set_transform",
          position: { x: 600, y: 200 },
          settings: { headerTitle: 'Set Transform', headerColor: '#2E7D32', category: 'Game Object' },
          inputs: [
            { _id: 'in', label: 'In', dataType: 'execution', color: '#fff' },
            { _id: 'target', label: 'Target ID (Self)', dataType: 'string', color: '#E040FB' },
            
            { _id: 'x', label: 'X', dataType: 'number', color: '#69F0AE' },
            { _id: 'y', label: 'Y', dataType: 'number', color: '#69F0AE' },
            { _id: 'rotation', label: 'Rotation', dataType: 'number', color: '#B2FF59' },
            { _id: 'width', label: 'Width', dataType: 'number', color: '#40C4FF' },
            { _id: 'height', label: 'Height', dataType: 'number', color: '#40C4FF' },
            { _id: 'pivotX', label: 'Pivot X', dataType: 'number', color: '#FFB74D' },
            { _id: 'pivotY', label: 'Pivot Y', dataType: 'number', color: '#FFB74D' }
          ],
          outputs: [
            { _id: 'out', label: 'Out', dataType: 'execution', color: '#fff' },
            // UPDATED: Menambahkan output lengkap agar bisa di-chain ke Format String
            { _id: 'x', label: 'X', dataType: 'number', color: '#69F0AE' },
            { _id: 'y', label: 'Y', dataType: 'number', color: '#69F0AE' },
            { _id: 'rotation', label: 'Rotation', dataType: 'number', color: '#B2FF59' },
            { _id: 'width', label: 'Width', dataType: 'number', color: '#40C4FF' },
            { _id: 'height', label: 'Height', dataType: 'number', color: '#40C4FF' },
            { _id: 'pivotX', label: 'Pivot X', dataType: 'number', color: '#FFB74D' },
            { _id: 'pivotY', label: 'Pivot Y', dataType: 'number', color: '#FFB74D' }
          ]
        },
        // 6. FORMAT STRING
        {
          _id: "node_fmt_string",
          type: "format_string",
          position: { x: 900, y: 400 },
          settings: { headerTitle: 'Format String', headerColor: '#F57C00', category: 'String' },
          data: { 
            format: 'Pos: {0}, {1} | Rot: {2}',
            allowDynamicInputs: true
          },
          inputs: [
            { _id: '0', label: '{0}', dataType: 'any', color: '#fff' },
            { _id: '1', label: '{1}', dataType: 'any', color: '#fff' },
            { _id: '2', label: '{2}', dataType: 'any', color: '#fff' },
            { _id: '3', label: '{3}', dataType: 'any', color: '#fff' },
            { _id: '4', label: '{4}', dataType: 'any', color: '#fff' },
            { _id: '5', label: '{5}', dataType: 'any', color: '#fff' },
            { _id: '6', label: '{6}', dataType: 'any', color: '#fff' }
          ],
          outputs: [
            { _id: 'out', label: 'Result', dataType: 'string', color: '#FFB74D' }
          ]
        },
        // 7. NOTIFICATION
        {
          _id: "node_notification",
          type: "ui_notification",
          position: { x: 1200, y: 200 },
          settings: { headerTitle: 'Notification', headerColor: '#37474F', category: 'UI' },
          data: { message: '' },
          inputs: [
            { _id: 'in', label: 'In', dataType: 'execution', color: '#fff' },
            { _id: 'msg', label: 'Message', dataType: 'string', color: '#E040FB' }
          ],
          outputs: [
            { _id: 'out', label: 'Out', dataType: 'execution', color: '#fff' }
          ]
        }
      ],
      edges: [
        // Execution
        { _id: "e1", source: "node_input", sourceHandle: "out", target: "node_add", targetHandle: "in" },
        { _id: "e2", source: "node_add", sourceHandle: "out", target: "node_set_trans", targetHandle: "in" },
        { _id: "e3", source: "node_set_trans", sourceHandle: "out", target: "node_notification", targetHandle: "in" },

        // Logic
        { _id: "d1", source: "node_get_speed", sourceHandle: "val", target: "node_add", targetHandle: "a" },
        { _id: "d2", source: "node_get_trans", sourceHandle: "x", target: "node_add", targetHandle: "b" },
        { _id: "d3", source: "node_add", sourceHandle: "res", target: "node_set_trans", targetHandle: "x" },

        // Format String
        { _id: "f0", source: "node_set_trans", sourceHandle: "x", target: "node_fmt_string", targetHandle: "0" },
        { _id: "f1", source: "node_set_trans", sourceHandle: "y", target: "node_fmt_string", targetHandle: "1" },
        { _id: "f2", source: "node_set_trans", sourceHandle: "rotation", target: "node_fmt_string", targetHandle: "2" },
        { _id: "f3", source: "node_set_trans", sourceHandle: "width", target: "node_fmt_string", targetHandle: "3" },
        { _id: "f4", source: "node_set_trans", sourceHandle: "height", target: "node_fmt_string", targetHandle: "4" },
        { _id: "f5", source: "node_set_trans", sourceHandle: "pivotX", target: "node_fmt_string", targetHandle: "5" },
        { _id: "f6", source: "node_set_trans", sourceHandle: "pivotY", target: "node_fmt_string", targetHandle: "6" },

        // Notification
        { _id: "msg1", source: "node_fmt_string", sourceHandle: "out", target: "node_notification", targetHandle: "msg" }
      ]
    });

    // --- 5. PREFABS ---
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
          Transform: { x: 0, y: 0, scaleX: 2, scaleY: 2, rotation: 0, width: 50, height: 50 },
          SpriteRenderer: { assetId: assetDungeonId, source: { x: 128, y: 0, w: 32, h: 32 }, color: "#FFFFFF", opacity: 1 },
          BoxCollider: { isTrigger: false, offset: { x: 0, y: 0 }, size: { x: 32, y: 32 } }
        }
      }
    });

    // --- 6. SCENES ---
    console.log("Seeding Scenes...");
    await Scene.create({
      _id: sceneId,
      projectId,
      scriptId: "level_1_demo",
      name: "Level 1 Demo",
      settings: {
        backgroundColor: "#222222",
        worldBounds: { x: 0, y: 0, width: 2000, height: 2000 }
      },
      layers: [
        { _id: "layer_ui", scriptId: "ui", name: "UI" },
        { _id: "layer_root", scriptId: "root", name: "Root" },
        { _id: "layer_hero", scriptId: "hero", name: "Hero" }
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
            Transform: { x: 0, y: 0, width: 640, height: 480, rotation: 0, scaleX: 1, scaleY: 1 },
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
            Transform: { x: 50, y: 50, width: 64, height: 64, pivotX: 0.5, pivotY: 1.0 },
            ShapeRenderer: { type: "rectangle", color: "#FF0000", width: 100, height: 100, opacity: 1 },
            ScriptController: {
              data: [
                {
                  _id: "inst_player_move_001", 
                  assetId: scriptPlayerMoveId, 
                  isActive: true,
                  variables: { [varSpeedId]: 50 } 
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