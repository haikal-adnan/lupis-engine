import express from "express";
import fs from "fs/promises";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";
import { GenerateUUID } from "../utils/GenerateUUID.js";
import { pool } from "../config/postgres.js";
import fsSync from "fs"; 

import Project from "../models/nosql/Project.js";
import Scene from "../models/nosql/Scene.js";
import Folder from "../models/nosql/Folder.js";
import Asset from "../models/nosql/Asset.js";
import Prefab from "../models/nosql/Prefab.js";
import Script from "../models/nosql/Script.js";

import Published from "../models/nosql/Published.js";
import ProjectPublished from "../models/nosql/published/ProjectPublished.js";
import ScenePublished from "../models/nosql/published/ScenePublished.js";
import FolderPublished from "../models/nosql/published/FolderPublished.js";
import AssetPublished from "../models/nosql/published/AssetPublished.js";
import PrefabPublished from "../models/nosql/published/PrefabPublished.js";
import ScriptPublished from "../models/nosql/published/ScriptPublished.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

const STORAGE_PROJECTS = path.resolve(__dirname, "../../storage/projects");
const STORAGE_PUBLISHED = path.resolve(__dirname, "../../storage/published");
const STORAGE_THUMBNAILS = path.resolve(__dirname, "../../storage/thumbnails");

if (!fsSync.existsSync(STORAGE_THUMBNAILS)) {
  fsSync.mkdirSync(STORAGE_THUMBNAILS, { recursive: true });
}

const uploadThumbnail = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file gambar (PNG, JPG, JPEG, WEBP) yang diizinkan.'), false);
    }
  }
}).single('thumbnail');

router.post('/upload-thumbnail', async (req, res) => {
  uploadThumbnail(req, res, async (err) => {
    if (err) return res.status(400).json({ success: false, error: err.message });
    
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'File gambar tidak ditemukan.' });
    }

    try {
      const ext = path.extname(req.file.originalname).toLowerCase();
      const fileName = `thumb_${GenerateUUID()}${ext}`; 
      const filePath = path.join(STORAGE_THUMBNAILS, fileName);

      await fs.writeFile(filePath, req.file.buffer);

      res.json({ success: true, data: { thumbnailUrl: fileName } });
    } catch (error) {
      console.error('[Upload Thumbnail Error]', error);
      res.status(500).json({ success: false, error: 'Gagal mengunggah thumbnail.' });
    }
  });
});

router.get("/project/:projectId", async (req, res) => {
  try {
    const game = await Published.findOne({ projectId: req.params.projectId }).lean();
    res.json({ success: true, data: game || null });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put("/:publishId", async (req, res) => {
  try {
    const { publishId } = req.params;
    const updateData = req.body;

    const updated = await Published.findByIdAndUpdate(publishId, updateData, { new: true });
    if (!updated) return res.status(404).json({ success: false, error: "Data publish tidak ditemukan." });

    res.json({ success: true, data: updated, message: "Berhasil diperbarui" });
  } catch (error) {
    res.status(500).json({ success: false, error: "Gagal memperbarui data publish." });
  }
});

router.get("/check-slug/:slug", async (req, res) => {
  try {
    const existing = await Published.findOne({ slug: req.params.slug }).lean();
    res.json({ success: true, available: !existing });
  } catch (error) {
    res.status(500).json({ success: false, error: "Gagal mengecek ketersediaan slug." });
  }
});

router.post("/create", async (req, res) => {
  try {
    const { projectId, ownerId, title, slug, description, thumbnailUrl, playOnBrowser, downloads } = req.body;

    if (!projectId || !title || !slug) {
      return res.status(400).json({ success: false, error: "Missing required fields." });
    }

    const projectExists = await Project.findById(projectId).lean();
    if (!projectExists) {
      return res.status(404).json({ success: false, error: "Project tidak ditemukan." });
    }

    const slugExists = await Published.findOne({ slug });
    if (slugExists) {
      return res.status(400).json({ success: false, error: "URL/Slug sudah digunakan, pilih yang lain." });
    }

    await Project.findByIdAndUpdate(projectId, { 
      status: 'PUBLISHED',
      $set: { "settings.publishedSlug": slug } 
    });

    const publishId = GenerateUUID();

    const srcDir = path.join(STORAGE_PROJECTS, projectId.toString());
    const destDir = path.join(STORAGE_PUBLISHED, projectId.toString());

    try {
      await fs.cp(srcDir, destDir, { recursive: true });
      console.log(`[Publish] Berhasil menyalin asset fisik ke: ${destDir}`);
    } catch (fsError) {
      console.error("[Publish Warning] Folder project mungkin kosong atau gagal disalin:", fsError);
    }

    const scenes = await Scene.find({ projectId }).lean();
    const folders = await Folder.find({ projectId }).lean();
    const assets = await Asset.find({ projectId }).lean();
    const prefabs = await Prefab.find({ projectId }).lean();
    const scripts = await Script.find({ projectId }).lean();

    await Promise.all([
      ProjectPublished.deleteOne({ _id: projectId }),
      ScenePublished.deleteMany({ projectId }),
      FolderPublished.deleteMany({ projectId }),
      AssetPublished.deleteMany({ projectId }),
      PrefabPublished.deleteMany({ projectId }),
      ScriptPublished.deleteMany({ projectId })
    ]);

    await ProjectPublished.create({
      ...projectExists,
      status: 'PUBLISHED' 
    });
    
    if (scenes.length) await ScenePublished.insertMany(scenes);
    if (folders.length) await FolderPublished.insertMany(folders);
    if (assets.length) await AssetPublished.insertMany(assets);
    if (prefabs.length) await PrefabPublished.insertMany(prefabs);
    if (scripts.length) await ScriptPublished.insertMany(scripts);

    const newPublished = await Published.create({
      _id: publishId,
      projectId,
      ownerId,
      title,
      slug,
      description,
      thumbnailUrl,
      playOnBrowser,
      downloads
    });

    res.status(201).json({
      success: true,
      message: "Game berhasil dipublish!",
      data: newPublished
    });

  } catch (error) {
    console.error("[Publish Route Error]:", error);
    res.status(500).json({ success: false, error: "Terjadi kesalahan server saat mempublish game." });
  }
});

router.get("/", async (req, res) => {
  try {
    const games = await Published.find().sort({ createdAt: -1 }).lean();
    
    if (games.length === 0) {
       return res.json({ success: true, data: [] });
    }

    const ownerIds = [...new Set(games.map(g => g.ownerId))];
    
    const query = `
      SELECT 
        u.id, 
        u.username,
        COALESCE(up.display_name, u.username) AS name, 
        up.avatar_url 
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE u.id = ANY($1)
    `;
    
    const creatorsResult = await pool.query(query, [ownerIds]);
    
    const creatorsMap = Object.fromEntries(
      creatorsResult.rows.map(row => [
        row.id, 
        { name: row.name, avatar: row.avatar_url, username: row.username } 
      ])
    );

    const result = games.map(game => ({
      ...game,
      creator: creatorsMap[game.ownerId] || { name: "Unknown", avatar: null }
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    console.error("[Get Published Error]:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/slug/:slug", async (req, res) => {
  try {
    const game = await Published.findOne({ slug: req.params.slug }).lean();
    if (!game) return res.status(404).json({ success: false, error: "Game not found" });

    const query = `
      SELECT 
        u.id, 
        u.username, 
        COALESCE(up.display_name, u.username) AS name, 
        up.avatar_url 
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE u.id = $1
    `;
    
    const creatorResult = await pool.query(query, [game.ownerId]);
    
    const creator = creatorResult.rows[0] 
      ? { 
          name: creatorResult.rows[0].name, 
          avatar: creatorResult.rows[0].avatar_url,
          username: creatorResult.rows[0].username 
        }
      : { name: "Unknown", avatar: null, username: null };

    res.json({ success: true, data: { ...game, creator } });
  } catch (error) {
    console.error("[Get Detail Published Error]:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/:id/resources", async (req, res) => {
  try {
    const publishedGame = await Published.findById(req.params.id).lean();
    if (!publishedGame) return res.status(404).json({ success: false, error: "Game not found" });

    const projectId = publishedGame.projectId;

    const [project, scenes, folders, assets, prefabs, scripts] = await Promise.all([
      ProjectPublished.findById(projectId).lean(), 
      ScenePublished.find({ projectId }).lean(),
      FolderPublished.find({ projectId }).lean(),
      AssetPublished.find({ projectId }).lean(),
      PrefabPublished.find({ projectId }).lean(),
      ScriptPublished.find({ projectId }).lean()
    ]);

    res.json({
      success: true,
      data: {
        project, 
        scenes,
        folders,
        assets,
        prefabs,
        scripts
      }
    });
  } catch (error) {
    console.error("[Get Published Resources Error]:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/republish/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const projectExists = await Project.findById(projectId).lean();
    if (!projectExists) {
      return res.status(404).json({ success: false, error: "Project tidak ditemukan." });
    }

    const publishedGame = await Published.findOne({ projectId });
    if (!publishedGame) {
      return res.status(404).json({ success: false, error: "Game belum dipublish." });
    }

    const srcDir = path.join(STORAGE_PROJECTS, projectId.toString());
    const destDir = path.join(STORAGE_PUBLISHED, projectId.toString());

    try {
      await fs.rm(destDir, { recursive: true, force: true }).catch(() => {}); 
      await fs.cp(srcDir, destDir, { recursive: true });
      console.log(`[Publish] Berhasil menimpa asset fisik ke: ${destDir}`);
    } catch (fsError) {
      console.error("[Publish Warning] Folder project mungkin kosong atau gagal disalin:", fsError);
    }

    const scenes = await Scene.find({ projectId }).lean();
    const folders = await Folder.find({ projectId }).lean();
    const assets = await Asset.find({ projectId }).lean();
    const prefabs = await Prefab.find({ projectId }).lean();
    const scripts = await Script.find({ projectId }).lean();

    await Promise.all([
      ProjectPublished.deleteOne({ _id: projectId }),
      ScenePublished.deleteMany({ projectId }),
      FolderPublished.deleteMany({ projectId }),
      AssetPublished.deleteMany({ projectId }),
      PrefabPublished.deleteMany({ projectId }),
      ScriptPublished.deleteMany({ projectId })
    ]);

    await ProjectPublished.create({
      ...projectExists,
      status: 'PUBLISHED' 
    });
    
    if (scenes.length) await ScenePublished.insertMany(scenes);
    if (folders.length) await FolderPublished.insertMany(folders);
    if (assets.length) await AssetPublished.insertMany(assets);
    if (prefabs.length) await PrefabPublished.insertMany(prefabs);
    if (scripts.length) await ScriptPublished.insertMany(scripts);

    res.json({
      success: true,
      message: "Game berhasil diupdate dengan data proyek terbaru!"
    });

  } catch (error) {
    console.error("[Republish Route Error]:", error);
    res.status(500).json({ success: false, error: "Terjadi kesalahan server saat mengupdate game." });
  }
});

export default router;