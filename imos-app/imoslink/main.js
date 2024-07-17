const { app, BrowserWindow, ipcMain } = require('electron');
const { doesContainerExist, doesMultiContainerExist, startDockerProcess, stopDockerProcess,
  createDockerProcess, createMultiDockerProcess, getImageMetadata, getMultiImageMetadata,
  deleteDockerProcess, deleteDockerApp } = require('../docker/docker');

// Declare window variables
let mainWindow;
let setWindow;

/**
 * Creates the main Electron window for the application.
 * Loads 'index.html' as the main window content.
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    autoHideMenuBar: true,
    icon: 'imoslink/logo.ico',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      worldSafeExecuteJavaScript: true,
    }
  });

  mainWindow.loadFile('index.html');
}

/**
 * Creates a setup window for configuring Docker applications or multi-container environments.
 * @param {string} appName - The name of the application or environment.
 * @param {Object} labels - Labels or metadata related to the application.
 * @param {string} type - The type of the application ('image' or 'multicontainer').
 * @returns {Promise} - Promise that resolves when the setup window is created.
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

    setWindow.loadFile('setup.html', { query: { appName, type, labels } });
  });
}

// Start the main window when Electron is ready
app.whenReady().then(createWindow);

// Activate the main window when it is clicked and no windows are open
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Quit the app when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle IPC events
/**
 * Event listener for starting an application by name search.
 * Checks if the application name starts with 'imos-'; if not, prefixes it.
 * Logs the application start attempt and initiates Docker processes based on existence and type.
 * If the application exists as a single container or multi-container, starts the corresponding Docker process.
 * @param {string} name - The name of the application to start.
 * @param {Object} installedApps - Object containing information about installed applications.
 */
ipcMain.on('start-appbysearch', (event, name, installedApps) => {
  if (!name.startsWith('imos-')) {
    name = 'imos-' + name;
  }

  console.log(`Starting application: ${name}`);
  if (doesContainerExist(name)) {
    startDockerProcess(name, "image", interface = 0);
  }
  else if (doesMultiContainerExist(name)) {
    startDockerProcess(name, "multicontainer", interface = 0);
  }

  else if (installedApps[name] != null) {
    if (installedApps[name].type == 'multicontainer') {
      if (!setWindow) {
        getMultiImageMetadata(installedApps[name].type)
          .then((labels) => {
            createSetupWindow(name, JSON.stringify(labels), installedApps[name].type);
          }).catch((error) => {
            console.error('Error fetching multi-container configs:', error);
          });
      }
    }
    else if (installedApps[name].type == 'image') {
      if (!setWindow) {
        const labels = JSON.stringify(getImageMetadata(name));
        createSetupWindow(name, labels, installedApps[name].type);
      }
    }
  }

  else {
    console.log("The app you just tried executing does not exist.");
  }
});

/**
 * Event listener for stopping an application by name.
 * Logs the application stop attempt and stops the Docker process based on its existence and type.
 * @param {string} name - The name of the application to stop.
 */
ipcMain.on('stop-appbysearch', (event, name) => {
  console.log(`Stopping application: ${name}`);
  if (doesContainerExist(name)) {
    stopDockerProcess(name, "image");
  }
  else if (doesMultiContainerExist(name)) {
    stopDockerProcess(name, "multicontainer");
  }
});

/**
 * Event listener for restarting an application.
 * If the application type is 'multicontainer' and no setup window is open,
 * fetches metadata and opens the setup window.
 * If the application type is 'image' and no setup window is open,
 * opens the setup window with fetched metadata.
 * @param {string} app - The name of the application to restart.
 * @param {string} type - The type of the application ('image' or 'multicontainer').
 */
ipcMain.on('restartApp', (event, app, type) => {
  if (type == 'multicontainer') {
    if (!setWindow) {
      getMultiImageMetadata(app)
        .then((labels) => {
          createSetupWindow(app, JSON.stringify(labels), type);
        }).catch((error) => {
          console.error('Error fetching multi-container configs:', error);
        });
    }
  }
  else if (type == 'image') {
    if (!setWindow) {
      createSetupWindow(app, JSON.stringify(getImageMetadata(app)), type);
    }
  }
});

/**
 * Event listener for deleting a Docker process.
 * Deletes the Docker process based on its name and type.
 * Sends a reply signal indicating deletion completion.
 * @param {string} app - The name of the Docker application to delete.
 * @param {string} type - The type of the Docker application ('image' or 'multicontainer').
 */
ipcMain.on('deleteProcess', (event, app, type) => {
  deleteDockerProcess(app, type);
  event.reply('deleted');
});

/**
 * Event listener for uninstalling a Docker application.
 * Deletes the Docker application and all associated containers based on its name and type.
 * @param {string} app - The name of the Docker application to uninstall.
 * @param {string} type - The type of the Docker application ('image' or 'multicontainer').
 */
ipcMain.on('unnistallApp', (event, app, type) => {
  deleteDockerApp(app, type);
});

/**
 * Event listener for setting up Docker applications.
 * Closes the setup window and starts Docker processes based on the application configuration.
 * Sends a reply signal indicating setup completion.
 * @param {Object} appConfig - Configuration data for setting up Docker applications.
 */
ipcMain.on('set', (event, appConfig) => {
  setWindow.close();
  if (appConfig.type == 'image')
    createDockerProcess(appConfig, 0);
  else if (appConfig.type == 'multicontainer')
    createMultiDockerProcess(appConfig, 0);

  event.reply('all-set');
});
