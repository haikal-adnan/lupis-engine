import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Project from './models/nosql/Project.js';
import Folder from './models/nosql/Folder.js';
import Asset from './models/nosql/Asset.js';
import Scene from './models/nosql/Scene.js';
import { generateId } from './utils/idGenerator.js'; // Import utils

dotenv.config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    // Bersihkan Data Lama
    await Project.deleteMany({});
    await Folder.deleteMany({});
    await Asset.deleteMany({});
    await Scene.deleteMany({});

    const projectId = generateId('proj');
    const fSpritesId = generateId('folder');
    const fFontsId = generateId('folder');
    const assetDungeonId = generateId('asset');
    const assetFontId = generateId('asset');
    const sceneId = generateId('scene');

    await Project.create({
      _id: projectId, // Pakai ID manual
      ownerId: "dev_2025",
      name: "Dungeon Project",
      settings: { width: 1280, height: 720 },
      layers: [
        { id: "layer_root", name: "Root Layer", order: 0 },
        { id: "layer_hero", name: "Hero Layer", order: 1 }
      ]
    });

    // 3. Create Folders
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

    // 4. Create Assets
    // Note: Di seeder ini kita anggap file sudah ada di server/CDN
    const mockCdnUrl = "http://localhost:3000/cdn"; 

    await Asset.create({
      _id: assetDungeonId,
      projectId: projectId,
      folderId: fSpritesId,
      name: "dungeon_sheet",
      type: "texture",
      fileKey: `dungeon_sheet_${Date.now()}`,
      fileUrl: `${mockCdnUrl}/dungeon_sheet.png`, // URL Final
      meta: { extension: ".png", filterMode: "nearest" }
    });

    await Asset.create({
      _id: assetFontId,
      projectId: projectId,
      folderId: fFontsId, 
      name: "gaegu",     
      type: "font",
      fileKey: `gaegu_${Date.now()}`,
      fileUrl: `${mockCdnUrl}/gaegu.ttf`, // URL Final
      meta: { 
        extension: ".ttf", 
        originalName: "Gaegu-Regular.ttf" 
      }
    });

    console.log("Project created:", projectId);
    console.log("Assets created:", assetDungeonId, assetFontId);

    // 5. Create Scene & Entities
    // Generate Entity IDs manual juga
    const entBgId = generateId('ent');
    const entGroupId = generateId('ent');
    const entItemId = generateId('ent');
    const entBoxId = generateId('ent');
    const entTextId = generateId('ent');

    await Scene.create({
      _id: sceneId,
      projectId: projectId,
      name: "Level 1",
      settings: { backgroundColor: "#222222" },
      entities: [
        {
          _id: entBgId, // String ID
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
              "assetId": assetDungeonId, // Referensi ke String ID Asset
              "source": { "x": 0, "y": 0, "w": 256, "h": 256 },
              "opacity": 1.0
            }
          }
        },
        
        {
          _id: entGroupId,
          name: "dungeon",
          type: "group", // Logic type bisa disimpan di komponen atau meta, tapi nama field 'type' di schema entity belum ada di schema di atas, saya anggap masuk 'components' atau field tambahan jika perlu. Di sini saya ikuti struktur Anda sebelumnya.
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
          parentId: entGroupId, // String ID Parent
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

    console.log("Database seeded successfully with Custom String IDs.");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedDatabase();