const { ipcRenderer } = require('electron');
const { spawn } = require('child_process');
const { getInstalledApps } = require('../docker/docker');

const openApps = {};

function setupButton(buttonId, appPath, appType) {
    const button = document.getElementById(buttonId);
    
    button.addEventListener('click', () => {
        if (appType !== 'default') {
            ipcRenderer.send('runDockerApp', appPath, appType);
        } else {
            if (!openApps[appPath] || openApps[appPath].closed) {
                launchApp(appPath);
            }
        }
    });

    button.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        
        const contextMenu = document.createElement('div');
        contextMenu.classList.add('context-menu');
        contextMenu.innerHTML = `
            <div class="context-menu-option" id="open">Open</div>
            <div class="context-menu-option" id="uninstall">Uninstall</div>
            <div class="context-menu-option" id="settings">Settings</div>
        `;

        contextMenu.style.position = 'absolute';
        contextMenu.style.left = `${event.pageX}px`;
        contextMenu.style.top = `${event.pageY}px`;

        document.body.appendChild(contextMenu);

        // Event listeners for context menu options
        document.getElementById('open').addEventListener('click', () => {
            if (appType !== 'default') {
                ipcRenderer.send('runDockerApp', appPath, appType);
            } else {
                if (!openApps[appPath] || openApps[appPath].closed) {
                    launchApp(appPath);
                }
            }
            document.body.removeChild(contextMenu);
        });

        document.getElementById('uninstall').addEventListener('click', () => {
            // Implement uninstall action
            console.log('Uninstall action triggered');
            document.body.removeChild(contextMenu);
        });

        document.getElementById('settings').addEventListener('click', () => {
            // Implement settings action
            console.log('Settings action triggered');
            document.body.removeChild(contextMenu);
        });

        // Hide context menu when clicking outside
        document.addEventListener('click', (event) => {
            if (!event.target.closest('.context-menu')) {
                document.body.removeChild(contextMenu);
            }
        });
    });
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
    'imostore': { type: 'default' },
    'imoslink': { type: 'default' },
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
        const appPath = appType.includes('default') ? `${appName}/main.js` : appName;
        
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
