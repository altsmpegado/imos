const { ipcRenderer } = require('electron');
const { spawn } = require('child_process');
const { getInstalledApps } = require('../docker/docker');

const openApps = {};

function setupButton(buttonId, appPath, appType) {
    if (buttonId.includes('imos')){
        document.getElementById(buttonId).addEventListener('click', () => {
            ipcRenderer.send('runDockerApp', appPath, appType);
        });
    }
    else {
        document.getElementById(buttonId).addEventListener('click', () => {
            if (!openApps[appPath] || openApps[appPath].closed) {
                launchApp(appPath);
            }
        });
    }
}

function launchApp(appPath) {
    const electronPath = 'C:/imos-dev/imos-app/node_modules/.bin/electron.cmd';
    const childProcess = spawn(electronPath, [appPath]);
    
    openApps[appPath] = {
        closed: false,
        process: childProcess,
    };

    childProcess.on('close', () => {
        openApps[appPath].closed = true;
    });
}

let installedApps = {};
let defaultApps = {
    'marketplace-app': { type: 'default' },
    'enabler-app': { type: 'default' },
    'settings-app': { type: 'default' }
};

function circular() {
    const container = document.querySelector('.app-container');
    const circles = document.querySelectorAll('.button-component[type=app]');
    const radius = container.offsetWidth / 2;
    let rotation = 0;

    circles.forEach((circle, i) => {
        const value = `rotate(${rotation}deg) translate(${radius}px) rotate(-${rotation}deg)`;
        rotation += 360 / 12;
        circle.style.transform = value;
    });
}

getInstalledApps().then((builtApps) => {

    console.log('Built Apps:', builtApps);
    installedApps = Object.assign({}, defaultApps, builtApps);
    console.log('Installed Apps:', installedApps);

    const dynamicButtonsContainer = document.getElementById('dynamicButtonsContainer');

    // Dynamically generate buttons for installed apps
    Object.keys(installedApps).forEach((appName, index) => {
        const buttonId = `button_${appName}`;
        const appType = installedApps[appName].type;
        const appPath = appName.includes('imos') ? appName : `${appName}/main.js`;
        
        // Create a new button
        const newButton = document.createElement('button');
        newButton.setAttribute('class', 'button-component');
        newButton.setAttribute('title', appName);
        newButton.setAttribute('type', 'app');
        newButton.setAttribute('id', buttonId);
        newButton.innerHTML = `<span class='circle-info'>${index + 1}</span>`;

        // Append the button to the dynamicButtonsContainer
        dynamicButtonsContainer.appendChild(newButton);

        // Set up the button click event
        setupButton(buttonId, appPath, appType);
    });
    circular();
});

document.getElementById('button_logout').addEventListener('click', () => {
    ipcRenderer.send('logout');
});

window.addEventListener('load', circular, false);
