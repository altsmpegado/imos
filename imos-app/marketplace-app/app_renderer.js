const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', () => {
    let isAppOwned = false;

    ipcRenderer.on('appInfo', (event, appjson, user) => {
        // Check user's ownedApps
        console.log(appjson.company);
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
        
        const appInfoDiv = document.getElementById('main');
        appInfoDiv.innerHTML = `
            <div class="app-container">
                <img class="app-icon" src="C:\\imos\\imos-app\\marketplace-app\\views\\apps.8985.13655054093851568.1c669dab-3716-40f6-9b59-de7483397c3a.png"></img>
                <h3 class="apptitle">${appjson.name}</h3>
                <p class="companytitle">${appjson.company}</p>
                <button id="downloadButton" class="getapp-btn hidden">Download</button>
                <button id="acquireButton" class="getapp-btn hidden">Acquire</button>
            </div>
            <div class="sticky-header">
                <img class="sticky-app-icon" src="C:\\imos\\imos-app\\marketplace-app\\views\\apps.8985.13655054093851568.1c669dab-3716-40f6-9b59-de7483397c3a.png"></img>
                <h5 class="sticky-apptitle">${appjson.name}</h5>
                <p class="sticky-companytitle">${appjson.company}</p>
                <button id="downloadButton" class="sticky-getapp-btn hidden">Download</button>
                <button id="acquireButton" class="sticky-getapp-btn hidden">Acquire</button>
            </div>
            <div class="info-container">
                <div class="screenshots">
                    <h4 class="tab-title">Screenshots</h4>
                </div>
                <div class="description">
                    <h4 class="tab-title">About this</h4>
                </div>
                <div class="reviews">
                    <h4 class="tab-title">Reviews</h4>
                </div>
                <div class="additional">
                    <h4 class="tab-title">Additional Information</h4>
                </div>
            </div>
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
