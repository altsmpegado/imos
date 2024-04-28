const { app, BrowserWindow, ipcMain } = require('electron');
const { exec } = require('child_process');
const { doesContainerExist, doesMultiContainerExist , startDockerProcess, stopDockerProcess,
        createDockerProcess, createMultiDockerProcess, getImageMetadata, getMultiImageMetadata,
        deleteDockerProcess, deleteDockerApp} = require('../docker/docker');

let mainWindow;
let setWindow;

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

function createSetupWindow(appName, labels, type) {
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
  
    // Handle window closed
    setWindow.on('closed', () => {
      setWindow = null;
    });
    console.log(labels);
    setWindow.loadFile('setup.html', { query: { appName, type, labels} });
  });
}

app.whenReady().then(createWindow);

ipcMain.on('start-deployment', (event, { name, path }) => {

  // para voltar a integrar Kubernetes
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
    console.log(`Starting application: ${name}`);
    if(doesContainerExist(name)){
      startDockerProcess(name, "image", interface=0);
    }
    else if(doesMultiContainerExist(name)){   
      startDockerProcess(name, "multicontainer", interface=0);
    }
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

  else{
    console.log(`Stopping application: ${deploymentName}`);
    if(doesContainerExist(deploymentName)){
      stopDockerProcess(deploymentName, "image");
    }
    else if(doesMultiContainerExist(deploymentName)){     
      stopDockerProcess(deploymentName, "multicontainer");
    }
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
      const labels = JSON.stringify(getImageMetadata(app));
      createSetupWindow(app, labels, type);
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