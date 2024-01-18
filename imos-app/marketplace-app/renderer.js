const { ipcRenderer } = require('electron');

document.getElementById('downloadButton').addEventListener('click', () => {
  const fileId = '65a8f501c22c7b5a6018ebe9';
  ipcRenderer.send('downloadFile', { id: fileId });
});

ipcRenderer.on('downloadCompleted', (event, filePath) => {
  console.log(`File downloaded successfully to ${filePath}`);
});
