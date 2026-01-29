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
        { _id: varSpeedId, name: "Speed", type: "number", defaultValue: 5 }
      ],
      nodes: [
        {
          _id: "node_input_wasd",
          type: "event_advanced_key",
          position: { x: 50, y: 50 },
          settings: { headerTitle: 'Input Mapper', headerColor: '#C2185B', category: 'Keyboard Events' },
          data: {
            mappings: [
              { _id: "move_up", key: "W", trigger: "hold", threshold: 0, repeat: true },
              { _id: "move_left", key: "A", trigger: "hold", threshold: 0, repeat: true },
              { _id: "move_down", key: "S", trigger: "hold", threshold: 0, repeat: true },
              { _id: "move_right", key: "D", trigger: "hold", threshold: 0, repeat: true }
            ]
          },
          inputs: [],
          outputs: [
            { _id: "out_move_up", label: "W (Up)", dataType: "execution", color: "#FFEB3B" },
            { _id: "out_move_left", label: "A (Left)", dataType: "execution", color: "#FFEB3B" },
            { _id: "out_move_down", label: "S (Down)", dataType: "execution", color: "#FFEB3B" },
            { _id: "out_move_right", label: "D (Right)", dataType: "execution", color: "#FFEB3B" }
          ]
        },

        {
          _id: "node_get_speed",
          type: "variable_get",
          position: { x: 50, y: 300 },
          settings: { headerTitle: 'Get Speed', headerColor: '#00C853', category: 'Variables' },
          data: { variableId: varSpeedId },
          inputs: [],
          outputs: [
            { _id: "val", label: "Value", dataType: "number", color: "#B2FF59" }
          ]
        },

        {
          _id: "node_get_trans",
          type: "get_transform",
          position: { x: 50, y: 450 },
          settings: { headerTitle: 'Get Transform', headerColor: '#2E7D32', category: 'Transform' },
          data: {
             propertyOptions: [
                { value: 'x', label: 'Position X', type: 'number', color: '#69F0AE' },
                { value: 'y', label: 'Position Y', type: 'number', color: '#69F0AE' }
             ]
          },
          inputs: [
            { _id: "in_target", label: "Target ID (Self)", dataType: "string", color: "#E040FB" }
          ],
          outputs: [
            { _id: "x", label: "Position X", dataType: "number", color: "#69F0AE" },
            { _id: "y", label: "Position Y", dataType: "number", color: "#69F0AE" }
          ]
        },
        {
          _id: "node_add_x",
          type: "math_add",
          position: { x: 400, y: 50 },
          settings: { headerTitle: 'Calc Right (+X)', headerColor: '#00796B', category: 'Math' },
          data: {},
          inputs: [
            { _id: "in", label: "In", dataType: "execution", color: "#fff" },
            { _id: "a", label: "Current X", dataType: "number", color: "#B2FF59" },
            { _id: "b", label: "Speed", dataType: "number", color: "#B2FF59" }
          ],
          outputs: [
            { _id: "out", label: "Trigger", dataType: "execution", color: "#fff" },
            { _id: "res", label: "Result", dataType: "number", color: "#B2FF59" }
          ]
        },

        {
          _id: "node_sub_x",
          type: "math_subtract",
          position: { x: 400, y: 250 },
          settings: { headerTitle: 'Calc Left (-X)', headerColor: '#00796B', category: 'Math' },
          data: {},
          inputs: [
            { _id: "in", label: "In", dataType: "execution", color: "#fff" },
            { _id: "a", label: "Current X", dataType: "number", color: "#B2FF59" },
            { _id: "b", label: "Speed", dataType: "number", color: "#B2FF59" }
          ],
          outputs: [
            { _id: "out", label: "Trigger", dataType: "execution", color: "#fff" },
            { _id: "res", label: "Result", dataType: "number", color: "#B2FF59" }
          ]
        },

        {
          _id: "node_add_y",
          type: "math_add",
          position: { x: 400, y: 450 },
          settings: { headerTitle: 'Calc Down (+Y)', headerColor: '#00796B', category: 'Math' },
          data: {},
          inputs: [
            { _id: "in", label: "In", dataType: "execution", color: "#fff" },
            { _id: "a", label: "Current Y", dataType: "number", color: "#B2FF59" },
            { _id: "b", label: "Speed", dataType: "number", color: "#B2FF59" }
          ],
          outputs: [
            { _id: "out", label: "Trigger", dataType: "execution", color: "#fff" },
            { _id: "res", label: "Result", dataType: "number", color: "#B2FF59" }
          ]
        },

        {
          _id: "node_sub_y",
          type: "math_subtract",
          position: { x: 400, y: 650 },
          settings: { headerTitle: 'Calc Up (-Y)', headerColor: '#00796B', category: 'Math' },
          data: {},
          inputs: [
            { _id: "in", label: "In", dataType: "execution", color: "#fff" },
            { _id: "a", label: "Current Y", dataType: "number", color: "#B2FF59" },
            { _id: "b", label: "Speed", dataType: "number", color: "#B2FF59" }
          ],
          outputs: [
            { _id: "out", label: "Trigger", dataType: "execution", color: "#fff" },
            { _id: "res", label: "Result", dataType: "number", color: "#B2FF59" }
          ]
        },

        {
          _id: "node_set_right",
          type: "set_transform",
          position: { x: 800, y: 50 },
          settings: { headerTitle: 'Set Right', headerColor: '#2E7D32', category: 'Transform' },
          data: { propertyOptions: [{ value: 'x', label: 'X' }] },
          inputs: [
            { _id: "exec_in", label: "In", dataType: "execution", color: "#ffffff" },
            { _id: "in_target", label: "Target", dataType: "string", color: "#E040FB" },
            { _id: "x", label: "Position X", dataType: "number", color: "#69F0AE" }
          ],
          outputs: [{ _id: "exec_out", label: "Out", dataType: "execution", color: "#ffffff" }]
        },

        {
          _id: "node_set_left",
          type: "set_transform",
          position: { x: 800, y: 250 },
          settings: { headerTitle: 'Set Left', headerColor: '#2E7D32', category: 'Transform' },
          data: { propertyOptions: [{ value: 'x', label: 'X' }] },
          inputs: [
            { _id: "exec_in", label: "In", dataType: "execution", color: "#ffffff" },
            { _id: "in_target", label: "Target", dataType: "string", color: "#E040FB" },
            { _id: "x", label: "Position X", dataType: "number", color: "#69F0AE" }
          ],
          outputs: [{ _id: "exec_out", label: "Out", dataType: "execution", color: "#ffffff" }]
        },

        {
          _id: "node_set_down",
          type: "set_transform",
          position: { x: 800, y: 450 },
          settings: { headerTitle: 'Set Down', headerColor: '#2E7D32', category: 'Transform' },
          data: { propertyOptions: [{ value: 'y', label: 'Y' }] },
          inputs: [
            { _id: "exec_in", label: "In", dataType: "execution", color: "#ffffff" },
            { _id: "in_target", label: "Target", dataType: "string", color: "#E040FB" },
            { _id: "y", label: "Position Y", dataType: "number", color: "#69F0AE" }
          ],
          outputs: [{ _id: "exec_out", label: "Out", dataType: "execution", color: "#ffffff" }]
        },

        {
          _id: "node_set_up",
          type: "set_transform",
          position: { x: 800, y: 650 },
          settings: { headerTitle: 'Set Up', headerColor: '#2E7D32', category: 'Transform' },
          data: { propertyOptions: [{ value: 'y', label: 'Y' }] },
          inputs: [
            { _id: "exec_in", label: "In", dataType: "execution", color: "#ffffff" },
            { _id: "in_target", label: "Target", dataType: "string", color: "#E040FB" },
            { _id: "y", label: "Position Y", dataType: "number", color: "#69F0AE" }
          ],
          outputs: [{ _id: "exec_out", label: "Out", dataType: "execution", color: "#ffffff" }]
        }
      ],

      edges: [
        { _id: "d1", source: "node_get_speed", sourceHandle: "val", target: "node_add_x", targetHandle: "b" },
        { _id: "d2", source: "node_get_speed", sourceHandle: "val", target: "node_sub_x", targetHandle: "b" },
        { _id: "d3", source: "node_get_speed", sourceHandle: "val", target: "node_add_y", targetHandle: "b" },
        { _id: "d4", source: "node_get_speed", sourceHandle: "val", target: "node_sub_y", targetHandle: "b" },

        { _id: "d5", source: "node_get_trans", sourceHandle: "x", target: "node_add_x", targetHandle: "a" },
        { _id: "d6", source: "node_get_trans", sourceHandle: "x", target: "node_sub_x", targetHandle: "a" },

        { _id: "d7", source: "node_get_trans", sourceHandle: "y", target: "node_add_y", targetHandle: "a" },
        { _id: "d8", source: "node_get_trans", sourceHandle: "y", target: "node_sub_y", targetHandle: "a" },

        { _id: "e1", source: "node_input_wasd", sourceHandle: "out_move_right", target: "node_add_x", targetHandle: "in" },
        { _id: "e2", source: "node_add_x", sourceHandle: "out", target: "node_set_right", targetHandle: "exec_in" },
        { _id: "r1", source: "node_add_x", sourceHandle: "res", target: "node_set_right", targetHandle: "x" },

        { _id: "e3", source: "node_input_wasd", sourceHandle: "out_move_left", target: "node_sub_x", targetHandle: "in" },
        { _id: "e4", source: "node_sub_x", sourceHandle: "out", target: "node_set_left", targetHandle: "exec_in" },
        { _id: "r2", source: "node_sub_x", sourceHandle: "res", target: "node_set_left", targetHandle: "x" },

        { _id: "e5", source: "node_input_wasd", sourceHandle: "out_move_down", target: "node_add_y", targetHandle: "in" },
        { _id: "e6", source: "node_add_y", sourceHandle: "out", target: "node_set_down", targetHandle: "exec_in" },
        { _id: "r3", source: "node_add_y", sourceHandle: "res", target: "node_set_down", targetHandle: "y" },

        { _id: "e7", source: "node_input_wasd", sourceHandle: "out_move_up", target: "node_sub_y", targetHandle: "in" },
        { _id: "e8", source: "node_sub_y", sourceHandle: "out", target: "node_set_up", targetHandle: "exec_in" },
        { _id: "r4", source: "node_sub_y", sourceHandle: "res", target: "node_set_up", targetHandle: "y" }
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
          Transform: { x: 0, y: 0, scaleX: 2, scaleY: 2, rotation: 0, width: 50, height: 50 },
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
            Transform: { x: 300, y: 300, width: 64, height: 64, pivotX: 0.5, pivotY: 0.5 },
            ShapeRenderer: { type: "rectangle", color: "#FF0000", width: 64, height: 64, opacity: 1 },
            ScriptController: {
              data: [
                {
                  _id: "inst_player_move_001", 
                  assetId: scriptPlayerMoveId, 
                  isActive: true,
                  variables: { [varSpeedId]: 5 } 
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