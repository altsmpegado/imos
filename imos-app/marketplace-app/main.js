const { app, BrowserWindow, ipcMain } = require('electron');
const { download } = require('electron-dl');

function createWindow() {
  const window = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // Set to false to allow the use of preload scripts
      enableRemoteModule: true, // Set to true if you use remote module
      worldSafeExecuteJavaScript: true, // Set to true to enable safe execution of JavaScript
  },
    autoHideMenuBar: true,
  });

  window.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

ipcMain.on('downloadFile', (event, { id }) => {
  // Define the options for the download
  const options = {
    saveAs: true, // Show "Save As" dialog
  };

  const url = `http://localhost:8000/download/${id}`;

  // Trigger the download using electron-dl
  download(BrowserWindow.getFocusedWindow(), url, options)
    .then(dl => {
      // Handle successful download
      event.reply('downloadCompleted', dl.getSavePath());
    })
    .catch(err => {
      // Handle download error
      console.error(err);
    });
});
