const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', () => {
    let isAppOwned = false;

  ipcRenderer.on('appInfo', (event, appjson, user) => {
    // Check user's ownedApps
    //console.log(user);
    fetch(`http://localhost:8000/apps/${user}`)
    .then((response) => response.json())
    .then(data => {
    // Handle the data received from the server
        //console.log(data.ownedApps);
        isAppOwned = data.ownedApps.includes(appjson.name);
        //console.log(isAppOwned);
        updateButton();
    })
        .catch(error => {
        console.error('Error fetching user owned apps:', error);
    });

    const appInfoDiv = document.getElementById('appInfo');
    appInfoDiv.innerHTML = `
      <h2>${appjson.name}</h2>
      <p>Provider: ${appjson.company}</p>
      <p>Version: ${appjson.version}</p>
      <p>Info: ${appjson.info}</p>
    `;
    
    const appTitle = document.getElementById('appTitle');
    appTitle.innerText = appjson.name;
    
    const downloadButton = document.getElementById('downloadButton');
    downloadButton.addEventListener('click', () => {
    ipcRenderer.send('downloadFile', { id: appjson.files.toString() });
    });
    
    const acquireButton = document.getElementById('acquireButton');
    acquireButton.addEventListener('click', () => {
    ipcRenderer.send('acquireApp', user, appjson.name.toString());
    });
    
    function updateButton() {
        if (isAppOwned) {
            downloadButton.style.display = 'block';
            acquireButton.style.display = 'none';
        } else {
            downloadButton.style.display = 'none';
            acquireButton.style.display = 'block';
        }
    }
  });

  ipcRenderer.on('downloadCompleted', (event, filePath) => {
    console.log(`File downloaded successfully to ${filePath}`);
  });

  ipcRenderer.on('appAcquired', (event) => {
    console.log('App Acquired Successfully');
    location.reload();
  });
  
});
