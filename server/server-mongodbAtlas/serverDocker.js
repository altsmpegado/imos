const { spawnSync } = require('child_process');

function createDockerProcess(configData) {
    console.log("HI");
    console.log(configData);
    const appName = configData.appName;
    console.log(appName);
    const userappName = configData.userappName;
    console.log(userappName);
    const projectDir = appName.split('-')[1];
    onsole.log(projectDir);
    delete configData.appName;
    delete configData.userappName;
    delete configData.type;
    
    // Use the appropriate base directory environment variable or fallback to a default path
    const baseDir = '../../apps';
    const appDir = `${baseDir}/${projectDir}/${appName}`;
    const volumeDir = `${baseDir}/${projectDir}/${userappName}/Volume`;

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
    console.log(dockerArgs);
    // Add the image name to the end, which is the same as the container name
    dockerArgs.push(appName);
    
    console.log('Executing command:', 'docker', dockerArgs.join(' '));

    const dockerProcess = spawnSync('docker', dockerArgs);

    if (dockerProcess.status === 0) {
        console.log('Container created and started successfully.');
    } else {
        console.error('Error creating or starting container:', dockerProcess.stderr.toString());
    }
}

module.exports = {createDockerProcess}