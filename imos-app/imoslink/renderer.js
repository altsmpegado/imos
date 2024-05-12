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
  const appListDiv = document.getElementById('appContainer');
  
  try {
    const installedApps = await getInstalledApps();
    
    for (const app in installedApps) {
      const appData = installedApps[app];
      let isRunning = false;
      if (appData.type == 'image') {
        isRunning = isContainerRunning(app);
      } else if (appData.type == 'multicontainer') {
        isRunning = isMultiContainerRunning(app);
      }
      
      const imageUrl = `${process.env.IMOS_APPS_DIR}/${app.split('-')[1]}/logo.png`;

      const cardHtml = `
      <div class="product-card">
        <a class="product">
            <div>
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <img class="app-icon" src="${imageUrl}"></img>
                    <div>
                        <p class="title">${app}</p>
                    </div>
                    <div id="buttonsdiv-${app}" class="price-container">
                      <!-- Buttons will be appended here -->
                    </div>
                </div>
            </div>
        </a>
      </div>
      `;
      
      appListDiv.innerHTML += cardHtml;

      const buttonsDiv = document.getElementById(`buttonsdiv-${app}`);
      const startStopBtn = createButton(isRunning ? 'pause' : 'play_arrow', () => startstopApp(app, appData.type, isRunning));
      const resetBtn = createButton('stop', () => resetApp(app, appData.type, isRunning));
      const deleteBtn = createButton('delete', () => deleteApp(app, appData.type, isRunning));
      const settingsBtn = createButton('settings', () => openSettings(app));
      const statusLED = createStatusLED(isRunning);
      
      buttonsDiv.appendChild(startStopBtn);
      buttonsDiv.appendChild(resetBtn);
      buttonsDiv.appendChild(deleteBtn);
      buttonsDiv.appendChild(settingsBtn);
      buttonsDiv.appendChild(statusLED);
    }
  } catch (error) {
    console.error('Error creating app cards:', error);
  }
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
    const icon = document.createElement('i');
    icon.classList.add('material-symbols-outlined');
    icon.textContent = text;
    button.append(icon);
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