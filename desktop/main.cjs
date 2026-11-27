const { app, BrowserWindow, protocol, net, Menu, ipcMain } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { startPvpServer } = require('../server.js');

// The installed app serves the built desktop-www folder (pnpm run desktop:dist).
// `pnpm run desktop` serves the repo root directly, so no build step is needed while testing.
const ROOT = app.isPackaged ? path.join(__dirname, '..', 'desktop-www') : path.join(__dirname, '..');

// Serve the game from app://dearth/ instead of file:// so absolute paths and fetch() keep working.
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } }
]);

// Local PvP: the phones need a real web server on the network, so the app starts the game's own
// (server.js, serving the same files) the first time the page asks for /api/... (PvP opened).
// The page keeps talking to app://dearth/api/..., which is passed on to it, so its saves stay on app://.
let pvpServerStart = null;

function pvpServer() {
  if (!pvpServerStart) {
    pvpServerStart = startPvpServer({ root: ROOT }).catch((error) => {
      pvpServerStart = null;
      throw error;
    });
  }
  return pvpServerStart;
}

async function forwardToPvpServer(request, url) {
  try {
    const { port } = await pvpServer();
    const init = { method: request.method, headers: { 'Content-Type': request.headers.get('content-type') || 'application/json' } };
    if (request.method !== 'GET' && request.method !== 'HEAD') init.body = Buffer.from(await request.arrayBuffer());
    const response = await fetch(`http://127.0.0.1:${port}${url.pathname}${url.search}`, init);
    return new Response(await response.arrayBuffer(), {
      status: response.status,
      headers: { 'Content-Type': response.headers.get('content-type') || 'application/json', 'Cache-Control': 'no-store' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: 'PvP server could not start' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

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
    const url = new URL(request.url);
    const { pathname } = url;
    if (pathname.startsWith('/api/')) return forwardToPvpServer(request, url);
    const filePath = path.join(ROOT, decodeURIComponent(pathname));
    if (!filePath.startsWith(ROOT)) return new Response('Not found', { status: 404 });
    return net.fetch(pathToFileURL(filePath).toString());
  });
  Menu.setApplicationMenu(null);
  createWindow();
});

app.on('window-all-closed', () => app.quit());
app.on('will-quit', () => {
  if (pvpServerStart) pvpServerStart.then((server) => server.close()).catch(() => {});
});
