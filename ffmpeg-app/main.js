const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({ width: 800, height: 600 });
  mainWindow.loadFile('index.html');

  // Run ffplay command
  const ffplayProcess = spawn('ffplay', ['-i', 'udp://127.0.0.1:1235', '-vf', 'scale=800:600']);
  mainWindow.on('closed', () => {
    // Close ffplay when the Electron window is closed
    ffplayProcess.kill();
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
