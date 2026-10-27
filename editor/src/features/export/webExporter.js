import JSZip from 'jszip';
import { LUPIS_HEADER, XOR_KEY } from '@utils/constanta.js';
import { encodeLupisProject } from '@utils/projectFormat.js';

export const LUPIS_DATA_HEADER = new Uint8Array([
  0x4C, 0x55, 0x50, 0x49, 0x53, 0x5F, 0x44, 0x41,
  0x54, 0x41, 0x5F, 0x56, 0x31, 0x21, 0x00, 0x00
]); // "LUPIS_DATA_V1!\0\0"

export const LUPIS_XOR_KEY = XOR_KEY; // 0x5A

/**
 * Encodes binary buffer with LUPIS_DATA_HEADER + XOR_KEY (.lupisdata format)
 */
export function encodeToLupisDataBuffer(rawBuffer) {
  const bytes = rawBuffer instanceof Uint8Array ? rawBuffer : new Uint8Array(rawBuffer);
  const out = new Uint8Array(LUPIS_DATA_HEADER.length + bytes.length);
  out.set(LUPIS_DATA_HEADER, 0);
  for (let i = 0; i < bytes.length; i++) {
    out[LUPIS_DATA_HEADER.length + i] = bytes[i] ^ LUPIS_XOR_KEY;
  }
  return out;
}

/**
 * Encodes JavaScript code string using UTF-8 -> XOR_KEY -> Base64
 */
export function encodeObfuscatedCode(codeStr) {
  if (typeof codeStr !== 'string' || !codeStr) return '';
  const encoder = new TextEncoder();
  const rawBytes = encoder.encode(codeStr);
  const masked = new Uint8Array(rawBytes.length);
  for (let i = 0; i < rawBytes.length; i++) {
    masked[i] = rawBytes[i] ^ LUPIS_XOR_KEY;
  }
  let binary = '';
  const len = masked.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(masked[i]);
  }
  return btoa(binary);
}

/**
 * Obfuscates a single script JSON object:
 * - Encodes node JavaScript code into _c (XOR + Base64) and removes plain-text code
 * - Preserves all node runtime payload configurations (values, method, steps, options, cases, etc.)
 * - Strips editor-only canvas layout metadata (position, selected, dragging, width, height, resizing)
 * - Retains node IDs, ports, roles, and settings so ScriptRunner execution logic stays 100% intact
 */
export function obfuscateScriptData(scriptObj) {
  if (!scriptObj || typeof scriptObj !== 'object') return scriptObj;

  const cloned = JSON.parse(JSON.stringify(scriptObj));

  if (Array.isArray(cloned.nodes)) {
    cloned.nodes = cloned.nodes.map((node) => {
      const rawCode = node.code !== undefined ? node.code : (node.data ? node.data.code : undefined);

      let sanitizedCode = '';
      if (typeof rawCode === 'string' && rawCode.trim().length > 0) {
        sanitizedCode = rawCode.trim();
      }

      const encodedCode = sanitizedCode.length > 0
        ? encodeObfuscatedCode(sanitizedCode)
        : (node._c || node.data?._c || '');

      const role = node.role || (
        node.inputs?.some((i) => i.dataType === 'execution')
          ? 'action'
          : (node.outputs?.some((o) => o.dataType === 'execution') ? 'event' : 'pure')
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

      const cleanData = node.data && typeof node.data === 'object' ? { ...node.data } : {};
      delete cleanData.code;
      delete cleanData._c;

      const obfNode = {
        ...node,
        role,
        inputs: cleanInputs,
        outputs: cleanOutputs,
        data: cleanData
      };

      delete obfNode.code;
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
 * Generates the standalone index.html shell that loads the 4 modular JS chunks
 */
export function generateStandaloneIndexHtml(
  gameTitle = 'Lupis Engine Game',
  mode = 'release',
  canvasWidth = 1920,
  canvasHeight = 1080
) {
  const safeTitle = String(gameTitle || 'Lupis Engine Game')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const modeBadge = mode === 'development'
    ? `\n  <!-- Lupis Engine Standalone Web Build (Mode: DEVELOPMENT) -->`
    : '';

  const safeWidth = Number(canvasWidth) || 1920;
  const safeHeight = Number(canvasHeight) || 1080;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/png" href="assets/logo.png" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>${safeTitle}</title>${modeBadge}
  <script>
    globalThis.__LUPIS_CANVAS_CONFIG__ = {
      width: ${safeWidth},
      height: ${safeHeight}
    };
  </script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #000000;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      user-select: none;
      -webkit-user-select: none;
    }
    #canvas_container {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
    #lp_canvas_preview {
      display: block;
      outline: none;
      background: transparent;
      box-shadow: none;
      max-width: 100%;
      max-height: 100%;
    }
    #loading {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #94a3b8;
      background: #0d0f12;
      z-index: 50;
      transition: opacity 0.3s ease;
      padding: 20px;
      text-align: center;
    }
    .spinner {
      width: 36px;
      height: 36px;
      border: 3px solid rgba(148, 163, 184, 0.2);
      border-top-color: #38bdf8;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: 20px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .loading-bar-wrapper {
      width: 240px;
      height: 8px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 9999px;
      overflow: hidden;
      margin-bottom: 12px;
      box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.4);
    }
    .loading-bar-fill {
      width: 0%;
      height: 100%;
      background: linear-gradient(90deg, #0284c7, #38bdf8);
      border-radius: 9999px;
      transition: width 0.15s ease-out;
    }
    #loading-percent {
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.05em;
      color: #94a3b8;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    .hidden { opacity: 0 !important; pointer-events: none !important; }
  </style>
</head>
<body>
  <div id="loading">
    <div class="spinner"></div>
    <div class="loading-bar-wrapper">
      <div id="loading-progress" class="loading-bar-fill"></div>
    </div>
    <div id="loading-percent">0%</div>
  </div>

  <div id="canvas_container">
    <canvas id="lp_canvas_preview" tabindex="0"></canvas>
  </div>

  <script src="./js/lupis.core.js" defer></script>
  <script src="./js/lupis.renderer.js" defer></script>
  <script src="./js/lupis.vm.js" defer></script>
  <script src="./js/lupis.loader.js" defer></script>
</body>
</html>`;
}

// In-memory cache for fetched engine runtime chunks
const inMemoryRuntimeChunks = {
  development: null,
  release: null
};

/**
 * Loads engine runtime chunk content (browser fetch with Node/test fallback)
 */
async function loadEngineRuntimeFile(mode, filename) {
  // Test/Node environment check
  if (typeof process !== 'undefined' && process.versions?.node) {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const candidatePaths = [
        path.resolve(process.cwd(), 'public/engine-runtime', mode, filename),
        path.resolve(process.cwd(), 'editor/public/engine-runtime', mode, filename),
        path.resolve(__dirname, '../../../public/engine-runtime', mode, filename),
        path.resolve(__dirname, '../../../../service/.cache/runtime', mode, filename)
      ];
      for (const p of candidatePaths) {
        if (fs.existsSync(p)) {
          return fs.readFileSync(p, 'utf-8');
        }
      }
    } catch {}
  }

  // Browser fetch
  let fullUrl = `./engine-runtime/${mode}/${filename}`;
  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin || '';
    const base = import.meta.env?.BASE_URL || '/';
    const cleanBase = base.endsWith('/') ? base : `${base}/`;
    fullUrl = `${origin}${cleanBase}engine-runtime/${mode}/${filename}`;
  }

  const res = await fetch(fullUrl);
  if (!res.ok) {
    throw new Error(`Failed to load engine runtime chunk '${filename}' from '${fullUrl}' (${res.status})`);
  }
  return await res.text();
}

/**
 * Fetches all runtime engine chunks for development or release mode
 */
export async function getEngineRuntimeChunks(mode = 'release') {
  const normalizedMode = mode === 'development' ? 'development' : 'release';

  if (inMemoryRuntimeChunks[normalizedMode]) {
    return { ...inMemoryRuntimeChunks[normalizedMode] };
  }

  const fileList = normalizedMode === 'development'
    ? [
        'lupis.core.js',
        'lupis.core.js.map',
        'lupis.loader.js',
        'lupis.loader.js.map',
        'lupis.renderer.js',
        'lupis.renderer.js.map',
        'lupis.vm.js',
        'lupis.vm.js.map'
      ]
    : [
        'lupis.core.js',
        'lupis.loader.js',
        'lupis.renderer.js',
        'lupis.vm.js'
      ];

  const loadedChunks = {};
  await Promise.all(
    fileList.map(async (filename) => {
      const content = await loadEngineRuntimeFile(normalizedMode, filename);
      loadedChunks[`js/${filename}`] = content;
    })
  );

  inMemoryRuntimeChunks[normalizedMode] = loadedChunks;
  return { ...loadedChunks };
}

/**
 * Retrieves default logo blob
 */
async function getDefaultLogo() {
  if (typeof process !== 'undefined' && process.versions?.node) {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const candidatePaths = [
        path.resolve(process.cwd(), 'public/assets/logo.png'),
        path.resolve(process.cwd(), 'editor/public/assets/logo.png'),
        path.resolve(__dirname, '../../../public/assets/logo.png')
      ];
      for (const p of candidatePaths) {
        if (fs.existsSync(p)) {
          return fs.readFileSync(p);
        }
      }
    } catch {}
  }

  try {
    let logoUrl = './assets/logo.png';
    if (typeof window !== 'undefined' && window.location) {
      const origin = window.location.origin || '';
      const base = import.meta.env?.BASE_URL || '/';
      const cleanBase = base.endsWith('/') ? base : `${base}/`;
      logoUrl = `${origin}${cleanBase}assets/logo.png`;
    }
    const res = await fetch(logoUrl);
    if (res.ok) {
      return await res.blob();
    }
  } catch {}

  // 1x1 transparent PNG fallback
  return new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
    0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
    0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82
  ]);
}

/**
 * Builds standalone web ZIP package entirely on the client-side.
 * Matches backend buildUnifiedWebPackage logic and structure exactly:
 * - Development: unminified OPFS data/ structure, raw assets in assets/, source maps (.map) in js/
 * - Release: single encrypted data/game.data, encrypted .lupisdata in assets/, obfuscated scripts, no source maps
 */
export async function buildClientWebPackage({
  projectDirHandle,
  mode = 'release',
  projectName = null,
  onProgress = () => {}
}) {
  const normalizedMode = mode === 'development' ? 'development' : 'release';
  const isRelease = normalizedMode === 'release';

  onProgress(15, 'Reading project configuration and files...');

  // 1. Read project.json for metadata & canvas resolution
  let gameTitle = projectName || 'Lupis Engine Game';
  let canvasWidth = 1920;
  let canvasHeight = 1080;
  let projectJsonObj = null;

  try {
    const projectFileHandle = await projectDirHandle.getFileHandle('project.json');
    const projectFile = await projectFileHandle.getFile();
    projectJsonObj = JSON.parse(await projectFile.text());

    if (projectJsonObj?.name) {
      gameTitle = projectJsonObj.name;
    }
    const uiSettings = projectJsonObj?.settings?.ui;
    if (uiSettings?.width && !isNaN(Number(uiSettings.width)) && Number(uiSettings.width) > 0) {
      canvasWidth = Number(uiSettings.width);
    }
    if (uiSettings?.height && !isNaN(Number(uiSettings.height)) && Number(uiSettings.height) > 0) {
      canvasHeight = Number(uiSettings.height);
    }
  } catch (err) {
    console.warn('[WebExporter] Failed to read project.json:', err);
  }

  // 2. Fetch and add engine runtime chunks
  onProgress(25, 'Loading engine runtime modules...');
  const chunks = await getEngineRuntimeChunks(normalizedMode);

  const mainZip = new JSZip();

  // Add engine chunks under js/
  for (const [relPath, content] of Object.entries(chunks)) {
    mainZip.file(relPath, content);
  }

  // Add index.html and build-info.json
  const indexHtml = generateStandaloneIndexHtml(gameTitle, normalizedMode, canvasWidth, canvasHeight);
  mainZip.file('index.html', indexHtml);
  mainZip.file(
    'build-info.json',
    JSON.stringify({
      gameTitle,
      canvasWidth,
      canvasHeight,
      mode: normalizedMode,
      builtAt: new Date().toISOString()
    }, null, 2)
  );

  // 3. Scan OPFS project entries
  onProgress(35, 'Processing assets and project scenes...');

  // Read workspaces/assets.json if present
  let assetsList = [];
  try {
    const wsDir = await projectDirHandle.getDirectoryHandle('workspaces');
    const assetsHandle = await wsDir.getFileHandle('assets.json');
    const assetsFile = await assetsHandle.getFile();
    const parsedAssets = JSON.parse(await assetsFile.text());
    assetsList = Array.isArray(parsedAssets) ? parsedAssets : (parsedAssets?.items || []);
  } catch {}

  // Read files in assets/ folder
  const assetFilesMap = new Map();
  try {
    const assetsDirHandle = await projectDirHandle.getDirectoryHandle('assets');
    for await (const [name, handle] of assetsDirHandle.entries()) {
      if (handle.kind === 'file') {
        const file = await handle.getFile();
        assetFilesMap.set(name, file);
      }
    }
  } catch {}

  const assetsZipFolder = mainZip.folder('assets');

  if (isRelease) {
    // === RELEASE MODE ===
    // 3A. Protect assets -> .lupisdata and update assetsList
    const processedAssetFileNames = new Set();

    for (const asset of assetsList) {
      if (!asset || !asset.fileKey) continue;
      asset.meta = asset.meta || {};
      delete asset.localBlob;
      delete asset.folderId;
      asset.fileUrl = '';

      if (asset.type === 'font') {
        const fntName = `${asset.fileKey}.fnt`;
        const pngName = `${asset.fileKey}.png`;
        const png0Name = `${asset.fileKey}_0.png`;

        const fntFile = assetFilesMap.get(fntName);
        const actualPngFile = assetFilesMap.get(pngName) || assetFilesMap.get(png0Name);

        const fntDestName = `${asset.fileKey}_fnt.lupisdata`;
        const texDestName = `${asset.fileKey}_tex.lupisdata`;

        if (fntFile) {
          const rawBuf = await fntFile.arrayBuffer();
          const encodedFnt = encodeToLupisDataBuffer(rawBuf);
          assetsZipFolder.file(fntDestName, encodedFnt);
          processedAssetFileNames.add(fntName);
        }

        if (actualPngFile) {
          const rawBuf = await actualPngFile.arrayBuffer();
          const encodedPng = encodeToLupisDataBuffer(rawBuf);
          assetsZipFolder.file(texDestName, encodedPng);
          if (pngName) processedAssetFileNames.add(pngName);
          if (png0Name) processedAssetFileNames.add(png0Name);
        }

        asset.meta.protected = true;
        asset.meta.fntLupisData = fntDestName;
        asset.meta.texLupisData = texDestName;
        delete asset.meta.fntFile;
        delete asset.meta.pngFiles;

      } else {
        const ext = asset.meta.extension || '';
        const rawFileName = `${asset.fileKey}${ext}`;
        const rawFile = assetFilesMap.get(rawFileName);
        const protectedFileName = `${asset.fileKey}.lupisdata`;

        if (rawFile) {
          const rawBuf = await rawFile.arrayBuffer();
          const encoded = encodeToLupisDataBuffer(rawBuf);
          assetsZipFolder.file(protectedFileName, encoded);
          processedAssetFileNames.add(rawFileName);
        }

        asset.meta.protected = true;
        asset.meta.lupisDataFile = protectedFileName;
      }
    }

    // Process any remaining files in assets/ directory
    for (const [fileName, file] of assetFilesMap.entries()) {
      if (processedAssetFileNames.has(fileName)) continue;
      const lower = fileName.toLowerCase();
      if (lower.endsWith('.ttf') || lower.endsWith('.otf')) {
        continue; // Strip raw TTF/OTF in release
      }

      if (lower.endsWith('.lupisdata')) {
        assetsZipFolder.file(fileName, file);
      } else {
        const extIdx = fileName.lastIndexOf('.');
        const ext = extIdx > 0 ? fileName.slice(extIdx).toLowerCase() : '';
        const base = extIdx > 0 ? fileName.slice(0, extIdx) : fileName;
        const targetName = ext === '.fnt' ? `${base}_fnt.lupisdata` : `${base}.lupisdata`;
        const rawBuf = await file.arrayBuffer();
        const encoded = encodeToLupisDataBuffer(rawBuf);
        assetsZipFolder.file(targetName, encoded);
      }
    }

    // Ensure assets/logo.png is added unencrypted
    if (assetFilesMap.has('logo.png')) {
      assetsZipFolder.file('logo.png', assetFilesMap.get('logo.png'));
    } else {
      const defaultLogo = await getDefaultLogo();
      assetsZipFolder.file('logo.png', defaultLogo);
    }

    onProgress(50, 'Obfuscating scripts and compiling game.data binary archive...');

    // 3B. Assemble internal gameDataZip (single encrypted data/game.data)
    const gameDataZip = new JSZip();

    // Cleaned project.json
    if (projectJsonObj) {
      const cleanProj = JSON.parse(JSON.stringify(projectJsonObj));
      delete cleanProj.thumbnailUrl;
      delete cleanProj.snapshotUrl;
      if (cleanProj.settings?.grid) {
        cleanProj.settings.grid.visible = false;
      }
      if (cleanProj.settings) {
        if (!cleanProj.settings.debug) cleanProj.settings.debug = {};
        cleanProj.settings.debug.active = false;
      }
      gameDataZip.file('project.json', JSON.stringify(cleanProj));
    }

    // Process scripts/ -> obfuscated
    try {
      const scriptsDir = await projectDirHandle.getDirectoryHandle('scripts');
      for await (const [name, handle] of scriptsDir.entries()) {
        if (handle.kind === 'file' && name.endsWith('.json')) {
          const file = await handle.getFile();
          try {
            const rawScript = JSON.parse(await file.text());
            const obf = obfuscateScriptData(rawScript);
            gameDataZip.file(`scripts/${name}`, JSON.stringify(obf));
          } catch {
            gameDataZip.file(`scripts/${name}`, file);
          }
        }
      }
    } catch {}

    // Process scenes/ and prefabs/ -> clean folderId & projectId
    for (const sub of ['scenes', 'prefabs']) {
      try {
        const subDir = await projectDirHandle.getDirectoryHandle(sub);
        for await (const [name, handle] of subDir.entries()) {
          if (handle.kind === 'file' && name.endsWith('.json')) {
            const file = await handle.getFile();
            try {
              const data = JSON.parse(await file.text());
              delete data.folderId;
              delete data.projectId;
              gameDataZip.file(`${sub}/${name}`, JSON.stringify(data));
            } catch {
              gameDataZip.file(`${sub}/${name}`, file);
            }
          }
        }
      } catch {}
    }

    // Process workspaces/
    try {
      const wsDir = await projectDirHandle.getDirectoryHandle('workspaces');
      for await (const [name, handle] of wsDir.entries()) {
        if (handle.kind === 'file' && name.endsWith('.json')) {
          if (name === 'folders.json') {
            continue; // Strip folders.json in release
          }

          if (name === 'assets.json') {
            gameDataZip.file('workspaces/assets.json', JSON.stringify(assetsList));
            continue;
          }

          const file = await handle.getFile();
          try {
            let data = JSON.parse(await file.text());
            if (name === 'scripts.json' && Array.isArray(data)) {
              data = data.map((item) => (item.nodes ? obfuscateScriptData(item) : item));
            } else if (Array.isArray(data)) {
              data.forEach((item) => {
                if (item && typeof item === 'object') {
                  delete item.folderId;
                  delete item.projectId;
                }
              });
            }
            gameDataZip.file(`workspaces/${name}`, JSON.stringify(data));
          } catch {
            gameDataZip.file(`workspaces/${name}`, file);
          }
        }
      }
    } catch {}

    // Pack gameDataZip to encrypted binary
    const rawGameDataBlob = await gameDataZip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 }
    });

    const encodedGameDataBlob = await encodeLupisProject(rawGameDataBlob);
    mainZip.folder('data').file('game.data', encodedGameDataBlob);

  } else {
    // === DEVELOPMENT MODE ===
    // Raw assets in assets/
    for (const [fileName, file] of assetFilesMap.entries()) {
      assetsZipFolder.file(fileName, file);
    }
    if (!assetFilesMap.has('logo.png')) {
      const defaultLogo = await getDefaultLogo();
      assetsZipFolder.file('logo.png', defaultLogo);
    }

    onProgress(50, 'Structuring unminified development data package...');

    // Cleaned assetsList for dev
    for (const asset of assetsList) {
      if (!asset) continue;
      delete asset.localBlob;
      asset.fileUrl = '';
      if (asset.meta) {
        asset.meta.protected = false;
      }
    }

    // Open OPFS structure in data/
    const dataZipFolder = mainZip.folder('data');

    // Recursively add OPFS directory into dataZipFolder
    const addDirToZip = async (dirHandle, targetZipFolder, currentPath = '') => {
      for await (const [name, handle] of dirHandle.entries()) {
        const fullRelPath = currentPath ? `${currentPath}/${name}` : name;
        if (name === 'assets' && !currentPath) {
          continue; // Assets are placed in root assets/
        }

        if (handle.kind === 'file') {
          if (fullRelPath === 'workspaces/assets.json') {
            targetZipFolder.file(name, JSON.stringify(assetsList, null, 2));
            continue;
          }
          const file = await handle.getFile();
          targetZipFolder.file(name, file);
        } else if (handle.kind === 'directory') {
          const subFolder = targetZipFolder.folder(name);
          await addDirToZip(handle, subFolder, fullRelPath);
        }
      }
    };

    await addDirToZip(projectDirHandle, dataZipFolder);
  }

  // 4. Final ZIP compression
  onProgress(65, 'Compressing standalone web ZIP package (0%)...');

  const finalBlob = await mainZip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 }
    },
    (metadata) => {
      if (metadata && typeof metadata.percent === 'number') {
        const mapped = Math.round(65 + metadata.percent * 0.3);
        onProgress(Math.min(mapped, 95), `Compressing standalone web ZIP package (${Math.round(metadata.percent)}%)...`);
      }
    }
  );

  return finalBlob;
}
