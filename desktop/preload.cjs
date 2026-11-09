// Bridge between the game page and the Electron window (the page has no Node access).
// The game checks for window.dearthDesktop to know it runs in the desktop app.
const { contextBridge, ipcRenderer } = require('electron');

let fullscreen = ipcRenderer.sendSync('dearth:is-fullscreen');
const listeners = new Set();

ipcRenderer.on('dearth:fullscreen-changed', (_event, on) => {
  fullscreen = Boolean(on);
  listeners.forEach((listener) => {
    try { listener(fullscreen); } catch (error) {}
  });
});

contextBridge.exposeInMainWorld('dearthDesktop', {
  isFullscreen: () => fullscreen,
  setFullscreen: (on) => ipcRenderer.send('dearth:set-fullscreen', Boolean(on)),
  onFullscreenChange: (listener) => {
    if (typeof listener === 'function') listeners.add(listener);
  }
});
