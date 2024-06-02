const { execSync , spawnSync } = require('child_process');
const Docker = require('dockerode');

function openBrowser(url) {
    const { status, error } = spawnSync('start', [url], { shell: true });
    if (status !== 0) {
        console.error('Error opening web browser:', error);
    }
    console.error('Opened web browser at:', url);
}

async function getInstalledApps() {
    const docker = new Docker();

    try {
        // Fetch Docker images - for solo containers
        const dockerImages = await docker.listImages();
        //console.log(dockerImages);
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
        //console.log(imosMultiImages);

        const installedApps = [...imosImages,  ...imosMultiImages]

        // Create a dictionary to store apps with their types
        const appDictionary = installedApps.reduce((acc, app) => {
            acc[app.name] = { type: app.type };
            return acc;
        }, {});

        //console.log(appDictionary);
        return appDictionary;
        
    } catch (error) {
        console.error('Error fetching Docker images and Kubernetes deployments:', error);
        return [];
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
        console.error('Multi-container environment does not exist.');
        return false; 
    } else {
        console.error('Error checking if multi-container environment exists:', result.stderr);
        return false;
    }
}

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
        //console.log(ports);
        return ports;
    } catch (error) {
        console.error('Error fetching container ports:', error);
        return [];
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
            //console.log(rconfigs);
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
                //console.log(requiredConfigsLabel);
                if (availableConfigsLabel) {
                    const aconfigs = availableConfigsLabel.split(",").map(config => config.trim());
                    var rconfigs = [];
                    if (requiredConfigsLabel) {
                        rconfigs = requiredConfigsLabel.split(",").map(config => config.trim());
                    }
                    //console.log(rconfigs);
                    aconfigs.forEach((aconfig) => {
                        if (rconfigs.includes(aconfig))
                            metadata[aconfig] = true;
                        else
                            metadata[aconfig] = false;
                    });
                }
            }
        });
        //console.log(Object(metadata));
        return Object(metadata);
    } catch (error) {
        console.error('Error fetching multi-container configs:', error);
        return null;
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

function createDockerProcess(configData, interface=1) {
    const appName = configData.appName;
    const projectDir = appName.split('-')[1];
    delete configData.appName;
    delete configData.type;
    const baseDir = process.env.IMOS_APPS_DIR || 'C:\\imos\\Apps';
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

    // add image name to the end, which is the same as the container name
    dockerArgs.push(appName);
    
    console.log('Executing command:', 'docker', dockerArgs);

    const dockerProcess = spawnSync('docker', dockerArgs);

    if (dockerProcess.status === 0) {
        console.log('Container created and started successfully.');
    } else {
        console.error('Error creating or starting container:', dockerProcess.stderr);
    }

    if(interface==1){
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

function createMultiDockerProcess(configData, interface=1) {
    const appName = configData.appName;
    const projectDir = appName.split('-')[1];
    delete configData.appName;
    delete configData.type;

    let envArgs = '';

    for (const [key, value] of Object.entries(configData)) {
        if(value != '')
            envArgs += `$env:${key}='"${value}"'; `;
    }

    const baseDir = process.env.IMOS_APPS_DIR || 'C:\\IMOS\\Apps';

    const command = `powershell -Command "{ Set-Location '${baseDir}\\${projectDir}'; ${envArgs} docker compose -f docker-compose.yml -p ${appName} up -d}"`;

    console.log('Executing command:', command);

    const dockerProcess = spawnSync('powershell', ['-Command', command], { shell: true });

    if (dockerProcess.status === 0) {
        console.log('Multicontainer created and started successfully.');
    } else {
        console.error('Error creating or starting multicontainer:', dockerProcess.stderr ? dockerProcess.stderr.toString() : 'Unknown error');
    }

    if(interface==1){
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

function startDockerProcess(containerName, type, interface=1) {
    console.log(containerName);
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
        if(interface==1){
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

    else if(type == 'multicontainer'){
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
        if(interface==1){
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

function stopDockerProcess(containerName, type) {

    console.log(containerName);
    if(type == 'image'){
        if (isContainerRunning(containerName)) {
            const dockerProcess = spawnSync('docker', ['stop', containerName]);
            if (dockerProcess.status !== 0) {
                console.error('Error stoping existing container:', dockerProcess.stderr);
            } else {
                console.log('Container exited successfully.');
            }
        }
    }

    else if(type == 'multicontainer'){
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

module.exports = { createDockerProcess, createMultiDockerProcess, doesContainerExist, doesMultiContainerExist, 
                   startDockerProcess, stopDockerProcess, getImageMetadata, getMultiImageMetadata, getInstalledApps,
                   isContainerRunning, isMultiContainerRunning, deleteDockerProcess, getAllImagesFromMultiContainer,
                   deleteDockerApp};