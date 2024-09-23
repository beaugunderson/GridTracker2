const { contextBridge } = require('electron');
const { electronAPI } = require('@electron-toolkit/preload');
const { Menu, MenuItem } = require('@electron/remote');

// Custom APIs for renderer
const api = {};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI);
    contextBridge.exposeInMainWorld('api', api);
    contextBridge.exposeInMainWorld('Menu', Menu);
    contextBridge.exposeInMainWorld('MenuItem', MenuItem);
  } catch (error) {
    console.error(error);
  }
} else {
  window.electron = electronAPI;
  window.api = api;
  window.Menu = Menu;
  window.MenuItem = MenuItem;
}
