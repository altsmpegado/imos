const { ipcRenderer } = require('electron');
const { getInstalledApps ,  doesContainerExist , doesMultiContainerExist , isContainerRunning, isMultiContainerRunning, 
        startDockerProcess, stopDockerProcess} = require('../docker/docker');
const { cpSync } = require('original-fs');

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

async function createAppCards() {
  const appContainer = document.getElementById('appContainer');
  try {
    
    const installedApps = await getInstalledApps();
    console.log(installedApps);
    
    for (const app in installedApps) {
      const appData = installedApps[app];
      
      
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
        if (isRunning) {
            stopDockerProcess(app, appData.type, 0);
            location.reload();
        } else {
            startDockerProcess(app, appData.type, 0);
            location.reload();
        }
      });

      const resetBtn = createButton('Reset', () => resetApp(app));
      const settingsBtn = createButton('Settings', () => openSettings(app));

      card.appendChild(startStopBtn);
      card.appendChild(resetBtn);
      card.appendChild(settingsBtn);

      appContainer.appendChild(card);
    }
  } catch (error) {
      console.error('Error creating app cards:', error);
  }
}

function createButton(text, clickHandler) {
    const button = document.createElement('button');
    button.className = 'button';
    button.innerText = text;
    button.addEventListener('click', clickHandler);
    return button;
}

window.onload = createAppCards;

/*
setInterval(() => {
  location.reload();
}, 5000);
*/