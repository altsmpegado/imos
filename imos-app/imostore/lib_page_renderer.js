const { ipcRenderer } = require('electron');
const fs = require('fs');

document.addEventListener('DOMContentLoaded', () => {
    const data = fs.readFileSync('userData/session.json', 'utf8');
    var { type } = JSON.parse(data);
    const username = JSON.parse(data).username;
    //console.log(JSON.parse(data).username);
    // Fetch app information from the server
    fetch(`http://${process.env.IMOS_SERVER_CON}/apps/${username}`)
      .then((response) => response.json())
      .then((data) => {
        //console.log(data);
        const appListDiv = document.getElementById('apps-container');
        
        data.ownedApps.forEach((app) => {
          //console.log(app);
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
                  <div class="price-container">
                    <button id="download-${app.image}" title="Download App" class="download-button"><span class="material-symbols-outlined">cloud_download</span></button>
                    <button id="createCloudApp-${app.image}" title="Create App on Cloud" class="download-button"><span class="material-symbols-outlined">subscriptions</span></button>
                    <button id="startCloudApp-${app.image}" title="Start App on Cloud" class="download-button"><span class="material-symbols-outlined">play_arrow</span></button>
                    <button id="stopCloudApp-${app.image}" title="Stop App on Cloud" class="download-button"><span class="material-symbols-outlined">pause</span></button>
                    <button id="removeCloudApp-${app.image}" title="Remove App from Cloud" class="download-button"><span class="material-symbols-outlined">delete</span></button>
                  </div>
                </div>
              </div>
            </a>
          `
          const productCard = document.createElement('div');
          productCard.setAttribute('class', 'product-card');
          productCard.innerHTML = cardHtml;
          appListDiv.appendChild(productCard);

          document.getElementById(`download-${app.image}`).addEventListener("click", function() {
            ipcRenderer.send('downloadFile', { id: app.file.toString() });
          });

          document.getElementById(`createCloudApp-${app.image}`).addEventListener("click", function() {
            ipcRenderer.send('createCloudApp', username, app.name, app.image, app.type, app.labels);
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

document.getElementById("loadAppsPage").addEventListener("click", function() {
    var newPageUrl = "C:\\imos-dev\\imos-app\\imostore\\views\\apps_page.html";
    window.location.href = newPageUrl;
});

document.getElementById("loadHomePage").addEventListener("click", function() {
    var newPageUrl = "C:\\imos-dev\\imos-app\\imostore\\views\\index.html";
    window.location.href = newPageUrl;
});