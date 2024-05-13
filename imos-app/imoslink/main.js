const { app, BrowserWindow, ipcMain } = require('electron');
const { doesContainerExist, doesMultiContainerExist , startDockerProcess, stopDockerProcess,
        createDockerProcess, createMultiDockerProcess, getImageMetadata, getMultiImageMetadata,
        deleteDockerProcess, deleteDockerApp} = require('../docker/docker');

let mainWindow;
let setWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
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
  
    // Handle window closed
    setWindow.on('closed', () => {
      setWindow = null;
    });
    console.log(labels);
    setWindow.loadFile('setup.html', { query: { appName, type, labels} });
  });
}

app.whenReady().then(createWindow);

ipcMain.on('start-appbysearch', (event, name, installedApps) => {
  if (!name.startsWith('imos-')) {
    name = 'imos-' + name;
  }
  
  console.log(`Starting application: ${name}`);
  if(doesContainerExist(name)){
    startDockerProcess(name, "image", interface=0);
  }
  else if(doesMultiContainerExist(name)){   
    startDockerProcess(name, "multicontainer", interface=0);
  }

  else if(installedApps[name] != null){
    if(installedApps[name].type == 'multicontainer'){
      if(!setWindow){
        getMultiImageMetadata(installedApps[name].type)
          .then((labels) => {
            createSetupWindow(name, JSON.stringify(labels), installedApps[name].type);
          }).catch((error) => {
              console.error('Error fetching multi-container configs:', error);
          });
      }
    }
    else if(installedApps[name].type == 'image'){
      if(!setWindow){
        const labels = JSON.stringify(getImageMetadata(name));
        createSetupWindow(name, labels, installedApps[name].type);
      }
    }
  }

  else{
    console.log("The app you just tried executing does not exist.");
  }
});

ipcMain.on('stop-appbysearch', (event, name) => {
  console.log(`Stopping application: ${name}`);
  if(doesContainerExist(name)){
    stopDockerProcess(name, "image");
  }
  else if(doesMultiContainerExist(name)){     
    stopDockerProcess(name, "multicontainer");
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

ipcMain.on('restartApp', (event, app, type) => {
  if(type == 'multicontainer'){
    if(!setWindow){
      getMultiImageMetadata(app)
        .then((labels) => {
          //console.log(labels);
          createSetupWindow(app, JSON.stringify(labels), type);
        }).catch((error) => {
            console.error('Error fetching multi-container configs:', error);
        });
    }
  }
  else if(type == 'image'){
    if(!setWindow){
      createSetupWindow(app, JSON.stringify(getImageMetadata(app)), type);
    }
  }
});

ipcMain.on('deleteProcess', (event, app, type) => {
  deleteDockerProcess(app, type);
  event.reply('deleted');
});

ipcMain.on('unnistallApp', (event, app, type) => {
  deleteDockerApp(app, type);
});

ipcMain.on('set', (event, appConfig) => {
  console.log(appConfig);
  setWindow.close();
  if(appConfig.type == 'image')
    createDockerProcess(appConfig, 0);
  else if(appConfig.type == 'multicontainer')
    createMultiDockerProcess(appConfig, 0);

  event.reply('all-set');
});