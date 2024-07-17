const { app, BrowserWindow, ipcMain } = require('electron');
const { createDockerProcess, createMultiDockerProcess, doesContainerExist, doesMultiContainerExist,
  startDockerProcess, getImageMetadata, getMultiImageMetadata } = require('../docker/docker');
const request = require('request');
const fs = require('fs');
const { log } = require('console');
require('dotenv').config();

// Declare window variables
let mainWindow;
let authWindow;
let regWindow;
let logWindow;
let setWindow;
var remcheck = false;

/**
 * Function to create the main application window.
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: true,
    icon: 'assets/imoslogo.ico',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      worldSafeExecuteJavaScript: true,
    },
  });

  mainWindow.loadFile('views/index.html');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * Function to create the authentication window.
 */
function createAuthWindow() {
  return new Promise((resolve, reject) => {
    authWindow = new BrowserWindow({
      width: 400,
      height: 400,
      autoHideMenuBar: true,
      icon: 'assets/imoslogo.ico',
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

/**
 * Function to create the login window.
 */
function createLoginWindow() {
  return new Promise((resolve, reject) => {
    logWindow = new BrowserWindow({
      width: 400,
      height: 400,
      autoHideMenuBar: true,
      icon: 'assets/imoslogo.ico',
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: true,
        worldSafeExecuteJavaScript: true,
      },
    });

    logWindow.on('closed', () => {
      logWindow = null;
    });

    logWindow.loadFile('views/login.html');
  });
}

/**
 * Function to create the registration window.
 */
function createRegisterWindow() {
  return new Promise((resolve, reject) => {
    regWindow = new BrowserWindow({
      width: 400,
      height: 400,
      autoHideMenuBar: true,
      icon: 'assets/imoslogo.ico',
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: true,
        worldSafeExecuteJavaScript: true,
      },
    });

    regWindow.on('closed', () => {
      regWindow = null;
    });

    regWindow.loadFile('views/register.html');
  });
}

/**
 * Function to create the setup window for applications.
 */
function createSetupWindow(appName, labels, type) {
  return new Promise((resolve, reject) => {
    setWindow = new BrowserWindow({
      width: 400,
      height: 400,
      autoHideMenuBar: true,
      icon: `${process.env.IMOS_APPS_DIR}/${appName.split('-')[1]}/logo.ico`,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: true,
        worldSafeExecuteJavaScript: true,
        additionalArguments: [appName]
      },
    });

    setWindow.on('closed', () => {
      setWindow = null;
    });

    console.log(labels);
    setWindow.loadFile('views/setup.html', { query: { appName, type, labels } });
  });
}

// Handle imos booting up when app is ready
app.whenReady().then(() => {
  const data = fs.readFileSync('userData/session.json', 'utf8');
  var { username, password, save } = JSON.parse(data);

  if (process.argv[2] == 'local') {
    createWindow();
  }
  else if (save == "false") {
    createAuthWindow()
      .catch(error => {
        console.error('Error creating Auth window:', error);
      });
  }
  else {
    var options = {
      'method': 'POST',
      'url': `http://${process.env.IMOS_SERVER_CON}/login`,
      'headers': {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': 'connect.sid=s%3ANH1jhVRVXwUs5YVuF7s--d4HSGu7vN-v.z3tEKLRjcMQ0pS4fLQKBm9MfCMCcD1y7G%2FOckJk99k4'
      },
      form: {
        'password': password,
        'username': username
      }
    };

    request(options, function (error, response) {
      if (error) throw new Error(error);
      if (response.body.includes("/login-success")) {
        if (!mainWindow) {
          createWindow();
        }

        fetch(`http://${process.env.IMOS_SERVER_CON}/user/${username}`)
          .then((response) => response.json())

          .then((data) => {
            const type = data.user.type;
            fs.writeFileSync('userData/session.json', JSON.stringify({ username, type, password, save }));
          })
          .catch((error) => {
            console.error('Error fetching app information:', error);
          });
      }
    });
  }
});

// Quit the app when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle IPC events from renderer process

/**
 * Event listener for running Docker applications based on type.
 * If 'multicontainer', checks if a setup window is not open and the container does not exist,
 * fetches metadata and opens setup window; otherwise starts the Docker process directly.
 * If 'image', checks similarly for containers and metadata, and handles accordingly.
 * @param {string} app - The name of the Docker application or environment.
 * @param {string} type - The type of the Docker application ('image' or 'multicontainer').
 */
ipcMain.on('runDockerApp', (event, app, type) => {
  if (type == 'multicontainer') {
    if (!setWindow && !doesMultiContainerExist(app)) {
      getMultiImageMetadata(app)
        .then((labels) => {
          createSetupWindow(app, JSON.stringify(labels), type);
        }).catch((error) => {
          console.error('Error fetching multi-container configs:', error);
        });
    }
    else
      startDockerProcess(app, type);
  }
  else if (type == 'image') {
    if (!setWindow && !doesContainerExist(app)) {
      const labels = JSON.stringify(getImageMetadata(app));
      createSetupWindow(app, labels, type);
    }
    else
      startDockerProcess(app, type);
  }
});

/**
 * Event listener for opening the login window.
 * Closes any existing authentication window before creating the login window.
 */
ipcMain.on('openLoginWindow', (event) => {
  createLoginWindow();
  if (authWindow) {
    authWindow.close();
  }
});

/**
 * Event listener for opening the register window.
 * Closes any existing authentication window before creating the register window.
 */
ipcMain.on('openRegisterWindow', (event) => {
  createRegisterWindow();
  if (authWindow) {
    authWindow.close();
  }
});

/**
 * Event listener for registering a user.
 * Posts user registration data to the server and handles success and failure cases.
 * Closes the registration window and opens the authentication window upon successful registration.
 * @param {Object} userData - User registration data including username, password, email, and type.
 */
ipcMain.on('register', (event, userData) => {
  if (authWindow) {
    authWindow.close();
  }

  var options = {
    'method': 'POST',
    'url': `http://${process.env.IMOS_SERVER_CON}/register`,
    form: {
      'type': userData.type,
      'password': userData.password,
      'username': userData.username,
      'email': userData.email
    }
  };

  request(options, function (error, response) {
    if (error) throw new Error(error);
    if (response.body.includes("Successful")) {
      if (regWindow) {
        regWindow.close();
      }

      if (!authWindow) {
        createAuthWindow();
      }
    }
  });
});

/**
 * Event listener for user login.
 * Posts user login credentials to the server and handles successful login by fetching user information.
 * Saves user session data to 'userData/session.json' and closes the login window.
 * Opens the main window upon successful login.
 * @param {Object} userData - User login data including username and password.
 */
ipcMain.on('login', (event, userData) => {
  if (authWindow) {
    authWindow.close();
  }

  var options = {
    'method': 'POST',
    'url': `http://${process.env.IMOS_SERVER_CON}/login`,
    form: {
      'password': userData.password,
      'username': userData.username
    }
  };

  var username = userData.username;
  var password = userData.password;
  var type = "";
  var save = "false";

  request(options, function (error, response) {
    if (error) throw new Error(error);
    if (response.body.includes("/login-success")) {

      fetch(`http://${process.env.IMOS_SERVER_CON}/user/${username}`)
        .then((response) => response.json())
        .then((data) => {
          type = data.user.type;
          fs.writeFileSync('userData/session.json', JSON.stringify({ username, type, password, save }));
        })
        .catch((error) => {
          console.error('Error fetching app information:', error);
        });

      if (remcheck) {
        save = "true";
        fs.writeFileSync('userData/session.json', JSON.stringify({ username, type, password, save }));
      }
      else {
        save = "false"
        fs.writeFileSync('userData/session.json', JSON.stringify({ username: '', type: '', password: '', save }));
      }
      if (logWindow) {
        logWindow.close();
      }

      if (!mainWindow) {
        createWindow();
      }
    }
  });
});

/**
 * Event listener for saving session.
 * Toggles 'remcheck' flag to save or not save user session in 'userData/session.json'.
 */
ipcMain.on('saveSession', (event) => {
  if (!remcheck)
    remcheck = true;
  else
    remcheck = false;
});

/**
 * Event listener for logging out.
 * Closes the main window, opens the authentication window, and clears session data in 'userData/session.json'.
 */
ipcMain.on('logout', (event) => {
  mainWindow.close();
  createAuthWindow();
  fs.writeFileSync('userData/session.json', JSON.stringify({ username: '', type: '', password: '', save: 'false' }));
});

/**
 * Event listener for navigating back in authentication windows.
 * Closes any login or registration window and opens the authentication window.
 */
ipcMain.on('back', (event) => {
  if (logWindow)
    logWindow.close();
  if (regWindow)
    regWindow.close();
  createAuthWindow();
});

/**
 * Event listener for setting up Docker applications.
 * Closes the setup window and starts Docker processes based on the application configuration.
 * @param {Object} appConfig - Configuration data for setting up Docker applications.
 */
ipcMain.on('set', (event, appConfig) => {
  console.log(appConfig);
  setWindow.close();
  if (appConfig.type == 'image')
    createDockerProcess(appConfig);
  else if (appConfig.type == 'multicontainer')
    createMultiDockerProcess(appConfig);
});