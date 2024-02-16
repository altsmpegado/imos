const { app, BrowserWindow, ipcMain } = require('electron');
const { exec } = require('child_process');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      worldSafeExecuteJavaScript: true,
    }
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

ipcMain.on('start-deployment', (event, { name, path }) => {
  if(name.includes("deployment")){
    console.log(`Starting deployment: ${name}`);
    exec(`docker  apply -f "${path}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error starting deployment: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`Error starting deployment: ${stderr}`);
        return;
      }
      console.log(`Deployment started: ${name}`);
    });
  }
  else{
    console.log(`Starting app: ${name}`);
    //exec(`docker run -it --name ${name} ${name}`, (error, stdout, stderr) => {
    exec(`docker start ${name}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error starting deployment: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`Error starting deployment: ${stderr}`);
        return;
      }
      console.log(`Deployment started: ${name}`);
    });
  }
});

ipcMain.on('stop-deployment', (event, deploymentName) => {
  if(deploymentName.includes("deployment")){
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
  }
  else {
    console.log(`Stopping application: ${deploymentName}`);
    exec(`docker stop ${deploymentName}`, (error, stdout, stderr) => {
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
  }
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
