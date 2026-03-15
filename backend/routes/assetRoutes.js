import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { exec } from "child_process";

import Project from "../models/nosql/Project.js"; 
import Asset from "../models/nosql/Asset.js";
import { createAsset } from "../bin/createAsset.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const STORAGE_BASE_PATH = path.resolve(__dirname, "../../storage/projects");

const fileFilter = (req, file, cb) => {
  const allowedExts = [".png", ".jpg", ".jpeg", ".ttf", ".wav", ".mp3", ".ogg"];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExts.includes(ext)) {
    cb(null, true); 
  } else {
    cb(new Error(`Tipe file tidak diizinkan! Hanya menerima: ${allowedExts.join(", ")}`), false);
  }
};

const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 } 
}).single("file");


router.post("/createAsset", (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(400).json({ success: false, error: err.message });

    const { projectId, folderId, width, height, name, duration } = req.body; 
    const file = req.file;

    if (!file || !projectId) return res.status(400).json({ success: false, error: "Missing parameters" });
    if (!/^[a-zA-Z0-9_-]+$/.test(projectId)) return res.status(400).json({ success: false, error: "Invalid projectId format." });

    try {
      const projectExists = await Project.findById(projectId);
      if (!projectExists) return res.status(404).json({ success: false, error: "Project tidak ditemukan." });

      const projectFolder = path.join(STORAGE_BASE_PATH, projectId);
      if (!fs.existsSync(projectFolder)) return res.status(400).json({ success: false, error: "Project folder not found." });

      const ext = path.extname(file.originalname).toLowerCase();
      
      let label = 'image_';
      let assetType = 'texture';
      
      if (ext === '.ttf') {
        label = 'font_';
        assetType = 'font';
      } else if (['.wav', '.mp3', '.ogg'].includes(ext)) {
        label = 'audio_';
        assetType = 'audio';
      }

      const random16Digit = crypto.randomBytes(8).toString('hex'); 
      const baseName = `${label}${random16Digit}`;
      const savedName = `${baseName}${ext}`;
      const filePath = path.join(projectFolder, savedName);

      fs.writeFileSync(filePath, file.buffer);
      console.log(`[Upload] File fisik tersimpan: ${savedName}`);

      if (assetType === 'font') {
        const outputPath = path.join(projectFolder, `${baseName}.fnt`); 
        const cmd = `npx msdf-bmfont-xml "${filePath}" -o "${outputPath}" --texture-size 1024,1024 --distance-range 8 --smart-size --pot --square --font-size 42`;

        exec(cmd, async (error) => {
          const pngPath = path.join(projectFolder, `${baseName}.png`);
          const fntPath = path.join(projectFolder, `${baseName}.fnt`);
          
          if (!error && fs.existsSync(fntPath) && fs.existsSync(pngPath)) {
            try {
              const newAsset = await createAsset({
                projectId,
                folderId: folderId || null,
                name: name || file.originalname, 
                type: 'font',
                fileKey: baseName, 
                extension: ext,
                size: file.size
              });

              return res.json({ success: true, data: { asset: newAsset } });
            } catch (dbErr) {
              if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
              if (fs.existsSync(fntPath)) fs.unlinkSync(fntPath);
              if (fs.existsSync(pngPath)) fs.unlinkSync(pngPath);
              return res.status(500).json({ success: false, error: 'Database storage failed.' });
            }
          } else {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath); 
            return res.status(500).json({ success: false, error: 'MSDF Generation failed.' });
          }
        });

      } else if (assetType === 'audio') {
        try {
          const newAsset = await createAsset({
            projectId,
            folderId: folderId || null,
            name: name || file.originalname, 
            type: 'audio',
            fileKey: baseName, 
            extension: ext,
            size: file.size,
            duration: duration ? parseFloat(duration) : 0 
          });

          return res.json({ success: true, data: { asset: newAsset } });
        } catch (dbErr) {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          return res.status(500).json({ success: false, error: 'Database storage failed.' });
        }

      } else {
        let assetDimensions = undefined;
        if (width && height) {
          assetDimensions = { w: parseInt(width), h: parseInt(height) };
        }

        try {
          const newAsset = await createAsset({
            projectId,
            folderId: folderId || null,
            name: name || file.originalname, 
            type: 'texture',
            fileKey: baseName, 
            extension: ext,
            size: file.size,
            dimensions: assetDimensions
          });

          return res.json({ success: true, data: { asset: newAsset } });
        } catch (dbErr) {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          return res.status(500).json({ success: false, error: 'Database storage failed.' });
        }
      }
    } catch (e) {
      console.error("[Upload Error]:", e);
      res.status(500).json({ success: false, error: "Internal server error." });
    }
  });
});


router.put("/updateAsset/:assetId", async (req, res) => {
  try {
    const { assetId } = req.params;
    const { name, folderId, filterMode } = req.body;

    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (folderId !== undefined) updateFields.folderId = folderId;
    
    if (filterMode !== undefined) updateFields['meta.filterMode'] = filterMode;

    const updatedAsset = await Asset.findByIdAndUpdate(
      assetId,
      { $set: updateFields },
      { new: true } 
    );

    if (!updatedAsset) {
      return res.status(404).json({ success: false, error: "Asset tidak ditemukan." });
    }

    res.json({ success: true, data: updatedAsset });

  } catch (error) {
    console.error("[Update Error]:", error);
    res.status(500).json({ success: false, error: "Gagal melakukan update asset." });
  }
});


router.post("/duplicateAsset/:assetId", async (req, res) => {
  try {
    const { assetId } = req.params;
    const { targetFolderId } = req.body;

    const originalAsset = await Asset.findById(assetId);
    if (!originalAsset) return res.status(404).json({ success: false, error: "Asset asal tidak ditemukan." });

    const { projectId, fileKey, extension, type, size, meta } = originalAsset;
    const projectFolder = path.join(STORAGE_BASE_PATH, projectId.toString());
    
    const random16Digit = crypto.randomBytes(8).toString('hex');
    
    let label = 'image_';
    if (type === 'font') label = 'font_';
    else if (type === 'audio') label = 'audio_';

    const newFileKey = `${label}${random16Digit}`;

    const copyFileFs = (ext) => {
      const src = path.join(projectFolder, `${fileKey}${ext}`);
      const dest = path.join(projectFolder, `${newFileKey}${ext}`);
      if (fs.existsSync(src)) fs.copyFileSync(src, dest);
    };

    if (type === 'texture' || type === 'audio') {
      copyFileFs(extension || (type === 'audio' ? '.mp3' : '.png'));
    } else if (type === 'font') {
      ['.ttf', '.png', '.fnt'].forEach(ext => copyFileFs(ext));
    }

    const duplicatedAsset = await createAsset({
      projectId,
      folderId: targetFolderId || originalAsset.folderId,
      name: `${originalAsset.name} (Copy)`,
      type,
      fileKey: newFileKey,
      extension,
      size,
      dimensions: meta?.dimensions,
      duration: meta?.duration
    });

    res.json({ success: true, data: duplicatedAsset });

  } catch (error) {
    console.error("[Duplicate Error]:", error);
    res.status(500).json({ success: false, error: "Gagal menduplikasi asset." });
  }
});


router.delete("/deleteAsset/:assetId", async (req, res) => {
  try {
    const { assetId } = req.params;

    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.status(404).json({ success: false, error: "Asset tidak ditemukan." });
    }

    const { projectId, fileKey, type, meta } = asset;
    const projectFolder = path.join(STORAGE_BASE_PATH, projectId.toString());

    await Asset.findByIdAndDelete(assetId);

    if (type === 'texture' || type === 'audio') {
      const ext = meta.extension || (type === 'audio' ? '.mp3' : '.png');
      const filePath = path.join(projectFolder, `${fileKey}${ext}`);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      
    } else if (type === 'font') {
      const exts = ['.ttf', '.png', '.fnt'];
      exts.forEach((ext) => {
        const filePath = path.join(projectFolder, `${fileKey}${ext}`);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });
    }

    res.json({ success: true, message: "Asset berhasil dihapus sepenuhnya." });

  } catch (error) {
    console.error("[Delete Error]:", error);
    res.status(500).json({ success: false, error: "Gagal menghapus asset." });
  }
});

export default router;