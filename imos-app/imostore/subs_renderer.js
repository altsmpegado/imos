const { ipcRenderer } = require('electron');

/**
 * Event listener when DOM content is fully loaded.
 * Fetches user-specific app information from the server and dynamically generates app cards.
 */
document.addEventListener('DOMContentLoaded', async () => {

  /**
   * IPC event listener for 'subsInfo' message from main process.
   * Fetches submission information for a specific user and renders it in the UI.
   * @param {Event} event - The event object representing the event being handled.
   * @param {string} user - The username of the user for whom submission information is fetched.
   */
  ipcRenderer.on('subsInfo', async (event, user) => {
    try {
      const subInfoDiv = document.getElementById('subs-container');

      // Fetch user's submission information from server
      const data = await fetch(`http://${process.env.IMOS_SERVER_CON}/subs/${user}`).then(response => response.json());

      // Fetch detailed information for each submission asynchronously
      const subAppsData = await Promise.all(data.subApps.map(async (id) => {
        const subApp = await fetch(`http://${process.env.IMOS_SERVER_CON}/sub/${id}`).then(response => response.json());
        return subApp.sub;
      }));

      // Iterate through each submission and create HTML card
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
        `;
        subInfoDiv.innerHTML += cardHtml;
      });
    } catch (error) {
      console.error('Error fetching user submitted apps:', error);
    }
  });
});
