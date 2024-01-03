// renderer.js
const { ipcRenderer } = require('electron');
const { spawn } = require('child_process');

const openApps = {};

function setupButton(buttonId, appPath) {
    if (buttonId != 'button1' && buttonId != 'button2' && buttonId != 'button3'){
        document.getElementById(buttonId).addEventListener('click', () => {
            const dockerAppName = 'docker-app'; // Replace with the actual name of your Docker image
            if (!openApps[dockerAppName] || openApps[dockerAppName].closed) {
                // Run the Docker app only if it's not already open
                ipcRenderer.send('runDockerApp');
            }
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

    // Optional: Handle communication or synchronization between the parent and child processes if needed
    // For example, you can use ipcRenderer to send messages between the processes
    ipcRenderer.send('startAnotherApp', 'Data to send to the other app');

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
setupButton('button1', 'marketplace-app/main.js'); 
setupButton('button2', 'enabler-app/main.js');
setupButton('button3', 'settings-app/main.js');
setupButton('dockerButton', '');