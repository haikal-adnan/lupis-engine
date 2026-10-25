const { app, BrowserWindow, protocol, session, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const zlib = require('zlib');

const LUPIS_PROJECT_HEADER = Buffer.from([
  0x4C, 0x55, 0x50, 0x49, 0x53, 0x5F, 0x50, 0x52,
  0x4F, 0x4A, 0x45, 0x43, 0x54, 0x31, 0x21, 0x00
]);
const XOR_KEY = 0x5A;

const virtualProjectFiles = new Map();

function loadEmbeddedLupisProject() {
  const embeddedArchivePath = path.join(__dirname, 'web', 'game.lupisproject');
  if (!fs.existsSync(embeddedArchivePath)) return;

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
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    title: 'Lupis Engine Standalone',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      devTools: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.webContents.on('before-input-event', (event, input) => {
    const isDevToolsShortcut =
      input.key === 'F12' ||
      ((input.control || input.meta) && input.shift && ['I', 'J', 'C'].includes(input.key.toUpperCase()));
    if (isDevToolsShortcut) {
      event.preventDefault();
    }
  });

  mainWindow.loadURL('app://localhost/index.html');
}

app.whenReady().then(() => {
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

    if (normalizedRel.startsWith('project/') && virtualProjectFiles.size > 0) {
      const virtualKey = normalizedRel.slice('project/'.length);
      if (virtualProjectFiles.has(virtualKey)) {
        return respondBuffer(virtualProjectFiles.get(virtualKey), virtualKey);
      }
    }

    const embeddedPath = path.join(__dirname, 'web', relativePath);
    if (fs.existsSync(embeddedPath) && fs.statSync(embeddedPath).isFile()) {
      return respondFile(embeddedPath);
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
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.wasm': 'application/wasm',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.lupisdata': 'application/octet-stream',
    '.lupisproject': 'application/octet-stream'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}
