const { execSync, spawnSync } = require('child_process');
const Docker = require('dockerode');

/**
 * Opens a web browser with the specified URL.
 * @param {string} url - The URL to open in the web browser.
 */
function openBrowser(url) {
    const { status, error } = spawnSync('start', [url], { shell: true });

    if (status !== 0) {
        console.error('Error opening web browser:', error);
    }
    console.error('Opened web browser at:', url);
}

/**
 * Fetches the list of installed Docker applications.
 * @returns {Promise<Object>} A dictionary of installed apps with their types.
 */
async function getInstalledApps() {
    const docker = new Docker();
    try {
        const dockerImages = await docker.listImages();

        const imosImages = dockerImages
            .filter(image => image.RepoTags)
            .filter(image => image.RepoTags.some(tag => tag.includes('imos')))
            .map(image => ({ name: image.RepoTags[0].split(':')[0], type: 'image' }));

        const imosMultiImages = dockerImages
            .reduce((acc, image) => {
                const labels = image.Labels || {};
                const projectName = labels['com.main.multicontainer'];
                if (projectName && projectName.startsWith('imos') && !acc.find(app => app.name === projectName)) {
                    acc.push({ name: projectName, type: 'multicontainer' });
                }
                return acc;
            }, []);

        const installedApps = [...imosImages, ...imosMultiImages]

        const appDictionary = installedApps.reduce((acc, app) => {
            acc[app.name] = { type: app.type };
            return acc;
        }, {});

        return appDictionary;
    } catch (error) {
        console.error('Error fetching Docker images and Kubernetes deployments:', error);
        return [];
    }
}

/**
 * Checks if a Docker container exists.
 * @param {string} containerName - The name of the Docker container.
 * @returns {boolean} True if the container exists, false otherwise.
 */
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

/**
 * Checks if a Docker multi-container environment exists.
 * @param {string} containerName - The name of the multi-container environment.
 * @returns {boolean} True if the multi-container environment exists, false otherwise.
 */
function doesMultiContainerExist(containerName) {
    const result = spawnSync('docker', ['ps', '-a', '--format', '{{.Labels}}'], { encoding: 'utf-8' });

    if (result.status === 0) {
        const containers = result.stdout.trim().split('\n');
        for (const container of containers) {
            const labels = container.split(',');
            for (const label of labels) {
                if (label.includes(`com.docker.compose.project=${containerName}`)) {
                    return true;
                }
            }
        }
        console.error('Multi-container environment does not exist.');
        return false;
    } else {
        console.error('Error checking if multi-container environment exists:', result.stderr);
        return false;
    }
}

/**
 * Checks if a Docker container is running.
 * @param {string} containerName - The name of the Docker container.
 * @returns {boolean} True if the container is running, false otherwise.
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
 * Checks if a Docker multi-container environment is running.
 * @param {string} projectName - The name of the multi-container project.
 * @returns {boolean} True if the multi-container environment is running, false otherwise.
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
 * Fetches the public ports of a Docker container.
 * @param {string} containerName - The name of the Docker container.
 * @returns {Promise<Array<number>>} An array of public ports.
 */
async function getContainerPort(containerName) {
    const docker = new Docker();
    const ports = [];

    try {
        const dockerContainers = await docker.listContainers({ all: true });
        dockerContainers.forEach(container => {
            if (containerName === container.Image) {
                const labels = container.Labels || {};
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

/**
 * Fetches the public ports of a Docker multi-container environment.
 * @param {string} projectName - The name of the multi-container project.
 * @returns {Promise<Array<number>>} An array of public ports.
 */
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

/**
 * Fetches metadata for a Docker image.
 * @param {string} imageName - The name of the Docker image.
 * @returns {Object|null} An object containing metadata or null if an error occurs.
 */
function getImageMetadata(imageName) {
    const metadata = {};
    const result = spawnSync('docker', ['inspect', '--format={{json .Config.Labels}}', imageName], { encoding: 'utf-8' });

    if (result.status === 0) {
        const labels = JSON.parse(result.stdout);
        const availableConfigsLabel = labels["com.available.configs"];
        const requiredConfigsLabel = labels["com.required.configs"];
        if (availableConfigsLabel) {
            const aconfigs = availableConfigsLabel.split(",").map(config => config.trim());
            var rconfigs = [];
            if (requiredConfigsLabel) {
                rconfigs = requiredConfigsLabel.split(",").map(config => config.trim());
            }
            aconfigs.forEach((aconfig) => {
                if (rconfigs.includes(aconfig))
                    metadata[aconfig] = true;
                else
                    metadata[aconfig] = false;
            });
        }
        return metadata;
    } else {
        console.error('Error retrieving labels:', result.stderr);
        return null;
    }
}

/**
 * Fetches metadata for a Docker multi-container environment.
 * @param {string} projectName - The name of the multi-container project.
 * @returns {Promise<Object|null>} An object containing metadata or null if an error occurs.
 */
async function getMultiImageMetadata(projectName) {
    const docker = new Docker();
    const metadata = {};

    try {
        const dockerImages = await docker.listImages();
        dockerImages.forEach((image) => {
            const labels = image.Labels || {};

            if (labels["com.main.multicontainer"] === projectName) {
                const availableConfigsLabel = labels["com.available.configs"];
                const requiredConfigsLabel = labels["com.required.configs"];

                if (availableConfigsLabel) {
                    const aconfigs = availableConfigsLabel.split(",").map(config => config.trim());
                    var rconfigs = [];

                    if (requiredConfigsLabel) {
                        rconfigs = requiredConfigsLabel.split(",").map(config => config.trim());
                    }

                    aconfigs.forEach((aconfig) => {
                        if (rconfigs.includes(aconfig))
                            metadata[aconfig] = true;
                        else
                            metadata[aconfig] = false;
                    });
                }
            }
        });
        return Object(metadata);
    } catch (error) {
        console.error('Error fetching multi-container configs:', error);
        return null;
    }
}

/**
 * Fetches all Docker images from a multi-container project.
 * @param {string} projectName - The name of the multi-container project.
 * @returns {Promise<Array<string>|null>} An array of image names or null if an error occurs.
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
 * Creates and starts a Docker container based on configuration data.
 * @param {Object} configData - Configuration data for creating the Docker container.
 * @param {string} configData.appName - The name of the Docker container/application.
 * @param {string} configData.PORT - Optional port mapping for the container.
 * @param {number} [interface=1] - Interface mode (default: 1).
 */
function createDockerProcess(configData, interface = 1) {
    const appName = configData.appName;
    const projectDir = appName.split('-')[1];
    delete configData.appName;
    delete configData.type;
    const baseDir = process.env.IMOS_APPS_DIR || 'C:\\imos\\apps';
    const volumeDir = `${baseDir}\\${projectDir}\\Volume`;

    const dockerArgs = [
        'run',
        '-d',
        '-v', `${volumeDir}:/tmp`,
        '--name', appName
    ];

    if (configData.PORT) {
        dockerArgs.push('-p', configData.PORT);
    }

    for (const [key, value] of Object.entries(configData)) {
        dockerArgs.push('-e', `${key}=${value}`);
    }

    dockerArgs.push(appName);
    console.log('Executing command:', 'docker', dockerArgs);
    const dockerProcess = spawnSync('docker', dockerArgs);

    if (dockerProcess.status === 0) {
        console.log('Container created and started successfully.');
    } else {
        console.error('Error creating or starting container:', dockerProcess.stderr);
    }

    if (interface == 1) {
        getContainerPort(appName)
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
}

/**
 * Creates and starts a Docker multi-container environment based on configuration data.
 * @param {Object} configData - Configuration data for creating the multi-container environment.
 * @param {string} configData.appName - The name of the Docker multi-container environment/application.
 * @param {number} [interface=1] - Interface mode (default: 1).
 */
function createMultiDockerProcess(configData, interface = 1) {
    const appName = configData.appName;
    const projectDir = appName.split('-')[1];
    delete configData.appName;
    delete configData.type;
    let envArgs = '';

    for (const [key, value] of Object.entries(configData)) {
        if (value != '')
            envArgs += `$env:${key}='"${value}"'; `;
    }

    const baseDir = process.env.IMOS_APPS_DIR || 'C:\\imos\\apps';
    const command = `powershell -Command "{ Set-Location '${baseDir}\\${projectDir}'; ${envArgs} docker compose -f docker-compose.yml -p ${appName} up -d}"`;
    console.log('Executing command:', command);
    const dockerProcess = spawnSync('powershell', ['-Command', command], { shell: true });

    if (dockerProcess.status === 0) {
        console.log('Multicontainer created and started successfully.');
    } else {
        console.error('Error creating or starting multicontainer:', dockerProcess.stderr ? dockerProcess.stderr.toString() : 'Unknown error');
    }

    if (interface == 1) {
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
}

/**
 * Starts a Docker container or multi-container environment based on the specified type.
 * @param {string} containerName - The name of the Docker container or multi-container environment.
 * @param {string} type - The type of the container ('image' or 'multicontainer').
 * @param {number} [interface=1] - Interface mode (default: 1).
 */
function startDockerProcess(containerName, type, interface = 1) {
    if (type == 'image') {
        if (!isContainerRunning(containerName)) {
            const dockerProcess = spawnSync('docker', ['start', containerName]);
            if (dockerProcess.status !== 0) {
                console.error('Error starting existing container:', dockerProcess.stderr);
            } else {
                console.log('Container started successfully.');
            }
        }
        if (interface == 1) {
            getContainerPort(containerName)
                .then(port => {
                    console.log('Port:', port);
                    openBrowser(`http://localhost:${port}`);

                })
                .catch(error => {
                    console.error('Error:', error);
                });
        }
    }

    else if (type == 'multicontainer') {
        if (!isMultiContainerRunning(containerName)) {
            try {
                console.log('Docker Compose started');
                execSync(`docker compose -p ${containerName} start`);
            } catch (error) {
                console.error('Error starting Docker Compose:', error.stderr.toString());
            }
        }

        if (interface == 1) {
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
        }
    }
}

/**
 * Stops a Docker container or multi-container environment based on the specified type.
 * @param {string} containerName - The name of the Docker container or multi-container environment.
 * @param {string} type - The type of the container ('image' or 'multicontainer').
 */
function stopDockerProcess(containerName, type) {
    if (type == 'image') {
        if (isContainerRunning(containerName)) {
            const dockerProcess = spawnSync('docker', ['stop', containerName]);
            if (dockerProcess.status !== 0) {
                console.error('Error stoping existing container:', dockerProcess.stderr);
            } else {
                console.log('Container exited successfully.');
            }
        }
    }

    else if (type == 'multicontainer') {
        if (isMultiContainerRunning(containerName)) {
            try {
                console.log('Docker compose stop started');
                execSync(`docker compose -p ${containerName} stop`);
            } catch (error) {
                console.error('Error exiting docker compose:', error.stderr.toString());
            }
        }
    }
}

/**
 * Deletes a Docker container or multi-container environment based on the specified type.
 * @param {string} containerName - The name of the Docker container or multi-container environment.
 * @param {string} type - The type of the container ('image' or 'multicontainer').
 */
function deleteDockerProcess(containerName, type) {
    if (type === 'image') {
        const dockerProcess = spawnSync('docker', ['rm', containerName]);
        if (dockerProcess.status !== 0) {
            console.error('Error deleting existing container:', dockerProcess.stderr);
        } else {
            console.log('Container deleted successfully.');
        }
    }
    else if (type === 'multicontainer') {
        getAllImagesFromMultiContainer(containerName)
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

/**
 * Uninstalls a Docker application or multi-container environment based on the specified type.
 * @param {string} containerName - The name of the Docker application or multi-container environment.
 * @param {string} type - The type of the container ('image' or 'multicontainer').
 */
function deleteDockerApp(containerName, type) {
    if (type === 'image') {
        const dockerProcess = spawnSync('docker', ['rmi', containerName]);
        if (dockerProcess.status !== 0) {
            console.error('Error deleting existing container:', dockerProcess.stderr);
        } else {
            console.log('App unnistalled successfully.');
        }
    }
    else if (type === 'multicontainer') {
        getAllImagesFromMultiContainer(containerName)
            .then((containers) => {
                containers.forEach((container) => {
                    const dockerProcess = spawnSync('docker', ['rmi', container]);
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
        console.log('Multicontainer', containerName, 'unnistalled with all sub-containers.');
    } else {
        console.error('Unknown container type:', type);
    }
}

module.exports = {
    createDockerProcess, createMultiDockerProcess, doesContainerExist, doesMultiContainerExist,
    startDockerProcess, stopDockerProcess, getImageMetadata, getMultiImageMetadata, getInstalledApps,
    isContainerRunning, isMultiContainerRunning, deleteDockerProcess, getAllImagesFromMultiContainer,
    deleteDockerApp
};