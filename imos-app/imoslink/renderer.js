const { ipcRenderer  } = require('electron');
const { getInstalledApps ,  isContainerRunning, isMultiContainerRunning, 
        startDockerProcess, stopDockerProcess, doesContainerExist, doesMultiContainerExist } = require('../docker/docker');

let installedApps;

function startApp() {
  const appName = document.getElementById('app-name').value.trim();
  console.log(appName);
  if (!appName) {
    displayMessage('Please enter a valid application name.', 'error');
    return;
  }
  ipcRenderer.send('start-appbysearch', appName, installedApps);
}

function stopApp() {
  const appName = document.getElementById('app-name').value.trim();
  console.log(appName);
  if (!appName) {
    displayMessage('Please enter a valid application name.', 'error');
    return;
  }
  ipcRenderer.send('stop-appbysearch', appName);
}

function createStatusLED(isRunning) {
  const statusLED = document.createElement('div');
  statusLED.classList.add('status-led');
  if (isRunning) {
      statusLED.classList.add('green');
  } else {
      statusLED.classList.add('red');
  }
  return statusLED;
}

function startstopApp(app, type, isRunning){
  if(type == 'image' && !doesContainerExist(app))
    ipcRenderer.send('restartApp', app, type);

  else if(type == 'multicontainer' && !doesMultiContainerExist(app))
    ipcRenderer.send('restartApp', app, type);
  
  else if (isRunning) {
      stopDockerProcess(app, type);
      location.reload();
  } 
  
  else {
      startDockerProcess(app, type, 0);
      location.reload();
  }
}

function resetApp(appName, type, isRunning) {
  if(doesContainerExist(appName) || doesMultiContainerExist(appName)){
    if (isRunning)
      stopDockerProcess(appName, type);

    ipcRenderer.send('deleteProcess', appName, type);
    ipcRenderer.on('deleted', () => {
      console.log('Received deleted event');
      ipcRenderer.send('restartApp', appName, type);
    });
  }
}

function deleteApp(appName, type, isRunning, installedApps) {
  if(appName in installedApps){
    if (isRunning)
      stopDockerProcess(appName, type);

    ipcRenderer.send('deleteProcess', appName, type);
    ipcRenderer.on('deleted', () => {
      console.log('Received deleted event');
      ipcRenderer.send('unnistallApp', appName, type);
    });
  }
  else{
    console.log("This app does not exist or cannot be deleted:", appName);
  }
}

function createButton(text, clickHandler=null) {
    const button = document.createElement('button');
    button.className = 'button';
    const icon = document.createElement('i');
    icon.classList.add('material-symbols-outlined');
    icon.textContent = text;
    button.append(icon);
    button.addEventListener('click', clickHandler);
    return button;
}

document.addEventListener('DOMContentLoaded', async () => {
  const appContainer = document.getElementById('appContainer');
  installedApps = await getInstalledApps();
  try {

    const reloadButton = document.getElementById('reloadButton');

    reloadButton.addEventListener('click', () => {
        location.reload();
    });

    for (const app in installedApps) {
      const appData = installedApps[app];
      let isRunning = false;
      
      if (appData.type == 'image') {
        isRunning = isContainerRunning(app);
      } else if (appData.type == 'multicontainer') {
        isRunning = isMultiContainerRunning(app);
      }
      
      const card = document.createElement('div');
      card.className = 'product-card';

      const product = document.createElement('a');
      product.className = 'product';

      const appInfo = document.createElement('div');
      appInfo.style.display = 'flex';
      appInfo.style.alignItems = 'center';
      appInfo.style.gap = '1rem';

      const icon = document.createElement('img');
      icon.className = 'app-icon';
      icon.src = `${process.env.IMOS_APPS_DIR}/${app.split('-')[1]}/logo.png`;

      const title = document.createElement('div');
      title.innerHTML = `<p class="title">${app}</p>`;

      const buttonsDiv = document.createElement('div');
      buttonsDiv.id = `buttonsdiv-${app}`;
      buttonsDiv.className = 'price-container';

      const startStopBtn = createButton(isRunning ? 'pause' : 'play_arrow', () => startstopApp(app, appData.type, isRunning));
      const resetBtn = createButton('stop', () => resetApp(app, appData.type, isRunning));
      const deleteBtn = createButton('delete', () => deleteApp(app, appData.type, isRunning, installedApps));
      const settingsBtn = createButton('settings');
      const statusLED = createStatusLED(isRunning);
      
      buttonsDiv.appendChild(startStopBtn);
      buttonsDiv.appendChild(resetBtn);
      buttonsDiv.appendChild(deleteBtn);
      buttonsDiv.appendChild(settingsBtn);
      buttonsDiv.appendChild(statusLED);

      appInfo.appendChild(icon);
      appInfo.appendChild(title);
      appInfo.appendChild(buttonsDiv);

      product.appendChild(appInfo);
      card.appendChild(product);

      appContainer.appendChild(card);
    }
  } catch (error) {
    console.error('Error creating app cards:', error);
  }
});

// NOT RECEIVING RESTAR CONFIRMATION, CANT RELOAD PAGE
ipcRenderer.on('all-set', () => {
  console.log('Received all-set event');
  location.reload();
});

/*
setInterval(() => {
  location.reload();
}, 5000);
*/