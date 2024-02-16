const { app, BrowserWindow, ipcMain } = require('electron');
const { exec } = require('child_process');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

ipcMain.on('start-deployment', (event, deploymentName) => {
  console.log(`Starting deployment: ${deploymentName}`);
  exec(`kubectl apply -f ${deploymentName}.yaml`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error starting deployment: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Error starting deployment: ${stderr}`);
      return;
    }
    console.log(`Deployment started: ${deploymentName}`);
  });
});

ipcMain.on('stop-deployment', (event, deploymentName) => {
  console.log(`Stopping deployment: ${deploymentName}`);
  exec(`kubectl delete deployment ${deploymentName}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error stopping deployment: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Error stopping deployment: ${stderr}`);
      return;
    }
    console.log(`Deployment stopped: ${deploymentName}`);
  });
});

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
