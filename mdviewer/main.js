const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let filePath = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('index.html');

  // Wait for the renderer to finish loading before sending any queued file
  mainWindow.webContents.on('did-finish-load', () => {
    if (filePath) {
      loadFile(filePath);
    }
  });
}

function loadFile(fp) {
  if (!mainWindow) {
    filePath = fp;
    return;
  }
  try {
    const content = fs.readFileSync(fp, 'utf-8');
    const fileName = path.basename(fp);
    mainWindow.webContents.send('file-opened', { fileName, content });
    mainWindow.setTitle(`MD Viewer — ${fileName}`);
  } catch (err) {
    console.error('Failed to read file:', err);
  }
}

// macOS: file opened via double-click or drag-to-dock
app.on('open-file', (event, fp) => {
  event.preventDefault();
  filePath = fp;
  if (mainWindow) {
    loadFile(fp);
  }
});

// Windows/Linux: file path comes as a command-line argument
function getFileFromArgs(argv) {
  // In packaged app, the file arg is argv[1]; in dev it's argv[2] (after electron .)
  const args = argv.slice(app.isPackaged ? 1 : 2);
  for (const arg of args) {
    if (arg.endsWith('.md') || arg.endsWith('.markdown')) {
      return arg;
    }
  }
  return null;
}

app.whenReady().then(() => {
  // Check command-line args for a file path
  const argFile = getFileFromArgs(process.argv);
  if (argFile) {
    filePath = path.resolve(argFile);
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Handle second-instance (Windows/Linux) — if user double-clicks another .md file
app.on('second-instance', (event, argv) => {
  const fp = getFileFromArgs(argv);
  if (fp) {
    loadFile(path.resolve(fp));
  }
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

// Let renderer request a file-open dialog
ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'Markdown', extensions: ['md', 'markdown'] }]
  });
  if (!result.canceled && result.filePaths.length > 0) {
    loadFile(result.filePaths[0]);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
