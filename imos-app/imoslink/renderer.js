const { ipcRenderer } = require('electron');
const { getInstalledApps, isContainerRunning, isMultiContainerRunning,
  startDockerProcess, stopDockerProcess, doesContainerExist, doesMultiContainerExist } = require('../docker/docker');

let installedApps;

/**
 * Function to start an application based on user input.
 * Sends an IPC event to start the application by search.
 */
function startApp() {
  const appName = document.getElementById('app-name').value.trim();
  if (!appName) {
    displayMessage('Please enter a valid application name.', 'error');
    return;
  }
  ipcRenderer.send('start-appbysearch', appName, installedApps);
}

/**
 * Function to stop an application based on user input.
 * Sends an IPC event to stop the application by search.
 */
function stopApp() {
  const appName = document.getElementById('app-name').value.trim();
  if (!appName) {
    displayMessage('Please enter a valid application name.', 'error');
    return;
  }
  ipcRenderer.send('stop-appbysearch', appName);
}

/**
 * Function to create a status LED element based on whether the application is running.
 * @param {boolean} isRunning - Flag indicating if the application is running.
 * @returns {HTMLElement} - Created status LED element.
 */
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

/**
 * Function to handle starting or stopping an application based on its current state.
 * @param {string} app - The name of the application.
 * @param {string} type - The type of the application ('image' or 'multicontainer').
 * @param {boolean} isRunning - Flag indicating if the application is currently running.
 */
function startstopApp(app, type, isRunning) {
  if (type == 'image' && !doesContainerExist(app))
    ipcRenderer.send('restartApp', app, type);

  else if (type == 'multicontainer' && !doesMultiContainerExist(app))
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

/**
 * Function to reset an application by stopping and deleting its Docker process.
 * @param {string} appName - The name of the application.
 * @param {string} type - The type of the application ('image' or 'multicontainer').
 * @param {boolean} isRunning - Flag indicating if the application is currently running.
 */
function resetApp(appName, type, isRunning) {
  if (doesContainerExist(appName) || doesMultiContainerExist(appName)) {
    if (isRunning)
      stopDockerProcess(appName, type);

    ipcRenderer.send('deleteProcess', appName, type);
    ipcRenderer.on('deleted', () => {
      ipcRenderer.send('restartApp', appName, type);
    });
  }
}

/**
 * Function to delete an application by stopping its Docker process and uninstalling it.
 * @param {string} appName - The name of the application.
 * @param {string} type - The type of the application ('image' or 'multicontainer').
 * @param {boolean} isRunning - Flag indicating if the application is currently running.
 * @param {Object} installedApps - Object containing information about installed applications.
 */
function deleteApp(appName, type, isRunning, installedApps) {
  if (appName in installedApps) {
    if (isRunning)
      stopDockerProcess(appName, type);

    ipcRenderer.send('deleteProcess', appName, type);
    ipcRenderer.on('deleted', () => {
      ipcRenderer.send('unnistallApp', appName, type);
    });
  }
  else {
    console.log("This app does not exist or cannot be deleted:", appName);
  }
}

/**
 * Function to create a button element with an optional click handler.
 * @param {string} text - Text content of the button.
 * @param {function} clickHandler - Optional click handler function for the button.
 * @returns {HTMLElement} - Created button element.
 */
function createButton(text, clickHandler = null) {

  const button = document.createElement('button');
  button.className = 'button';

  const icon = document.createElement('i');
  icon.classList.add('material-symbols-outlined');
  icon.textContent = text;

  button.append(icon);
  button.addEventListener('click', clickHandler);

  return button;
}

/**
 * Event listener for when the DOM content is fully loaded.
 * Populates the application container with cards for each installed application,
 * displaying application information, buttons for starting/stopping/resetting/deleting,
 * and status indicators.
 */
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

/**
 * Event listener for handling the 'all-set' event,
 * triggered when Docker application setup is completed.
 * Reloads the application to reflect changes.
 */
ipcRenderer.on('all-set', () => {
  location.reload();
});

// Uncomment the following setInterval function if auto-reload is needed periodically.
/*
setInterval(() => {
  location.reload();
}, 5000);
*/