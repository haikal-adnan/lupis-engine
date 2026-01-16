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
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing in .env file");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB...");

    await Project.deleteMany({});
    await Folder.deleteMany({});
    await Asset.deleteMany({});
    await Scene.deleteMany({});
    await Prefab.deleteMany({});

    const projectId = "project_dungeon_demo_01";
    const sceneId = "scene_level_1_demo";

    const fSpritesId = "folder_sprites_main";
    const fFontsId = "folder_fonts_main";

    const assetDungeonId = "dungeon_sheet_fixed_key";
    const assetFontId = "gaegu";

    const prefabChestId = "prefab_chest_001";

    // Entity IDs
    const entBgId = "ent_background_map";
    const entGroupId = "ent_group_dungeon";
    const entItemId = "ent_item_inner";
    const entTextId = "ent_ui_text_label";
    const entChestStdId = "ent_chest_std";
    const entChestBigId = "ent_chest_big";
    const entTilemapId = "ent_main_tilemap";

    await Project.create({
      _id: projectId,
      ownerId: "dev_2025",
      name: "Dungeon Project",
      settings: { width: 1280, height: 720 },
      scenes: [sceneId]
    });

    await Folder.create([
      { _id: fSpritesId, projectId, name: "Sprites" },
      { _id: fFontsId, projectId, name: "Fonts" }
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
            x: 0, y: 0, scaleX: 2, scaleY: 2, rotation: 0,
            width: 50, height: 50, pivotX: 0.5, pivotY: 0.5
          },
          SpriteRenderer: {
            assetId: assetDungeonId,
            source: { x: 128, y: 0, w: 32, h: 32 },
            color: "#FFFFFF",
            opacity: 1
          },
          BoxCollider: {
            isTrigger: false,
            offset: { x: 0, y: 0 },
            size: { x: 32, y: 32 }
          }
        }
      }
    });

    await Scene.create({
      _id: sceneId,
      projectId,
      name: "Level 1 Demo",
      settings: {
        backgroundColor: "#222222",
        worldBounds: { x: 0, y: 0, width: 2000, height: 2000 }
      },
      layers: [
        { _id: "layer_root", name: "Root" },
        { _id: "layer_hero", name: "Hero" },
        { _id: "layer_ui", name: "UI" }
      ],
      entities: [
        {
            _id: entTilemapId,
            scriptId: "level_ground",
            type: "entity",
            name: "Level Terrain",
            tag: "ground",
            layerId: "layer_root",
            parentId: null,
            isActive: true,
            isVisible: true,
            components: {
                Transform: {
                    x: 0, y: 0, width: 640, height: 480, rotation: 0, scaleX: 1, scaleY: 1
                },
                Tilemap: {
                    tileWidth: 16,
                    tileHeight: 16,
                    width: 40,      
                    height: 30,     
                    assetId: assetDungeonId,
                    opacity: 1,
                    isSolid: true,
                    data: Array(1200).fill(0).map((_, i) => i >= 1120 ? 45 : 0)
                }
            }
        },
        // 2. BACKGROUND (Reverted to Active)
        {
          _id: entBgId,
          scriptId: "bg_main",
          type: "entity",
          name: "Background Image",
          tag: "background",
          layerId: "layer_root",
          parentId: null,
          isActive: true, 
          isVisible: true,
          components: {
            Transform: {
              x: 0,
              y: 0,
              width: 800,
              height: 600
            },
            SpriteRenderer: {
              assetId: assetDungeonId,
              source: { x: 0, y: 0, w: 256, h: 256 },
              opacity: 1
            }
          }
        },
        {
          _id: entGroupId,
          scriptId: "room_group",
          type: "group",
          name: "Dungeon Room",
          layerId: "layer_hero",
          parentId: null,
          isActive: true,
          isVisible: true,
          _editor: { expanded: true },
          components: {
            Transform: { x: 100, y: 100, scaleX: 1, scaleY: 1 }
          }
        },
        {
          _id: entItemId,
          scriptId: "inner_item_debug",
          type: "entity",
          name: "Inner Item",
          parentId: entBgId,
          layerId: "layer_hero",
          isActive: true,
          isVisible: true,
          components: {
            Transform: { x: 50, y: 50, width: 64, height: 64, pivotX: 0.5, pivotY: 1.0 },
            ShapeRenderer: { type: "rectangle", color: "#FF0000", width: 100, height: 100, opacity: 1 }
          }
        },
        {
          _id: entChestStdId,
          scriptId: "chest_std_01",
          type: "entity",
          name: "Chest 1 (Standard)",
          prefabId: prefabChestId,
          parentId: entGroupId,
          layerId: "layer_hero",
          isActive: true,
          isVisible: true,
          components: {
            Transform: { x: 200, y: 0, width: 50, height: 50 }
          }
        },
        {
          _id: entChestBigId,
          scriptId: "chest_boss_01",
          type: "entity",
          name: "Chest 2 (Big Ghost)",
          prefabId: prefabChestId,
          parentId: entGroupId,
          layerId: "layer_hero",
          isActive: true,
          isVisible: true,
          components: {
            Transform: { x: 400, y: 0, scaleX: 3, scaleY: 3, width: 50, height: 50 },
            SpriteRenderer: {
              assetId: assetDungeonId,
              source: { x: 128, y: 0, w: 32, h: 32 },
              color: "#FFCCCC",
              opacity: 1
            }
          }
        },
        {
          _id: entTextId,
          scriptId: "ui_title_label",
          type: "entity",
          name: "Title Label",
          layerId: "layer_ui",
          parentId: null,
          isActive: true,
          isVisible: true,
          components: {
            Transform: { x: 640, y: 100, width: 300, height: 42, pivotX: 0.5, pivotY: 0.5 },
            TextRenderer: {
              value: "LUPIS ENGINE",
              fontSize: 64,
              color: "#FFD700",
              assetId: assetFontId,
              align: "center",
              opacity: 1
            }
          }
        }
      ]
    });

    console.log("Database Seeding Completed Successfully!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedDatabase();