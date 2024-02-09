const { ipcRenderer } = require('electron');
const { spawn } = require('child_process');
const Docker = require('dockerode');

const openApps = {};

function setupButton(buttonId, appPath) {
    if (buttonId.includes('imos')){
        document.getElementById(buttonId).addEventListener('click', () => {
            ipcRenderer.send('runDockerApp', appPath);
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
    const electronPath = 'C:/imos/imos-app/node_modules/.bin/electron.cmd';
    const childProcess = spawn(electronPath, [appPath]);
    
    openApps[appPath] = {
        closed: false,
        process: childProcess,
    };

    childProcess.on('close', () => {
        openApps[appPath].closed = true;
    });
}

let installedApps = [];
let defaultApps = ['marketplace-app', 'enabler-app', 'settings-app'];

async function getInstalledApps() {
    const docker = new Docker();

    try {
        const images = await docker.listImages();
        const builtImages = images
            .filter((image) => image.RepoTags)
            .filter((image) => image.RepoTags.some((tag) => tag.includes('imos')))
            .map((image) => image.RepoTags.map((tag) => tag.split(':')[0]))
            .flat();

        return builtImages;
    } catch (error) {
        console.error('Error fetching Docker images:', error);
        return [];
    }
}

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

getInstalledApps().then((builtImages) => {
    console.log('Built Images:', builtImages);
    installedApps = defaultApps.concat(builtImages);
    console.log('Installed Apps:', installedApps);

    const dynamicButtonsContainer = document.getElementById('dynamicButtonsContainer');

    // Dynamically generate buttons for installed apps
    installedApps.forEach((appName, index) => {
        const buttonId = `button_${appName}`;
        const appPath = appName.includes('imos') ? appName : `${appName}/main.js`;

        // Create a new button
        const newButton = document.createElement('button');
        newButton.setAttribute('class', 'button-component');
        newButton.setAttribute('type', 'app');
        newButton.setAttribute('id', buttonId);
        newButton.innerHTML = `<span class='circle-info'>${index + 1}</span>`;

        // Append the button to the dynamicButtonsContainer
        dynamicButtonsContainer.appendChild(newButton);

        // Set up the button click event
        setupButton(buttonId, appPath);
    });
    circular();
});

document.getElementById('button_logout').addEventListener('click', () => {
    ipcRenderer.send('logout');
});

window.addEventListener('load', circular, false);
