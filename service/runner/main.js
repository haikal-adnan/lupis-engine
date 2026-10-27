const { app, BrowserWindow, protocol, session, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const zlib = require('zlib');

const LUPIS_PROJECT_HEADER = Buffer.from([
  0x4C, 0x55, 0x50, 0x49, 0x53, 0x5F, 0x50, 0x52,
  0x4F, 0x4A, 0x45, 0x43, 0x54, 0x31, 0x21, 0x00
]);
const XOR_KEY = 0x5A;

const virtualProjectFiles = new Map();
let runnerBuildInfo = {
  mode: 'release',
  gameTitle: 'Lupis Engine Standalone',
  canvasWidth: 1920,
  canvasHeight: 1080
};

function loadRunnerBuildInfo() {
  const buildInfoPath = path.join(__dirname, 'web', 'build-info.json');
  if (fs.existsSync(buildInfoPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(buildInfoPath, 'utf-8'));
      if (parsed && typeof parsed === 'object') {
        runnerBuildInfo = { ...runnerBuildInfo, ...parsed };
      }
    } catch (err) {
      console.warn('[Lupis Runner] Failed to parse build-info.json:', err);
    }
  }
  const devProjectJsonPath = path.join(__dirname, 'web', 'data', 'project.json');
  if (fs.existsSync(devProjectJsonPath)) {
    runnerBuildInfo.mode = 'development';
    try {
      const pData = JSON.parse(fs.readFileSync(devProjectJsonPath, 'utf-8'));
      if (pData && typeof pData === 'object') {
        if (pData.name && !runnerBuildInfo.gameTitle) runnerBuildInfo.gameTitle = pData.name;
        if (pData.settings?.ui?.width) runnerBuildInfo.canvasWidth = Number(pData.settings.ui.width);
        if (pData.settings?.ui?.height) runnerBuildInfo.canvasHeight = Number(pData.settings.ui.height);
      }
    } catch {}
  }
}

function loadEmbeddedLupisProject() {
  const candidateArchives = [
    path.join(__dirname, 'web', 'data', 'game.data'),
    path.join(__dirname, 'web', 'game.lupisproject')
  ];
  const embeddedArchivePath = candidateArchives.find((p) => fs.existsSync(p));
  if (!embeddedArchivePath) return;

  try {
    const rawBuffer = fs.readFileSync(embeddedArchivePath);
    if (rawBuffer.length < LUPIS_PROJECT_HEADER.length) return;

    for (let i = 0; i < LUPIS_PROJECT_HEADER.length; i++) {
      if (rawBuffer[i] !== LUPIS_PROJECT_HEADER[i]) {
        console.error('[Lupis Runner] Invalid game.lupisproject magic header.');
        return;
      }
    }

    const zipBuffer = Buffer.allocUnsafe(rawBuffer.length - LUPIS_PROJECT_HEADER.length);
    for (let i = 0; i < zipBuffer.length; i++) {
      zipBuffer[i] = rawBuffer[LUPIS_PROJECT_HEADER.length + i] ^ XOR_KEY;
    }

    let eocdOffset = -1;
    for (let i = zipBuffer.length - 22; i >= 0; i--) {
      if (zipBuffer.readUInt32LE(i) === 0x06054b50) {
        eocdOffset = i;
        break;
      }
    }
    if (eocdOffset === -1) return;

    const totalEntries = zipBuffer.readUInt16LE(eocdOffset + 10);
    let cdOffset = zipBuffer.readUInt32LE(eocdOffset + 16);

    for (let i = 0; i < totalEntries; i++) {
      if (zipBuffer.readUInt32LE(cdOffset) !== 0x02014b50) break;

      const compressionMethod = zipBuffer.readUInt16LE(cdOffset + 10);
      const compressedSize = zipBuffer.readUInt32LE(cdOffset + 20);
      const fileNameLen = zipBuffer.readUInt16LE(cdOffset + 28);
      const extraLen = zipBuffer.readUInt16LE(cdOffset + 30);
      const commentLen = zipBuffer.readUInt16LE(cdOffset + 32);
      const localHeaderOffset = zipBuffer.readUInt32LE(cdOffset + 42);

      const entryName = zipBuffer
        .subarray(cdOffset + 46, cdOffset + 46 + fileNameLen)
        .toString('utf-8')
        .replace(/\\/g, '/')
        .replace(/^\/+/, '');

      cdOffset += 46 + fileNameLen + extraLen + commentLen;

      if (entryName.endsWith('/')) continue;

      const localFileNameLen = zipBuffer.readUInt16LE(localHeaderOffset + 26);
      const localExtraLen = zipBuffer.readUInt16LE(localHeaderOffset + 28);
      const dataStart = localHeaderOffset + 30 + localFileNameLen + localExtraLen;
      const compressedSlice = zipBuffer.subarray(dataStart, dataStart + compressedSize);

      let fileBuffer;
      if (compressionMethod === 0) {
        fileBuffer = Buffer.from(compressedSlice);
      } else if (compressionMethod === 8) {
        fileBuffer = zlib.inflateRawSync(compressedSlice);
      } else {
        continue;
      }

      virtualProjectFiles.set(entryName, fileBuffer);
    }

    // Inspect project.json from embedded archive for game title and canvas dimensions
    const projectJsonBuffer = virtualProjectFiles.get('project.json') || virtualProjectFiles.get('data/project.json');
    if (projectJsonBuffer) {
      try {
        const pData = JSON.parse(projectJsonBuffer.toString('utf-8'));
        if (pData && typeof pData === 'object') {
          if (pData.name && !runnerBuildInfo.gameTitle) runnerBuildInfo.gameTitle = pData.name;
          if (pData.settings?.ui?.width) runnerBuildInfo.canvasWidth = Number(pData.settings.ui.width);
          if (pData.settings?.ui?.height) runnerBuildInfo.canvasHeight = Number(pData.settings.ui.height);
        }
      } catch {}
    }
  } catch (err) {
    console.error('[Lupis Runner] Failed to unpack embedded game.lupisproject:', err);
  }
}

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true
    }
  }
]);

function createWindow() {
  const isDevMode = runnerBuildInfo.mode === 'development';
  const baseTitle = runnerBuildInfo.gameTitle || 'Lupis Engine Standalone';
  const windowTitle = isDevMode ? `${baseTitle} [Development]` : baseTitle;

  const iconPath = path.join(__dirname, 'icon.png');
  const iconFallback = path.join(__dirname, 'web', 'assets', 'logo.png');
  const windowIcon = fs.existsSync(iconPath) ? iconPath : (fs.existsSync(iconFallback) ? iconFallback : undefined);

  const canvasW = Math.max(1, Number(runnerBuildInfo.canvasWidth) || 1280);
  const canvasH = Math.max(1, Number(runnerBuildInfo.canvasHeight) || 720);
  const aspectRatio = canvasW / canvasH;

  // Compute initial window dimensions fitted within primary display work area while preserving aspect ratio
  let winW = canvasW;
  let winH = canvasH;

  try {
    const primaryDisplay = screen.getPrimaryDisplay();
    const workArea = primaryDisplay ? primaryDisplay.workAreaSize : null;
    if (workArea && workArea.width > 0 && workArea.height > 0) {
      const maxAllowedWidth = Math.floor(workArea.width * 0.9);
      const maxAllowedHeight = Math.floor(workArea.height * 0.9);
      if (winW > maxAllowedWidth || winH > maxAllowedHeight) {
        const scale = Math.min(maxAllowedWidth / winW, maxAllowedHeight / winH);
        winW = Math.round(winW * scale);
        winH = Math.round(winW / aspectRatio);
      }
    }
  } catch (err) {
    console.warn('[Lupis Runner] Failed to query screen work area:', err);
  }

  const minW = Math.max(320, Math.round(180 * aspectRatio));
  const minH = Math.max(180, Math.round(320 / aspectRatio));

  const mainWindow = new BrowserWindow({
    width: winW,
    height: winH,
    useContentSize: true, // Content viewport matches canvas size and aspect ratio directly
    minWidth: minW,
    minHeight: minH,
    resizable: true,
    center: true,
    title: windowTitle,
    icon: windowIcon,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      devTools: isDevMode,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Remove default application menu so no invisible native menu bar takes up space
  mainWindow.removeMenu();

  function getFrameSize() {
    try {
      const [w, h] = mainWindow.getSize();
      const [cw, ch] = mainWindow.getContentSize();
      return {
        width: Math.max(0, w - cw),
        height: Math.max(0, h - ch)
      };
    } catch {
      return { width: 16, height: 39 };
    }
  }

  // Intercept window resizing so that the CONTENT viewport strictly follows the canvas aspect ratio
  mainWindow.on('will-resize', (event, newBounds, details) => {
    if (mainWindow.isFullScreen() || mainWindow.isMaximized()) return;
    const frame = getFrameSize();
    const edge = details ? details.edge : '';

    if (edge === 'top' || edge === 'bottom') {
      const targetContentH = Math.max(minH, newBounds.height - frame.height);
      const targetContentW = Math.round(targetContentH * aspectRatio);
      newBounds.width = targetContentW + frame.width;
    } else {
      const targetContentW = Math.max(minW, newBounds.width - frame.width);
      const targetContentH = Math.round(targetContentW / aspectRatio);
      newBounds.height = targetContentH + frame.height;
    }
  });

  const initialFrame = getFrameSize();
  mainWindow.setAspectRatio(aspectRatio, { width: initialFrame.width, height: initialFrame.height });

  const sendWindowState = () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('window:state-changed', {
        isMaximized: mainWindow.isMaximized(),
        isFullScreen: mainWindow.isFullScreen()
      });
    }
  };

  mainWindow.on('maximize', () => {
    mainWindow.setAspectRatio(0);
    sendWindowState();
  });
  mainWindow.on('unmaximize', () => {
    const f = getFrameSize();
    mainWindow.setAspectRatio(aspectRatio, { width: f.width, height: f.height });
    sendWindowState();
  });
  mainWindow.on('enter-full-screen', () => {
    mainWindow.setAspectRatio(0);
    sendWindowState();
  });
  mainWindow.on('leave-full-screen', () => {
    const f = getFrameSize();
    mainWindow.setAspectRatio(aspectRatio, { width: f.width, height: f.height });
    sendWindowState();
  });

  mainWindow.webContents.on('did-finish-load', () => {
    sendWindowState();
  });

  mainWindow.webContents.on('before-input-event', (event, input) => {
    // Toggle full screen / windowed mode with F11
    if (input.key === 'F11' && input.type === 'keyDown') {
      event.preventDefault();
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
      return;
    }

    const isDevToolsShortcut =
      input.key === 'F12' ||
      ((input.control || input.meta) && input.shift && ['I', 'J', 'C'].includes(input.key.toUpperCase()));
    if (isDevToolsShortcut) {
      if (isDevMode) {
        if (input.type === 'keyDown') {
          mainWindow.webContents.toggleDevTools();
        }
      } else {
        event.preventDefault();
      }
    }
  });

  if (!isDevMode) {
    mainWindow.webContents.on('context-menu', (event) => {
      event.preventDefault();
    });
  }

  mainWindow.loadURL('app://localhost/index.html');
}

app.whenReady().then(() => {
  loadRunnerBuildInfo();
  loadEmbeddedLupisProject();

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Access-Control-Allow-Origin': ['*'],
        'Access-Control-Allow-Headers': ['*'],
        'Access-Control-Allow-Methods': ['GET, POST, PUT, DELETE, OPTIONS']
      }
    });
  });

  protocol.handle('app', (request) => {
    const url = new URL(request.url);
    let relativePath = decodeURIComponent(url.pathname);

    if (relativePath === '/' || !relativePath) {
      relativePath = 'index.html';
    } else if (relativePath.startsWith('/')) {
      relativePath = relativePath.slice(1);
    }

    const normalizedRel = relativePath.replace(/\\/g, '/');

    const embeddedPath = path.join(__dirname, 'web', relativePath);
    if (fs.existsSync(embeddedPath) && fs.statSync(embeddedPath).isFile()) {
      return respondFile(embeddedPath);
    }

    if ((normalizedRel.startsWith('data/') || normalizedRel.startsWith('project/')) && virtualProjectFiles.size > 0) {
      const prefix = normalizedRel.startsWith('data/') ? 'data/' : 'project/';
      const virtualKey = normalizedRel.slice(prefix.length);
      if (virtualProjectFiles.has(virtualKey)) {
        return respondBuffer(virtualProjectFiles.get(virtualKey), virtualKey);
      }
    }

    const exeDir = path.dirname(app.getPath('exe'));
    const externalPath = path.join(exeDir, relativePath);
    if (fs.existsSync(externalPath) && fs.statSync(externalPath).isFile()) {
      return respondFile(externalPath);
    }

    console.error(`[Lupis Runner 404] File not found: ${relativePath}`);
    return new Response(`404 - File Not Found: ${relativePath}`, {
      status: 404,
      headers: { 'Content-Type': 'text/plain' }
    });
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.on('app:quit', () => {
  app.quit();
});

ipcMain.on('screen:change', (event, mode) => {
  const win = BrowserWindow.fromWebContents(event.sender) || BrowserWindow.getFocusedWindow();
  if (win) {
    if (mode === 'fullscreen' || mode === 'Full Screen') {
      win.setFullScreen(true);
    } else {
      win.setFullScreen(false);
    }
  }
});

ipcMain.handle('window:get-state', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender) || BrowserWindow.getFocusedWindow();
  return {
    isMaximized: win ? win.isMaximized() : false,
    isFullScreen: win ? win.isFullScreen() : false
  };
});

ipcMain.on('window:set-aspect-ratio', (event, data) => {
  const win = BrowserWindow.fromWebContents(event.sender) || BrowserWindow.getFocusedWindow();
  if (win && data) {
    const width = Number(data.width);
    const height = Number(data.height);
    if (width > 0 && height > 0) {
      const newRatio = width / height;
      runnerBuildInfo.canvasWidth = width;
      runnerBuildInfo.canvasHeight = height;
      if (!win.isMaximized() && !win.isFullScreen()) {
        win.setAspectRatio(newRatio);
      }
    }
  }
});

function respondBuffer(fileBuffer, filePath) {
  const mimeType = getMimeType(filePath);
  return new Response(fileBuffer, {
    status: 200,
    headers: {
      'Content-Type': mimeType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
}

function respondFile(filePath) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    return respondBuffer(fileBuffer, filePath);
  } catch (err) {
    return new Response('500 - Internal Server Error', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.mjs': 'text/javascript',
    '.map': 'application/json',
    '.css': 'text/css',
    '.json': 'application/json',
    '.fnt': 'application/xml',
    '.xml': 'application/xml',
    '.ttf': 'font/ttf',
    '.otf': 'font/otf',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.wasm': 'application/wasm',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.data': 'application/octet-stream',
    '.lupisdata': 'application/octet-stream',
    '.lupisproject': 'application/octet-stream'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}
