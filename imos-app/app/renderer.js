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
            console.log('Uninstall action triggered');
            document.body.removeChild(contextMenu);
        });

        document.getElementById('settings').addEventListener('click', () => {
            console.log('Settings action triggered');
            document.body.removeChild(contextMenu);
        });

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
    'imoslink': { type: 'default' },
    'imostore': { type: 'default' },
    'imoshub': { type: 'default' },
    'settings': { type: 'default' }
};

function circular() {
    const container = document.querySelector('.app-container');
    const circles = document.querySelectorAll('.button-component[type=app]');
    const radius = container.offsetWidth / 2;
    let rotation = 0;

    circles.forEach((circle, i) => {
        const value = `rotate(${rotation}deg) translate(${radius}px) rotate(calc(-${rotation}deg + 90deg))`;
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
    Object.keys(installedApps).forEach((app, index) => {
        const appType = installedApps[app].type;
        let imageUrl = '';
        if(appType == 'default'){
            imageUrl = `${process.env.IMOS_ROOT}/${app}/logo.png`;
        }
        else{
            imageUrl = `${process.env.IMOS_APPS_DIR}/${app.split('-')[1]}/logo.png`;
        }
        const buttonId = `button-${app}`;
        const appPath = appType.includes('default') ? `${app}/main.js` : app;
        
        const newApp = document.createElement('button');
        newApp.setAttribute('class', 'button-component');
        newApp.setAttribute('title', app);
        newApp.setAttribute('type', 'app');
        newApp.setAttribute('id', buttonId);       
        newApp.style.backgroundImage = `url('${imageUrl}')`;
        newApp.style.backgroundSize = 'cover';
        newApp.style.backgroundPosition = 'center';
        dynamicButtonsContainer.appendChild(newApp);
        
        setupButton(buttonId, appPath, appType);
    });

    circular();
});

document.getElementById('button_logout').addEventListener('click', () => {
    ipcRenderer.send('logout');
});

window.addEventListener('load', circular, false);
