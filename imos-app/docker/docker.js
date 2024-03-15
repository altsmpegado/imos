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

function createDockerProcess(appName) {
    /*const dockerProcess = spawnSync('docker', [
        'run',
        '--rm',
        '--name',
        appName,
        '-e', 'DISPLAY=host.docker.internal:0',
        appName
    ]);*/

    if (doesContainerExist(appName)) {
        // Start the existing container
        const dockerProcess = spawnSync('docker', ['start', appName]);
        if (dockerProcess.status !== 0) {
            console.error('Error starting existing container:', dockerProcess.stderr);
        } else {
            console.log('Container started successfully.');
            openBrowser('http://localhost:8080');
        }

        //console.log(`IMOS-local-example Output: ${dockerProcess.stdout}`);
        //console.error(`IMOS-local-example Error: ${dockerProcess.stderr}`);

    } else {
        // Create and run a new container
        const dockerProcess = spawnSync('docker', [
            'run',
            '-d',
            '-p',
            '8080:80',
            '--name',
            appName,
            appName
        ]);
    
        if (dockerProcess.status === 0) {
            console.log('Container created and started successfully.');
            openBrowser('http://localhost:8080');
        } else {
            console.error('Error creating or starting container:', dockerProcess.stderr);
        }

        //console.log(`IMOS-local-example Output: ${dockerProcess.stdout}`);
        //console.error(`IMOS-local-example Error: ${dockerProcess.stderr}`);

    }
}

module.exports = { createDockerProcess };