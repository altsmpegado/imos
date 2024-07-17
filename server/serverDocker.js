const { spawnSync } = require('child_process');
const path = require('path');
const Docker = require('dockerode');

/**
 * Function to check if a Docker container is running.
 * @param {string} containerName - The name of the Docker container.
 * @returns {boolean} - True if the container is running, false otherwise.
 */
function isContainerRunning(containerName) {
    const result = spawnSync('docker', ['inspect', '--format={{.State.Running}}', containerName], { encoding: 'utf-8' });

    if (result.status === 0) {
        return result.stdout.trim() === 'true';
    } else {
        console.error('Container is not running', containerName);
        return false;
    }
}

/**
 * Async function to fetch all Docker images associated with a multi-container project.
 * @param {string} projectName - The name of the multi-container project.
 * @returns {Promise<string[] | null>} - Array of Docker image names or null if error.
 */
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

/**
 * Function to check if a Docker compose multi-container environment is running.
 * @param {string} projectName - The name of the multi-container project.
 * @returns {boolean} - True if at least one container is running, false otherwise.
 */
function isMultiContainerRunning(projectName) {
    const result = spawnSync('docker', ['compose', '-p', projectName, 'ps', '-q'], { encoding: 'utf-8', shell: true });

    if (result.status === 0) {
        const containerIds = result.stdout.trim().split('\n');
        return containerIds.length > 1;
    } else {
        console.error('Error checking if multi-container environment is running:', result.stderr);
        return false;
    }
}

/**
 * Function to create and start a Docker container based on provided configuration.
 * @param {Object} configData - Configuration data for creating the Docker container.
 * @returns {boolean} - True if container was created and started successfully, false otherwise.
 */
function createDockerProcess(configData) {
    const appName = configData.appName;
    const userappName = configData.userappName;
    const projectDir = appName.split('-')[1];

    delete configData.appName;
    delete configData.username;
    delete configData.userappName;
    delete configData.type;

    const baseDir = path.resolve(__dirname, '../apps');
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

/**
 * Function to create and start a multi-container Docker environment based on provided configuration.
 * @param {Object} configData - Configuration data for creating the multi-container Docker environment.
 * @returns {boolean} - True if multi-container environment was created and started successfully, false otherwise.
 */
function createMultiDockerProcess(configData) {
    const appName = configData.appName;
    const username = configData.username;
    const userappName = configData.userappName;
    const projectDir = appName.split('-')[1];

    delete configData.appName;
    delete configData.username;
    delete configData.userappName;
    delete configData.type;

    const baseDir = path.resolve(__dirname, '../apps');
    const appDir = path.resolve(baseDir, projectDir, appName);
    let envArgs = '';

    for (const [key, value] of Object.entries(configData)) {
        if (value != '')
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
        console.error('Error creating or starting multicontainer:', dockerProcess.stderr.toString());
        deleteDockerProcess(username, { type: 'multicontainer', container_name: userappName, image: appName });
        return false;
    }
}

/**
 * Function to start a Docker container or multi-container environment.
 * @param {Object} configData - Configuration data for starting the Docker process.
 * @returns {boolean} - True if Docker process was started successfully, false otherwise.
 */
function startDockerProcess(configData) {
    if (configData.type == 'image') {
        if (!isContainerRunning(configData.container_name)) {
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

    else if (configData.type == 'multicontainer') {
        if (!isMultiContainerRunning(configData.container_name)) {
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

/**
 * Function to stop a Docker container or multi-container environment.
 * @param {Object} configData - Configuration data for stopping the Docker process.
 * @returns {boolean} - True if Docker process was stopped successfully, false otherwise.
 */
function stopDockerProcess(configData) {
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
    else if (configData.type == 'multicontainer') {
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

/**
 * Function to delete a Docker container or multi-container environment.
 * @param {string} user - The username associated with the container(s).
 * @param {Object} configData - Configuration data for deleting the Docker process.
 * @returns {boolean} - True if Docker process was deleted successfully, false otherwise.
 */
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

module.exports = { createDockerProcess, createMultiDockerProcess, startDockerProcess, stopDockerProcess, deleteDockerProcess }