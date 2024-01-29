const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', () => {
  // Fetch app information from the server
  fetch('http://localhost:8000/apps')
    .then((response) => response.json())
    .then((apps) => {
      const appListDiv = document.getElementById('appList');
      
      // Create download button for each app
      apps.forEach((app) => {
        const appButton = document.createElement('button');
        appButton.textContent = `${app.name}`;
        appButton.addEventListener('click', () => {
          ipcRenderer.send('openAppWindow', app);
        });
        
        appListDiv.appendChild(appButton);
      });
    })
    .catch((error) => {
      console.error('Error fetching app information:', error);
    });

  
});