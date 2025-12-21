import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Project from './models/nosql/Project.js';
import Folder from './models/nosql/Folder.js';
import Asset from './models/nosql/Asset.js';
import Scene from './models/nosql/Scene.js';
// import { generateId } from './utils/idGenerator.js'; // Tidak perlu dipakai di sini dulu

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
    const entBoxId = "ent_debug_redbox";
    const entTextId = "ent_ui_text_label";

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

    await Asset.create({
      _id: assetDungeonId,
      projectId: projectId,
      folderId: fSpritesId,
      name: "dungeon_sheet",
      type: "texture",
      fileKey: "dungeon_sheet_fixed_key", // Fixed key juga
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

    console.log("Project created:", projectId);
    console.log("Assets created:", assetDungeonId, assetFontId);

    await Scene.create({
      _id: sceneId,
      projectId: projectId,
      name: "Level 1",
      settings: { backgroundColor: "#222222" },
      entities: [
        {
          _id: entBgId,
          name: "Background Map",
          type: "object",
          layerId: "layer_root",
          parentId: null,
          transform: {
            translate: { x: 0, y: 0 },
            width: 800, height: 600
          },
          components: {
            "SpriteRenderer": {
              "assetId": assetDungeonId, // Menggunakan Fixed ID Asset
              "source": { "x": 0, "y": 0, "w": 256, "h": 256 },
              "opacity": 1.0
            }
          }
        },
        
        {
          _id: entGroupId,
          name: "dungeon",
          type: "group",
          layerId: "layer_hero",
          parentId: null,
          transform: {
            translate: { x: 100, y: 100 },
            width: 0, height: 0
          }
        },

        {
          _id: entItemId,
          name: "Inner Dungeon Item",
          layerId: "layer_hero",
          parentId: entGroupId, 
          transform: {
            translate: { x: 50, y: 50 },
            width: 64, height: 64
          },
          components: {
            "SpriteRenderer": {
              "assetId": assetDungeonId,
              "source": { "x": 32, "y": 0, "w": 16, "h": 16 },
              "opacity": 1.0
            }
          }
        },

        {
          _id: entBoxId,
          name: "Red Rectangle",
          layerId: "layer_hero",
          parentId: entGroupId,
          transform: {
            translate: { x: 0, y: 100 }, 
            width: 100, height: 100
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

        {
          _id: entTextId,
          name: "Text Label",
          layerId: "layer_hero",
          parentId: entGroupId,
          transform: {
            translate: { x: 0, y: 220 }, 
            width: 200, height: 50
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

    console.log("Database seeded successfully with FIXED IDs.");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedDatabase();