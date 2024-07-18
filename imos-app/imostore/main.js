const { app, BrowserWindow, ipcMain, nativeImage } = require('electron');
const { download } = require('electron-dl');
const request = require('request');
const fs = require('fs');

// Ensure no sandbox for Electron app
app.commandLine.appendSwitch('no-sandbox');

// Global variables for windows
let appWindow;
let devForm;
let setWindow;
let subsWindow;
let subdocWindow;
const openApps = {};

/**
 * Create the main window for the application.
 */
function createWindow() {
  const window = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 700,
    minHeight: 550,
    autoHideMenuBar: true,
    icon: 'imostore/logo.ico',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      worldSafeExecuteJavaScript: true,
    }
  });

  window.loadFile('views/index.html');
}

/**
 * Create a window for displaying app details.
 * @param {Object} appjson - JSON object containing app details
 */
function createAppWindow(appjson) {
  appWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 450,
    minHeight: 550,
    autoHideMenuBar: true,
    icon: nativeImage.createFromDataURL(`data:image/png;base64,${appjson.logo}`),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      worldSafeExecuteJavaScript: true,
    },
  });

  appWindow.on('closed', () => {
    appWindow = null;
    openApps[appjson.name.toString()].closed = true;
  });

  appWindow.loadFile('views/app.html');
  appWindow.webContents.on('did-finish-load', () => {
    const data = fs.readFileSync('userData/session.json', 'utf8');
    var { username } = JSON.parse(data);
    appWindow.webContents.send('appInfo', appjson, username);
  });
}

/**
 * Create a window for setting up an application.
 * @param {string} user - Username of the user setting up the app
 * @param {string} image - Image identifier for the app
 * @param {string} appName - Name of the app
 * @param {Array} labels - Labels associated with the app
 * @param {string} type - Type of the app (e.g., multicontainer, image)
 */
function createSetupWindow(user, image, appName, labels, type) {
  return new Promise((resolve, reject) => {
    setWindow = new BrowserWindow({
      width: 400,
      height: 400,
      autoHideMenuBar: true,
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

    setWindow.loadFile('views/setup.html', { query: { user, image, appName, type, labels } });
  });
}

/**
 * Create a window for the developer form.
 */
function createDevForm() {
  devForm = new BrowserWindow({
    width: 500,
    height: 700,
    icon: 'imoslink/logo.ico',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      worldSafeExecuteJavaScript: true,
    },
  });

  devForm.on('closed', () => {
    devForm = null;
    openApps['devform'].closed = true;
  });

  devForm.loadFile('views/form.html');
}

/**
 * Create a window for managing submissions.
 */
function createSubsWindow() {
  return new Promise((resolve, reject) => {
    subsWindow = new BrowserWindow({
      width: 500,
      height: 700,
      icon: 'imoslink/logo.ico',
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: true,
        worldSafeExecuteJavaScript: true,
      },
    });

    subsWindow.on('closed', () => {
      subsWindow = null;
      openApps['subs'].closed = true;
    });

    subsWindow.loadFile('views/subs.html');
    subsWindow.webContents.on('did-finish-load', () => {
      const data = fs.readFileSync('userData/session.json', 'utf8');
      var { username } = JSON.parse(data);
      subsWindow.webContents.send('subsInfo', username);
    });
  });
}

/**
 * Create a window for handling submission documents.
 */
function createSubDocWindow() {
  subdocWindow = new BrowserWindow({
    width: 400,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      worldSafeExecuteJavaScript: true,
    },
    autoHideMenuBar: true,
  });

  subdocWindow.on('subdoc', () => {
    subdocWindow = null;
    openApps['subdoc'].closed = true;
  });

  //devForm.loadFile('views/doc.html');
}

// Initialize the main window when Electron is ready
app.whenReady().then(createWindow);

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Re-open the main window if it's closed and the app is activated (macOS specific)
app.on('activate', function () {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

/**
 * Event listener for downloading a file.
 * @param {object} event - The event object for IPC communication
 * @param {object} id - The ID of the file to download
 */
ipcMain.on('downloadFile', (event, { id }) => {
  // Define the options for the download
  const options = {
    saveAs: true, // Show "Save As" dialog
  };

  const url = `http://${process.env.IMOS_SERVER_CON}/download/${id}`;

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

/**
 * Event listener for acquiring an app.
 * @param {object} event - The event object for IPC communication
 * @param {string} user - The username of the user acquiring the app
 * @param {string} name - The name of the app being acquired
 */
ipcMain.on('acquireApp', (event, user, name) => {
  var options = {
    'method': 'POST',
    'url': `http://${process.env.IMOS_SERVER_CON}/apps/${user}`,
    form: {
      'appName': name
    }
  };

  request(options, function (error, response) {
    if (error) throw new Error(error);
    event.reply('appAcquired');
    if (response.status == 200) {
      console.log("New App Acquired");
    }
  });
});

/**
 * Event listener for opening an app window.
 * @param {object} event - The event object for IPC communication
 * @param {string} app - The JSON string representing the app details
 */
ipcMain.on('openAppWindow', (event, app) => {
  console.log(openApps);
  const appjson = JSON.parse(app);
  if (!openApps[appjson.name] || openApps[appjson.name].closed) {
    createAppWindow(appjson);
    openApps[appjson.name.toString()] = {
      closed: false
    };
  }
});

/**
 * Event listener for opening the developer form.
 * @param {object} event - The event object for IPC communication
 */
ipcMain.on('openDevForm', (event) => {
  console.log(openApps);
  if (!openApps['devform'] || openApps['devform'].closed) {
    createDevForm();
    openApps['devform'] = {
      closed: false
    };
  }
});

/**
 * Event listener for submitting an app.
 * @param {object} event - The event object for IPC communication
 * @param {string} user - The username of the user submitting the app
 * @param {string} id - The ID of the app being submitted
 */
ipcMain.on('submited', (event, user, id) => {
  var options = {
    'method': 'POST',
    'url': `http://${process.env.IMOS_SERVER_CON}/subs/${user}`,
    form: {
      'subId': id
    }
  };

  request(options, function (error, response) {
    if (error) throw new Error(error);
    event.reply('appSubmited');
    if (response.status == 200) {
      console.log("New App Submited");
    }
  });
});

/**
 * Event listener for opening the submissions window.
 * @param {object} event - The event object for IPC communication
 */
ipcMain.on('openSubmissions', (event) => {
  if (!openApps['subs'] || openApps['subs'].closed) {
    createSubsWindow();
    openApps['subs'] = {
      closed: false
    };
  }
});

/**
 * Event listener for creating a cloud app.
 * @param {object} event - The event object for IPC communication
 * @param {string} user - The username of the user creating the cloud app
 * @param {string} app - The name of the app being created
 * @param {string} image - The image identifier of the app
 * @param {string} type - The type of the app (e.g., multicontainer, image)
 * @param {Array} labels - The labels associated with the app
 */
ipcMain.on('createCloudApp', (event, user, app, image, type, labels) => {
  if (type == 'multicontainer') {
    if (!setWindow) {
      createSetupWindow(user, image, app, JSON.stringify(labels), type);
    }
  }
  else if (type == 'image') {
    if (!setWindow) {
      createSetupWindow(user, image, app, JSON.stringify(labels), type);
    }
  }
});

/**
 * Event listener for setting up an app.
 * @param {object} event - The event object for IPC communication
 * @param {string} user - The username of the user setting up the app
 * @param {string} appName - The name of the app being set up
 * @param {object} data - The configuration data for setting up the app
 */
ipcMain.on('setCloud', (event, user, appName, data) => {
  setWindow.close();

  var options = {
    'method': 'PUT',
    'url': `http://${process.env.IMOS_SERVER_CON}/createapp`,
    form: {
      'user': user,
      'app': appName,
      'configs': JSON.stringify(data)
    }
  };
  request(options, function (error, response) {
    if (error) throw new Error(error);
    if (response.status == 200) {
      console.log("New App Submited");
    }
  });
});

/**
 * Event listener for setting up an app.
 * @param {object} event - The event object for IPC communication
 * @param {string} user - The username of the user starting the app
 * @param {string} appName - The name of the app being started
 */
ipcMain.on('startCloudApp', (event, user, appName) => {
  var options = {
    'method': 'PUT',
    'url': `http://${process.env.IMOS_SERVER_CON}/startapp`,
    form: {
      'user': user,
      'app': appName
    }
  };
  request(options, function (error, response) {
    if (error) throw new Error(error);
    if (response.status == 200) {
      console.log("App Started");
    }
  });
});

/**
 * Event listener for setting up an app.
 * @param {object} event - The event object for IPC communication
 * @param {string} user - The username of the user stoping the app
 * @param {string} appName - The name of the app being stoped
 */
ipcMain.on('stopCloudApp', (event, user, appName) => {
  var options = {
    'method': 'PUT',
    'url': `http://${process.env.IMOS_SERVER_CON}/stopapp`,
    form: {
      'user': user,
      'app': appName
    }
  };
  request(options, function (error, response) {
    if (error) throw new Error(error);
    if (response.status == 200) {
      console.log("App Stoped");
    }
  });
});

/**
 * Event listener for setting up an app.
 * @param {object} event - The event object for IPC communication
 * @param {string} user - The username of the user removing the app
 * @param {string} appName - The name of the app being removed
 */
ipcMain.on('removeCloudApp', (event, user, appName) => {
  var options = {
    'method': 'DELETE',
    'url': `http://${process.env.IMOS_SERVER_CON}/removeapp`,
    form: {
      'user': user,
      'app': appName
    }
  };
  request(options, function (error, response) {
    if (error) throw new Error(error);
    if (response.status == 200) {
      console.log("App Removed");
    }
  });
});
