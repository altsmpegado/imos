const { ipcRenderer } = require('electron');
const fs = require('fs');

document.addEventListener('DOMContentLoaded', () => {
    const data = fs.readFileSync('userData/session.json', 'utf8');
    //console.log(JSON.parse(data).username);
    // Fetch app information from the server
    fetch(`http://localhost:8000/apps/${JSON.parse(data).username}`)
      .then((response) => response.json())
      .then((data) => {
        //console.log(data);
        const appListDiv = document.getElementById('apps-container');
        
        data.ownedApps.forEach((app) => {
          //console.log(app);
          const cardHtml = `
          <div class="product-card">
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
                        <div class="price-container">
                          <button id="download" class="download-button"><span class="material-symbols-outlined">cloud_download</span></button>
                        </div>
                    </div>
                </div>
            </a>
          </div>
          `
          appListDiv.innerHTML += cardHtml;

          document.getElementById("download").addEventListener("click", function() {
            ipcRenderer.send('downloadFile', { id: app.file.toString() });
          });

        });
      })
      .catch((error) => {
        console.error('Error fetching app information:', error);
      });
 });

document.getElementById("loadAppsPage").addEventListener("click", function() {
    var newPageUrl = "C:\\imos-dev\\imos-app\\imostore\\views\\apps_page.html";
    window.location.href = newPageUrl;
});

document.getElementById("loadHomePage").addEventListener("click", function() {
    var newPageUrl = "C:\\imos-dev\\imos-app\\imostore\\views\\index.html";
    window.location.href = newPageUrl;
});

document.getElementById("loadSubmitPage").addEventListener("click", function() {
    ipcRenderer.send('openDevForm');
});