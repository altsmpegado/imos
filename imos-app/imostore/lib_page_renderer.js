const { ipcRenderer } = require('electron');
const fs = require('fs');

document.addEventListener('DOMContentLoaded', () => {
    const data = fs.readFileSync('userData/session.json', 'utf8');
    var { type } = JSON.parse(data);
    //console.log(JSON.parse(data).username);
    // Fetch app information from the server
    fetch(`http://${process.env.IMOS_SERVER_CON}/apps/${JSON.parse(data).username}`)
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
                          <button id="download" title="Download App" class="download-button"><span class="material-symbols-outlined">cloud_download</span></button>
                          <button id="startCloudApp" title="Start App on Cloud" class="download-button"><span class="material-symbols-outlined">subscriptions</span></button>
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

          document.getElementById("startCloudApp").addEventListener("click", function() {
            ipcRenderer.send('createCloudApp', app.name, app.type);
          });

        });
      })
      .catch((error) => {
        console.error('Error fetching app information:', error);
      });

      if (type == 'developer') {
        const moreFuncDiv = document.getElementById('btn-top');
        const devButton = document.createElement('button');
        devButton.classList.add('sidebtn');
        
        // Create the icon element and add it to the button
        const icon1 = document.createElement('i');
        icon1.classList.add('material-symbols-outlined');
        icon1.textContent = 'new_window'; // Set the icon's text content to the desired material icon identifier
    
        devButton.appendChild(icon1); // Add the icon to the button
    
        devButton.addEventListener('click', () => {
          ipcRenderer.send('openDevForm');
        });
    
        moreFuncDiv.appendChild(devButton);
        
        const subStateButton = document.createElement('button');
        subStateButton.classList.add('sidebtn');

        // Create the icon element and add it to the button
        const icon2 = document.createElement('i');
        icon2.classList.add('material-symbols-outlined');
        icon2.textContent = 'timeline'; // Set the icon's text content to the desired material icon identifier
    
        subStateButton.appendChild(icon2); // Add the icon to the button

        subStateButton.addEventListener('click', () => {
          ipcRenderer.send('openSubmissions');
        });
        
        moreFuncDiv.appendChild(subStateButton);
      }
 });

document.getElementById("loadAppsPage").addEventListener("click", function() {
    var newPageUrl = "C:\\imos-dev\\imos-app\\imostore\\views\\apps_page.html";
    window.location.href = newPageUrl;
});

document.getElementById("loadHomePage").addEventListener("click", function() {
    var newPageUrl = "C:\\imos-dev\\imos-app\\imostore\\views\\index.html";
    window.location.href = newPageUrl;
});