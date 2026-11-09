const { app, BrowserWindow, protocol, net, Menu } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

// For now the game is served straight from the repo root (index.html, main.js, styles.css, assets).
// Step 4 will switch this to a built desktop-www folder.
const ROOT = path.join(__dirname, '..');

// Serve the game from app://dearth/ instead of file:// so absolute paths and fetch() keep working.
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } }
]);

// Let music start without a click.
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

function createWindow() {
  const win = new BrowserWindow({
    width: 1600,
    height: 900,
    fullscreen: true,
    show: false,
    title: 'DEARTH',
    backgroundColor: '#000000',
    autoHideMenuBar: true,
    webPreferences: { backgroundThrottling: false, contextIsolation: true, nodeIntegration: false }
  });

  win.removeMenu();
  win.once('ready-to-show', () => win.show()); // no white flash on startup

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
