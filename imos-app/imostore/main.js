const { app, BrowserWindow, ipcMain } = require('electron');
const { download } = require('electron-dl');
const request = require('request');
const fs = require('fs');

app.commandLine.appendSwitch('no-sandbox');

let appWindow;
let devForm;
let subsWindow;
let subdocWindow;
const openApps = {};

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
      contextIsolation: false, // Set to false to allow the use of preload scripts
      enableRemoteModule: true, // Set to true if you use remote module
      worldSafeExecuteJavaScript: true, // Set to true to enable safe execution of JavaScript
    }
  });

  window.loadFile('views/index.html');
}

function createAppWindow(appjson) {
  return new Promise((resolve, reject) => {
    appWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 450,
      minHeight: 550,
      autoHideMenuBar: true,
      icon: `${process.env.IMOS_APPS_DIR}/${appjson.name.split('-')[1]}/logo.ico`,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: true, // Set to true if you use remote module
        worldSafeExecuteJavaScript: true, // Set to true to enable safe execution of JavaScript
      },
    });
  
    // Handle window closed
    appWindow.on('closed', () => {
      appWindow = null;
      openApps[appjson.name].closed = true;
    });

    appWindow.loadFile('views/app.html');
    appWindow.webContents.on('did-finish-load', () => {
      const data = fs.readFileSync('userData/session.json', 'utf8');
      var { username } = JSON.parse(data);  
      appWindow.webContents.send('appInfo', appjson, username);
    });
  });
}

function createDevForm() {
  devForm = new BrowserWindow({
    width: 400,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // Set to false to allow the use of preload scripts
      enableRemoteModule: true, // Set to true if you use remote module
      worldSafeExecuteJavaScript: true, // Set to true to enable safe execution of JavaScript
  },
    autoHideMenuBar: true,
  });

  devForm.on('closed', () => {
    devForm = null;
    openApps['devform'].closed = true;
  });

  devForm.loadFile('views/form.html');
}

function createSubsWindow() {
  return new Promise((resolve, reject) => {
    subsWindow = new BrowserWindow({
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
  
    // Handle window closed
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

app.whenReady().then(createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

ipcMain.on('downloadFile', (event, { id }) => {
  // Define the options for the download
  const options = {
    saveAs: true, // Show "Save As" dialog
  };

  const url = `http://localhost:8000/download/${id}`;

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

ipcMain.on('acquireApp', (event, user, name ) => {
  var options = {
    'method': 'POST',
    'url': `http://localhost:8000/apps/${user}`,
    form: {
        'appName': name
    }
  };

  request(options, function (error, response) {
    if (error) throw new Error(error);
    event.reply('appAcquired');
    if(response.status == 200){
      console.log("New App Acquired");
    }
  });
});

ipcMain.on('openAppWindow', (event, app) => {
  console.log(app);
  const appjson = JSON.parse(app);
  if (!openApps[appjson.name] || openApps[appjson.name].closed){
    createAppWindow(appjson);
    openApps[appjson.name] = {
      closed: false    
    };
  }
});

ipcMain.on('openDevForm', (event) => {
  if (!openApps['devform'] || openApps['devform'].closed){
    createDevForm();
    openApps['devform'] = {
      closed: false    
    };
  }
});

ipcMain.on('submited', (event, user, id) => {
  var options = {
    'method': 'POST',
    'url': `http://localhost:8000/subs/${user}`,
    form: {
        'subId': id
    }
  };

  request(options, function (error, response) {
      if (error) throw new Error(error);
      event.reply('appSubmited');
      if(response.status == 200){
        console.log("New App Submited");
      }
  });
  if (devForm) {
    devForm.close();
  }
});

ipcMain.on('openSubmissions', (event) => {
  if (!openApps['subs'] || openApps['subs'].closed){
    createSubsWindow();
    openApps['subs'] = {
      closed: false    
    };
  }
});

ipcMain.on('openSubDoc', (event) => {
  if (!openApps['subdoc'] || openApps['subdoc'].closed){
    createSubDocWindow();
    openApps['subdoc'] = {
      closed: false    
    };
  }
});