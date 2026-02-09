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

    // --- ID CONSTANTS ---
    const projectId = "project_dungeon_demo_01";
    const sceneId = "scene_level_1_demo";
    
    const fSpritesId = "folder_sprites_main";
    const fFontsId = "folder_fonts_main";
    const fScriptsId = "folder_scripts_main";
    
    const assetDungeonId = "dungeon_sheet_fixed_key";
    
    const scriptPlayerMoveId = "script_player_physics_move";
    const varSpeedId = "var_speed_001";
    
    const entPlayerId = "ent_hero_player";
    const entObstacleId = "ent_stone_wall"; 
    const entTriggerId = "ent_trigger_zone"; 

    console.log("Seeding Project...");
    await Project.create({
      _id: projectId,
      ownerId: "dev_2025",
      name: "Collision Event Demo",
      settings: { width: 1280, height: 720 },
      scenes: [sceneId],
      globalVariables: [],
      tags: ['Untagged', 'Player', 'Wall', 'Trigger'],
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

    // --- SCRIPT: PHYSICS MOVEMENT + COLLISION CHECK ---
    console.log("Seeding Player Script...");
    await Script.create({
      _id: scriptPlayerMoveId,
      projectId,
      name: "Player Move & Check",
      type: "component",
      exposedVariables: [
        { _id: varSpeedId, name: "Speed", type: "number", defaultValue: 250 }
      ],
      nodes: [
        // ... (Node Input & Variable Get tidak berubah) ...
        {
          _id: "node_input_pos",
          type: "event_advanced_key",
          position: { x: 50, y: 50 },
          settings: { headerTitle: 'POSITIVE INPUT', headerColor: '#C2185B', category: 'Input' },
          data: {
            mappings: [
              { _id: "move_right", key: "D", trigger: "hold", repeat: true },
              { _id: "move_down", key: "S", trigger: "hold", repeat: true }
            ]
          },
          inputs: [],
          outputs: [
            { _id: "out_move_right", label: "D (Right)", dataType: "execution", color: "#FFEB3B" },
            { _id: "out_move_down", label: "S (Down)", dataType: "execution", color: "#FFEB3B" }
          ]
        },
        {
          _id: "node_input_neg",
          type: "event_advanced_key",
          position: { x: 50, y: 500 },
          settings: { headerTitle: 'NEGATIVE INPUT', headerColor: '#C2185B', category: 'Input' },
          data: {
            mappings: [
              { _id: "move_left", key: "A", trigger: "hold", repeat: true },
              { _id: "move_up", key: "W", trigger: "hold", repeat: true }
            ]
          },
          inputs: [],
          outputs: [
            { _id: "out_move_left", label: "A (Left)", dataType: "execution", color: "#FFEB3B" },
            { _id: "out_move_up", label: "W (Up)", dataType: "execution", color: "#FFEB3B" }
          ]
        },
        {
          _id: "node_get_speed",
          type: "variable_get",
          position: { x: 50, y: 300 },
          settings: { headerTitle: 'GET SPEED', headerColor: '#424242', category: 'Variables' },
          data: { variableId: varSpeedId },
          inputs: [],
          outputs: [{ _id: "val", label: "Value", dataType: "number", color: "#B2FF59" }]
        },
        {
          _id: "node_negate_val",
          type: "math_negate",
          position: { x: 300, y: 600 },
          settings: { headerTitle: 'NEGATE', headerColor: '#00796B', category: 'Math' },
          data: {},
          inputs: [
             { _id: "in", label: "In", dataType: "execution", color: "#fff" },
             { _id: "a", label: "Value", dataType: "number", color: "#B2FF59" }
          ],
          outputs: [{ _id: "res", label: "Result", dataType: "number", color: "#B2FF59" }]
        },

        // ... (Node Physics Move tidak berubah) ...
        {
          _id: "node_phys_right",
          type: "move_and_slide",
          position: { x: 400, y: 50 },
          settings: { headerTitle: 'MOVE RIGHT', headerColor: '#F57C00', category: 'Physics' },
          data: {},
          inputs: [
            { _id: "exec_in", label: "In", dataType: "execution", color: "#ffffff" },
            { _id: "target", label: "Target", dataType: "string", color: "#E040FB" },
            { _id: "vel_x", label: "Vel X", dataType: "number", color: "#69F0AE", defaultValue: 0 },
            { _id: "vel_y", label: "Vel Y", dataType: "number", color: "#69F0AE", defaultValue: 0 }
          ],
          outputs: [{ _id: "out", label: "Out", dataType: "execution", color: "#ffffff" }]
        },
        {
          _id: "node_phys_down",
          type: "move_and_slide",
          position: { x: 400, y: 250 },
          settings: { headerTitle: 'MOVE DOWN', headerColor: '#F57C00', category: 'Physics' },
          data: {},
          inputs: [
            { _id: "exec_in", label: "In", dataType: "execution", color: "#ffffff" },
            { _id: "target", label: "Target", dataType: "string", color: "#E040FB" },
            { _id: "vel_x", label: "Vel X", dataType: "number", color: "#69F0AE", defaultValue: 0 },
            { _id: "vel_y", label: "Vel Y", dataType: "number", color: "#69F0AE", defaultValue: 0 }
          ],
          outputs: [{ _id: "out", label: "Out", dataType: "execution", color: "#ffffff" }]
        },
        {
          _id: "node_phys_left",
          type: "move_and_slide",
          position: { x: 600, y: 500 },
          settings: { headerTitle: 'MOVE LEFT', headerColor: '#F57C00', category: 'Physics' },
          data: {},
          inputs: [
            { _id: "exec_in", label: "In", dataType: "execution", color: "#ffffff" },
            { _id: "target", label: "Target", dataType: "string", color: "#E040FB" },
            { _id: "vel_x", label: "Vel X", dataType: "number", color: "#69F0AE", defaultValue: 0 },
            { _id: "vel_y", label: "Vel Y", dataType: "number", color: "#69F0AE", defaultValue: 0 }
          ],
          outputs: [{ _id: "out", label: "Out", dataType: "execution", color: "#ffffff" }]
        },
        {
          _id: "node_phys_up",
          type: "move_and_slide",
          position: { x: 600, y: 700 },
          settings: { headerTitle: 'MOVE UP', headerColor: '#F57C00', category: 'Physics' },
          data: {},
          inputs: [
            { _id: "exec_in", label: "In", dataType: "execution", color: "#ffffff" },
            { _id: "target", label: "Target", dataType: "string", color: "#E040FB" },
            { _id: "vel_x", label: "Vel X", dataType: "number", color: "#69F0AE", defaultValue: 0 },
            { _id: "vel_y", label: "Vel Y", dataType: "number", color: "#69F0AE", defaultValue: 0 }
          ],
          outputs: [{ _id: "out", label: "Out", dataType: "execution", color: "#ffffff" }]
        },

        // --- COLLISION LOGIC ---
        {
          _id: "node_tick",
          type: "event_tick",
          position: { x: 800, y: 50 },
          settings: { headerTitle: 'ON UPDATE', headerColor: '#2196F3', category: 'Events' },
          data: {},
          inputs: [],
          outputs: [{ _id: "out", label: "Tick", dataType: "execution", color: "#ffffff" }]
        },
        
        {
          _id: "node_check_col",
          type: "check_collision",
          position: { x: 1000, y: 50 },
          settings: { headerTitle: 'CHECK HIT', headerColor: '#E65100', category: 'Physics' },
          data: {},
          inputs: [
             { _id: "target", label: "Target", dataType: "string", color: "#E040FB" }
          ],
          outputs: [
             { _id: "is_colliding", label: "Is Hit?", dataType: "boolean", color: "#FF5252" },
             { _id: "hit_id", label: "Hit ID", dataType: "string", color: "#E040FB" }
          ]
        },

        {
          _id: "node_branch",
          type: "logic_branch",
          position: { x: 1250, y: 50 },
          settings: { headerTitle: 'IF HIT', headerColor: '#607D8B', category: 'Logic' },
          data: {},
          inputs: [
             { _id: "exec_in", label: "In", dataType: "execution", color: "#ffffff" },
             { _id: "condition", label: "Condition", dataType: "boolean", color: "#4CAF50" }
          ],
          outputs: [
             { _id: "true", label: "True", dataType: "execution", color: "#4CAF50" },
             { _id: "false", label: "False", dataType: "execution", color: "#F44336" }
          ]
        },

        // -----------------------------------------------------------------------
        // [UPDATED] NODE NOTIFICATION - Agar kompatibel dengan kode lama
        // -----------------------------------------------------------------------
        {
          _id: "node_notif",
          type: "ui_notification",
          position: { x: 1450, y: 50 },
          settings: { headerTitle: 'SHOW ALERT', headerColor: '#009688', category: 'Interface' },
          
          // [CHANGE 1] Data diset key 'msg' agar 'getInputValue(node, "msg")' punya fallback
          data: { 
             msg: 'You entered the Trigger Zone!', 
             duration: 2.0 
          }, 
          
          inputs: [
             { _id: "exec_in", label: "In", dataType: "execution", color: "#ffffff" },
             
             // [CHANGE 2] ID Input diganti jadi 'msg' (sesuai kode getInputValue)
             { _id: "msg", label: "Message", dataType: "string", color: "#FFB74D" } 
          ],
          outputs: [
             // [CHANGE 3] ID Output diganti jadi 'out' (sesuai kode executeFlow)
             { _id: "out", label: "Out", dataType: "execution", color: "#ffffff" }
          ]
        }
      ],

      edges: [
        { _id: "e1", source: "node_input_pos", sourceHandle: "out_move_right", target: "node_phys_right", targetHandle: "exec_in" },
        { _id: "e2", source: "node_get_speed", sourceHandle: "val", target: "node_phys_right", targetHandle: "vel_x" },
        { _id: "e3", source: "node_input_pos", sourceHandle: "out_move_down", target: "node_phys_down", targetHandle: "exec_in" },
        { _id: "e4", source: "node_get_speed", sourceHandle: "val", target: "node_phys_down", targetHandle: "vel_y" },
        { _id: "e_neg_val", source: "node_get_speed", sourceHandle: "val", target: "node_negate_val", targetHandle: "a" },
        { _id: "e5", source: "node_input_neg", sourceHandle: "out_move_left", target: "node_phys_left", targetHandle: "exec_in" },
        { _id: "e6", source: "node_negate_val", sourceHandle: "res", target: "node_phys_left", targetHandle: "vel_x" },
        { _id: "e7", source: "node_input_neg", sourceHandle: "out_move_up", target: "node_phys_up", targetHandle: "exec_in" },
        { _id: "e8", source: "node_negate_val", sourceHandle: "res", target: "node_phys_up", targetHandle: "vel_y" },

        // Logic Wiring
        { _id: "e_tick_branch", source: "node_tick", sourceHandle: "out", target: "node_branch", targetHandle: "exec_in" },
        { _id: "e_check_cond", source: "node_check_col", sourceHandle: "is_colliding", target: "node_branch", targetHandle: "condition" },
        { _id: "e_branch_notif", source: "node_branch", sourceHandle: "true", target: "node_notif", targetHandle: "exec_in" }
      ]
    });

    console.log("Seeding Scenes & Entities...");
    await Scene.create({
      _id: sceneId,
      projectId,
      scriptId: "level_1_demo",
      name: "Collision Test Level",
      settings: {
        backgroundColor: "#222222",
        tickRate: 60,
        worldBounds: { x1: -1000, x2: 1000, y1: -1000, y2: 1000, active: true },
        ui: { referenceWidth: 1280, referenceHeight: 720, scaleMode: "constant", showUIBorder: true, active: true },
        grid: { width: 32, height: 32, color: "#ffffff", opacity: 0.1, visible: true, snap: true },
        showRulers: true
      },
      layers: [
        { _id: "layer_hero", scriptId: "hero", name: "Game Layer" }
      ],
      entities: [
        // 1. ENTITY: HERO PLAYER
        {
          _id: entPlayerId,
          scriptId: "hero_player_obj",
          type: "entity",
          name: "Hero Player",
          layerId: "layer_hero",
          parentId: null,
          isActive: true,
          isVisible: true,
          components: {
            Transform: { x: 200, y: 360, width: 64, height: 64, isRatioLocked: false },
            ShapeRenderer: { type: "rectangle", color: "#2196F3", width: 64, height: 64, opacity: 1 },
            Collider: { 
              type: "solid",
              enabled: true,
              offsetX: 0, offsetY: 0,
              width: 64, height: 64
            },
            ScriptController: {
              data: [
                { 
                  _id: "inst_move", 
                  assetId: scriptPlayerMoveId, 
                  isActive: true, 
                  variables: { [varSpeedId]: 300 } 
                }
              ]
            }
          }
        },

        // 2. ENTITY: SOLID WALL
        {
          _id: entObstacleId,
          scriptId: "obstacle_wall_01",
          type: "entity",
          name: "Solid Wall",
          layerId: "layer_hero",
          parentId: null,
          isActive: true,
          isVisible: true,
          components: {
            Transform: { x: 500, y: 200, width: 64, height: 300, isRatioLocked: false },
            ShapeRenderer: { type: "rectangle", color: "#757575", width: 64, height: 300, opacity: 1 },
            Collider: { 
              type: "solid",
              enabled: true,
              offsetX: 0, offsetY: 0,
              width: 64, height: 300
            }
          }
        },

        // 3. ENTITY: TRIGGER ZONE
        {
          _id: entTriggerId,
          scriptId: "trigger_zone_01",
          type: "entity",
          name: "Trigger Zone",
          layerId: "layer_hero",
          parentId: null,
          isActive: true,
          isVisible: true,
          components: {
            Transform: { x: 800, y: 300, width: 200, height: 200, isRatioLocked: false },
            ShapeRenderer: { type: "rectangle", color: "#FFEB3B", width: 200, height: 200, opacity: 0.3 },
            Collider: { 
              type: "trigger", // Menggunakan tipe trigger
              enabled: true,
              offsetX: 0, offsetY: 0,
              width: 200, height: 200
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