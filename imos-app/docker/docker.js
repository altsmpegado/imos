const { spawnSync } = require('child_process');

function openBrowser(url) {
    const { status, error } = spawnSync('start', [url], { shell: true });
    if (status !== 0) {
        console.error('Error opening web browser:', error);
    }
}

function doesContainerExist(containerName) {
    const result = spawnSync('docker', ['ps', '-a', '--format', '{{.Names}}'], { encoding: 'utf-8' });
    if (result.status === 0) {
        const containers = result.stdout.trim().split('\n');
        return containers.includes(containerName);
    } else {
        console.error('Error checking if container exists:', result.stderr);
        return false;
    }
}

function isContainerRunning(containerName) {
    const result = spawnSync('docker', ['inspect', '--format={{.State.Running}}', containerName], { encoding: 'utf-8' });
    if (result.status === 0) {
        return result.stdout.trim() === 'true';
    } else {
        console.error('Error checking if container is running:', result.stderr);
        return false;
    }
}

function getContainerPort(containerName) {
    const result = spawnSync('docker', ['inspect', '--format={{range $p := .NetworkSettings.Ports}}{{$p}} {{end}}', containerName], { encoding: 'utf-8' });
    if (result.status === 0) {
        const portMappings = result.stdout.trim().slice(2, -2);
        if (portMappings.length > 0) {
            // Extract the host port from the port mappings
            const hostPort = portMappings.split(' ')[1];
            return hostPort;
        } else {
            console.error('No port mappings found for the container.');
            return null;
        }
    } else {
        console.error('Error retrieving container port:', result.stderr);
        return null;
    }
}

function getImageMetadata(imageName) {
    const result = spawnSync('docker', ['inspect', '--format={{json .Config.Labels}}', imageName], { encoding: 'utf-8' });
    if (result.status === 0) {
        const labels = JSON.parse(result.stdout);
        return labels;
    } else {
        console.error('Error retrieving labels:', result.stderr);
        return null;
    }
}

function createDockerProcess(appConfig) {
    const appName = appConfig.appName;
    const ip = appConfig.ip;
    const localhost = appConfig.localhost;
    /*const dockerProcess = spawnSync('docker', [
        'run',
        '--rm',
        '--name',
        appName,
        '-e', 'DISPLAY=host.docker.internal:0',
        appName
    ]);*/
    // Create and run a new container
    const dockerProcess = spawnSync('docker', [
        'run',
        '-d',
        '-p', localhost + ':3000',
        '--name', appName,
        '-e', 'PORT=' + localhost,
        '-e', 'WEBCAM_IP=' + ip,
        appName
    ]);

    if (dockerProcess.status === 0) {
        console.log('Container created and started successfully.');
        openBrowser(`http://localhost:${localhost}`);
    } else {
        console.error('Error creating or starting container:', dockerProcess.stderr);
    }
}

function startDockerProcess(containerName) {
    //console.log(containerName);
    if (!isContainerRunning(containerName)) {
        // start the existing container if not already running
        const dockerProcess = spawnSync('docker', ['start', containerName]);
        if (dockerProcess.status !== 0) {
            console.error('Error starting existing container:', dockerProcess.stderr);
        } else {
            console.log('Container started successfully.');
        }
    }
    const containerPort = getContainerPort(containerName);
    if (containerPort !== null) {
        openBrowser(`http://localhost:${containerPort}`);
    }
}

module.exports = { createDockerProcess, doesContainerExist, startDockerProcess, getImageMetadata};