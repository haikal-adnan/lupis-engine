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
      return callback(new Error("Blocked by CORS policy"), false);
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
      cb(new Error("Invalid file format. Only .ttf or .otf files are allowed."), false);
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
    message: "Engine micro-backend is active and ready.",
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
      console.error("[Upload Error]: File not found.");
      return res.status(400).json({ success: false, error: "Font file (.ttf/.otf) not found." });
    }

    const jobId = crypto.randomBytes(8).toString("hex");
    const jobFolder = path.join(TEMP_DIR, jobId);
    fs.mkdirSync(jobFolder, { recursive: true });

    const originalName = req.file.originalname;
    const ext = path.extname(originalName).toLowerCase() || ".ttf";
    const inputFontPath = path.join(jobFolder, `font${ext}`);
    const outputFntPath = path.join(jobFolder, "font.fnt");

    console.log(`\n--------------------------------------------------`);
    console.log(`[Job ${jobId}] Received file: ${originalName} (${(req.file.size / 1024).toFixed(2)} KB)`);

    fs.writeFileSync(inputFontPath, req.file.buffer);

    const msdfBin = path.join(__dirname, "node_modules", ".bin", "msdf-bmfont");
    const cmd = `"${msdfBin}" "${inputFontPath}" -o "${outputFntPath}" --fieldType msdf --texture-size 2048,2048 --distance-range 8 --texture-padding 8 --smart-size --pot --square --overlap`;

    console.log(`[Job ${jobId}] Running MSDF BMFont conversion...`);

    exec(cmd, (error, stdout, stderr) => {
      const cleanup = () => {
        if (fs.existsSync(jobFolder)) {
          fs.rmSync(jobFolder, { recursive: true, force: true });
          console.log(`[Job ${jobId}] Temporary directory cleaned up.`);
        }
      };

      if (error) {
        console.error(`[Job ${jobId}] Conversion error:`, error.message);
        if (stderr) console.error(`[Job ${jobId}] Stderr:`, stderr);
        cleanup();
        return res.status(500).json({ success: false, error: "Failed to process MSDF BMFont generator." });
      }

      if (stdout) console.log(`[Job ${jobId} Stdout]:\n${stdout.trim()}`);

      const files = fs.readdirSync(jobFolder);
      const fntFile = files.find((f) => f.endsWith(".fnt") || f.endsWith(".xml") || f.endsWith(".json"));
      const pngFiles = files.filter((f) => f.endsWith(".png"));

      if (!fntFile || pngFiles.length === 0) {
        console.error(`[Job ${jobId}] Output missing. Existing files:`, files);
        cleanup();
        return res.status(500).json({ success: false, error: "Conversion output not found." });
      }

      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="bmfont-${jobId}.zip"`);

      const archive = archiver("zip", { zlib: { level: 9 } });

      archive.on("error", (archiveErr) => {
        console.error(`[Job ${jobId}] Archive Error:`, archiveErr);
        cleanup();
        if (!res.headersSent) {
          res.status(500).send({ success: false, error: "Failed to create ZIP bundle." });
        }
      });

      res.on("finish", () => {
        console.log(`[Job ${jobId}] Finished. ZIP sent to client.`);
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
 * Reads manifest.runtime.json to map engine modules & assets for export
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
      console.log(`[Manifest Mapping] Successfully mapped ${filesToExport.length} files from manifest.`);
    } catch (e) {
      console.error("[Manifest Error] Failed to read manifest.runtime.json:", e.message);
    }
  } else {
    console.warn(`[Manifest Warning] Manifest file not found at: ${manifestPath}`);
  }
  return filesToExport;
}

/**
 * Stable ZIP extraction helper directly from Buffer
 */
async function extractZipBuffer(zipBuffer, outputDir) {
  const directory = await unzipper.Open.buffer(zipBuffer);
  await directory.extract({ path: outputDir });
}

app.post("/api/export-app/zip", (req, res) => {
  exportUpload(req, res, async (err) => {
    if (err) return res.status(400).json({ success: false, error: err.message });
    if (!req.file) return res.status(400).json({ success: false, error: "Project ZIP payload not found." });

    const { projectId, updatedAt } = req.body;
    const validUpdatedAt = updatedAt || new Date().toISOString();

    if (!projectId) {
      return res.status(400).json({ success: false, error: "projectId is required." });
    }

    const projectExportDir = path.join(EXPORTS_DIR, projectId, "zip");
    const targetFilePath = path.join(projectExportDir, `${projectId}.zip`);
    const metadataPath = path.join(projectExportDir, "metadata.json");

    fs.mkdirSync(projectExportDir, { recursive: true });

    const sendFileToClient = (filePath) => {
      res.download(filePath, `${projectId}.zip`, (downloadErr) => {
        if (downloadErr && !res.headersSent) {
          console.error(`[ZIP Send Error]:`, downloadErr);
          res.status(500).json({ success: false, error: "Failed to download ZIP file." });
        }
      });
    };

    if (fs.existsSync(targetFilePath) && fs.existsSync(metadataPath)) {
      try {
        const meta = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
        if (meta.updatedAt === validUpdatedAt) {
          console.log(`[ZIP Export] Sending ZIP build from cache...`);
          return sendFileToClient(targetFilePath);
        }
      } catch (e) {
        console.warn("[ZIP Export] Metadata error, reprocessing...");
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
      // 1. Extract project ZIP with unzipper.Open.buffer
      await extractZipBuffer(req.file.buffer, projectExtractDir);

      // 2. Create new ZIP bundle containing engine + project files
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
                console.warn(`[ZIP Export Warning] Module/asset not found in engine: ${fullPath}`);
              }
            });
            console.log(`[ZIP Export] Successfully added ${copiedCount}/${filesToExport.length} engine files to ZIP.`);
          } else {
            console.warn(`[ZIP Export Warning] Manifest is empty or missing, copying full engine directory.`);
            archive.directory(engineDir, "engine");
          }
        } else {
          console.error(`[ZIP Export Error] Engine directory not found at: ${engineDir}`);
        }

        // Put project files into engine/project/ folder
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
        res.status(500).json({ success: false, error: "Failed to process ZIP export." });
      }
    }
  });
});

app.post("/api/export-app/exe", (req, res) => {
  exportUpload(req, res, async (err) => {
    if (err) return res.status(400).json({ success: false, error: err.message });
    if (!req.file) return res.status(400).json({ success: false, error: "Project ZIP payload not found." });

    const projectId = req.body.projectId;
    const updatedAt = req.body.updatedAt;

    if (!projectId || !updatedAt) {
      return res.status(400).json({ success: false, error: "projectId and updatedAt are required." });
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
          console.log(`[EXE Export] Using existing EXE build for project: ${projectId}`);
          return res.json({
            success: true,
            message: "EXE build is ready for download.",
            downloadUrl: downloadRelativeUrl
          });
        }
        console.log(`[EXE Export] 'updatedAt' changed, recompiling EXE file...`);
      } catch (e) {
        console.warn("[Export Warning] Metadata error, reprocessing...");
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
      console.log(`[Job ${jobId}] Preparing runner compilation workspace...`);
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

      // 1. Safely extract project ZIP from buffer
      await extractZipBuffer(req.file.buffer, projectExtractDir);

      // 2. Copy engine files according to manifest mapping
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
              console.warn(`[EXE Export Warning] Module/asset not found in engine: ${srcPath}`);
            }
          });
          console.log(`[EXE Export] Successfully copied ${copiedCount}/${filesToExport.length} engine files to runner workspace.`);
        } else {
          console.warn(`[EXE Export Warning] Manifest is empty or missing, copying full engine directory.`);
          fs.cpSync(engineDir, runnerWebDir, { recursive: true });
        }
      } else {
        console.error(`[EXE Export Error] Engine directory not found at: ${engineDir}`);
      }

      console.log(`[Job ${jobId}] Running electron-builder EXE compilation...`);
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
          return res.status(500).json({ success: false, error: "Failed to compile EXE file." });
        }

        const distDir = path.join(jobFolder, "dist");
        const distFiles = fs.existsSync(distDir) ? fs.readdirSync(distDir) : [];
        const exeFile = distFiles.find((f) => f.endsWith(".exe"));

        if (!exeFile) {
          cleanup();
          return res.status(500).json({ success: false, error: "EXE output not found." });
        }

        const generatedExePath = path.join(distDir, exeFile);

        fs.copyFileSync(generatedExePath, targetFilePath);
        fs.writeFileSync(metadataPath, JSON.stringify({ projectId, updatedAt, lastExported: new Date().toISOString() }));

        cleanup();

        return res.json({
          success: true,
          message: "EXE compilation complete.",
          downloadUrl: downloadRelativeUrl
        });
      });

    } catch (processErr) {
      console.error(`[EXE Process Error]:`, processErr);
      cleanup();
      if (!res.headersSent) res.status(500).json({ success: false, error: "Failed to process EXE export." });
    }
  });
});

app.get("/api/download-app/exe/:projectId", (req, res) => {
  const { projectId } = req.params;
  const filePath = path.join(EXPORTS_DIR, projectId, "exe", `${projectId}.exe`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, error: ".exe file not found or not yet generated." });
  }

  res.download(filePath, `${projectId}.exe`, (err) => {
    if (err && !res.headersSent) {
      console.error("[Download Error]:", err);
    }
  });
});

const server = app.listen(PORT, () => {
  console.log(`[Lupis Backend] Micro-backend running on port ${PORT}`);
});

server.timeout = 600000;
server.keepAliveTimeout = 600000;
server.headersTimeout = 605000;