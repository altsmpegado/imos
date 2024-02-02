const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', async () => {

  ipcRenderer.on('subsInfo', async (event, user) => {
    try {
      const subInfoDiv = document.getElementById('subInfo');
      const data = await fetch(`http://localhost:8000/subs/${user}`).then(response => response.json());
      const subAppsData = await Promise.all(data.subApps.map(async (id) => {
        const subApp = await fetch(`http://localhost:8000/sub/${id}`).then(response => response.json());
        return subApp.sub; // Assuming 'sub' is the object within subApp containing the details
      }));

      subAppsData.forEach((subApp) => {
        const subInfo = document.createElement('div');
        subInfo.innerHTML = `
          <h2>${subApp.appname}</h2>
          <p>Provider: ${subApp.company}</p>
          <p>Version: ${subApp.version}</p>
          <p>State: ${subApp.state}</p>
        `;
        subInfoDiv.appendChild(subInfo);
        const line = document.createElement('hr');
        subInfo.appendChild(line);
      });
    } catch (error) {
      console.error('Error fetching user submitted apps:', error);
    }
  });
});
