const { app, BrowserWindow, protocol, net, Menu, ipcMain } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

// The installed app serves the built desktop-www folder (pnpm run desktop:dist).
// `pnpm run desktop` serves the repo root directly, so no build step is needed while testing.
const ROOT = app.isPackaged ? path.join(__dirname, '..', 'desktop-www') : path.join(__dirname, '..');

// Serve the game from app://dearth/ instead of file:// so absolute paths and fetch() keep working.
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } }
]);

// Let music start without a click.
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

// Fullscreen or windowed is remembered between launches (Settings > Display > Window, F11, Alt+Enter).
// Stored in the app's data folder (%APPDATA%\DEARTH on Windows).
function windowSettingsFile() {
  return path.join(app.getPath('userData'), 'window-settings.json');
}

function loadWindowSettings() {
  try {
    return JSON.parse(fs.readFileSync(windowSettingsFile(), 'utf8')) || {};
  } catch (error) {
    return {};
  }
}

function saveWindowSettings(settings) {
  try {
    fs.writeFileSync(windowSettingsFile(), JSON.stringify(settings));
  } catch (error) {}
}

function createWindow() {
  const startFullscreen = loadWindowSettings().fullscreen !== false;
  const win = new BrowserWindow({
    width: 1600,
    height: 900,
    fullscreen: startFullscreen,
    show: false,
    title: 'DEARTH',
    backgroundColor: '#000000',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      backgroundThrottling: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.removeMenu();
  win.once('ready-to-show', () => win.show()); // no white flash on startup
  if (!startFullscreen) win.center();

  // Tell the game when fullscreen changes, so Settings > Display shows the right value, and remember it.
  const reportFullscreen = () => {
    const on = win.isFullScreen();
    saveWindowSettings({ ...loadWindowSettings(), fullscreen: on });
    if (!win.webContents.isDestroyed()) win.webContents.send('dearth:fullscreen-changed', on);
  };
  win.on('enter-full-screen', reportFullscreen);
  win.on('leave-full-screen', reportFullscreen);

  // F11 or Alt+Enter toggles fullscreen.
  win.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return;
    if (input.key === 'F11' || (input.alt && input.key === 'Enter')) {
      win.setFullScreen(!win.isFullScreen());
      event.preventDefault();
    }
  });

  win.loadURL('app://dearth/index.html');
}

// Settings > Display > Window in the game.
ipcMain.on('dearth:is-fullscreen', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  event.returnValue = Boolean(win && win.isFullScreen());
});
ipcMain.on('dearth:set-fullscreen', (event, on) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win && win.isFullScreen() !== Boolean(on)) win.setFullScreen(Boolean(on));
});

app.whenReady().then(() => {
  protocol.handle('app', (request) => {
    const { pathname } = new URL(request.url);
    const filePath = path.join(ROOT, decodeURIComponent(pathname));
    if (!filePath.startsWith(ROOT)) return new Response('Not found', { status: 404 });
    return net.fetch(pathToFileURL(filePath).toString());
  });
  Menu.setApplicationMenu(null);
  createWindow();
});

app.on('window-all-closed', () => app.quit());
