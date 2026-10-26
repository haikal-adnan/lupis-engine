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
import { minify as terserMinify } from "terser";
import {
  buildUnifiedWebPackage,
  getOrBuildCachedEngineChunks,
  processProjectDataForExport,
  generateStandaloneIndexHtml
} from "./bundler/engineBundler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

const TEMP_DIR = path.resolve(__dirname, "./temp");
const EXPORTS_DIR = path.resolve(__dirname, "./exports");
const RUNNER_TEMPLATE_DIR = path.resolve(__dirname, "./runner");
const CACHE_DIR = path.resolve(__dirname, "./.cache");
const RUNNER_WORKSPACE_CACHE_BASE = path.resolve(CACHE_DIR, "./runner-workspace");

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
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
if (!fs.existsSync(RUNNER_WORKSPACE_CACHE_BASE)) fs.mkdirSync(RUNNER_WORKSPACE_CACHE_BASE, { recursive: true });

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
 * - Encodes node JavaScript code into _c (XOR + Base64) and removes plain-text code
 * - Preserves all node runtime payload configurations (values, method, steps, options, cases, etc.)
 * - Strips editor-only canvas layout metadata (position, selected, dragging, width, height, resizing)
 * - Retains node IDs, ports, roles, and settings so ScriptRunner execution logic stays 100% intact
 */
export async function obfuscateScriptData(scriptObj) {
  if (!scriptObj || typeof scriptObj !== "object") return scriptObj;

  const cloned = JSON.parse(JSON.stringify(scriptObj));

  if (Array.isArray(cloned.nodes)) {
    cloned.nodes = cloned.nodes.map((node) => {
      const rawCode = node.code !== undefined ? node.code : (node.data ? node.data.code : undefined);

      // Clean & preserve exact runtime code, avoiding destructive AST compression
      let sanitizedCode = "";
      if (typeof rawCode === "string" && rawCode.trim().length > 0) {
        sanitizedCode = rawCode.trim();
      }

      // Encode code safely into _c (XOR + Base64) for protection against plain-text inspection
      const encodedCode = sanitizedCode.length > 0
        ? encodeObfuscatedCode(sanitizedCode)
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

      // Preserve all node payload configuration (values, method, steps, cases, branches, options, formats, etc.)
      const cleanData = node.data && typeof node.data === "object" ? { ...node.data } : {};
      delete cleanData.code;
      delete cleanData._c;

      const obfNode = {
        ...node,
        role,
        inputs: cleanInputs,
        outputs: cleanOutputs,
        data: cleanData
      };

      // Strip plain-text code so it is protected
      delete obfNode.code;

      // Strip editor-only canvas layout metadata to reduce payload
      delete obfNode.position;
      delete obfNode.selected;
      delete obfNode.dragging;
      delete obfNode.width;
      delete obfNode.height;
      delete obfNode.resizing;

      if (encodedCode) {
        obfNode._c = encodedCode;
      }

      return obfNode;
    });
  }

  if (Array.isArray(cloned.edges)) {
    cloned.edges = cloned.edges.map((edge) => {
      const cleanEdge = {
        id: edge.id,
        source: edge.source,
        sourceHandle: edge.sourceHandle,
        target: edge.target,
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
export async function obfuscateAndProtectProject(projectDir) {
  // 1. Obfuscate scripts/*.json
  const scriptsDir = path.join(projectDir, "scripts");
  if (fs.existsSync(scriptsDir)) {
    const scriptFiles = fs.readdirSync(scriptsDir).filter((f) => f.endsWith(".json"));
    for (const file of scriptFiles) {
      const fullPath = path.join(scriptsDir, file);
      try {
        const raw = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
        const obfuscated = await obfuscateScriptData(raw);
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
      if (proj.settings) {
        if (!proj.settings.debug) proj.settings.debug = {};
        proj.settings.debug.active = false;
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
          data = await Promise.all(data.map((item) => (item.nodes ? obfuscateScriptData(item) : item)));
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

const runnerWorkspaceReadyPromises = new Map();

/**
 * Pre-populates and caches a complete runner workspace per mode ('development' / 'release'):
 * - runner/main.js, runner/preload.js, runner/package.json
 * - symlinked node_modules
 * - web/js/ pre-populated with cached engine chunks (lupis.*.js + .map in dev)
 */
async function ensureRunnerWorkspaceCache(buildMode) {
  const normalizedMode = buildMode === "development" ? "development" : "release";
  const modeWorkspace = path.join(RUNNER_WORKSPACE_CACHE_BASE, normalizedMode);
  const modeWebJsDir = path.join(modeWorkspace, "web", "js");
  const engineDir = resolveEngineDir();
  const filesToExport = getEngineFilesFromManifest();

  if (runnerWorkspaceReadyPromises.has(normalizedMode)) {
    return await runnerWorkspaceReadyPromises.get(normalizedMode);
  }

  const prepPromise = (async () => {
    // 1. Get or build cached engine runtime chunks
    const runtimeChunks = await getOrBuildCachedEngineChunks({
      filesToExport,
      engineDir,
      getEngineFileBufferFn: getEngineFileBuffer,
      mode: normalizedMode,
      cacheDir: CACHE_DIR
    });

    // 2. Prepare workspace structure
    fs.mkdirSync(modeWebJsDir, { recursive: true });

    // Copy template runner files (main.js, preload.js, package.json)
    fs.cpSync(RUNNER_TEMPLATE_DIR, modeWorkspace, {
      recursive: true,
      filter: (src) => !src.includes("node_modules") && !src.includes("dist") && !src.includes("web")
    });

    // Symlink root node_modules into the cached runner workspace
    const rootNodeModules = path.join(__dirname, "node_modules");
    const cacheNodeModules = path.join(modeWorkspace, "node_modules");
    if (fs.existsSync(rootNodeModules) && !fs.existsSync(cacheNodeModules)) {
      const symlinkType = process.platform === "win32" ? "junction" : "dir";
      try {
        fs.symlinkSync(rootNodeModules, cacheNodeModules, symlinkType);
      } catch {
        fs.cpSync(rootNodeModules, cacheNodeModules, { recursive: true });
      }
    }

    // Populate web/js/ with pre-bundled engine chunks
    for (const [relFile, content] of Object.entries(runtimeChunks)) {
      const targetPath = path.join(modeWorkspace, "web", relFile.replace(/^web\//, ""));
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      fs.writeFileSync(targetPath, content, "utf-8");
    }

    return { modeWorkspace, runtimeChunks };
  })();

  runnerWorkspaceReadyPromises.set(normalizedMode, prepPromise);
  try {
    return await prepPromise;
  } finally {
    runnerWorkspaceReadyPromises.delete(normalizedMode);
  }
}

/**
 * Rapidly prepares jobFolder directly from pre-populated runner workspace cache (< 10ms)
 */
function prepareJobFolderFromRunnerCache(jobFolder, buildMode) {
  const normalizedMode = buildMode === "development" ? "development" : "release";
  const modeWorkspace = path.join(RUNNER_WORKSPACE_CACHE_BASE, normalizedMode);

  // Fast copy runner files and pre-populated web/js/
  fs.cpSync(modeWorkspace, jobFolder, {
    recursive: true,
    filter: (src) => !src.includes("node_modules") && !src.includes("dist")
  });

  // Link node_modules directly to root node_modules
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
}

app.post("/api/export-app/zip", (req, res) => {
  exportUpload(req, res, async (err) => {
    if (err) return res.status(400).json({ success: false, error: err.message });
    if (!req.file) return res.status(400).json({ success: false, error: "Project ZIP payload not found." });

    const { projectId, updatedAt, mode, projectName } = req.body;
    const validUpdatedAt = updatedAt || new Date().toISOString();
    const buildMode = mode === "development" ? "development" : "release";
    const schemaVersion = `unified-v3-${buildMode}`;

    if (!projectId || !isValidProjectId(projectId)) {
      return res.status(400).json({ success: false, error: "Valid projectId is required." });
    }

    const projectExportDir = path.join(EXPORTS_DIR, projectId, `zip-${buildMode}`);
    const targetFilePath = path.join(projectExportDir, `${projectId}_${buildMode}.zip`);
    const metadataPath = path.join(projectExportDir, "metadata.json");

    fs.mkdirSync(projectExportDir, { recursive: true });

    const sendFileToClient = (filePath, customName = null) => {
      const effectiveName = customName || projectName || projectId;
      const safeName = String(effectiveName).trim().replace(/[/\\?%*:|"<>]/g, '').replace(/\s+/g, '_') || projectId;
      const modeLabel = buildMode === "development" ? "Development" : "Release";
      res.download(filePath, `${safeName}_${modeLabel}.zip`, (downloadErr) => {
        if (downloadErr && !res.headersSent) {
          console.error(`[ZIP Send Error]:`, downloadErr);
          res.status(500).json({ success: false, error: "Failed to download ZIP file." });
        }
      });
    };

    if (fs.existsSync(targetFilePath) && fs.existsSync(metadataPath)) {
      try {
        const meta = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
        if (meta.updatedAt === validUpdatedAt && meta.schema === schemaVersion) {
          console.log(`[ZIP Export] Sending ${buildMode.toUpperCase()} ZIP build from cache...`);
          return sendFileToClient(targetFilePath, projectName || meta.projectName);
        }
      } catch (e) {
        console.warn("[ZIP Export] Metadata error, reprocessing...");
      }
    }

    const jobId = crypto.randomBytes(8).toString("hex");
    const jobFolder = path.join(TEMP_DIR, jobId);
    const projectExtractDir = path.join(jobFolder, "raw_project");
    const webPackageDir = path.join(jobFolder, "web_package");
    const engineDir = resolveEngineDir();

    fs.mkdirSync(projectExtractDir, { recursive: true });
    fs.mkdirSync(webPackageDir, { recursive: true });

    const cleanup = () => {
      if (fs.existsSync(jobFolder)) {
        try { fs.rmSync(jobFolder, { recursive: true, force: true }); } catch {}
      }
    };

    try {
      // 1. Extract project ZIP with Zip Slip check
      await extractZipBuffer(req.file.buffer, projectExtractDir);

      // 2. Build unified web package (index.html, js/lupis.*.js, data/, assets/)
      const filesToExport = getEngineFilesFromManifest();
      const webPkgResult = await buildUnifiedWebPackage({
        projectExtractDir,
        outputDir: webPackageDir,
        mode: buildMode,
        filesToExport,
        engineDir,
        getEngineFileBufferFn: getEngineFileBuffer,
        obfuscateAndProtectProjectFn: obfuscateAndProtectProject,
        packDirectoryToLupisProjectFileFn: packDirectoryToLupisProjectFile,
        cacheDir: CACHE_DIR
      });

      // 3. Archive unified web package into standalone ZIP
      await new Promise((resolve, reject) => {
        const outputStream = fs.createWriteStream(targetFilePath);
        const archive = archiver("zip", { zlib: { level: 9 } });

        outputStream.on("close", resolve);
        outputStream.on("error", reject);
        archive.on("error", reject);

        archive.pipe(outputStream);
        archive.directory(webPackageDir, false);
        archive.finalize();
      });

      const finalProjectName = webPkgResult?.gameTitle || projectName || projectId;
      const safeProjectName = String(finalProjectName).trim().replace(/[/\\?%*:|"<>]/g, '').replace(/\s+/g, '_') || projectId;

      fs.writeFileSync(
        metadataPath,
        JSON.stringify({
          projectId,
          projectName: safeProjectName,
          mode: buildMode,
          updatedAt: validUpdatedAt,
          schema: schemaVersion,
          lastExported: new Date().toISOString()
        })
      );
      cleanup();
      sendFileToClient(targetFilePath, safeProjectName);

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
    const clientProjectName = req.body.projectName;
    const buildMode = req.body.mode === "development" ? "development" : "release";
    const schemaVersion = `unified-v3-${buildMode}`;

    if (!projectId || !updatedAt || !isValidProjectId(projectId)) {
      return res.status(400).json({ success: false, error: "Valid projectId and updatedAt are required." });
    }

    const projectExportDir = path.join(EXPORTS_DIR, projectId, `exe-${buildMode}`);
    const targetFilePath = path.join(projectExportDir, `${projectId}_${buildMode}.exe`);
    const metadataPath = path.join(projectExportDir, "metadata.json");

    fs.mkdirSync(projectExportDir, { recursive: true });

    if (fs.existsSync(targetFilePath) && fs.existsSync(metadataPath)) {
      try {
        const meta = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
        if (meta.updatedAt === updatedAt && meta.schema === schemaVersion) {
          console.log(`[EXE Export] Using existing ${buildMode.toUpperCase()} EXE build for project: ${projectId}`);
          const effectiveName = clientProjectName || meta.projectName || projectId;
          const safeName = String(effectiveName).trim().replace(/[/\\?%*:|"<>]/g, '').replace(/\s+/g, '_');
          const downloadRelativeUrl = `/api/download-app/exe/${projectId}?mode=${buildMode}&name=${encodeURIComponent(safeName)}`;
          return res.json({
            success: true,
            mode: buildMode,
            message: `EXE (${buildMode}) build is ready for download.`,
            downloadUrl: downloadRelativeUrl
          });
        }
        console.log(`[EXE Export] 'updatedAt' or schema changed, recompiling ${buildMode.toUpperCase()} EXE file...`);
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
      console.log(`[Job ${jobId}] Preparing cached runner workspace (${buildMode.toUpperCase()})...`);
      // 1. Ensure pre-cached runner workspace template is ready and warm
      await ensureRunnerWorkspaceCache(buildMode);

      // 2. Fast initialize jobFolder (< 10ms) with runner files and pre-bundled runtime in web/js/
      prepareJobFolderFromRunnerCache(jobFolder, buildMode);

      const runnerWebDir = path.join(jobFolder, "web");
      const tempProjectExtractDir = path.join(jobFolder, "raw_project");
      fs.mkdirSync(tempProjectExtractDir, { recursive: true });

      // Ensure Electron icon from editor assets or runner template
      const editorLogoPath = path.resolve(__dirname, "../editor/public/assets/logo.png");
      const runnerIconPath = path.join(RUNNER_TEMPLATE_DIR, "icon.png");
      const jobIconPath = path.join(jobFolder, "icon.png");
      if (!fs.existsSync(jobIconPath)) {
        if (fs.existsSync(editorLogoPath)) {
          fs.copyFileSync(editorLogoPath, jobIconPath);
        } else if (fs.existsSync(runnerIconPath)) {
          fs.copyFileSync(runnerIconPath, jobIconPath);
        }
      }

      // 3. Extract uploaded project ZIP into temporary folder
      await extractZipBuffer(req.file.buffer, tempProjectExtractDir);

      // 4. In 1 single pass: process project data directly into jobFolder/web
      const { gameTitle, canvasWidth, canvasHeight } = await processProjectDataForExport({
        projectExtractDir: tempProjectExtractDir,
        outputDir: runnerWebDir,
        mode: buildMode,
        obfuscateAndProtectProjectFn: obfuscateAndProtectProject,
        packDirectoryToLupisProjectFileFn: packDirectoryToLupisProjectFile
      });

      // Remove temporary extraction folder
      fs.rmSync(tempProjectExtractDir, { recursive: true, force: true });

      // 5. Generate index.html shell (with project title & canvas dimensions) & write build-info.json
      const effectiveAppTitle = gameTitle || clientProjectName || "Lupis Engine Game";
      const safeAppTitle = String(effectiveAppTitle).trim().replace(/[/\\?%*:|"<>]/g, '').replace(/\s+/g, '_');
      const safePkgName = safeAppTitle.toLowerCase().replace(/[^a-z0-9_-]/g, "-").replace(/^-+|-+$/g, "") || "lupis-game";

      // Update package.json in jobFolder so electron-builder uses project name as product and application name
      const jobPkgPath = path.join(jobFolder, "package.json");
      if (fs.existsSync(jobPkgPath)) {
        try {
          const jobPkg = JSON.parse(fs.readFileSync(jobPkgPath, "utf-8"));
          jobPkg.name = safePkgName;
          jobPkg.productName = effectiveAppTitle;
          if (!jobPkg.build) jobPkg.build = {};
          jobPkg.build.productName = effectiveAppTitle;
          if (jobPkg.build.win) {
            jobPkg.build.win.executableName = safeAppTitle;
          }
          fs.writeFileSync(jobPkgPath, JSON.stringify(jobPkg, null, 2), "utf-8");
        } catch (pkgErr) {
          console.warn(`[Job ${jobId}] Failed to update runner package.json:`, pkgErr.message);
        }
      }

      const indexHtml = generateStandaloneIndexHtml(effectiveAppTitle, buildMode, canvasWidth, canvasHeight);
      fs.writeFileSync(path.join(runnerWebDir, "index.html"), indexHtml, "utf-8");

      fs.writeFileSync(
        path.join(runnerWebDir, "build-info.json"),
        JSON.stringify({
          projectId,
          gameTitle: effectiveAppTitle,
          canvasWidth,
          canvasHeight,
          mode: buildMode,
          updatedAt,
          builtAt: new Date().toISOString()
        }, null, 2),
        "utf-8"
      );

      console.log(`[Job ${jobId}] Running single-pass electron-builder EXE compilation (${buildMode.toUpperCase()})...`);
      const isWin = process.platform === "win32";
      const cmd = isWin ? "npx.cmd" : "npx";
      const args = [
        "electron-builder",
        "--win",
        "portable",
        "--config.directories.output=dist",
        "--config.compression=normal",
        "--config.win.icon=icon.png"
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
        const downloadRelativeUrl = `/api/download-app/exe/${projectId}?mode=${buildMode}&name=${encodeURIComponent(safeAppTitle)}`;

        fs.copyFileSync(generatedExePath, targetFilePath);
        fs.writeFileSync(
          metadataPath,
          JSON.stringify({
            projectId,
            projectName: safeAppTitle,
            mode: buildMode,
            updatedAt,
            schema: schemaVersion,
            lastExported: new Date().toISOString()
          })
        );

        cleanup();

        return res.json({
          success: true,
          mode: buildMode,
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

app.delete("/api/export-app/cache/:projectId", (req, res) => {
  const { projectId } = req.params;
  if (!isValidProjectId(projectId)) {
    return res.status(400).json({ success: false, error: "Invalid projectId." });
  }

  const projectExportDir = path.join(EXPORTS_DIR, projectId);
  if (fs.existsSync(projectExportDir)) {
    try {
      fs.rmSync(projectExportDir, { recursive: true, force: true });
      console.log(`[Export Cache] Cleared build cache for project: ${projectId}`);
    } catch (err) {
      console.warn(`[Export Cache] Failed to clear build cache for project ${projectId}:`, err.message);
    }
  }

  res.json({ success: true, message: `Build cache for project '${projectId}' cleared.` });
});

app.get("/api/export-app/status/:projectId", (req, res) => {
  const { projectId } = req.params;
  if (!isValidProjectId(projectId)) {
    return res.status(400).json({ success: false, error: "Invalid projectId." });
  }

  const checkMode = (buildMode) => {
    const projectExportDir = path.join(EXPORTS_DIR, projectId, `exe-${buildMode}`);
    const targetFilePath = path.join(projectExportDir, `${projectId}_${buildMode}.exe`);
    const metadataPath = path.join(projectExportDir, "metadata.json");
    if (fs.existsSync(targetFilePath) && fs.existsSync(metadataPath)) {
      try {
        const meta = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
        const safeName = String(meta.projectName || projectId).trim().replace(/[/\\?%*:|"<>]/g, '').replace(/\s+/g, '_');
        return `/api/download-app/exe/${projectId}?mode=${buildMode}&name=${encodeURIComponent(safeName)}`;
      } catch {}
    }
    return null;
  };

  const devUrl = checkMode("development");
  const relUrl = checkMode("release");

  res.json({
    success: true,
    projectId,
    builds: {
      development: devUrl,
      release: relUrl
    }
  });
});

app.get("/api/download-app/exe/:projectId", (req, res) => {
  const { projectId } = req.params;
  const buildMode = req.query.mode === "development" ? "development" : "release";

  if (!isValidProjectId(projectId)) {
    return res.status(400).json({ success: false, error: "Invalid projectId." });
  }

  let filePath = path.join(EXPORTS_DIR, projectId, `exe-${buildMode}`, `${projectId}_${buildMode}.exe`);
  if (!fs.existsSync(filePath)) {
    const legacyPath = path.join(EXPORTS_DIR, projectId, "exe", `${projectId}.exe`);
    if (fs.existsSync(legacyPath)) {
      filePath = legacyPath;
    }
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, error: ".exe file not found or not yet generated." });
  }

  let projectName = req.query.name;
  if (!projectName) {
    const metadataPath = path.join(EXPORTS_DIR, projectId, `exe-${buildMode}`, "metadata.json");
    if (fs.existsSync(metadataPath)) {
      try {
        const meta = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
        if (meta.projectName) projectName = meta.projectName;
      } catch {}
    }
  }

  const safeName = String(projectName || projectId).trim().replace(/[/\\?%*:|"<>]/g, '').replace(/\s+/g, '_');
  const modeLabel = buildMode === "development" ? "Development" : "Release";
  const downloadFileName = `${safeName}_${modeLabel}.exe`;

  res.download(filePath, downloadFileName, (err) => {
    if (err && !res.headersSent) {
      console.error("[Download Error]:", err);
    }
  });
});

async function warmupRuntimeCaches() {
  try {
    const engineDir = resolveEngineDir();
    const filesToExport = getEngineFilesFromManifest();
    console.log("[Lupis Backend] Warming up pre-bundled engine runtime caches...");
    await Promise.all([
      getOrBuildCachedEngineChunks({
        filesToExport,
        engineDir,
        getEngineFileBufferFn: getEngineFileBuffer,
        mode: "release",
        cacheDir: CACHE_DIR
      }),
      getOrBuildCachedEngineChunks({
        filesToExport,
        engineDir,
        getEngineFileBufferFn: getEngineFileBuffer,
        mode: "development",
        cacheDir: CACHE_DIR
      })
    ]);
    await Promise.all([
      ensureRunnerWorkspaceCache("release"),
      ensureRunnerWorkspaceCache("development")
    ]);
    console.log("[Lupis Backend] Engine runtime & runner workspace caches are warm and ready.");
  } catch (err) {
    console.warn("[Lupis Backend] Cache warmup warning:", err.message);
  }
}

if (!process.env.VITEST && process.argv[1] && process.argv[1].includes("server.js")) {
  const server = app.listen(PORT, () => {
    console.log(`[Lupis Backend] Micro-backend running on port ${PORT}`);
    warmupRuntimeCaches();
  });

  server.timeout = 600000;
  server.keepAliveTimeout = 600000;
  server.headersTimeout = 605000;
}
