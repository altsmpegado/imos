const { spawnSync } = require('child_process');
const path = require('path');
const Docker = require('dockerode');

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

async function getAllImagesFromMultiContainer(projectName) {
    const docker = new Docker();
    const containers = [];
    try {
        const dockerImages = await docker.listImages();
        dockerImages.forEach((image) => {
            const labels = image.Labels || {};
            if (labels["com.main.multicontainer"] === projectName) {
                const repoTag = image.RepoTags[0];
                const imageName = repoTag.split(':')[0];
                containers.push(imageName);
            }
        });
        return containers;
    } catch (error) {
        console.error('Error fetching multi-container configs:', error);
        return null;
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
    //console.log(configData);
    const appName = configData.appName;
    const userappName = configData.userappName;
    const projectDir = appName.split('-')[1];
    //console.log(projectDir);
    delete configData.appName;
    delete configData.username;
    delete configData.userappName;
    delete configData.type;
    
    const baseDir = path.resolve(__dirname, '../../apps');
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

function createMultiDockerProcess(configData) {
    //console.log(configData);
    const appName = configData.appName;
    const username = configData.username;
    const userappName = configData.userappName;
    const projectDir = appName.split('-')[1];
    //console.log(projectDir);
    delete configData.appName;
    delete configData.username;
    delete configData.userappName;
    delete configData.type;

    const baseDir = path.resolve(__dirname, '../../apps');
    const appDir = path.resolve(baseDir, projectDir, appName);

    let envArgs = '';

    for (const [key, value] of Object.entries(configData)) {
        if(value != '')
            envArgs += `${key}="${value}" `;
    }

    envArgs += `USER="${username}"`;

    const command = `cd ${appDir} && ${envArgs} docker compose -f ${appDir}/docker-compose.server.yml -p ${userappName} up -d`;

    //console.log('Executing command:', command);

    const dockerProcess = spawnSync('/bin/bash', ['-c', command], { shell: true });

    if (dockerProcess.status === 0) {
        console.log('Multicontainer created and started successfully.');
        return true;
    } else {
        console.error('Error creating or starting multicontainer:', dockerProcess.stderr ? dockerProcess.stderr.toString() : 'Unknown error');
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
        if (!isMultiContainerRunning(configData.container_name)) {
            // start the existing container if not already running
            const dockerProcess = spawnSync('docker', ['compose', '-p', `${configData.container_name}`, 'start'], { shell: true });
            if (dockerProcess.status !== 0) {
                console.error('Error starting multicontainer:', dockerProcess.stderr);
                return false;
            } else {
                console.log('Multicontainer started successfully.');
                return true;
            }
        }
    }
}

function stopDockerProcess(configData) {
    //console.log(configData.container_name);
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
            const dockerProcess = spawnSync('docker', ['compose', '-p', `${configData.container_name}`, 'stop'], { shell: true });
            if (dockerProcess.status !== 0) {
                console.error('Error stoping container:', dockerProcess.stderr);
                return false;
            } else {
                console.log('Multicontainer stoped successfully.');
                return true;
            }
        }  
    }
}

function deleteDockerProcess(user, configData) {
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
        getAllImagesFromMultiContainer(configData.image)
            .then((containers) => {
                console.log(containers);
                containers.forEach((container) => {
                    const dockerProcess = spawnSync('docker', ['rm', `${user}-${container}`]);
                    if (dockerProcess.status !== 0) {
                        console.error('Error deleting existing container:', dockerProcess.stderr);
                    } else {
                        console.log('Container removed successfully.');
                    }
                });
            })
            .catch((error) => {
                console.error('Error fetching images from multi-container:', error);
            });
        console.log('Multicontainer', configData.container_name, 'deleted with all sub-containers.');
        return true;
    } else {
        console.error('Unknown container type:', type);
        return false;
    }
}

module.exports = {createDockerProcess, createMultiDockerProcess, startDockerProcess, stopDockerProcess, deleteDockerProcess}