const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

/**
 * Function to handle click events on app cards.
 */
function clickApp() {
  const appcard = document.querySelectorAll(".product");
  appcard.forEach((item) => {
    item.addEventListener('click', (event) => {
      event.preventDefault();
      const data = item.dataset.app;
      ipcRenderer.send('openAppWindow', data)
    })
  })
}

/**
 * Event listener when DOM content is fully loaded.
 * Fetches user-specific app information from the server and dynamically generates app cards.
 */
document.addEventListener('DOMContentLoaded', () => {
  // Read session data from file
  const data = fs.readFileSync('userData/session.json', 'utf8');
  var { type } = JSON.parse(data);

  // Fetch app information from the server
  fetch(`http://${process.env.IMOS_SERVER_CON}/apps`)
    .then((response) => response.json())
    .then((apps) => {
      const appListDiv = document.getElementById('apps-container');

      // Iterate through each app and create HTML card
      apps.forEach((app) => {
        const cardHtml = `
          <div class="product-card">
            <a href="0#" class="product" data-app="${JSON.stringify(app).replace(/"/g, '&quot;')}">
              <img class="app-icon" src="data:image/png;base64,${app.logo}"></img>
              <div class="info-container">
                <p class="title">${app.name}</p>
                <div class="subtitle">
                  <div class="rating-element">
                    <span>4.2</span>
                    <span>&#9733;</span>
                  </div>
                  <div class="text-ellipsis">| ${app.company}</div>
                </div>
              </div>
              <div class="price-container">
                <button class="more-button">More</button>
              </div>
            </a>
          </div>
        `;
        appListDiv.innerHTML += cardHtml;
        clickApp();
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
  var newPageUrl = path.resolve(__dirname, './apps_page.html');
  window.location.href = newPageUrl;
});

/**
 * Event listener for loading the Library page.
 * Redirects to the Library page when the corresponding button is clicked.
 */
document.getElementById("loadLibPage").addEventListener("click", function () {
  var newPageUrl = path.resolve(__dirname, './lib_page.html');
  window.location.href = newPageUrl;
});