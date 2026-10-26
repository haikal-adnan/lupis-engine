const { contextBridge, ipcRenderer } = require('electron');

// Expose safe, structured API to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  },

  // Window Controls
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
  getWindowState: () => ipcRenderer.invoke('window:get-state'),
  setAspectRatio: (width, height) => ipcRenderer.send('window:set-aspect-ratio', { width, height }),

  // Window State Listener (used by engine preview / bundler)
  onWindowStateChange: (callback) => {
    if (typeof callback !== 'function') return;
    const subscription = (_event, state) => callback(state);
    ipcRenderer.on('window:state-changed', subscription);
    return () => ipcRenderer.removeListener('window:state-changed', subscription);
  },

  // System Helpers
  openExternal: (targetUrl) => ipcRenderer.invoke('shell:open-external', targetUrl),
  openPath: (targetPath) => ipcRenderer.invoke('shell:open-path', targetPath)
});
