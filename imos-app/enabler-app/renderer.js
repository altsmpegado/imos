const { ipcRenderer } = require('electron');

function startDeployment() {
  const deploymentName = document.getElementById('deployment-name').value.trim();
  if (!deploymentName) {
    displayMessage('Please enter a deployment name.', 'error');
    return;
  }

  ipcRenderer.send('start-deployment', deploymentName);
}

function stopDeployment() {
  const deploymentName = document.getElementById('deployment-name').value.trim();
  if (!deploymentName) {
    displayMessage('Please enter a deployment name.', 'error');
    return;
  }

  ipcRenderer.send('stop-deployment', deploymentName);
}

function startContainer(containerName) {
    exec(`docker start ${containerName}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error starting container: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`Error starting container: ${stderr}`);
        return;
      }
      console.log(`Container started: ${containerName}`);
    });
  }
  
  function stopContainer(containerName) {
    exec(`docker stop ${containerName}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error stopping container: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`Error stopping container: ${stderr}`);
        return;
      }
      console.log(`Container stopped: ${containerName}`);
    });
  }
  
function displayMessage(message, type) {
  const statusMessage = document.getElementById('status-message');
  statusMessage.innerHTML = message;
  statusMessage.className = type;
}
