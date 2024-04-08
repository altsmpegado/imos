const { exec, execSync , spawnSync } = require('child_process');
const Docker = require('dockerode');

function openBrowser(url) {
    const { status, error } = spawnSync('start', [url], { shell: true });
    if (status !== 0) {
        console.error('Error opening web browser:', error);
    }
    console.error('Opened web browser at:', url);
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

function doesMultiContainerExist(containerName) {
    const result = spawnSync('docker', ['ps', '-a', '--format', '{{.Labels}}'], { encoding: 'utf-8' });
    if (result.status === 0) {
        const containers = result.stdout.trim().split('\n');
        for (const container of containers) {
            const labels = container.split(',');
            for (const label of labels) {
                if (label.includes(`com.docker.compose.project=${containerName}`)) {
                    return true; // if the project name is found in any container's labels
                }
            }
        }
        console.error('Error checking if multi-container environment exists:', result.stderr);
        return false; 
    } else {
        console.error('Error checking if multi-container environment exists:', result.stderr);
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

function isMultiContainerRunning(projectName) {
    const result = spawnSync('docker', ['compose', '-p', projectName, 'ps', '-q'], { encoding: 'utf-8', shell: true });
    //console.log(result);
    if (result.status === 0) {
        const containerIds = result.stdout.trim().split('\n');
        //console.log(containerIds);
        return containerIds.length > 1; // at least one container is running
    } else {
        console.error('Error checking if multi-container environment is running:', result.stderr);
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

async function getMultiContainerPorts(projectName) {
    const docker = new Docker();
    const ports = [];

    try {
        const dockerContainers = await docker.listContainers({ all: true });

        dockerContainers.forEach(container => {
            const labels = container.Labels || {};
            const containerProjectName = labels['com.docker.compose.project'];
            if (containerProjectName === projectName) {
                const displayLabel = labels['com.user.display'];
                if (displayLabel === 'True') {
                    const portMappings = container.Ports || [];
                    portMappings.forEach(mapping => {
                        if (mapping.PublicPort) {
                            ports.push(mapping.PublicPort);
                        }
                    });
                }
            }
        });

        return ports;
    } catch (error) {
        console.error('Error fetching container ports:', error);
        return [];
    }
}

function getImageMetadata(imageName) {
    const result = spawnSync('docker', ['inspect', '--format={{json .Config.Labels}}', imageName], { encoding: 'utf-8' });
    if (result.status === 0) {
        const labels = JSON.parse(result.stdout);
        if (labels['com.required.configs']) {
            labels['com.required.configs'] = labels['com.required.configs'].split(',').map(item => item.trim());
        }
        return labels;
    } else {
        console.error('Error retrieving labels:', result.stderr);
        return null;
    }
}

async function getMultiImageMetadata(projectName) {
    const docker = new Docker();
    const requiredConfigs = {};
    try {
        const dockerImages = await docker.listImages();
        dockerImages.forEach((image) => {
            const labels = image.Labels || {};
            if (labels["com.main.multicontainer"] === "imos-datavisapp") {
                const requiredConfigsLabel = labels["com.required.configs"];
                if (requiredConfigsLabel) {
                    const configs = requiredConfigsLabel.split(",").map(config => config.trim());
                    configs.forEach((config) => {
                        requiredConfigs[config] = true;
                    });
                }
            }
        });
        //console.log({ "com.required.configs": Object.keys(requiredConfigs) });
        return { "com.required.configs": Object.keys(requiredConfigs) };
    } catch (error) {
        console.error('Error fetching multi-container configs:', error);
        return null;
    }
}

function createDockerProcess(configData) {
    const appName = configData.appName;
    delete configData.appName;

    const dockerArgs = [
        'run',
        '-d',
        // app could not have interface
        '-p', configData.PORT,
        '--name', appName        
    ];

    for (const [key, value] of Object.entries(configData)) {
        dockerArgs.push('-e', `${key}=${value}`);
    }

    // add iamge name to the end, which is the same as the container name
    dockerArgs.push(appName);

    const dockerProcess = spawnSync('docker', dockerArgs);

    if (dockerProcess.status === 0) {
        console.log('Container created and started successfully.');
        // app could not have interface
        openBrowser(`http://localhost:${configData.PORT.split(":")[1]}`);
    } else {
        console.error('Error creating or starting container:', dockerProcess.stderr);
    }
}

function createMultiDockerProcess(configData) {
    const appName = configData.appName;
    const projectDir = appName.split('-')[1];
    delete configData.appName;
    delete configData.type;

    let envArgs = '';

    for (const [key, value] of Object.entries(configData)) {
        envArgs += `$env:${key}='"${value}"'; `;
    }

    const baseDir = process.env.IMOS_APPS_DIR || 'C:\\IMOS\\Apps';

    const command = `powershell -Command "{ Set-Location '${baseDir}\\${projectDir}'; ${envArgs} docker compose -p ${appName} up}"`;

    console.log('Executing command:', command);

    const dockerProcess = spawnSync('powershell', ['-Command', command], { shell: true });

    if (dockerProcess.status === 0) {
        console.log('Multicontainer created and started successfully.');
    } else {
        console.error('Error creating or starting multicontainer:', dockerProcess.stderr ? dockerProcess.stderr.toString() : 'Unknown error');
    }

    getMultiContainerPorts(appName)
        .then(ports => {
            console.log('Ports:', ports);
            ports.forEach(port => {
                openBrowser(`http://localhost:${port}`);
            });
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

function startDockerProcess(containerName, type) {

    //console.log(containerName);
    if(type == 'image'){
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

    else if(type == 'multicontainer'){
        console.log(containerName);
        if (!isMultiContainerRunning(containerName)) {
            // start the existing container if not already running
            try {
                console.log('Docker Compose started');
                execSync(`docker compose -p ${containerName} start`);
            } catch (error) {
                console.error('Error starting Docker Compose:', error.stderr.toString());
            }
        }

        // need to get ports of multiple containers
        // label which containers are intend for user interaction
        getMultiContainerPorts(containerName)
            .then(ports => {
                console.log('Ports:', ports);
                ports.forEach(port => {
                    openBrowser(`http://localhost:${port}`);
                });
            })
            .catch(error => {
                console.error('Error:', error);
            });

        
        /*const containerPort = getContainerPort(containerName);
        if (containerPort !== null) {
            openBrowser(`http://localhost:${containerPort}`);
        }*/
    }
}

module.exports = { createDockerProcess, createMultiDockerProcess, doesContainerExist, doesMultiContainerExist, 
                   startDockerProcess, getImageMetadata, getMultiImageMetadata};