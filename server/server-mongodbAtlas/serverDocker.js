const { spawnSync } = require('child_process');
const path = require('path');


function isContainerRunning(containerName) {
    //console.log(containerName);
    const result = spawnSync('docker', ['inspect', '--format={{.State.Running}}', containerName], { encoding: 'utf-8' });
    if (result.status === 0) {
        return result.stdout.trim() === 'true';
    } else {
        console.error('Container is not running', containerName);
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

function createDockerProcess(configData) {
    console.log(configData);
    const appName = configData.appName;
    const userappName = configData.userappName;
    const projectDir = appName.split('-')[1];
    console.log(projectDir);
    delete configData.appName;
    delete configData.userappName;
    delete configData.type;
    
    // Use the appropriate base directory environment variable or fallback to a default path
    const baseDir = path.resolve(__dirname, '../../apps');
    const appDir = path.resolve(baseDir, projectDir, appName);
    const volumeDir = path.resolve(baseDir, projectDir, userappName, 'Volume');
    
    const dockerArgs = [
        'run',
        '-d',
        '-v', `${volumeDir}:/tmp`,
        '--name', userappName        
    ];

    if (configData.PORT) {
        dockerArgs.push('-p', configData.PORT);
    }

    for (const [key, value] of Object.entries(configData)) {
        dockerArgs.push('-e', `${key}=${value}`);
    }
    //console.log(dockerArgs);
    // Add the image name to the end, which is the same as the container name
    dockerArgs.push(appName);
    
    //console.log('Executing command:', 'docker', dockerArgs.join(' '));

    const dockerProcess = spawnSync('docker', dockerArgs);

    if (dockerProcess.status === 0) {
        console.log('Container created and started successfully.');
        return true;
    } else {
        console.error('Error creating or starting container:', dockerProcess.stderr.toString());
        return false;
    }
}

function startDockerProcess(configData) {
    //console.log(configData.container_name);
    if(configData.type == 'image'){
        if (!isContainerRunning(configData.container_name)) {
            // start the existing container if not already running
            const dockerProcess = spawnSync('docker', ['start', configData.container_name]);
            if (dockerProcess.status !== 0) {
                console.error('Error starting container:', dockerProcess.stderr);
                return false;
            } else {
                console.log('Container started successfully.');
                return true;
            }
        }
    }

    else if(configData.type == 'multicontainer'){
        if (!isMultiContainerRunning(containerName)) {
            // start the existing container if not already running
            try {
                console.log('Docker Compose started');
                execSync(`docker compose -p ${containerName} start`);
            } catch (error) {
                console.error('Error starting Docker Compose:', error.stderr.toString());
            }
        }

    }
}

function stopDockerProcess(configData) {
    console.log(configData.container_name);
    if (configData.type === 'image') {
        if (isContainerRunning(configData.container_name)) {
            const dockerProcess = spawnSync('docker', ['stop', configData.container_name]);
            if (dockerProcess.status !== 0) {
                console.error('Error stoping container:', dockerProcess.stderr);
                return false;
            } else {
                console.log('Container stoped successfully.');
                return true;
            }
        }
    } 
    else if(configData.type == 'multicontainer'){
        if (isMultiContainerRunning(configData.container_name)) {
            try {
                console.log('Docker compose stop started');
                execSync(`docker compose -p ${configData.container_name} stop`);
            } catch (error) {
                console.error('Error exiting docker compose:', error.stderr.toString());
            }
        }  
    }
}

function deleteDockerProcess(configData) {
    if (configData.type === 'image') {
        const dockerProcess = spawnSync('docker', ['rm', configData.container_name]);
        if (dockerProcess.status !== 0) {
            console.error('Error deleting existing container:', dockerProcess.stderr);
            return false;
        } else {
            console.log('Container deleted successfully.');
            return true;
        }
    } 
    else if (configData.type === 'multicontainer') {
        getAllImagesFromMultiContainer(configData.container_name)
            .then((containers) => {
                containers.forEach((container) => {
                    const dockerProcess = spawnSync('docker', ['rm', container]);
                    if (dockerProcess.status !== 0) {
                        console.error('Error deleting existing container:', dockerProcess.stderr);
                    } else {
                        console.log('Container deleted successfully.');
                    }
                });
            })
            .catch((error) => {
                console.error('Error fetching images from multi-container:', error);
            });
        console.log('Multicontainer', containerName, 'deleted with all sub-containers.');
    } else {
        console.error('Unknown container type:', type);
    }
}

module.exports = {createDockerProcess, startDockerProcess, stopDockerProcess, deleteDockerProcess}