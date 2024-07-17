const { ipcRenderer } = require('electron');
const fs = require('fs');
const request = require('request');

/**
 * Function to create a status LED element based on whether the application is running.
 * @param {boolean} isRunning - Flag indicating if the application is running.
 * @returns {HTMLElement} - Created status LED element.
 */
function createStatusLED(isRunning) {
  const statusLED = document.createElement('div');
  statusLED.classList.add('status-led');
  if (isRunning) {
    statusLED.classList.add('green');
  } else {
    statusLED.classList.add('red');
  }
  return statusLED;
}

/**
 * Event listener when DOM content is fully loaded.
 * Fetches user-specific app information from the server and dynamically generates app cards.
 */
document.addEventListener('DOMContentLoaded', () => {
  const data = fs.readFileSync('userData/session.json', 'utf8');
  var { type } = JSON.parse(data);
  const username = JSON.parse(data).username;

  // Fetch app information from the server
  fetch(`http://${process.env.IMOS_SERVER_CON}/apps/${username}`)
    .then((response) => response.json())
    .then((data) => {
      const appListDiv = document.getElementById('apps-container');

      data.ownedApps.forEach((app) => {
        const cardHtml = `
          <a class="product" data-app="${JSON.stringify(app).replace(/"/g, '&quot;')}">
            <div>
              <div style="display: flex; align-items: center; gap: 1rem;">
                <img class="app-icon" src="data:image/png;base64,${app.logo}"></img>
                <div class="info-container">
                  <p class="title">${app.name}</p>
                  <div class="subtitle">
                    <div class="text-ellipsis">Owned/Download</div>
                  </div>
                </div>
                <div class="price-container" style="display: flex; align-items: center; gap: 0.5rem;">
                  <div id="status-led-${app.image}" class="status-led-container"></div>
                  <button id="download-${app.image}" title="Download App" class="download-button"><span class="material-symbols-outlined">cloud_download</span></button>
                  <button id="createCloudApp-${app.image}" title="Create App on Cloud" class="download-button"><span class="material-symbols-outlined">subscriptions</span></button>
                  <button id="startCloudApp-${app.image}" title="Start App on Cloud" class="download-button"><span class="material-symbols-outlined">play_arrow</span></button>
                  <button id="stopCloudApp-${app.image}" title="Stop App on Cloud" class="download-button"><span class="material-symbols-outlined">pause</span></button>
                  <button id="removeCloudApp-${app.image}" title="Remove App from Cloud" class="download-button"><span class="material-symbols-outlined">delete</span></button>
                  
                </div>
              </div>
            </div>
          </a>
        `;

        const productCard = document.createElement('div');
        productCard.setAttribute('class', 'product-card');
        productCard.innerHTML = cardHtml;
        appListDiv.appendChild(productCard);

        // Add event listeners for app actions
        document.getElementById(`download-${app.image}`).addEventListener("click", function () {
          ipcRenderer.send('downloadFile', { id: app.file.toString() });
        });

        document.getElementById(`createCloudApp-${app.image}`).addEventListener("click", function () {
          ipcRenderer.send('createCloudApp', username, app.name, app.image, app.type, app.labels);
        });

        document.getElementById(`startCloudApp-${app.image}`).addEventListener("click", function () {
          ipcRenderer.send('startCloudApp', username, app.name);
        });

        document.getElementById(`stopCloudApp-${app.image}`).addEventListener("click", function () {
          ipcRenderer.send('stopCloudApp', username, app.name, app.image, app.type, app.labels);
        });

        document.getElementById(`removeCloudApp-${app.image}`).addEventListener("click", function () {
          ipcRenderer.send('removeCloudApp', username, app.name, app.image, app.type, app.labels);
        });
      
      });

      // Fetch the cloud apps state
      const options = {
        'method': 'GET',
        'url': `http://${process.env.IMOS_SERVER_CON}/cloudapps/${username}`
      };
      
      request(options, function (error, response, body) {
        if (error) {
          console.error('Error fetching cloud app states:', error);
          return;
        }
        if (response.statusCode === 200) {
          const cloudApps = JSON.parse(body).cloudApps;
          console.log('Cloud Apps:', cloudApps);

          // Update the LED status for each app
          data.ownedApps.forEach((app) => {
            const statusLedContainer = document.getElementById(`status-led-${app.image}`);
            const cloudApp = cloudApps.find(cloudApp => cloudApp.app === app.name);
            const isRunning = cloudApp && cloudApp.state === 'running';
            const statusLED = createStatusLED(isRunning);
            statusLedContainer.appendChild(statusLED);
          });
        } else {
          console.error('Failed to retrieve cloud app states, status code:', response.statusCode);
        }

      });
    })
    .catch((error) => {
      console.error('Error fetching app information:', error);
    });

  // Add developer-specific functionality if user is a developer
  if (type == 'developer') {
    const moreFuncDiv = document.getElementById('btn-top');

    // Add button to open developer form
    const devButton = document.createElement('button');
    devButton.classList.add('sidebtn');
    const icon1 = document.createElement('i');
    icon1.classList.add('material-symbols-outlined');
    icon1.textContent = 'new_window';
    devButton.appendChild(icon1);
    devButton.addEventListener('click', () => {
      ipcRenderer.send('openDevForm');
    });
    moreFuncDiv.appendChild(devButton);

    // Add button to open submissions
    const subStateButton = document.createElement('button');
    subStateButton.classList.add('sidebtn');
    const icon2 = document.createElement('i');
    icon2.classList.add('material-symbols-outlined');
    icon2.textContent = 'timeline';
    subStateButton.appendChild(icon2);
    subStateButton.addEventListener('click', () => {
      ipcRenderer.send('openSubmissions');
    });
    moreFuncDiv.appendChild(subStateButton);
  }
});

/**
 * Event listener for loading the Apps page.
 * Redirects to the Apps page when the corresponding button is clicked.
 */
document.getElementById("loadAppsPage").addEventListener("click", function () {
  var newPageUrl = "C:\\imos-dev\\imos-app\\imostore\\views\\apps_page.html";
  window.location.href = newPageUrl;
});

/**
 * Event listener for loading the Home page.
 * Redirects to the Home page when the corresponding button is clicked.
 */
document.getElementById("loadHomePage").addEventListener("click", function () {
  var newPageUrl = "C:\\imos-dev\\imos-app\\imostore\\views\\index.html";
  window.location.href = newPageUrl;
});