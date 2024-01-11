// main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const { createDockerProcess } = require('../docker/docker');
const request = require('request');

require('dotenv').config();

let mainWindow;
let authWindow;
let regWindow;
let logWindow;

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
            "style-src 'self'"
        ];
        callback({ cancel: false, responseHeaders: details.responseHeaders });
    });

    mainWindow.loadFile('views/index.html');

    // Handle window closed
    mainWindow.on('closed', () => {
      mainWindow = null;
    });
}

function createAuthWindow() {
    authWindowWindow = new BrowserWindow({
      width: 400,
      height: 400,
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: true, // Set to true if you use remote module
        worldSafeExecuteJavaScript: true, // Set to true to enable safe execution of JavaScript
      },
    });

    authWindow.loadFile('views/auth.html');

    // Handle window closed
    authWindow.on('closed', () => {
      authWindow = null;
    });
}

function createLoginWindow() {
    logWindow = new BrowserWindow({
      width: 400,
      height: 400,
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: true, // Set to true if you use remote module
        worldSafeExecuteJavaScript: true, // Set to true to enable safe execution of JavaScript
      },
    });
  
    // Handle window closed
    logWindow.on('closed', () => {
        logWindow = null;
    });

    logWindow.loadFile('views/login.html');
}

function createRegisterWindow() {
    regWindow = new BrowserWindow({
      width: 400,
      height: 400,
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: true, // Set to true if you use remote module
        worldSafeExecuteJavaScript: true, // Set to true to enable safe execution of JavaScript
      },
    });
  
    // Handle window closed
    regWindow.on('closed', () => {
        regWindow = null;
    });

    regWindow.loadFile('views/register.html');
}


app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
      createAuthWindow();
      //createWindow();
  }
});

app.whenReady().then(() => {
  //createAuthWindow();
    
  createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Handle Docker button click
ipcMain.on('runDockerApp', (event, app) => {
    createDockerProcess(app);
});

// Handle Auth events
ipcMain.on('openLoginWindow', (event) => {
    createLoginWindow();
    if (authWindow) {
      authWindow.close();
    }
});

ipcMain.on('openRegisterWindow', (event) => {
    createRegisterWindow();
    if (authWindow) {
        authWindow.close();
    }
});

ipcMain.on('register', (event, userData) => {
    if (authWindow) {
      authWindow.close();
    }
    
    var options = {
        'method': 'POST',
        'url': 'http://localhost:8000/register',
        form: {
            'password': userData.password,
            'username': userData.username,
            'email': userData.email
        }
    };
    
    request(options, function (error, response) {
        if (error) throw new Error(error);
        console.log(response.body);
    });

    if (!authWindowWindow) {
        createAuthWindow();
    }

  });

  ipcMain.on('login', (event, userData) => {
    if (authWindow) {
      authWindow.close();
    }
    
    var options = {
        'method': 'POST',
        'url': 'http://localhost:8000/login',
        form: {
            'password': userData.password,
            'username': userData.username
        }
    };
    
    request(options, function (error, response) {
        if (error) throw new Error(error);
        console.log(response.body);
    });

    // Show the main window
    if (!mainWindow) {
      createWindow();
    }

  });