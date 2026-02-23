import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { exec } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const STORAGE_BASE_PATH = path.resolve(__dirname, "../../storage/projects");

const fileFilter = (req, file, cb) => {
  const allowedExts = [".png", ".jpg", ".jpeg", ".ttf"];
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

router.post("/upload", (req, res) => {
  upload(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, error: err.message });

    const { projectId } = req.body;
    const file = req.file;

    if (!file || !projectId) return res.status(400).json({ success: false, error: "Missing parameters" });
    if (!/^[a-zA-Z0-9_-]+$/.test(projectId)) return res.status(400).json({ success: false, error: "Invalid projectId format." });

    const projectFolder = path.join(STORAGE_BASE_PATH, projectId);
    if (!fs.existsSync(projectFolder)) return res.status(400).json({ success: false, error: "Project folder not found." });

    // ==========================================
    // LOGIKA PENAMAAN ACAK (RANDOM 16 DIGIT)
    // ==========================================
    const ext = path.extname(file.originalname).toLowerCase();
    let label = ext === '.ttf' ? 'font_' : 'image_';
    
    // crypto.randomBytes(8) menghasilkan 8 byte, yang jika di-toString('hex') menjadi 16 karakter
    const random16Digit = crypto.randomBytes(8).toString('hex'); 
    
    const baseName = `${label}${random16Digit}`; // Contoh: image_1a2b3c4d5e6f7g8h
    const savedName = `${baseName}${ext}`;       // Contoh: image_1a2b3c4d5e6f7g8h.png
    const filePath = path.join(projectFolder, savedName);

    try {
      // Simpan file ke disk
      fs.writeFileSync(filePath, file.buffer);
      console.log(`[Upload] Menyimpan file fisik: ${savedName}`);

      // ==========================================
      // LOGIKA KHUSUS FONT (MSDF GENERATOR)
      // ==========================================
      if (ext === '.ttf') {
        const outputPath = path.join(projectFolder, `${baseName}.fnt`); 
        console.log(`⚙️ Processing MSDF for: ${savedName}`);
        
        const cmd = `npx msdf-bmfont-xml "${filePath}" -o "${outputPath}" --texture-size 1024,1024 --distance-range 8 --smart-size --pot --square --font-size 42`;

        exec(cmd, (error, stdout, stderr) => {
          const pngPath = path.join(projectFolder, `${baseName}.png`);
          const fntPath = path.join(projectFolder, `${baseName}.fnt`);
          
          if (fs.existsSync(fntPath) && fs.existsSync(pngPath)) {
            console.log("✅ MSDF Generated successfully:", baseName);
            res.json({
              success: true,
              data: {
                projectId,
                originalName: file.originalname,
                savedName: savedName,
                baseName: baseName, // Kirim basename untuk kemudahan frontend
                files: {
                  ttf: savedName,
                  png: `${baseName}.png`,
                  fnt: `${baseName}.fnt`
                }
              }
            });
          } else {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath); 
            return res.status(500).json({ success: false, error: 'MSDF Generation failed.' });
          }
        });

      } else {
        // Response untuk gambar
        res.json({
          success: true,
          data: {
            projectId,
            originalName: file.originalname,
            savedName: savedName,
            files: { url: savedName }
          }
        });
      }

    } catch (e) {
      console.error("Save error:", e);
      res.status(500).json({ success: false, error: "Gagal menyimpan file ke storage" });
    }
  });
});

export default router;