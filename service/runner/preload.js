const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  quit: () => ipcRenderer.send('app:quit'),
  close: () => ipcRenderer.send('app:quit'),
  setFullScreen: (flag) => ipcRenderer.send('screen:change', flag ? 'fullscreen' : 'window'),
  changeScreen: (mode) => ipcRenderer.send('screen:change', mode),
  setAspectRatio: (width, height) => ipcRenderer.send('window:set-aspect-ratio', { width, height }),
  getWindowState: () => ipcRenderer.invoke('window:get-state'),
  onWindowStateChange: (callback) => {
    ipcRenderer.on('window:state-changed', (event, state) => {
      if (typeof callback === 'function') callback(state);
    });
  }
});
