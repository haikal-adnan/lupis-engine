const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  quit: () => ipcRenderer.send('app:quit'),
  close: () => ipcRenderer.send('app:quit'),
  setFullScreen: (flag) => ipcRenderer.send('screen:change', flag ? 'fullscreen' : 'window'),
  changeScreen: (mode) => ipcRenderer.send('screen:change', mode)
});
