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

const LUPIS_PROJECT_HEADER = Buffer.from([
  0x4C, 0x55, 0x50, 0x49, 0x53, 0x5F, 0x50, 0x52,
  0x4F, 0x4A, 0x45, 0x43, 0x54, 0x31, 0x21, 0x00
]); // "LUPIS_PROJECT1!\0"

const LUPIS_DATA_HEADER = Buffer.from([
  0x4C, 0x55, 0x50, 0x49, 0x53, 0x5F, 0x44, 0x41,
  0x54, 0x41, 0x5F, 0x56, 0x31, 0x21, 0x00, 0x00
]); // "LUPIS_DATA_V1!\0\0"

const XOR_KEY = 0x5A;

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
  limits: { fileSize: 20 * 1024 * 1024 },
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

function isValidProjectId(projectId) {
  return typeof projectId === "string" && /^[a-zA-Z0-9_-]+$/.test(projectId);
}

function resolveEngineDir() {
  if (fs.existsSync("/engine")) return "/engine";
  const coreDir = path.resolve(__dirname, "../core");
  if (fs.existsSync(coreDir)) return coreDir;
  return path.resolve(__dirname, "../engine");
}

/**
 * Retrieves engine file buffer from disk, with fallback to core HTTP service
 */
async function getEngineFileBuffer(relPath, engineDir) {
  if (engineDir && fs.existsSync(engineDir)) {
    const fullPath = path.join(engineDir, relPath);
    if (fs.existsSync(fullPath)) {
      return fs.readFileSync(fullPath);
    }
  }

  const candidateUrls = [
    process.env.CORE_URL ? `${process.env.CORE_URL.replace(/\/$/, "")}/${relPath}` : null,
    `http://core/${relPath}`,
    `http://lupis-core/${relPath}`,
    `http://localhost:8080/${relPath}`
  ].filter(Boolean);

  for (const url of candidateUrls) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const ab = await res.arrayBuffer();
        return Buffer.from(ab);
      }
    } catch {}
  }

  return null;
}

/**
 * Encodes a raw Buffer with LUPIS_DATA_HEADER + XOR_KEY (.lupisdata format)
 */
function encodeToLupisDataBuffer(rawBuffer) {
  const out = Buffer.allocUnsafe(LUPIS_DATA_HEADER.length + rawBuffer.length);
  LUPIS_DATA_HEADER.copy(out, 0);
  for (let i = 0; i < rawBuffer.length; i++) {
    out[LUPIS_DATA_HEADER.length + i] = rawBuffer[i] ^ XOR_KEY;
  }
  return out;
}

/**
 * Encodes a raw ZIP Buffer with LUPIS_PROJECT_HEADER + XOR_KEY (.lupisproject format)
 */
function encodeToLupisProjectBuffer(zipBuffer) {
  const out = Buffer.allocUnsafe(LUPIS_PROJECT_HEADER.length + zipBuffer.length);
  LUPIS_PROJECT_HEADER.copy(out, 0);
  for (let i = 0; i < zipBuffer.length; i++) {
    out[LUPIS_PROJECT_HEADER.length + i] = zipBuffer[i] ^ XOR_KEY;
  }
  return out;
}

/**
 * Encodes JS code string using UTF-8 -> XOR_KEY -> Base64
 */
function encodeObfuscatedCode(codeStr) {
  if (typeof codeStr !== "string" || !codeStr) return "";
  const rawBytes = Buffer.from(codeStr, "utf-8");
  const masked = Buffer.allocUnsafe(rawBytes.length);
  for (let i = 0; i < rawBytes.length; i++) {
    masked[i] = rawBytes[i] ^ XOR_KEY;
  }
  return masked.toString("base64");
}

/**
 * Obfuscates a single script JSON object:
 * - Mangles node IDs (_0x0, _0x1, ...) and updates edge source/target references
 * - Encodes node JavaScript code into _c (XOR + Base64) and removes plain-text code
 * - Strips all editor layout metadata (position, x, y, width, height, labels, titles, comments)
 */
export function obfuscateScriptData(scriptObj) {
  if (!scriptObj || typeof scriptObj !== "object") return scriptObj;

  const cloned = JSON.parse(JSON.stringify(scriptObj));
  const nodeIdMap = new Map();

  if (Array.isArray(cloned.nodes)) {
    cloned.nodes.forEach((node, idx) => {
      if (node && node.id) {
        nodeIdMap.set(node.id, `_0x${idx.toString(16)}`);
      }
    });

    cloned.nodes = cloned.nodes.map((node) => {
      const rawCode = node.code !== undefined ? node.code : (node.data ? node.data.code : undefined);
      const encodedCode = typeof rawCode === "string" && rawCode.length > 0
        ? encodeObfuscatedCode(rawCode)
        : (node._c || node.data?._c || "");

      const role = node.role || (
        node.inputs?.some((i) => i.dataType === "execution")
          ? "action"
          : (node.outputs?.some((o) => o.dataType === "execution") ? "event" : "pure")
      );

      const cleanInputs = Array.isArray(node.inputs)
        ? node.inputs.map((port) => {
            const p = { id: port.id, dataType: port.dataType };
            if (port.defaultValue !== undefined) p.defaultValue = port.defaultValue;
            if (port.source !== undefined) p.source = port.source;
            return p;
          })
        : [];

      const cleanOutputs = Array.isArray(node.outputs)
        ? node.outputs.map((port) => ({
            id: port.id,
            dataType: port.dataType
          }))
        : [];

      const cleanData = {};
      if (node.data && typeof node.data === "object") {
        if (node.data.values && Object.keys(node.data.values).length > 0) {
          cleanData.values = node.data.values;
        }
        if (node.data.valueModes && Object.keys(node.data.valueModes).length > 0) {
          cleanData.valueModes = node.data.valueModes;
        }
        if (node.data.variableBindings && Object.keys(node.data.variableBindings).length > 0) {
          cleanData.variableBindings = node.data.variableBindings;
        }
        if (node.data.variableModifiers && Object.keys(node.data.variableModifiers).length > 0) {
          cleanData.variableModifiers = node.data.variableModifiers;
        }
      }

      const obfNode = {
        id: nodeIdMap.get(node.id) || node.id,
        type: node.type,
        role,
        inputs: cleanInputs,
        outputs: cleanOutputs
      };

      if (encodedCode) {
        obfNode._c = encodedCode;
      }
      if (Object.keys(cleanData).length > 0) {
        obfNode.data = cleanData;
      }

      return obfNode;
    });
  }

  if (Array.isArray(cloned.edges)) {
    cloned.edges = cloned.edges.map((edge) => {
      const cleanEdge = {
        source: nodeIdMap.get(edge.source) || edge.source,
        sourceHandle: edge.sourceHandle,
        target: nodeIdMap.get(edge.target) || edge.target,
        targetHandle: edge.targetHandle
      };
      if (edge.modifier) {
        cleanEdge.modifier = edge.modifier;
      }
      return cleanEdge;
    });
  }

  delete cloned.folderId;
  delete cloned.projectId;
  delete cloned.description;

  return cloned;
}

/**
 * Processes an extracted project directory for release export:
 * 1. Obfuscates all blueprint node JSONs in scripts/*.json and workspaces/scripts.json
 * 2. Converts all assets in assets/* into .lupisdata binary format and strips raw .png/.ttf/.fnt/.ogg
 * 3. Minifies project.json, scenes/*.json, prefabs/*.json, and strips editor-only metadata
 */
export function obfuscateAndProtectProject(projectDir) {
  // 1. Obfuscate scripts/*.json
  const scriptsDir = path.join(projectDir, "scripts");
  if (fs.existsSync(scriptsDir)) {
    const scriptFiles = fs.readdirSync(scriptsDir).filter((f) => f.endsWith(".json"));
    for (const file of scriptFiles) {
      const fullPath = path.join(scriptsDir, file);
      try {
        const raw = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
        const obfuscated = obfuscateScriptData(raw);
        fs.writeFileSync(fullPath, JSON.stringify(obfuscated));
      } catch (err) {
        console.warn(`[Obfuscator] Failed to obfuscate script ${file}:`, err.message);
      }
    }
  }

  // 2. Protect assets in assets/ -> .lupisdata and update workspaces/assets.json
  const assetsDir = path.join(projectDir, "assets");
  const workspacesDir = path.join(projectDir, "workspaces");
  const assetsJsonPath = path.join(workspacesDir, "assets.json");

  if (fs.existsSync(assetsJsonPath)) {
    try {
      const assetsRaw = JSON.parse(fs.readFileSync(assetsJsonPath, "utf-8"));
      const assetsList = Array.isArray(assetsRaw) ? assetsRaw : (assetsRaw?.items || []);

      for (const asset of assetsList) {
        if (!asset || !asset.fileKey) continue;
        asset.meta = asset.meta || {};
        delete asset.localBlob;
        delete asset.folderId;
        asset.fileUrl = "";

        if (asset.type === "font") {
          const fntSrc = path.join(assetsDir, `${asset.fileKey}.fnt`);
          const pngSrc = path.join(assetsDir, `${asset.fileKey}.png`);
          const png0Src = path.join(assetsDir, `${asset.fileKey}_0.png`);
          const ttfSrc = path.join(assetsDir, `${asset.fileKey}.ttf`);
          const otfSrc = path.join(assetsDir, `${asset.fileKey}.otf`);

          const fntDestName = `${asset.fileKey}_fnt.lupisdata`;
          const texDestName = `${asset.fileKey}_tex.lupisdata`;

          if (fs.existsSync(fntSrc)) {
            const encodedFnt = encodeToLupisDataBuffer(fs.readFileSync(fntSrc));
            fs.writeFileSync(path.join(assetsDir, fntDestName), encodedFnt);
            fs.unlinkSync(fntSrc);
          }

          const actualPngSrc = fs.existsSync(pngSrc) ? pngSrc : (fs.existsSync(png0Src) ? png0Src : null);
          if (actualPngSrc) {
            const encodedPng = encodeToLupisDataBuffer(fs.readFileSync(actualPngSrc));
            fs.writeFileSync(path.join(assetsDir, texDestName), encodedPng);
            fs.unlinkSync(actualPngSrc);
          }

          if (fs.existsSync(ttfSrc)) fs.unlinkSync(ttfSrc);
          if (fs.existsSync(otfSrc)) fs.unlinkSync(otfSrc);

          asset.meta.protected = true;
          asset.meta.fntLupisData = fntDestName;
          asset.meta.texLupisData = texDestName;
          delete asset.meta.fntFile;
          delete asset.meta.pngFiles;
        } else {
          const ext = asset.meta.extension || "";
          const rawFileName = `${asset.fileKey}${ext}`;
          const rawFilePath = path.join(assetsDir, rawFileName);
          const protectedFileName = `${asset.fileKey}.lupisdata`;
          const protectedFilePath = path.join(assetsDir, protectedFileName);

          if (fs.existsSync(rawFilePath)) {
            const encoded = encodeToLupisDataBuffer(fs.readFileSync(rawFilePath));
            fs.writeFileSync(protectedFilePath, encoded);
            if (rawFilePath !== protectedFilePath) {
              fs.unlinkSync(rawFilePath);
            }
          }

          asset.meta.protected = true;
          asset.meta.lupisDataFile = protectedFileName;
        }
      }

      fs.writeFileSync(assetsJsonPath, JSON.stringify(assetsList));
    } catch (err) {
      console.warn(`[Obfuscator] Failed to process workspaces/assets.json:`, err.message);
    }
  }

  // Sweep any remaining non-.lupisdata files in assets/
  if (fs.existsSync(assetsDir)) {
    const remainingFiles = fs.readdirSync(assetsDir);
    for (const file of remainingFiles) {
      if (file.endsWith(".lupisdata")) continue;
      const fullPath = path.join(assetsDir, file);
      if (!fs.statSync(fullPath).isFile()) continue;

      const ext = path.extname(file).toLowerCase();
      const baseName = path.basename(file, path.extname(file));
      if (ext === ".ttf" || ext === ".otf") {
        fs.unlinkSync(fullPath);
        continue;
      }

      const targetName = ext === ".fnt" ? `${baseName}_fnt.lupisdata` : `${baseName}.lupisdata`;
      const targetPath = path.join(assetsDir, targetName);
      if (!fs.existsSync(targetPath)) {
        const encoded = encodeToLupisDataBuffer(fs.readFileSync(fullPath));
        fs.writeFileSync(targetPath, encoded);
      }
      fs.unlinkSync(fullPath);
    }
  }

  // 3. Minify & clean project.json, scenes, prefabs, workspaces
  const projectJsonPath = path.join(projectDir, "project.json");
  if (fs.existsSync(projectJsonPath)) {
    try {
      const proj = JSON.parse(fs.readFileSync(projectJsonPath, "utf-8"));
      delete proj.thumbnailUrl;
      delete proj.snapshotUrl;
      if (proj.settings?.grid) {
        proj.settings.grid.visible = false;
      }
      fs.writeFileSync(projectJsonPath, JSON.stringify(proj));
    } catch {}
  }

  const foldersJsonPath = path.join(workspacesDir, "folders.json");
  if (fs.existsSync(foldersJsonPath)) {
    try { fs.unlinkSync(foldersJsonPath); } catch {}
  }

  for (const sub of ["scenes", "prefabs"]) {
    const subDir = path.join(projectDir, sub);
    if (fs.existsSync(subDir)) {
      for (const f of fs.readdirSync(subDir).filter((name) => name.endsWith(".json"))) {
        const p = path.join(subDir, f);
        try {
          const data = JSON.parse(fs.readFileSync(p, "utf-8"));
          delete data.folderId;
          delete data.projectId;
          fs.writeFileSync(p, JSON.stringify(data));
        } catch {}
      }
    }
  }

  for (const wsFile of ["scenes.json", "prefabs.json", "scripts.json"]) {
    const wsPath = path.join(workspacesDir, wsFile);
    if (fs.existsSync(wsPath)) {
      try {
        let data = JSON.parse(fs.readFileSync(wsPath, "utf-8"));
        if (wsFile === "scripts.json" && Array.isArray(data)) {
          data = data.map((item) => (item.nodes ? obfuscateScriptData(item) : item));
        }
        fs.writeFileSync(wsPath, JSON.stringify(data));
      } catch {}
    }
  }
}

/**
 * Packs a directory into a .lupisproject Buffer (LUPIS_PROJECT_HEADER + XOR_KEY over DEFLATE ZIP)
 */
async function packDirectoryToLupisProjectFile(sourceDir, outputFilePath) {
  const zipBuffer = await new Promise((resolve, reject) => {
    const chunks = [];
    const archive = archiver("zip", { zlib: { level: 9 } });

    archive.on("data", (chunk) => chunks.push(chunk));
    archive.on("end", () => resolve(Buffer.concat(chunks)));
    archive.on("error", reject);

    archive.directory(sourceDir, false);
    archive.finalize();
  });

  const lupisProjectBuffer = encodeToLupisProjectBuffer(zipBuffer);
  fs.writeFileSync(outputFilePath, lupisProjectBuffer);
}

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
      const errorMessage = err.code === "LIMIT_FILE_SIZE"
        ? "Font file is too large. Maximum size allowed is 20MB."
        : err.message;
      return res.status(400).json({ success: false, error: errorMessage });
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
    const primarySize = 32;

    const cleanup = () => {
      if (fs.existsSync(jobFolder)) {
        fs.rmSync(jobFolder, { recursive: true, force: true });
        console.log(`[Job ${jobId}] Temporary directory cleaned up.`);
      }
    };

    const runConversion = (fontSize, isRetry = false) => {
      const cmd = `"${msdfBin}" "${inputFontPath}" -o "${outputFntPath}" -s ${fontSize} --fieldType msdf --texture-size 2048,2048 --distance-range 8 --texture-padding 8 --smart-size --pot --square`;

      console.log(`[Job ${jobId}] Running MSDF BMFont conversion (size: ${fontSize}px${isRetry ? ', retry' : ''})...`);

      exec(cmd, { timeout: 15000, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
        if (error) {
          if (!isRetry) {
            console.warn(`[Job ${jobId}] Conversion attempt at ${fontSize}px failed: ${error.message}. Retrying with alternate size (34px)...`);
            return runConversion(34, true);
          }
          console.error(`[Job ${jobId}] Conversion error:`, error.message);
          if (stderr) console.error(`[Job ${jobId}] Stderr:`, stderr);
          cleanup();
          if (error.killed || error.signal === "SIGTERM") {
            return res.status(504).json({ success: false, error: "Font conversion timed out (20 seconds)." });
          }
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
    };

    runConversion(primarySize);
  });
});

/**
 * Reads manifest.runtime.json to map engine modules & assets for export
 */
function getEngineFilesFromManifest() {
  const manifestPath = path.join(__dirname, "config", "manifest.runtime.json");
  const fileSet = new Set(["index.html", "Runtime.js"]);

  if (fs.existsSync(manifestPath)) {
    try {
      const manifestData = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      if (manifestData.entry) {
        Object.values(manifestData.entry).forEach((f) => {
          if (f) fileSet.add(f);
        });
      }
      if (manifestData.modules && Array.isArray(manifestData.modules)) {
        manifestData.modules.forEach((f) => fileSet.add(f));
      }
      if (manifestData.assets) {
        Object.values(manifestData.assets).forEach((assetList) => {
          if (Array.isArray(assetList)) {
            assetList.forEach((f) => fileSet.add(f));
          }
        });
      }
      console.log(`[Manifest Mapping] Successfully mapped ${fileSet.size} engine files from manifest.`);
    } catch (e) {
      console.error("[Manifest Error] Failed to read manifest.runtime.json:", e.message);
    }
  } else {
    console.warn(`[Manifest Warning] Manifest file not found at: ${manifestPath}`);
  }
  return Array.from(fileSet);
}

/**
 * Stable ZIP extraction helper directly from Buffer with Zip Slip protection
 */
async function extractZipBuffer(zipBuffer, outputDir) {
  const directory = await unzipper.Open.buffer(zipBuffer);
  const resolvedBase = path.resolve(outputDir);

  for (const file of directory.files) {
    const normalizedEntry = file.path.replace(/\\/g, "/");
    if (normalizedEntry.includes("..") || normalizedEntry.startsWith("/")) {
      throw new Error(`[Security Error] Invalid ZIP entry path: ${file.path}`);
    }
    const targetPath = path.resolve(outputDir, normalizedEntry);
    if (!targetPath.startsWith(resolvedBase)) {
      throw new Error(`[Security Error] Zip Slip traversal blocked: ${file.path}`);
    }
  }

  await directory.extract({ path: outputDir });
}

app.post("/api/export-app/zip", (req, res) => {
  exportUpload(req, res, async (err) => {
    if (err) return res.status(400).json({ success: false, error: err.message });
    if (!req.file) return res.status(400).json({ success: false, error: "Project ZIP payload not found." });

    const { projectId, updatedAt } = req.body;
    const validUpdatedAt = updatedAt || new Date().toISOString();

    if (!projectId || !isValidProjectId(projectId)) {
      return res.status(400).json({ success: false, error: "Valid projectId is required." });
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
        if (meta.updatedAt === validUpdatedAt && meta.schema === "obfuscated-v2") {
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
    const engineDir = resolveEngineDir();

    fs.mkdirSync(projectExtractDir, { recursive: true });

    const cleanup = () => {
      if (fs.existsSync(jobFolder)) {
        try { fs.rmSync(jobFolder, { recursive: true, force: true }); } catch {}
      }
    };

    try {
      // 1. Extract project ZIP with Zip Slip check
      await extractZipBuffer(req.file.buffer, projectExtractDir);

      // 2. Obfuscate node JSONs & convert assets to .lupisdata
      obfuscateAndProtectProject(projectExtractDir);

      // 3. Create new Web Standalone ZIP with index.html at root + ./project
      await new Promise(async (resolve, reject) => {
        const outputStream = fs.createWriteStream(targetFilePath);
        const archive = archiver("zip", { zlib: { level: 9 } });

        outputStream.on("close", resolve);
        outputStream.on("error", reject);
        archive.on("error", reject);

        archive.pipe(outputStream);

        const filesToExport = getEngineFilesFromManifest();

        let gameTitle = "Lupis Engine Game";
        try {
          const projectJsonPath = path.join(projectExtractDir, "project.json");
          if (fs.existsSync(projectJsonPath)) {
            const pData = JSON.parse(fs.readFileSync(projectJsonPath, "utf-8"));
            if (pData.name) gameTitle = pData.name;
          }
        } catch {}

        let copiedCount = 0;
        for (const relPath of filesToExport) {
          const fileBuf = await getEngineFileBuffer(relPath, engineDir);
          if (fileBuf) {
            if (relPath === "index.html") {
              let indexContent = fileBuf.toString("utf-8");
              indexContent = indexContent.replace(
                /<title>.*?<\/title>/i,
                `<title>${gameTitle.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</title>`
              );
              archive.append(indexContent, { name: "index.html" });
            } else {
              archive.append(fileBuf, { name: relPath });
            }
            copiedCount++;
          } else {
            console.warn(`[ZIP Export Warning] Module/asset not found: ${relPath}`);
          }
        }
        console.log(`[ZIP Export] Successfully added ${copiedCount}/${filesToExport.length} engine files to ZIP root.`);

        // Put obfuscated project files into ./project/ folder at ZIP root (matching index.html PROJECT_FOLDER = "./project")
        archive.directory(projectExtractDir, "project");
        archive.finalize();
      });

      fs.writeFileSync(
        metadataPath,
        JSON.stringify({
          projectId,
          updatedAt: validUpdatedAt,
          schema: "obfuscated-v2",
          lastExported: new Date().toISOString()
        })
      );
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

    if (!projectId || !updatedAt || !isValidProjectId(projectId)) {
      return res.status(400).json({ success: false, error: "Valid projectId and updatedAt are required." });
    }

    const projectExportDir = path.join(EXPORTS_DIR, projectId, "exe");
    const targetFilePath = path.join(projectExportDir, `${projectId}.exe`);
    const metadataPath = path.join(projectExportDir, "metadata.json");

    fs.mkdirSync(projectExportDir, { recursive: true });

    const downloadRelativeUrl = `/api/download-app/exe/${projectId}`;

    if (fs.existsSync(targetFilePath) && fs.existsSync(metadataPath)) {
      try {
        const meta = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
        if (meta.updatedAt === updatedAt && meta.schema === "obfuscated-v2") {
          console.log(`[EXE Export] Using existing EXE build for project: ${projectId}`);
          return res.json({
            success: true,
            message: "EXE build is ready for download.",
            downloadUrl: downloadRelativeUrl
          });
        }
        console.log(`[EXE Export] 'updatedAt' or schema changed, recompiling EXE file...`);
      } catch (e) {
        console.warn("[Export Warning] Metadata error, reprocessing...");
      }
    }

    const jobId = crypto.randomBytes(8).toString("hex");
    const jobFolder = path.join(TEMP_DIR, jobId);
    const engineDir = resolveEngineDir();

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
      const tempProjectExtractDir = path.join(jobFolder, "raw_project");
      fs.mkdirSync(runnerWebDir, { recursive: true });
      fs.mkdirSync(tempProjectExtractDir, { recursive: true });

      // 1. Safely extract project ZIP into temporary folder
      await extractZipBuffer(req.file.buffer, tempProjectExtractDir);

      // 2. Obfuscate node JSONs and convert assets to .lupisdata
      obfuscateAndProtectProject(tempProjectExtractDir);

      // 3. Bundle the obfuscated project into an embedded binary container (web/game.lupisproject)
      //    and remove the loose raw_project directory so no raw project folder exists!
      const embeddedLupisProjectPath = path.join(runnerWebDir, "game.lupisproject");
      await packDirectoryToLupisProjectFile(tempProjectExtractDir, embeddedLupisProjectPath);
      fs.rmSync(tempProjectExtractDir, { recursive: true, force: true });

      // 4. Copy engine runtime files according to manifest mapping
      const filesToExport = getEngineFilesFromManifest();
      let copiedCount = 0;
      for (const relPath of filesToExport) {
        const fileBuf = await getEngineFileBuffer(relPath, engineDir);
        if (fileBuf) {
          const destPath = path.join(runnerWebDir, relPath);
          fs.mkdirSync(path.dirname(destPath), { recursive: true });
          fs.writeFileSync(destPath, fileBuf);
          copiedCount++;
        } else {
          console.warn(`[EXE Export Warning] Module/asset not found: ${relPath}`);
        }
      }
      console.log(`[EXE Export] Successfully copied ${copiedCount}/${filesToExport.length} engine files to runner workspace.`);

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

      buildProcess.stdout?.on("data", (d) => console.log(`[electron-builder stdout]: ${d.toString()}`));
      buildProcess.stderr?.on("data", (d) => console.error(`[electron-builder stderr]: ${d.toString()}`));

      buildProcess.on("close", (code) => {
        if (code !== 0) {
          console.error(`[Job ${jobId}] electron-builder exited with code ${code}`);
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
        fs.writeFileSync(
          metadataPath,
          JSON.stringify({
            projectId,
            updatedAt,
            schema: "obfuscated-v2",
            lastExported: new Date().toISOString()
          })
        );

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
  if (!isValidProjectId(projectId)) {
    return res.status(400).json({ success: false, error: "Invalid projectId." });
  }

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
