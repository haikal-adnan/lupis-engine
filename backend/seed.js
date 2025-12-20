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

    await Project.deleteMany({});
    await Folder.deleteMany({});
    await Asset.deleteMany({});
    await Scene.deleteMany({});

    const project = await Project.create({
      ownerId: "dev_2025",
      name: "Canvas Engine Project",
      settings: { width: 800, height: 600 },
      layers: [{ id: "layer_01", name: "Main", order: 0 }]
    });

    const fSprites = await Folder.create({ 
      projectId: project._id, 
      name: "Sprites" 
    });

    const heroAsset = await Asset.create({
      projectId: project._id,
      folderId: fSprites._id,
      name: "dungeon_sheet",
      type: "texture",
      meta: { extension: ".png", filterMode: "nearest" }
    });

    await Scene.create({
      projectId: project._id,
      name: "Level 1",
      settings: { backgroundColor: "#111111" },
      entities: [
        {
          id: "hero_01",
          name: "Hero Player",
          layerId: "layer_01",
          transform: {
            translate: { x: 50, y: 50 },
            width: 64, height: 64
          },
          components: {
            "SpriteRenderer": {
              "assetId": heroAsset._id,
              "source": { "x": 112, "y": 0, "w": 16, "h": 16 },
              "opacity": 1.0
            }
          }
        }
      ]
    });

    process.exit();
  } catch (err) {
    process.exit(1);
  }
};

seedDatabase();