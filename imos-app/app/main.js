// main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const { createDockerProcess } = require('../docker/docker');
const request = require('request');
const fs = require('fs');
const { log } = require('console');

require('dotenv').config();

let mainWindow;
let authWindow;
let regWindow;
let logWindow;
var remcheck = false;

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
    /*mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
        details.responseHeaders['Content-Security-Policy'] = [
            "default-src 'self'",
            "script-src 'self'",
            "style-src 'self'"
        ];
        callback({ cancel: false, responseHeaders: details.responseHeaders });
    });*/

    mainWindow.loadFile('views/index.html');

    // Handle window closed
    mainWindow.on('closed', () => {
      mainWindow = null;
    });
}

function createAuthWindow() {
  return new Promise((resolve, reject) => {
    authWindow = new BrowserWindow({
      width: 400,
      height: 400,
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: true,
        worldSafeExecuteJavaScript: true,
      },
    });

    authWindow.loadFile('views/auth.html');

    authWindow.on('closed', () => {
      authWindow = null;
    });

  });
}

function createLoginWindow() {
  return new Promise((resolve, reject) => {
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
  });
}

function createRegisterWindow() {
  return new Promise((resolve, reject) => {
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
  });
}

//macOS
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
      createAuthWindow();
      //createWindow();
  }
});

app.whenReady().then(() => {
  const data = fs.readFileSync('userData/loginSettings.json', 'utf8');
  var { username, password } = JSON.parse(data);

  if(username == '' && password == ''){
    createAuthWindow()
    .catch(error => {
      console.error('Error creating Auth window:', error);
    });
  }
  else{
    var options = {
      'method': 'POST',
      'url': 'http://localhost:8000/login',
      form: {
          'password': password,
          'username': username
      }
    };
  
    request(options, function (error, response) {
        if (error) throw new Error(error);
        if(response.body.includes("/login-success")){
          if (!mainWindow) {
            createWindow();
          }

          fetch(`http://localhost:8000/user/${username}`)
            .then((response) => response.json())
            
            .then((data) => {
              const type = data.user.type;
              fs.writeFileSync('userData/session.json', JSON.stringify({ username, type }));
            })
            .catch((error) => {
              console.error('Error fetching app information:', error);
            });
        }
    });
  }
    
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
          'type': userData.type,
          'password': userData.password,
          'username': userData.username,
          'email': userData.email
      }
  };
  
  request(options, function (error, response) {
      if (error) throw new Error(error);
      //console.log(response.body);
      if(response.body.includes("Successful")){
        if (regWindow) {
          regWindow.close();
        }

        if (!authWindow) {
            createAuthWindow();
        }
      }
  });
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
  
  var username = userData.username;
  var password = userData.password;

  request(options, function (error, response) {
      if (error) throw new Error(error);
      if(response.body.includes("/login-success")){

        fetch(`http://localhost:8000/user/${username}`)
          .then((response) => response.json())
          .then((data) => {
            const type = data.user.type;
            fs.writeFileSync('userData/session.json', JSON.stringify({ username, type }));
          })
          .catch((error) => {
            console.error('Error fetching app information:', error);
          });

        if(remcheck)
          // Save login settings to a file
          fs.writeFileSync('userData/loginSettings.json', JSON.stringify({ username, password }));
        else {
          fs.writeFileSync('userData/loginSettings.json', JSON.stringify({ username:'', password:'' }));
        }
        if (logWindow) {
          logWindow.close();
        }
        
        // Show the main window
        if (!mainWindow) {
          createWindow();
        }
      }
  });

});

ipcMain.on('saveLoginSettings', (event) => {
  if(!remcheck)
    remcheck = true;
  else
    remcheck = false;
});

ipcMain.on('logout', (event) => {
  mainWindow.close();
  createAuthWindow();
  fs.writeFileSync('userData/loginSettings.json', JSON.stringify({ username:'', password:'' }));
  fs.writeFileSync('userData/session.json', JSON.stringify({ username:'', type:'' }));
});

ipcMain.on('back', (event) => {
  if(logWindow)
    logWindow.close();
  if(regWindow)
    regWindow.close();
  createAuthWindow();
});