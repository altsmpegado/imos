const { execSync, spawnSync } = require('child_process');
const Docker = require('dockerode');
const { performance } = require('perf_hooks');
const { createLogger, format, transports } = require('winston');

/**
 * Configure Winston Logger.
 */
const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp(),
        format.json() // Structured JSON format for easy parsing
    ),
    transports: [
        new transports.Console(), // Logs to console
        new transports.File({ filename: 'metrics_log.json' }) // Logs to file
    ],
});

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
        //console.log('Multi-container environment does not exist.');
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
    const startTime = performance.now(); // Start timing
    const metrics = { action: 'createDockerProcess', containerName: configData.appName, startTime: new Date().toISOString() };

    // Original functionality unchanged
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

    // Add environment variables to dockerArgs
    for (const [key, value] of Object.entries(configData)) {
        dockerArgs.push('-e', `${key}=${value}`);
    }

    dockerArgs.push(appName);

    // Execute the Docker command
    const commandStart = performance.now();
    const dockerProcess = spawnSync('docker', dockerArgs);
    metrics.commandExecutionTime = performance.now() - commandStart;

    // Handle success or failure
    if (dockerProcess.status === 0) {
        console.log('Container created and started successfully.');
        metrics.success = true;
    } else {
        const error = dockerProcess.stderr ? dockerProcess.stderr.toString() : 'Unknown error';
        console.error('Error creating or starting container:', error);
        metrics.success = false;
        metrics.error = error;
    }

    // Handle interface (optional)
    if (interface === 1) {
        const interfaceStart = performance.now();
        getContainerPort(appName)
            .then(ports => {
                console.log('Ports:', ports);
                ports.forEach(port => {
                    openBrowser(`http://localhost:${port}`);
                });
                metrics.interfaceHandlingTime = performance.now() - interfaceStart;
                metrics.totalExecutionTime = performance.now() - startTime;
                logger.info(metrics); // Log metrics after interface handling
            })
            .catch(error => {
                console.error('Error:', error);
                metrics.interfaceError = error.toString();
                metrics.totalExecutionTime = performance.now() - startTime;
                logger.info(metrics); // Log metrics with error
            });
    } else {
        metrics.totalExecutionTime = performance.now() - startTime;
        logger.info(metrics); // Log metrics if no interface handling
    }
}

/**
 * Creates and starts a Docker multi-container environment based on configuration data.
 * @param {Object} configData - Configuration data for creating the multi-container environment.
 * @param {string} configData.appName - The name of the Docker multi-container environment/application.
 * @param {number} [interface=1] - Interface mode (default: 1).
 */
function createMultiDockerProcess(configData, interface = 1) {
    const startTime = performance.now(); // Start timing

    const metrics = {}; // Object to store metrics
    metrics.startTime = new Date().toISOString();
    metrics.action = "createMultiDockerProcess";

    // Extract and log configuration data
    const appName = configData.appName;
    metrics.appName = appName;
    const projectDir = appName.split('-')[1];
    delete configData.appName;
    delete configData.type;

    let envArgs = '';
    const envStart = performance.now(); // Time environment variable processing
    for (const [key, value] of Object.entries(configData)) {
        if (value != '') envArgs += `$env:${key}='"${value}"'; `;
    }
    metrics.envProcessingTime = performance.now() - envStart;

    // Prepare Docker command
    const baseDir = process.env.IMOS_APPS_DIR || 'C:\\imos\\apps';
    const command = `powershell -Command "{ Set-Location '${baseDir}\\${projectDir}'; ${envArgs} docker compose -f docker-compose.yml -p ${appName} up -d}"`;
    metrics.command = command;

    // Execute Docker command and time it
    const commandStart = performance.now();
    const dockerProcess = spawnSync('powershell', ['-Command', command], { shell: true });
    metrics.commandExecutionTime = performance.now() - commandStart;

    // Capture result
    if (dockerProcess.status === 0) {
        console.log('Multicontainer created and started successfully.');
        metrics.success = true;
    } else {
        const error = dockerProcess.stderr ? dockerProcess.stderr.toString() : 'Unknown error';
        console.error('Error creating or starting multicontainer:', error);
        metrics.success = false;
        metrics.error = error;
    }

    // Handle interface and measure its time
    if (interface === 1) {
        const interfaceStart = performance.now();
        getMultiContainerPorts(appName)
            .then(ports => {
                ports.forEach(port => {
                    openBrowser(`http://localhost:${port}`);
                });
                metrics.interfaceHandlingTime = performance.now() - interfaceStart;
                logger.info(metrics); // Log metrics once all tasks are done
            })
            .catch(error => {
                console.error('Error:', error);
                metrics.interfaceError = error.toString();
                logger.info(metrics);
            });
    } else {
        logger.info(metrics); // Log metrics if no interface handling is required
    }

    // Log total execution time
    metrics.totalExecutionTime = performance.now() - startTime;
}

/**
 * Starts a Docker container or multi-container environment based on the specified type.
 * @param {string} containerName - The name of the Docker container or multi-container environment.
 * @param {string} type - The type of the container ('image' or 'multicontainer').
 * @param {number} [interface=1] - Interface mode (default: 1).
 */
function startDockerProcess(containerName, type, interface = 1) {
    const startTime = performance.now(); // Start timing
    const metrics = { action: 'startDockerProcess', containerName, type, startTime: new Date().toISOString() };

    if (type === 'image') {
        const imageStart = performance.now(); // Start image-related timing
        if (!isContainerRunning(containerName)) {
            const dockerProcess = spawnSync('docker', ['start', containerName]);
            if (dockerProcess.status !== 0) {
                const error = dockerProcess.stderr ? dockerProcess.stderr.toString() : 'Unknown error';
                console.error('Error starting existing container:', error);
                metrics.success = false;
                metrics.error = error;
            } else {
                console.log('Container started successfully.');
                metrics.success = true;
            }
        }
        metrics.imageProcessTime = performance.now() - imageStart; // Log image process time

        if (interface === 1) {
            const interfaceStart = performance.now(); // Start interface timing
            getContainerPort(containerName)
                .then(port => {
                    console.log('Port:', port);
                    openBrowser(`http://localhost:${port}`);
                    metrics.interfaceHandlingTime = performance.now() - interfaceStart;
                    metrics.totalExecutionTime = performance.now() - startTime; // Log total execution time
                    logger.info(metrics); // Log metrics to file
                })
                .catch(error => {
                    console.error('Error:', error);
                    metrics.interfaceError = error.toString();
                    metrics.totalExecutionTime = performance.now() - startTime;
                    logger.info(metrics); // Log metrics with error
                });
        } else {
            metrics.totalExecutionTime = performance.now() - startTime;
            logger.info(metrics); // Log metrics without interface handling
        }

    } else if (type === 'multicontainer') {
        const multiContainerStart = performance.now(); // Start multi-container timing
        if (!isMultiContainerRunning(containerName)) {
            try {
                console.log('Docker Compose started');
                execSync(`docker compose -p ${containerName} start`);
                metrics.success = true;
            } catch (error) {
                console.error('Error starting Docker Compose:', error.stderr.toString());
                metrics.success = false;
                metrics.error = error.stderr.toString();
            }
        }
        metrics.multiContainerProcessTime = performance.now() - multiContainerStart; // Log multi-container process time

        if (interface === 1) {
            const interfaceStart = performance.now(); // Start interface handling for multi-container
            getMultiContainerPorts(containerName)
                .then(ports => {
                    console.log('Ports:', ports);
                    ports.forEach(port => {
                        openBrowser(`http://localhost:${port}`);
                    });
                    metrics.interfaceHandlingTime = performance.now() - interfaceStart;
                    metrics.totalExecutionTime = performance.now() - startTime;
                    logger.info(metrics); // Log metrics to file
                })
                .catch(error => {
                    console.error('Error:', error);
                    metrics.interfaceError = error.toString();
                    metrics.totalExecutionTime = performance.now() - startTime;
                    logger.info(metrics); // Log metrics with error
                });
        } else {
            metrics.totalExecutionTime = performance.now() - startTime;
            logger.info(metrics); // Log metrics without interface handling
        }
    }
}

/**
 * Stops a Docker container or multi-container environment based on the specified type.
 * @param {string} containerName - The name of the Docker container or multi-container environment.
 * @param {string} type - The type of the container ('image' or 'multicontainer').
 */
function stopDockerProcess(containerName, type) {
    const startTime = performance.now(); // Start timing
    const metrics = { action: 'stopDockerProcess', containerName, type, startTime: new Date().toISOString() };

    if (type === 'image') {
        const imageStopStart = performance.now(); // Start image-related timing
        if (isContainerRunning(containerName)) {
            const dockerProcess = spawnSync('docker', ['stop', containerName]);
            if (dockerProcess.status !== 0) {
                const error = dockerProcess.stderr ? dockerProcess.stderr.toString() : 'Unknown error';
                console.error('Error stopping existing container:', error);
                metrics.success = false;
                metrics.error = error;
            } else {
                console.log('Container exited successfully.');
                metrics.success = true;
            }
        }
        metrics.imageStopTime = performance.now() - imageStopStart; // Log image stop process time

    } else if (type === 'multicontainer') {
        const multiContainerStopStart = performance.now(); // Start multi-container timing
        if (isMultiContainerRunning(containerName)) {
            try {
                console.log('Docker compose stop started');
                execSync(`docker compose -p ${containerName} stop`);
                metrics.success = true;
            } catch (error) {
                console.error('Error exiting docker compose:', error.stderr.toString());
                metrics.success = false;
                metrics.error = error.stderr.toString();
            }
        }
        metrics.multiContainerStopTime = performance.now() - multiContainerStopStart; // Log multi-container stop process time
    }

    // Capture total execution time
    metrics.totalExecutionTime = performance.now() - startTime;
    logger.info(metrics); // Log metrics to file and console
}

/**
 * Deletes a Docker container or multi-container environment based on the specified type.
 * @param {string} containerName - The name of the Docker container or multi-container environment.
 * @param {string} type - The type of the container ('image' or 'multicontainer').
 */
function deleteDockerProcess(containerName, type) {
    const startTime = performance.now(); // Start timing
    const metrics = { action: 'deleteDockerProcess', containerName, type, startTime: new Date().toISOString() };

    if (type === 'image') {
        const imageDeleteStart = performance.now(); // Start image deletion timing
        const dockerProcess = spawnSync('docker', ['rm', containerName]);
        if (dockerProcess.status !== 0) {
            const error = dockerProcess.stderr ? dockerProcess.stderr.toString() : 'Unknown error';
            console.error('Error deleting existing container:', error);
            metrics.success = false;
            metrics.error = error;
        } else {
            console.log('Container deleted successfully.');
            metrics.success = true;
        }
        metrics.imageDeleteTime = performance.now() - imageDeleteStart; // Log image deletion time
    } else if (type === 'multicontainer') {
        const multiContainerDeleteStart = performance.now(); // Start multi-container deletion timing
        getAllImagesFromMultiContainer(containerName)
            .then((containers) => {
                containers.forEach((container) => {
                    const dockerProcess = spawnSync('docker', ['rm', container]);
                    if (dockerProcess.status !== 0) {
                        console.error('Error deleting existing container:', dockerProcess.stderr);
                        metrics.success = false;
                        metrics.error = dockerProcess.stderr ? dockerProcess.stderr.toString() : 'Unknown error';
                    } else {
                        console.log('Container deleted successfully.');
                        metrics.success = true;
                    }
                });
                metrics.multiContainerDeleteTime = performance.now() - multiContainerDeleteStart; // Log multi-container deletion time
                console.log('Multicontainer', containerName, 'deleted with all sub-containers.');
                metrics.totalExecutionTime = performance.now() - startTime; // Capture total execution time
                logger.info(metrics); // Log metrics to file and console
            })
            .catch((error) => {
                console.error('Error fetching images from multi-container:', error);
                metrics.interfaceError = error.toString();
                metrics.totalExecutionTime = performance.now() - startTime; // Capture total execution time
                logger.info(metrics); // Log metrics with error
            });
    } else {
        console.error('Unknown container type:', type);
        metrics.success = false;
        metrics.error = 'Unknown container type';
        metrics.totalExecutionTime = performance.now() - startTime;
        logger.info(metrics); // Log error metrics
    }

    // Log total execution time if it's a single container process
    if (type !== 'multicontainer') {
        metrics.totalExecutionTime = performance.now() - startTime;
        logger.info(metrics); // Log metrics to file
    }
}

/**
 * Uninstalls a Docker application or multi-container environment based on the specified type.
 * @param {string} containerName - The name of the Docker application or multi-container environment.
 * @param {string} type - The type of the container ('image' or 'multicontainer').
 */
function deleteDockerApp(containerName, type) {
    const startTime = performance.now(); // Start timing
    const metrics = { action: 'deleteDockerApp', containerName, type, startTime: new Date().toISOString() };

    if (type === 'image') {
        const imageDeleteStart = performance.now(); // Start image-related timing
        const dockerProcess = spawnSync('docker', ['rmi', containerName]);
        if (dockerProcess.status !== 0) {
            const error = dockerProcess.stderr ? dockerProcess.stderr.toString() : 'Unknown error';
            console.error('Error deleting existing container:', error);
            metrics.success = false;
            metrics.error = error;
        } else {
            console.log('App uninstalled successfully.');
            metrics.success = true;
        }
        metrics.imageDeleteTime = performance.now() - imageDeleteStart; // Log image deletion time

    } else if (type === 'multicontainer') {
        const multiContainerDeleteStart = performance.now(); // Start multi-container timing
        getAllImagesFromMultiContainer(containerName)
            .then((containers) => {
                containers.forEach((container) => {
                    const dockerProcess = spawnSync('docker', ['rmi', container]);
                    if (dockerProcess.status !== 0) {
                        const error = dockerProcess.stderr ? dockerProcess.stderr.toString() : 'Unknown error';
                        console.error('Error deleting existing container:', error);
                        metrics.success = false;
                        metrics.error = error;
                    } else {
                        console.log('Container deleted successfully.');
                    }
                });
                metrics.multiContainerDeleteTime = performance.now() - multiContainerDeleteStart; // Log multi-container deletion time
                console.log('Multicontainer', containerName, 'uninstalled with all sub-containers.');
                metrics.success = true;
                metrics.totalExecutionTime = performance.now() - startTime;
                logger.info(metrics); // Log metrics to file and console
            })
            .catch((error) => {
                console.error('Error fetching images from multi-container:', error);
                metrics.success = false;
                metrics.error = error.toString();
                metrics.totalExecutionTime = performance.now() - startTime;
                logger.info(metrics); // Log metrics with error
            });

        return; // Return early to ensure metrics are logged only once multi-container deletion is complete

    } else {
        console.error('Unknown container type:', type);
        metrics.success = false;
        metrics.error = 'Unknown container type';
        metrics.totalExecutionTime = performance.now() - startTime;
        logger.info(metrics); // Log error in case of unknown container type
    }

    metrics.totalExecutionTime = performance.now() - startTime;
    logger.info(metrics); // Log metrics to file and console
}

module.exports = {
    createDockerProcess, createMultiDockerProcess, doesContainerExist, doesMultiContainerExist,
    startDockerProcess, stopDockerProcess, getImageMetadata, getMultiImageMetadata, getInstalledApps,
    isContainerRunning, isMultiContainerRunning, deleteDockerProcess, getAllImagesFromMultiContainer,
    deleteDockerApp
};