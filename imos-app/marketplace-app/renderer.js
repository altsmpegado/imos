const { ipcRenderer } = require('electron');
const fs = require('fs');

document.addEventListener('DOMContentLoaded', () => {
  const data = fs.readFileSync('userData/session.json', 'utf8');
  var { type } = JSON.parse(data);
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

  if (type == 'developer'){
    const moreFuncDiv = document.getElementById('moreFunc');
    const devButton = document.createElement('button');
    devButton.textContent = 'Submit App';
    devButton.addEventListener('click', () => {
      ipcRenderer.send('openDevForm');
    });
    moreFuncDiv.appendChild(devButton);
    
    const subStateButton = document.createElement('button');
    subStateButton.textContent = 'Submissions';
    subStateButton.addEventListener('click', () => {
      ipcRenderer.send('openSubmissions');
    });
    
    moreFuncDiv.appendChild(subStateButton);
  }
  
});