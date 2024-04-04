const { ipcRenderer, app } = require('electron');
const { spawn } = require('child_process');
const Docker = require('dockerode');
const { KubeConfig, AppsV1Api } = require('@kubernetes/client-node');

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

let installedApps = {};
let defaultApps = {
    'marketplace-app': { type: 'default' },
    'enabler-app': { type: 'default' },
    'settings-app': { type: 'default' }
};

async function getInstalledApps() {
    const docker = new Docker();

    try {
        // Fetch Docker images - for solo containers
        const dockerImages = await docker.listImages();
        console.log(dockerImages);
        const imosImages = dockerImages
            .filter(image => image.RepoTags)
            .filter(image => image.RepoTags.some(tag => tag.includes('imos')))
            .map(image => ({ name: image.RepoTags[0].split(':')[0], type: 'image' }));

        // Fetch Docker containers - for multi containers/services in compose file
        const dockerContainers = await docker.listContainers({ all: true });
        //console.log(dockerContainers);
        const imosContainers = dockerContainers
            .reduce((acc, container) => {
                const labels = container.Labels || {};
                const projectName = labels['com.docker.compose.project'];
                if (projectName && projectName.startsWith('imos') && !acc.find(app => app.name === projectName)) {
                    acc.push({ name: projectName, type: 'multicontainer' });
                }
                return acc;
            }, []);
        
        //console.log(imosContainers);

        // Fetch Kubernetes deployments - for kubernetes deployment files
        /*const kubeconfig = new KubeConfig();
        kubeconfig.loadFromDefault();
        const k8sApi = kubeconfig.makeApiClient(AppsV1Api);
        const response = await k8sApi.listNamespacedDeployment('default');
        const deployedApps = response.body.items
            .filter((deployment) => deployment.metadata.name.includes('imos'))
            .map((deployment) => deployment.metadata.name);
        */
        // Merge Docker images and Kubernetes deployments into one list
        //const installedApps = [...builtImages, ...deployedApps];

        const installedApps = [...imosImages,  ...imosContainers]

        // Create a dictionary to store apps with their types
        const appDictionary = installedApps.reduce((acc, app) => {
            acc[app.name] = { type: app.type };
            return acc;
        }, {});

        console.log(appDictionary);
        return appDictionary;
        
    } catch (error) {
        console.error('Error fetching Docker images and Kubernetes deployments:', error);
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
        newButton.setAttribute('type', appType);
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
