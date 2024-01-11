// docker.js
const { ipcMain } = require('electron');
const { spawn } = require('child_process');

function createDockerProcess(appName) {
    // Replace 'docker-app' with the name of your Docker image
    const dockerProcess = spawn('docker', [
        'run',
        '--rm',
        '--name',
        appName,
        '-e', 'DISPLAY=host.docker.internal:0',
        appName
    ]);

    dockerProcess.stdout.on('data', (data) => {
        console.log(`Docker Output: ${data}`);
    });

    dockerProcess.stderr.on('data', (data) => {
        console.error(`Docker Error: ${data}`);
    });

    dockerProcess.on('close', (code) => {
        console.log(`Docker process exited with code ${code}`);
    });
}

module.exports = { createDockerProcess };