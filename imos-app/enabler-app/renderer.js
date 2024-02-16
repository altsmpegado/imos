const { ipcRenderer } = require('electron');

function startDeployment() {
  const deploymentName = document.getElementById('deployment-name').value.trim();
  if (!deploymentName) {
    displayMessage('Please enter a deployment name.', 'error');
    return;
  }

  if(deploymentName.includes("deployment")){
    // Instead of picking deployment file we can just assume the path
    const deploymentFileInput = document.createElement('input');
    deploymentFileInput.type = 'file';
    deploymentFileInput.accept = '.yaml';

    // Listen for change event when user selects a file
    deploymentFileInput.addEventListener('change', () => {
      const file = deploymentFileInput.files[0];
      if (file) {
        //console.log(file.path);
        ipcRenderer.send('start-deployment', { name: file.name, path: file.path });
      }
    });
  }

  else{
    ipcRenderer.send('start-deployment', { name: deploymentName, path: "" });
  }

  // Trigger click event to open file dialog
  deploymentFileInput.click();
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

// Listen for response from main process
ipcRenderer.on('deployment-status', (event, message) => {
  displayMessage(message, 'info');
});