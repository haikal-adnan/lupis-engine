const { app, BrowserWindow, protocol, session } = require('electron');
const path = require('path');
const fs = require('fs');

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
      webSecurity: true
    }
  });

  mainWindow.loadURL('app://localhost/index.html');
}

app.whenReady().then(() => {
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

function respondFile(filePath) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const mimeType = getMimeType(filePath);

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
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
    '.ogg': 'audio/ogg'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}