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

    await mongoose.connect(process.env.MONGO_URI);
    
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
    const scriptNpcId = "script_all_types_demo";
    
    const prefabChestId = "prefab_chest_001";
    const entTilemapId = "ent_main_tilemap";
    const entItemId = "ent_item_inner";

    await Project.create({
      _id: projectId,
      ownerId: "dev_2025",
      name: "Dungeon Project",
      settings: { width: 1280, height: 720 },
      scenes: [sceneId]
    });

    await Folder.create([
      { _id: fSpritesId, projectId, name: "Sprites" },
      { _id: fFontsId, projectId, name: "Fonts" },
      { _id: fScriptsId, projectId, name: "Scripts" }
    ]);

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

    await Script.create({
      _id: scriptPlayerMoveId,
      projectId,
      name: "Player Movement",
      type: "component",
      exposedVariables: [
        { name: "Speed", type: "Number", defaultValue: 10 }
      ],
      nodes: [
        {
          _id: "node_event_right",
          type: "event_key_press",
          position: { x: 100, y: 100 },
          settings: { 
            headerTitle: "On Key Press", 
            headerColor: "#4CAF50", 
            category: "Events",
            description: "Triggers when arrow key is pressed", 
            visibleDataFields: ["key"] 
          },
          inputs: [],
          outputs: [{ _id: "port_exec_out", label: "Flow", type: "execution", dataType: "execution", color: "#ffffff", enabled: true }],
          data: { key: "ArrowRight" }
        },
        {
          _id: "node_move_right",
          type: "action_translate",
          position: { x: 400, y: 100 },
          settings: { 
            headerTitle: "Move Entity", 
            headerColor: "#2196F3", 
            category: "Physics",
            description: "Moves the entity by X/Y", 
            visibleDataFields: ["x", "y"] 
          },
          inputs: [{ _id: "port_exec_in", label: "In", type: "execution", dataType: "execution", color: "#ffffff", enabled: true }],
          outputs: [{ _id: "port_exec_next", label: "Next", type: "execution", dataType: "execution", color: "#ffffff", enabled: true }],
          data: { x: 10, y: 0 }
        }
      ],
      edges: [
        { _id: "edge_1", source: "node_event_right", sourceHandle: "port_exec_out", target: "node_move_right", targetHandle: "port_exec_in" }
      ]
    });

    await Script.create({
      _id: scriptNpcId,
      projectId: projectId,
      name: "NPC Dialogue System (All Types)",
      type: "scene_logic",
      exposedVariables: [],
      nodes: [
        {
          _id: "n1_interact",
          type: "event_on_interact",
          position: { x: 50, y: 300 },
          settings: { headerTitle: "On Interact NPC", headerColor: "#E91E63", category: "Events" },
          inputs: [],
          outputs: [{ _id: "out_exec", label: "Start", type: "execution", dataType: "execution", color: "#ffffff" }],
          data: {}
        },
        {
          _id: "n2_player_data",
          type: "data_player_info",
          position: { x: 300, y: 100 },
          settings: { headerTitle: "Get Player Info", headerColor: "#9C27B0", category: "Data", description: "Provides player stats" },
          inputs: [],
          outputs: [
            { _id: "out_name", label: "Player Name", type: "string", dataType: "string", color: "#9c27b0" },
            { _id: "out_has_quest", label: "Is Quest Done?", type: "boolean", dataType: "boolean", color: "#f44336" }
          ],
          data: { debugName: "Hero_01" }
        },
        {
          _id: "n3_branch",
          type: "logic_branch",
          position: { x: 350, y: 300 },
          settings: { headerTitle: "Check Quest State", headerColor: "#FF9800", category: "Logic" },
          inputs: [
            { _id: "in_exec", label: "In", color: "#ffffff", dataType: "execution" },
            { _id: "in_cond", label: "Condition", color: "#f44336", dataType: "boolean" }
          ],
          outputs: [
            { _id: "out_true", label: "True (Done)", type: "execution", dataType: "execution", color: "#ffffff" },
            { _id: "out_false", label: "False (Not Yet)", type: "execution", dataType: "execution", color: "#ffffff" }
          ],
          data: {}
        },
        {
          _id: "n4_world_data",
          type: "data_world_info",
          position: { x: 300, y: 550 },
          settings: { headerTitle: "Get NPC & Reward Info", headerColor: "#2196F3", category: "Data" },
          inputs: [],
          outputs: [
            { _id: "out_npc_pos", label: "NPC Look Pos", type: "vector", dataType: "vector", color: "#FFC107" },
            { _id: "out_reward_item", label: "Reward Item Ref", type: "object", dataType: "object", color: "#2196f3" }
          ],
          data: { rewardId: "sword_epic_01" }
        },
        {
          _id: "n5_calc_exp",
          type: "math_formula",
          position: { x: 700, y: 100 },
          settings: { headerTitle: "Calc EXP Reward", headerColor: "#009688", category: "Math", visibleDataFields: ["base", "bonus"] },
          inputs: [],
          outputs: [{ _id: "out_total_exp", label: "Total Exp", type: "number", dataType: "number", color: "#00e676" }],
          data: { base: 500, bonus: 1.2 }
        },
        {
          _id: "n6_show_dialogue",
          type: "ui_show_advanced_dialogue",
          position: { x: 1000, y: 250 },
          settings: { headerTitle: "Show Final Dialogue", headerColor: "#607D8B", category: "UI", description: "Displays complex UI with all data types.", visibleDataFields: ["message"] },
          inputs: [
            { _id: "in_exec", label: "Show", type: "execution", dataType: "execution", color: "#ffffff" },
            { _id: "in_name", label: "Target Name", type: "string", dataType: "string", color: "#9c27b0" },
            { _id: "in_cond", label: "Is Happy?", type: "boolean", dataType: "boolean", color: "#f44336" },
            { _id: "in_exp", label: "Exp Amount", type: "number", dataType: "number", color: "#00e676" },
            { _id: "in_look", label: "Look At", type: "vector", dataType: "vector", color: "#FFC107" },
            { _id: "in_item", label: "Give Item", type: "object", dataType: "object", color: "#2196f3" }
          ],
          outputs: [{ _id: "out_done", label: "On Closed", type: "execution", dataType: "execution", color: "#ffffff" }],
          data: { message: "Thanks for helping, {name}! Here is {exp} exp and a {item}." }
        },
        {
          _id: "n7_simple_dialogue",
          type: "ui_message",
          position: { x: 700, y: 450 },
          settings: { headerTitle: "Simple Message", headerColor: "#607D8B", category: "UI" },
          inputs: [
            { _id: "in_exec", label: "Show", color: "#ffffff", dataType: "execution" },
            { _id: "in_name", label: "Name", color: "#9c27b0", dataType: "string" }
          ],
          outputs: [],
          data: { msg: "Please finish the quest first, {name}." }
        }
      ],
      edges: [
        { _id: "e1", source: "n1_interact", sourceHandle: "out_exec", target: "n3_branch", targetHandle: "in_exec" },
        { _id: "e2", source: "n2_player_data", sourceHandle: "out_has_quest", target: "n3_branch", targetHandle: "in_cond" },
        { _id: "e3", source: "n3_branch", sourceHandle: "out_true", target: "n6_show_dialogue", targetHandle: "in_exec" },
        { _id: "e4", source: "n2_player_data", sourceHandle: "out_name", target: "n6_show_dialogue", targetHandle: "in_name" },
        { _id: "e5", source: "n2_player_data", sourceHandle: "out_has_quest", target: "n6_show_dialogue", targetHandle: "in_cond" },
        { _id: "e6", source: "n5_calc_exp", sourceHandle: "out_total_exp", target: "n6_show_dialogue", targetHandle: "in_exp" },
        { _id: "e7", source: "n4_world_data", sourceHandle: "out_npc_pos", target: "n6_show_dialogue", targetHandle: "in_look" },
        { _id: "e8", source: "n4_world_data", sourceHandle: "out_reward_item", target: "n6_show_dialogue", targetHandle: "in_item" },
        { _id: "e9", source: "n3_branch", sourceHandle: "out_false", target: "n7_simple_dialogue", targetHandle: "in_exec" },
        { _id: "e10", source: "n2_player_data", sourceHandle: "out_name", target: "n7_simple_dialogue", targetHandle: "in_name" },
      ]
    });

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
                  variables: { "Speed": 20 }
                },
                {
                  _id: "npc_behavior_001",
                  assetId: scriptNpcId, 
                  isActive: true,
                  variables: {  }
                },
              ]
            }
          }
        }
      ]
    });

    console.log("Database seeded successfully!");
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seedDatabase();