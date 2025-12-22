import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Project from './models/nosql/Project.js';
import Folder from './models/nosql/Folder.js';
import Asset from './models/nosql/Asset.js';
import Scene from './models/nosql/Scene.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    // Bersihkan Data Lama
    await Project.deleteMany({});
    await Folder.deleteMany({});
    await Asset.deleteMany({});
    await Scene.deleteMany({});
    
    const projectId = "project_dungeon_demo_01";
    
    const fSpritesId = "folder_sprites_main";
    const fFontsId = "folder_fonts_main";
    
    const assetDungeonId = "asset_tex_dungeon_sheet";
    const assetFontId = "asset_font_gaegu_reg";
    
    const sceneId = "scene_level_1_demo";

    const entBgId = "ent_background_map";
    const entGroupId = "ent_group_dungeon";
    const entItemId = "ent_item_inner";
    const entMirroredId = "ent_item_mirrored_demo"; 
    const entBoxId = "ent_debug_redbox";
    const entTextId = "ent_ui_text_label";

    // 1. Setup Project
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

    // 2. Setup Folders
    await Folder.create({ 
      _id: fSpritesId,
      projectId: projectId, 
      name: "Sprites" 
    });

    await Folder.create({ 
      _id: fFontsId,
      projectId: projectId, 
      name: "Fonts" 
    });

    const mockCdnUrl = "http://localhost:3000/cdn"; 

    // 3. Setup Assets
    await Asset.create({
      _id: assetDungeonId,
      projectId: projectId,
      folderId: fSpritesId,
      name: "dungeon_sheet",
      type: "texture",
      fileKey: "dungeon_sheet_fixed_key",
      fileUrl: `${mockCdnUrl}/dungeon_sheet.png`,
      meta: { extension: ".png", filterMode: "nearest" }
    });

    await Asset.create({
      _id: assetFontId,
      projectId: projectId,
      folderId: fFontsId, 
      name: "gaegu",     
      type: "font",
      fileKey: "gaegu_fixed_key",
      fileUrl: `${mockCdnUrl}/gaegu.ttf`,
      meta: { 
        extension: ".ttf", 
        originalName: "Gaegu-Regular.ttf" 
      }
    });

    console.log("Project & Assets created.");

    // 4. Setup Scene (zIndex ditambahkan kembali)
    await Scene.create({
      _id: sceneId,
      projectId: projectId,
      name: "Level 1",
      settings: { backgroundColor: "#222222" },
      entities: [
        // --- ENTITY 1: Background ---
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
            zIndex: 0 // [ADA KEMBALI]
          },
          components: {
            "SpriteRenderer": {
              "assetId": assetDungeonId, 
              "source": { "x": 0, "y": 0, "w": 256, "h": 256 }
            }
          }
        },
        
        // --- ENTITY 2: Group Container ---
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
            zIndex: 1 // Contoh: Group ini sedikit di atas background
          },
          components: {}
        },

        // --- ENTITY 3: Item (Child of Group) ---
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
            zIndex: 0 // Relatif terhadap parent
          },
          components: {
            "SpriteRenderer": {
              "assetId": assetDungeonId,
              "source": { "x": 32, "y": 0, "w": 16, "h": 16 }
            }
          }
        },

        // --- ENTITY 4: Mirrored Item ---
        {
          _id: entMirroredId,
          name: "Mirrored Prop",
          tag: "props",
          layerId: "layer_hero",
          parentId: entGroupId, 
          opacity: 80, 
          transform: {
            translate: { x: 150, y: 50 },
            width: 64, height: 64,
            rotation: 0,
            pivot: { x: 0.5, y: 1.0 },
            scale: { x: -1, y: 1 },
            zIndex: 1
          },
          components: {
            "SpriteRenderer": {
              "assetId": assetDungeonId,
              "source": { "x": 32, "y": 0, "w": 16, "h": 16 }
            }
          }
        },

        // --- ENTITY 5: Red Box ---
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
              "color": "#FF0000FF",
              "width": 100,
              "height": 100
            }
          }
        },

        // --- ENTITY 6: Text ---
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
            zIndex: 10 // UI biasanya paling atas
          },
          components: {
            "TextRenderer": {
              "text": "Testing",
              "fontSize": 50,     
              "color": "#FFFFFF",   
              "assetId": assetFontId,
              "align": "center"
            }
          }
        }
      ]
    });

    console.log("Database seeded successfully with NEW SCHEMA (Pivot, Opacity, Tag, Scale, Z-Index).");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedDatabase();