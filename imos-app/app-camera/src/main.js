const { app, BrowserWindow } = require('electron');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false, // Enable context isolation
            enableRemoteModule: true  // Enable remote module
        }
    });

    const hostMachineIP = 'gateway.docker.internal';
    const port = 3000;

    mainWindow.loadURL(`http://${hostMachineIP}:${port}/camera-frame`);

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
    if (mainWindow === null) createWindow();
});
