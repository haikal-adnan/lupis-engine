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

    // Membersihkan data lama
    await Project.deleteMany({});
    await Folder.deleteMany({});
    await Asset.deleteMany({});
    await Scene.deleteMany({});

    // 1. Buat Project
    const project = await Project.create({
      ownerId: "dev_2025",
      name: "Dungeon Project",
      settings: { width: 1280, height: 720 },
      layers: [
        { id: "layer_root", name: "Root Layer", order: 0 },
        { id: "layer_hero", name: "Hero Layer", order: 1 }
      ]
    });

    // 2. Buat Folder (Sprites & Fonts)
    const fSprites = await Folder.create({ 
      projectId: project._id, 
      name: "Sprites" 
    });

    const fFonts = await Folder.create({ 
      projectId: project._id, 
      name: "Fonts" 
    });

    // 3. Buat Asset
    // --- Texture Asset ---
    const assetDungeon = await Asset.create({
      projectId: project._id,
      folderId: fSprites._id,
      name: "dungeon_sheet",
      type: "texture",
      meta: { extension: ".png", filterMode: "nearest" }
    });

    // --- NEW: Font Asset (Gaegu) ---
    const assetFontGaegu = await Asset.create({
      projectId: project._id,
      folderId: fFonts._id, // Masuk ke folder Fonts
      name: "gaegu",        // Nama font
      type: "font",
      meta: { 
        extension: ".ttf", 
        originalName: "Gaegu-Regular.ttf" 
      }
    });

    console.log("Project created:", project._id);
    console.log("Assets created:", assetDungeon.fileKey, assetFontGaegu.fileKey);

    // 4. Buat Scene dengan Entities
    await Scene.create({
      projectId: project._id,
      name: "Level 1",
      settings: { backgroundColor: "#222222" },
      entities: [
        // --- Background (Root Layer) ---
        {
          id: "ent_bg_01",
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
              "assetId": assetDungeon._id,
              "source": { "x": 0, "y": 0, "w": 256, "h": 256 },
              "opacity": 1.0
            }
          }
        },
        
        // --- Group Dungeon (Hero Layer) ---
        {
          id: "grp_dungeon",
          name: "dungeon",
          type: "group",
          layerId: "layer_hero",
          parentId: null,
          transform: {
            translate: { x: 100, y: 100 },
            width: 0, height: 0
          },
          components: {}
        },

        // --- Item Dungeon (Child of grp_dungeon) ---
        {
          id: "ent_dungeon_item",
          name: "Inner Dungeon Item",
          type: "object",
          layerId: "layer_hero",
          parentId: "grp_dungeon",
          transform: {
            translate: { x: 50, y: 50 },
            width: 64, height: 64
          },
          components: {
            "SpriteRenderer": {
              "assetId": assetDungeon._id,
              "source": { "x": 32, "y": 0, "w": 16, "h": 16 },
              "opacity": 1.0
            }
          }
        },

        // --- Shape Entity (Child of grp_dungeon) ---
        {
          id: "ent_red_box",
          name: "Red Rectangle",
          type: "object",
          layerId: "layer_hero",
          parentId: "grp_dungeon",
          transform: {
            translate: { x: 0, y: 100 }, 
            width: 100, 
            height: 100
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

        // --- NEW: Text Entity (Child of grp_dungeon) ---
        {
          id: "ent_text_test",
          name: "Text Label",
          type: "object",
          layerId: "layer_hero",
          parentId: "grp_dungeon",
          transform: {
            // Posisi relatif: di bawah kotak merah (y=100 + height=100 + gap)
            translate: { x: 0, y: 220 }, 
            width: 200, // Estimasi lebar text box
            height: 50
          },
          components: {
            "TextRenderer": {
              "text": "Testing",
              "fontSize": 50,        // Mapping dari 'size' lama
              "color": "#FFFFFF",    // Putih agar terlihat di BG gelap
              "assetId": assetFontGaegu._id, // Menggunakan ID dari asset yang baru dibuat
              "align": "center"
            }
          }
        }
      ]
    });

    console.log("Database seeded successfully.");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedDatabase();