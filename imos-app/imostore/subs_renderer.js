const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', async () => {

  ipcRenderer.on('subsInfo', async (event, user) => {
    try {
      const subInfoDiv = document.getElementById('subs-container');
      const data = await fetch(`http://localhost:8000/subs/${user}`).then(response => response.json());
      const subAppsData = await Promise.all(data.subApps.map(async (id) => {
        const subApp = await fetch(`http://localhost:8000/sub/${id}`).then(response => response.json());
        return subApp.sub;
      }));

      subAppsData.forEach((subApp) => {
        const stateText = subApp.state ? 'Accepted' : 'Under Review';
        const stateColor = subApp.state ? 'green' : 'orange';
        const cardHtml = `
          <div class="product-card">
            <div class="product">
              <div style="display: flex; align-items: center; gap: 1rem;">
                  <p class="title">${subApp.appname}</p>
                  <div class="subtitle">
                    <p style:"margin-bottom:10px;>Provider: ${subApp.company}</p><br>
                    <p>Version: ${subApp.version}</p><br>
                    <p style="color: ${stateColor};">State: ${stateText}</p>
                  </div>
              </div>
            </div>
          </div>
        `
        subInfoDiv.innerHTML += cardHtml;
      });
    } catch (error) {
      console.error('Error fetching user submitted apps:', error);
    }
  });
});
