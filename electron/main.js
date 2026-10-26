const { app, protocol, BrowserWindow, ipcMain, shell, net: electronNet } = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');
const http = require('http');
const net = require('net');
const { fork, execSync } = require('child_process');

let mainWindow = null;
let backendProcess = null;
let backendPort = 37602;
let backendUrl = 'http://127.0.0.1:37602';

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

// Check if a TCP port is currently free on 127.0.0.1
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const tester = net.createServer();
    tester.once('error', () => resolve(false));
    tester.once('listening', () => {
      tester.close(() => resolve(true));
    });
    tester.listen(port, '127.0.0.1');
  });
}

// Find the first free TCP port starting from startPort
async function findAvailablePort(startPort = 37602, maxAttempts = 50) {
  for (let port = startPort; port < startPort + maxAttempts; port++) {
    const available = await isPortAvailable(port);
    if (available) return port;
  }
  return startPort;
}

// Wait until backend service is up and responds to /api/health
function waitForBackendReady(port, timeoutMs = 15000) {
  const startTime = Date.now();
  return new Promise((resolve) => {
    const check = () => {
      const req = http.get(`http://127.0.0.1:${port}/api/health`, (res) => {
        if (res.statusCode < 500) {
          resolve(true);
        } else {
          retry();
        }
      });
      req.on('error', () => retry());
      req.setTimeout(1000, () => {
        req.destroy();
        retry();
      });
    };

    const retry = () => {
      if (Date.now() - startTime > timeoutMs) {
        resolve(false);
      } else {
        setTimeout(check, 200);
      }
    };

    check();
  });
}

// Start standalone backend service in background
async function ensureBackendRunning() {
  const scriptPath = getServiceScriptPath();
  if (!scriptPath) {
    console.warn('[Lupis Electron] Backend script server.js not found, skipping background service start.');
    return;
  }

  // Find a dedicated free port so standalone never collides with external Docker or other services
  backendPort = await findAvailablePort(37602);
  backendUrl = `http://127.0.0.1:${backendPort}`;
  console.log(`[Lupis Electron] Spawning standalone backend on port ${backendPort} from: ${scriptPath}`);

  try {
    const serviceCwd = path.dirname(scriptPath);
    let userDataPath = '';
    try {
      userDataPath = app.getPath('userData');
    } catch {}

    backendProcess = fork(scriptPath, [], {
      cwd: serviceCwd,
      env: {
        ...process.env,
        PORT: String(backendPort),
        ELECTRON_RUN_AS_NODE: '1',
        LUPIS_USER_DATA: userDataPath
      },
      stdio: ['pipe', 'pipe', 'pipe', 'ipc']
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

    const isReady = await waitForBackendReady(backendPort, 15000);
    if (isReady) {
      console.log(`[Lupis Electron] Standalone backend is active and ready on ${backendUrl}`);
    } else {
      console.warn(`[Lupis Electron] Standalone backend did not respond within 15s.`);
    }
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

        return await electronNet.fetch(url.pathToFileURL(targetFile).toString());
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
    minWidth: 800,
    minHeight: 560,
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
    mainWindow.loadURL('http://localhost:37600');
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

// Provide standalone backend URL to renderer process
ipcMain.on('backend:get-url', (event) => {
  event.returnValue = backendUrl;
});

ipcMain.handle('backend:get-url-async', () => {
  return backendUrl;
});

// Clean shutdown: ensure child backend process and tree are terminated
function terminateBackendProcess() {
  if (backendProcess) {
    console.log('[Lupis Electron] Terminating standalone backend process before quit...');
    try {
      if (process.platform === 'win32' && backendProcess.pid) {
        execSync(`taskkill /pid ${backendProcess.pid} /T /F`, { stdio: 'ignore' });
      } else {
        backendProcess.kill('SIGTERM');
      }
    } catch (e) {
      // Ignore if process has already stopped
    }
    backendProcess = null;
  }
}

app.on('before-quit', terminateBackendProcess);
app.on('will-quit', terminateBackendProcess);
process.on('exit', terminateBackendProcess);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
