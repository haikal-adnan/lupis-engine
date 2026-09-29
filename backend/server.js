import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { spawn, exec } from "child_process";
import archiver from "archiver";
import cors from "cors";
import unzipper from "unzipper";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

const TEMP_DIR = path.resolve(__dirname, "./temp");
const EXPORTS_DIR = path.resolve(__dirname, "./exports");
const RUNNER_TEMPLATE_DIR = path.resolve(__dirname, "./runner");

if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });
if (!fs.existsSync(EXPORTS_DIR)) fs.mkdirSync(EXPORTS_DIR, { recursive: true });

const allowedOrigins = [
  "app://localhost",
  "http://localhost:6500",
  "http://localhost:8080",
  "http://localhost:4000"
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin.startsWith("app://")) {
        return callback(null, true);
      }
      return callback(new Error("Terblokir oleh kebijakan CORS"), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
  })
);

app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === ".ttf" || ext === ".otf") {
      cb(null, true);
    } else {
      cb(new Error("Format file tidak valid. Hanya menerima file .ttf atau .otf!"), false);
    }
  },
}).single("file");

const exportUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 },
}).single("projectZip");

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Micro-backend engine aktif dan siap digunakan!",
    timestamp: new Date().toISOString(),
  });
});

app.post("/api/convert-font", (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      console.error(`[Upload Error]: ${err.message}`);
      return res.status(400).json({ success: false, error: err.message });
    }

    if (!req.file) {
      console.error("[Upload Error]: File tidak ditemukan.");
      return res.status(400).json({ success: false, error: "File font (.ttf/.otf) tidak ditemukan." });
    }

    const jobId = crypto.randomBytes(8).toString("hex");
    const jobFolder = path.join(TEMP_DIR, jobId);
    fs.mkdirSync(jobFolder, { recursive: true });

    const originalName = req.file.originalname;
    const ext = path.extname(originalName).toLowerCase() || ".ttf";
    const inputFontPath = path.join(jobFolder, `font${ext}`);
    const outputFntPath = path.join(jobFolder, "font.fnt");

    console.log(`\n--------------------------------------------------`);
    console.log(`[Job ${jobId}] Menerima file: ${originalName} (${(req.file.size / 1024).toFixed(2)} KB)`);

    fs.writeFileSync(inputFontPath, req.file.buffer);

    const msdfBin = path.join(__dirname, "node_modules", ".bin", "msdf-bmfont");
    const cmd = `"${msdfBin}" "${inputFontPath}" -o "${outputFntPath}" --fieldType msdf --texture-size 2048,2048 --distance-range 8 --texture-padding 8 --smart-size --pot --square --overlap`;

    console.log(`[Job ${jobId}] Menjalankan konversi MSDF BMFont...`);

    exec(cmd, (error, stdout, stderr) => {
      const cleanup = () => {
        if (fs.existsSync(jobFolder)) {
          fs.rmSync(jobFolder, { recursive: true, force: true });
          console.log(`[Job ${jobId}] Folder sementara dibersihkan.`);
        }
      };

      if (error) {
        console.error(`[Job ${jobId}] ERROR Konversi:`, error.message);
        if (stderr) console.error(`[Job ${jobId}] Stderr:`, stderr);
        cleanup();
        return res.status(500).json({ success: false, error: "Gagal memproses generator MSDF BMFont." });
      }

      if (stdout) console.log(`[Job ${jobId} Stdout]:\n${stdout.trim()}`);

      const files = fs.readdirSync(jobFolder);
      const fntFile = files.find((f) => f.endsWith(".fnt") || f.endsWith(".xml") || f.endsWith(".json"));
      const pngFiles = files.filter((f) => f.endsWith(".png"));

      if (!fntFile || pngFiles.length === 0) {
        console.error(`[Job ${jobId}] Output hilang! File yang ada:`, files);
        cleanup();
        return res.status(500).json({ success: false, error: "Output hasil konversi tidak ditemukan." });
      }

      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="bmfont-${jobId}.zip"`);

      const archive = archiver("zip", { zlib: { level: 9 } });

      archive.on("error", (archiveErr) => {
        console.error(`[Job ${jobId}] Archive Error:`, archiveErr);
        cleanup();
        if (!res.headersSent) {
          res.status(500).send({ success: false, error: "Gagal membuat bundel ZIP." });
        }
      });

      res.on("finish", () => {
        console.log(`[Job ${jobId}] Selesai! ZIP dikirim ke client.`);
        cleanup();
        console.log(`--------------------------------------------------\n`);
      });

      archive.pipe(res);
      archive.file(path.join(jobFolder, fntFile), { name: "font.fnt" });

      pngFiles.forEach((png, index) => {
        const zipName = pngFiles.length === 1 ? "font.png" : `font_${index}.png`;
        archive.file(path.join(jobFolder, png), { name: zipName });
      });

      archive.finalize();
    });
  });
});

/**
 * Membaca manifest.runtime.json HANYA untuk pemetaan modul & aset yang akan di-export
 */
function getEngineFilesFromManifest() {
  const manifestPath = path.join(__dirname, "config", "manifest.runtime.json");
  let filesToExport = [];

  if (fs.existsSync(manifestPath)) {
    try {
      const manifestData = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      if (manifestData.modules && Array.isArray(manifestData.modules)) {
        filesToExport.push(...manifestData.modules);
      }
      if (manifestData.assets) {
        Object.values(manifestData.assets).forEach((assetList) => {
          if (Array.isArray(assetList)) filesToExport.push(...assetList);
        });
      }
      console.log(`[Manifest Mapping] Berhasil memetakan ${filesToExport.length} file dari manifest.`);
    } catch (e) {
      console.error("[Manifest Error] Gagal membaca manifest.runtime.json:", e.message);
    }
  } else {
    console.warn(`[Manifest Warning] File manifest tidak ditemukan di: ${manifestPath}`);
  }
  return filesToExport;
}

/**
 * Helper ekstraksi ZIP yang stabil langsung dari Buffer
 */
async function extractZipBuffer(zipBuffer, outputDir) {
  const directory = await unzipper.Open.buffer(zipBuffer);
  await directory.extract({ path: outputDir });
}

app.post("/api/export-app/zip", (req, res) => {
  exportUpload(req, res, async (err) => {
    if (err) return res.status(400).json({ success: false, error: err.message });
    if (!req.file) return res.status(400).json({ success: false, error: "Payload ZIP proyek tidak ditemukan." });

    const { projectId, updatedAt } = req.body;
    const validUpdatedAt = updatedAt || new Date().toISOString();

    if (!projectId) {
      return res.status(400).json({ success: false, error: "projectId wajib dikirim." });
    }

    const projectExportDir = path.join(EXPORTS_DIR, projectId, "zip");
    const targetFilePath = path.join(projectExportDir, `${projectId}.zip`);
    const metadataPath = path.join(projectExportDir, "metadata.json");

    fs.mkdirSync(projectExportDir, { recursive: true });

    const sendFileToClient = (filePath) => {
      res.download(filePath, `${projectId}.zip`, (downloadErr) => {
        if (downloadErr && !res.headersSent) {
          console.error(`[ZIP Send Error]:`, downloadErr);
          res.status(500).json({ success: false, error: "Gagal mengunduh file ZIP." });
        }
      });
    };

    if (fs.existsSync(targetFilePath) && fs.existsSync(metadataPath)) {
      try {
        const meta = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
        if (meta.updatedAt === validUpdatedAt) {
          console.log(`[ZIP Export] Mengirim build ZIP dari cache...`);
          return sendFileToClient(targetFilePath);
        }
      } catch (e) {
        console.warn("[ZIP Export] Metadata error, memproses ulang...");
      }
    }

    const jobId = crypto.randomBytes(8).toString("hex");
    const jobFolder = path.join(TEMP_DIR, jobId);
    const projectExtractDir = path.join(jobFolder, "project");
    const engineDir = fs.existsSync("/engine") ? "/engine" : path.resolve(__dirname, "../engine");

    fs.mkdirSync(projectExtractDir, { recursive: true });

    const cleanup = () => {
      if (fs.existsSync(jobFolder)) {
        try { fs.rmSync(jobFolder, { recursive: true, force: true }); } catch {}
      }
    };

    try {
      // 1. Ekstrak ZIP proyek dengan unzipper.Open.buffer
      await extractZipBuffer(req.file.buffer, projectExtractDir);

      // 2. Buat bundel ZIP baru yang berisi file engine + proyek
      await new Promise((resolve, reject) => {
        const outputStream = fs.createWriteStream(targetFilePath);
        const archive = archiver("zip", { zlib: { level: 9 } });

        outputStream.on("close", resolve);
        outputStream.on("error", reject);
        archive.on("error", reject);

        archive.pipe(outputStream);

        const filesToExport = getEngineFilesFromManifest();

        if (fs.existsSync(engineDir)) {
          if (filesToExport.length > 0) {
            let copiedCount = 0;
            filesToExport.forEach((relPath) => {
              const fullPath = path.join(engineDir, relPath);
              if (fs.existsSync(fullPath)) {
                archive.file(fullPath, { name: `engine/${relPath}` });
                copiedCount++;
              } else {
                console.warn(`[ZIP Export Warning] Modul/Aset tidak ditemukan di engine: ${fullPath}`);
              }
            });
            console.log(`[ZIP Export] Berhasil menambahkan ${copiedCount}/${filesToExport.length} file engine ke ZIP.`);
          } else {
            console.warn(`[ZIP Export Warning] Manifest kosong/tidak ada, menyalin seluruh direktori engine.`);
            archive.directory(engineDir, "engine");
          }
        } else {
          console.error(`[ZIP Export Error] Engine directory tidak ditemukan di: ${engineDir}`);
        }

        // Masukkan file proyek ke folder engine/project/
        archive.directory(projectExtractDir, "engine/project");
        archive.finalize();
      });

      fs.writeFileSync(metadataPath, JSON.stringify({ projectId, updatedAt: validUpdatedAt, lastExported: new Date().toISOString() }));
      cleanup();
      sendFileToClient(targetFilePath);

    } catch (processErr) {
      console.error(`[ZIP Export Error]:`, processErr);
      cleanup();
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: "Gagal memproses ekspor ZIP." });
      }
    }
  });
});

app.post("/api/export-app/exe", (req, res) => {
  exportUpload(req, res, async (err) => {
    if (err) return res.status(400).json({ success: false, error: err.message });
    if (!req.file) return res.status(400).json({ success: false, error: "Payload ZIP proyek tidak ditemukan." });

    const projectId = req.body.projectId;
    const updatedAt = req.body.updatedAt;

    if (!projectId || !updatedAt) {
      return res.status(400).json({ success: false, error: "projectId dan updatedAt wajib dikirim." });
    }

    const projectExportDir = path.join(EXPORTS_DIR, projectId, "exe");
    const targetFilePath = path.join(projectExportDir, `${projectId}.exe`);
    const metadataPath = path.join(projectExportDir, "metadata.json");

    fs.mkdirSync(projectExportDir, { recursive: true });

    const downloadRelativeUrl = `/api/download-app/exe/${projectId}`;

    if (fs.existsSync(targetFilePath) && fs.existsSync(metadataPath)) {
      try {
        const meta = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
        if (meta.updatedAt === updatedAt) {
          console.log(`[EXE Export] Memakai build EXE eksisting untuk proyek: ${projectId}`);
          return res.json({
            success: true,
            message: "Build EXE siap diunduh.",
            downloadUrl: downloadRelativeUrl
          });
        }
        console.log(`[EXE Export] 'updatedAt' berubah, melakukan kompilasi ulang file EXE...`);
      } catch (e) {
        console.warn("[Export Warning] Metadata error, memproses ulang...");
      }
    }

    const jobId = crypto.randomBytes(8).toString("hex");
    const jobFolder = path.join(TEMP_DIR, jobId);
    const engineDir = fs.existsSync("/engine") ? "/engine" : path.resolve(__dirname, "../engine");

    const cleanup = () => {
      if (fs.existsSync(jobFolder)) {
        try { fs.rmSync(jobFolder, { recursive: true, force: true }); } catch {}
      }
    };

    try {
      console.log(`[Job ${jobId}] Menyiapkan workspace runner kompilasi...`);
      fs.cpSync(RUNNER_TEMPLATE_DIR, jobFolder, {
        recursive: true,
        filter: (src) => !src.includes("node_modules") && !src.includes("dist")
      });

      const rootNodeModules = path.join(__dirname, "node_modules");
      const jobNodeModules = path.join(jobFolder, "node_modules");

      if (fs.existsSync(rootNodeModules) && !fs.existsSync(jobNodeModules)) {
        const symlinkType = process.platform === "win32" ? "junction" : "dir";
        try {
          fs.symlinkSync(rootNodeModules, jobNodeModules, symlinkType);
        } catch {
          fs.cpSync(rootNodeModules, jobNodeModules, { recursive: true });
        }
      }

      const runnerWebDir = path.join(jobFolder, "web");
      const projectExtractDir = path.join(runnerWebDir, "project");
      fs.mkdirSync(projectExtractDir, { recursive: true });

      // 1. Ekstrak ZIP proyek dengan aman dari buffer
      await extractZipBuffer(req.file.buffer, projectExtractDir);

      // 2. Salin file engine sesuai pemetaan manifest
      const filesToExport = getEngineFilesFromManifest();
      if (fs.existsSync(engineDir)) {
        if (filesToExport.length > 0) {
          let copiedCount = 0;
          filesToExport.forEach((relPath) => {
            const srcPath = path.join(engineDir, relPath);
            const destPath = path.join(runnerWebDir, relPath);
            if (fs.existsSync(srcPath)) {
              fs.mkdirSync(path.dirname(destPath), { recursive: true });
              fs.copyFileSync(srcPath, destPath);
              copiedCount++;
            } else {
              console.warn(`[EXE Export Warning] Modul/Aset tidak ditemukan di engine: ${srcPath}`);
            }
          });
          console.log(`[EXE Export] Berhasil menyalin ${copiedCount}/${filesToExport.length} file engine ke workspace runner.`);
        } else {
          console.warn(`[EXE Export Warning] Manifest kosong/tidak ada, menyalin seluruh direktori engine.`);
          fs.cpSync(engineDir, runnerWebDir, { recursive: true });
        }
      } else {
        console.error(`[EXE Export Error] Engine directory tidak ditemukan di: ${engineDir}`);
      }

      console.log(`[Job ${jobId}] Menjalankan kompilasi electron-builder ke EXE...`);
      const isWin = process.platform === "win32";
      const cmd = isWin ? "npx.cmd" : "npx";
      const args = [
        "electron-builder",
        "--win",
        "portable",
        "--config.directories.output=dist",
        "--config.compression=normal"
      ];

      const buildProcess = spawn(cmd, args, { cwd: jobFolder, shell: true });

      buildProcess.on("close", (code) => {
        if (code !== 0) {
          cleanup();
          return res.status(500).json({ success: false, error: "Gagal mengompilasi file EXE." });
        }

        const distDir = path.join(jobFolder, "dist");
        const distFiles = fs.existsSync(distDir) ? fs.readdirSync(distDir) : [];
        const exeFile = distFiles.find((f) => f.endsWith(".exe"));

        if (!exeFile) {
          cleanup();
          return res.status(500).json({ success: false, error: "Output EXE tidak ditemukan." });
        }

        const generatedExePath = path.join(distDir, exeFile);

        fs.copyFileSync(generatedExePath, targetFilePath);
        fs.writeFileSync(metadataPath, JSON.stringify({ projectId, updatedAt, lastExported: new Date().toISOString() }));

        cleanup();

        return res.json({
          success: true,
          message: "Kompilasi EXE selesai.",
          downloadUrl: downloadRelativeUrl
        });
      });

    } catch (processErr) {
      console.error(`[EXE Process Error]:`, processErr);
      cleanup();
      if (!res.headersSent) res.status(500).json({ success: false, error: "Gagal memproses ekspor EXE." });
    }
  });
});

app.get("/api/download-app/exe/:projectId", (req, res) => {
  const { projectId } = req.params;
  const filePath = path.join(EXPORTS_DIR, projectId, "exe", `${projectId}.exe`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, error: "File .exe tidak ditemukan atau belum dibuat." });
  }

  res.download(filePath, `${projectId}.exe`, (err) => {
    if (err && !res.headersSent) {
      console.error("[Download Error]:", err);
    }
  });
});

const server = app.listen(PORT, () => {
  console.log(`[Lupis Backend] Micro-backend berjalan di port ${PORT}`);
});

server.timeout = 600000;
server.keepAliveTimeout = 600000;
server.headersTimeout = 605000;