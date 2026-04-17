const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('mdviewer', {
  onFileOpened: (callback) => {
    ipcRenderer.on('file-opened', (event, data) => callback(data));
  },
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog')
});
