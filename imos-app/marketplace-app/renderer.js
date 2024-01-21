const { ipcRenderer } = require('electron');

document.getElementById('downloadButton').addEventListener('click', () => {
  const fileId = '65ad6abad5fce619238d2706';
  ipcRenderer.send('downloadFile', { id: fileId });
});

ipcRenderer.on('downloadCompleted', (event, filePath) => {
  console.log(`File downloaded successfully to ${filePath}`);
});
