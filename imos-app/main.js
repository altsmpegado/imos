// main.js
const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 600,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false, // Set to false to allow the use of preload scripts
            enableRemoteModule: true, // Set to true if you use remote module
            worldSafeExecuteJavaScript: true, // Set to true to enable safe execution of JavaScript
        },
    });

    // Set a secure Content Security Policy
    mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
        details.responseHeaders['Content-Security-Policy'] = [
            "default-src 'self'",
            "script-src 'self'",
            "style-src 'self'",
            // Add more directives as needed based on your application's requirements
        ];
        callback({ cancel: false, responseHeaders: details.responseHeaders });
    });

    mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Handle Docker button click
const { ipcMain } = require('electron');
const { spawn } = require('child_process');

ipcMain.on('runDockerApp', () => {
    // Replace 'docker-app' with the name of your Docker image
    const dockerProcess = spawn('docker', ['run', '--rm', 'docker-app']);
    
    dockerProcess.stdout.on('data', (data) => {
        console.log(`Docker Output: ${data}`);
    });

    dockerProcess.stderr.on('data', (data) => {
        console.error(`Docker Error: ${data}`);
    });

    dockerProcess.on('close', (code) => {
        console.log(`Docker process exited with code ${code}`);
    });
});