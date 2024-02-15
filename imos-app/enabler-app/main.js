const { app, BrowserWindow, ipcMain } = require('electron');

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
  // Call function to start deployment with given name
  console.log(`Starting deployment: ${deploymentName}`);
  // You can use Kubernetes SDK or Minikube's CLI here to start the deployment
  // Example: `kubectl apply -f deployment.yaml`
  // Display success or error message using `mainWindow.webContents.send`
});

ipcMain.on('stop-deployment', (event, deploymentName) => {
  // Call function to stop deployment with given name
  console.log(`Stopping deployment: ${deploymentName}`);
  // You can use Kubernetes SDK or Minikube's CLI here to stop the deployment
  // Example: `kubectl delete deployment <deploymentName>`
  // Display success or error message using `mainWindow.webContents.send`
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
