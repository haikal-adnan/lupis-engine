const { app, protocol, BrowserWindow, ipcMain, shell, net } = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');
const http = require('http');
const { fork } = require('child_process');

let mainWindow = null;
let backendProcess = null;

// 1. Register 'app' custom scheme as standard & secure (Crucial for OPFS & Web Storage APIs)
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      standard: true,
      secure: true,
      allowServiceWorkers: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true
    }
  }
]);

// Helper: Determine location of built editor assets
function getEditorDistPath() {
  const prodPath = path.join(__dirname, 'editor/dist');
  if (fs.existsSync(prodPath)) return prodPath;

  const devPath = path.join(__dirname, '../editor/dist');
  if (fs.existsSync(devPath)) return devPath;

  const resourcesPath = path.join(process.resourcesPath, 'editor/dist');
  if (fs.existsSync(resourcesPath)) return resourcesPath;

  return path.join(__dirname, 'dist');
}

// Helper: Determine location of service backend script
function getServiceScriptPath() {
  const candidatePaths = [
    path.join(__dirname, 'service/server.js'),
    path.join(__dirname, '../service/server.js'),
    path.join(process.resourcesPath, 'service/server.js')
  ];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

// Check if backend service is already responding on port 4000
function checkBackendActive(port = 4000) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/api/health`, (res) => {
      resolve(res.statusCode < 500);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Start backend service in background if not already running
async function ensureBackendRunning() {
  const isActive = await checkBackendActive(4000);
  if (isActive) {
    console.log('[Lupis Electron] Service is already active on port 4000.');
    return;
  }

  const scriptPath = getServiceScriptPath();
  if (!scriptPath) {
    console.warn('[Lupis Electron] Backend script server.js not found, skipping background service start.');
    return;
  }

  try {
    console.log(`[Lupis Electron] Spawning backend service from: ${scriptPath}`);
    backendProcess = fork(scriptPath, [], {
      cwd: path.dirname(scriptPath),
      env: {
        ...process.env,
        PORT: '4000'
      },
      stdio: 'pipe'
    });

    if (backendProcess.stdout) {
      backendProcess.stdout.on('data', (d) => console.log(`[Service] ${d.toString().trim()}`));
    }
    if (backendProcess.stderr) {
      backendProcess.stderr.on('data', (d) => console.error(`[Service Error] ${d.toString().trim()}`));
    }

    backendProcess.on('exit', (code, signal) => {
      console.log(`[Lupis Electron] Backend service exited with code ${code}, signal ${signal}`);
      backendProcess = null;
    });
  } catch (err) {
    console.error('[Lupis Electron] Failed to start backend service process:', err);
  }
}

// Ensure single instance lock
const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    // 2. Setup protocol handler for 'app://'
    protocol.handle('app', async (request) => {
      try {
        const requestUrl = new URL(request.url);
        let pathname = decodeURIComponent(requestUrl.pathname);
        if (pathname === '/' || pathname === '') {
          pathname = '/index.html';
        }

        const baseDir = getEditorDistPath();
        const relativePath = pathname.startsWith('/') ? pathname.slice(1) : pathname;
        let targetFile = path.join(baseDir, relativePath);

        // Single Page Application (SPA) routing fallback
        const hasExtension = path.extname(targetFile).length > 0;
        if (!fs.existsSync(targetFile) || (!hasExtension && fs.existsSync(targetFile) && fs.statSync(targetFile).isDirectory())) {
          if (relativePath.startsWith('preview')) {
            targetFile = path.join(baseDir, 'preview/index.html');
          } else {
            targetFile = path.join(baseDir, 'index.html');
          }
        }

        return await net.fetch(url.pathToFileURL(targetFile).toString());
      } catch (err) {
        console.error('[Protocol app:// error]', err);
        return new Response('Not Found', { status: 404 });
      }
    });

    // 3. Start background backend service
    await ensureBackendRunning();

    // 4. Create Main Window
    createMainWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
      }
    });
  });
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    title: 'Lupis Engine',
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#1e2025',
    icon: path.join(__dirname, 'resources/icon.ico'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true
    }
  });

  // Notify renderer on window state changes
  const notifyWindowState = () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('window:state-changed', {
        isMaximized: mainWindow.isMaximized(),
        isFullScreen: mainWindow.isFullScreen()
      });
    }
  };

  mainWindow.on('maximize', notifyWindowState);
  mainWindow.on('unmaximize', notifyWindowState);
  mainWindow.on('enter-full-screen', notifyWindowState);
  mainWindow.on('leave-full-screen', notifyWindowState);

  // Handle external links and child windows
  mainWindow.webContents.setWindowOpenHandler(({ url: targetUrl }) => {
    if (targetUrl.startsWith('http:') || targetUrl.startsWith('https:')) {
      shell.openExternal(targetUrl);
      return { action: 'deny' };
    }
    return {
      action: 'allow',
      overrideBrowserWindowOptions: {
        autoHideMenuBar: true,
        webPreferences: {
          preload: path.join(__dirname, 'preload.js'),
          contextIsolation: true,
          nodeIntegration: false
        }
      }
    };
  });

  // Load URL
  if (process.argv.includes('--dev-server')) {
    mainWindow.loadURL('http://localhost:6500');
  } else {
    mainWindow.loadURL('app://localhost/index.html');
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Setup IPC handlers
ipcMain.on('window:minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window:maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  }
});

ipcMain.on('window:close', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.handle('window:get-state', () => {
  if (!mainWindow) return { isMaximized: false, isFullScreen: false };
  return {
    isMaximized: mainWindow.isMaximized(),
    isFullScreen: mainWindow.isFullScreen()
  };
});

ipcMain.on('window:set-aspect-ratio', (_event, { width, height }) => {
  if (mainWindow && width > 0 && height > 0) {
    mainWindow.setAspectRatio(width / height);
  } else if (mainWindow) {
    mainWindow.setAspectRatio(0);
  }
});

ipcMain.handle('shell:open-external', async (_event, targetUrl) => {
  if (targetUrl) return shell.openExternal(targetUrl);
});

ipcMain.handle('shell:open-path', async (_event, targetPath) => {
  if (targetPath) return shell.openPath(targetPath);
});

// Clean shutdown: ensure child backend process is terminated
app.on('before-quit', () => {
  if (backendProcess) {
    console.log('[Lupis Electron] Terminating backend service before quit...');
    try {
      backendProcess.kill('SIGTERM');
    } catch (e) {
      console.warn('[Lupis Electron] Error killing backend process:', e);
    }
    backendProcess = null;
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
