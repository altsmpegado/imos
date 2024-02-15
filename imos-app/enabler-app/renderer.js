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

function displayMessage(message, type) {
  const statusMessage = document.getElementById('status-message');
  statusMessage.innerHTML = message;
  statusMessage.className = type;
}
