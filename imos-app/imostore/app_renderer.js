const { ipcRenderer } = require('electron');

let isAppOwned = false;

/**
 * Function to handle media query change events.
 * Updates button visibility based on screen width.
 * @param {MediaQueryListEvent} e - Media query list event.
 */
function myFunction(e) {
    if (e.matches) {
        updateButton(isAppOwned);
    }
}

// Media query for minimum window width
var minWidth = window.matchMedia("(min-width: 730px)")

/**
 * Function to update button visibility based on ownership status.
 * @param {boolean} owned - Flag indicating if the application is owned by the user.
 */
function updateButton(owned) {
    const downloadButton = document.getElementById('downloadButton');
    const acquireButton = document.getElementById('acquireButton');
    const stickydownloadButton = document.getElementById('sticky-downloadButton');
    const stickyacquireButton = document.getElementById('sticky-acquireButton');

    if (owned) {
        downloadButton.style.display = 'block';
        stickydownloadButton.style.display = 'block';
        acquireButton.style.display = 'none';
        stickyacquireButton.style.display = 'none';
    } else {
        downloadButton.style.display = 'none';
        stickydownloadButton.style.display = 'none';
        acquireButton.style.display = 'block';
        stickyacquireButton.style.display = 'block';
    }
}

// Event listener for media query changes
minWidth.addEventListener("change", function () {
    myFunction(minWidth);
});

// Event listener when DOM content is fully loaded
document.addEventListener('DOMContentLoaded', () => {

    /**
     * IPC event listener for receiving application information.
     * Fetches user's owned apps from server and updates button visibility based on ownership.
     * @param {Event} event - IPC event object.
     * @param {Object} appjson - Application JSON object containing details like name, logo, etc.
     * @param {string} user - User identifier.
     */
    ipcRenderer.on('appInfo', (event, appjson, user) => {
        fetch(`http://${process.env.IMOS_SERVER_CON}/apps/${user}`)
            .then((response) => response.json())
            .then(data => {
                isAppOwned = data.ownedApps.some(app => app.name === appjson.name);
                updateButton(isAppOwned);
            })
            .catch(error => {
                console.error('Error fetching user owned apps:', error);
            });

        const appInfoDiv = document.getElementById('main');
        appInfoDiv.innerHTML = `
            <div class="app-container">
                <img class="app-icon" src="data:image/png;base64,${appjson.logo}"></img>
                <h3 class="apptitle">${appjson.name}</h3>
                <p class="companytitle">${appjson.company}</p>
                <button id="downloadButton" class="getapp-btn">Download</button>
                <button id="acquireButton" class="getapp-btn">Acquire</button>
                <h3 class="rating">4.3 &#9733; | 3K Ratings</h3>
            </div>
            <div class="sticky-header">
                <img class="sticky-app-icon" src="data:image/png;base64,${appjson.logo}"></img>
                <h5 class="sticky-apptitle">${appjson.name}</h5>
                <p class="sticky-companytitle">${appjson.company}</p>
                <button id="sticky-downloadButton" class="sticky-getapp-btn">Download</button>
                <button id="sticky-acquireButton" class="sticky-getapp-btn">Acquire</button>
            </div>
            <div class="info-container">
                <div class="screenshots">
                    <h4 class="tab-title">Screenshots</h4>
                    <img class="imgs-screenshots" src="wtsapp.jpeg"></img>
                </div>
                <div class="description">
                    <h4 class="tab-title">About</h4>
                    <p class="text"> Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. </p>
                </div>
                <div class="reviews">
                    <h4 class="tab-title">Reviews</h4>
                    <h1 style="margin-left: 25px; font-size:3.0rem;">4.3</h1>
                    <p class="text"> Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. </p>
                </div>
                <div class="additional">
                    <h4 class="tab-title">Additional Information</h4>
                    <p class="text"> Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. </p>
                    <p class="text"> Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. </p>
                </div>
            </div>
        `;

        const appTitle = document.getElementById('appTitle');
        appTitle.innerText = appjson.name;

        const downloadButton = document.getElementById('downloadButton');
        downloadButton.addEventListener('click', () => {
            ipcRenderer.send('downloadFile', { id: appjson.file.toString() });
        });

        const acquireButton = document.getElementById('acquireButton');
        acquireButton.addEventListener('click', () => {
            ipcRenderer.send('acquireApp', user, appjson.name.toString());
        });

        const stickydownloadButton = document.getElementById('sticky-downloadButton');
        stickydownloadButton.addEventListener('click', () => {
            ipcRenderer.send('downloadFile', { id: appjson.file.toString() });
        });

        const stickyacquireButton = document.getElementById('sticky-acquireButton');
        stickyacquireButton.addEventListener('click', () => {
            ipcRenderer.send('acquireApp', user, appjson.name.toString());
        });
    });

    /**
     * IPC event listener for download completion.
     * Logs the successful download of a file.
     * @param {Event} event - IPC event object.
     * @param {string} filePath - File path where the download completed.
     */
    ipcRenderer.on('downloadCompleted', (event, filePath) => {
        console.log(`File downloaded successfully to ${filePath}`);
    });

    /**
     * IPC event listener for successful app acquisition.
     * Reloads the page upon successful app acquisition.
     * @param {Event} event - IPC event object.
     */
    ipcRenderer.on('appAcquired', (event) => {
        console.log('App Acquired Successfully');
        location.reload();
    });

});