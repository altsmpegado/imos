const { ipcRenderer } = require('electron');
const fs = require('fs');

document.addEventListener('DOMContentLoaded', () => {
    const data = fs.readFileSync('userData/session.json', 'utf8');
    var { type } = JSON.parse(data);
    // Fetch app information from the server
    fetch('http://localhost:8000/apps')
      .then((response) => response.json())
      .then((apps) => {
        const appListDiv = document.getElementById('apps-container');
        
        apps.forEach((app) => {
          console.log(app);
          const cardHtml = `
          <div class="product-card">
            <a href="0#" class="product" data-app="${JSON.stringify(app).replace(/"/g, '&quot;')}">
                <div>
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <img class="app-icon" src="C:\\imos\\imos-app\\marketplace-app\\views\\apps.8985.13655054093851568.1c669dab-3716-40f6-9b59-de7483397c3a.png"></img>
                        <div class="info-container">
                            <p class="title">${app.name}</p>
                            <div class="subtitle">
                                <div class="text-ellipsis">${app.company}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </a>
          </div>
          `
          appListDiv.innerHTML += cardHtml;
        });
      })
      .catch((error) => {
        console.error('Error fetching app information:', error);
      });
  });

document.getElementById("loadAppsPage").addEventListener("click", function() {
    var newPageUrl = "C:\\imos\\imos-app\\marketplace-app\\views\\apps_page.html";
    window.location.href = newPageUrl;
});

document.getElementById("loadHomePage").addEventListener("click", function() {
    var newPageUrl = "C:\\imos\\imos-app\\marketplace-app\\views\\index.html";
    window.location.href = newPageUrl;
});

document.getElementById("loadSubmitPage").addEventListener("click", function() {
    ipcRenderer.send('openDevForm');
});