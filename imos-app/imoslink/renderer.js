const { ipcRenderer  } = require('electron');
const { getInstalledApps ,  isContainerRunning, isMultiContainerRunning, 
        startDockerProcess, stopDockerProcess, doesContainerExist, doesMultiContainerExist } = require('../docker/docker');

function startDeployment() {
  const deploymentName = document.getElementById('app-name').value.trim();
  if (!deploymentName) {
    displayMessage('Please enter a valid application name.', 'error');
    return;
  }

  if(deploymentName.includes("deployment")){
    // Instead of picking deployment file we can just assume the path
    const deploymentFileInput = document.createElement('input');
    deploymentFileInput.type = 'file';
    deploymentFileInput.accept = '.yaml';
    // Trigger click event to open file dialog
    deploymentFileInput.click();

    // Listen for change event when user selects a file
    deploymentFileInput.addEventListener('change', () => {
      const file = deploymentFileInput.files[0];
      if (file) {
        //console.log(file.path);
        ipcRenderer.send('start-deployment', { name: file.name, path: file.path });
      }
    });
  }

  else{
    //console.log(deploymentName);
    ipcRenderer.send('start-deployment', { name: deploymentName, path: "" });
  }
  
}

function stopDeployment() {
  const deploymentName = document.getElementById('app-name').value.trim();
  if (!deploymentName) {
    displayMessage('Please enter a deployment name.', 'error');
    return;
  }

  ipcRenderer.send('stop-deployment', deploymentName);
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

async function createAppCards() {
  const appContainer = document.getElementById('appContainer');
  
  try {
    
    const installedApps = await getInstalledApps();
    //console.log(installedApps);
    
    for (const app in installedApps) {
      const appData = installedApps[app];
      //console.log(app);
      let isRunning = false;
      if (appData.type == 'image') {
        isRunning = isContainerRunning(app);
      } else if (appData.type == 'multicontainer') {
        isRunning = isMultiContainerRunning(app);
      }
      
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `<h3>${app}</h3>`;

      const startStopBtn = document.createElement('button');
      startStopBtn.className = 'button';
      startStopBtn.innerText = isRunning ? 'Stop' : 'Start';

      startStopBtn.addEventListener('click', () => {

        if(appData.type == 'image' && !doesContainerExist(app))
          ipcRenderer.send('restartApp', app, appData.type);

        else if(appData.type == 'multicontainer' && !doesMultiContainerExist(app))
          ipcRenderer.send('restartApp', app, appData.type);
        
        else if (isRunning) {
            stopDockerProcess(app, appData.type);
            location.reload();
        } 
        
        else {
            startDockerProcess(app, appData.type, 0);
            location.reload();
        }
      });

      const resetBtn = createButton('Reset', () => resetApp(app, appData.type, isRunning));
      const deleteBtn = createButton('Delete', () => deleteApp(app, appData.type, isRunning));
      const settingsBtn = createButton('Settings', () => openSettings(app));
      const statusLED = createStatusLED(isRunning);
      card.appendChild(statusLED);
      card.appendChild(startStopBtn);
      card.appendChild(resetBtn);
      card.appendChild(deleteBtn);
      card.appendChild(settingsBtn);

      appContainer.appendChild(card);
    }
  } catch (error) {
      console.error('Error creating app cards:', error);
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

function deleteApp(appName, type, isRunning) {
  getInstalledApps()
    .then((apps) => {
      if(appName in apps){
        if (isRunning)
          stopDockerProcess(appName, type);
    
        ipcRenderer.send('deleteProcess', appName, type);
        ipcRenderer.on('deleted', () => {
          console.log('Received deleted event');
          ipcRenderer.send('unnistallApp', appName, type);
        });
      }
    }).catch((error) => {
        console.error('Error:', error);
    });
}

function createButton(text, clickHandler) {
    const button = document.createElement('button');
    button.className = 'button';
    button.innerText = text;
    button.addEventListener('click', clickHandler);
    return button;
}

// NOT RECEIVING RESTAR CONFIRMATION, CANT RELOAD PAGE
ipcRenderer.on('all-set', () => {
  console.log('Received all-set event');
  location.reload();
});

window.onload = createAppCards;

const reloadButton = document.getElementById('reloadButton');

reloadButton.addEventListener('click', () => {
    location.reload();
});

/*
setInterval(() => {
  location.reload();
}, 5000);
*/