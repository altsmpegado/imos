// renderer.js
const { ipcRenderer } = require('electron');
const { spawn } = require('child_process');

const openApps = {};

function setupButton(buttonId) {
    if (buttonId.includes('docker')){
        const appPath = buttonId.replace('button_', '');
        document.getElementById(buttonId).addEventListener('click', () => {
            ipcRenderer.send('runDockerApp', appPath);
        });
    }
    else {
        const appPath = buttonId.replace('button_', '') + '/main.js';
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
    
    // Update the open state for the launched app
    openApps[appPath] = {
        closed: false,
        process: childProcess,
    };

    // Listen for the 'close' event to update the open state when the app is closed
    childProcess.on('close', () => {
        openApps[appPath].closed = true;
    });
}

// Set up buttons
setupButton('button_marketplace-app'); 
setupButton('button_enabler-app');
setupButton('button_settings-app');
setupButton('button_docker-app');

document.getElementById('button_logout').addEventListener('click', () => {
    ipcRenderer.send('logout');
});

// https://codepen.io/noirsociety/pen/xxaWBzg
// App Visuals
const container = document.querySelector('.app-container');
const circles = document.querySelectorAll('.button-component[type=app]');
const radius = container.offsetWidth/2;
//const rotation = 360/circles.length;
let rotation = 0;
let mrotation = 360;

function circular() {
  circles.forEach((circle,i) => {
    if (i != 0){
        if (i % 2){
            rotation += 360/12;
        }
        else {
            mrotation -= 360/12;
        }
    }
    const value = `rotate(${i % 2 ? rotation : mrotation}deg) translate(${radius}px) rotate(-${i % 2 ? rotation : mrotation}deg)`;
    
    circle.style.transform = value;
  });
}

function circular() {
    circles.forEach((circle,i) => {
      const value = `rotate(${rotation}deg) translate(${radius}px) rotate(-${rotation}deg)`;
      rotation += 360/12;
      circle.style.transform = value;
    });
  }

window.addEventListener('load', circular, false);