const { app, BrowserWindow } = require('electron/main')

/**
 * Function to create the main application window.
 * Sets up a BrowserWindow with specific dimensions, web preferences, and icon,
 * then loads the 'index.html' file.
 */
const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    autoHideMenuBar: true,
    icon: 'imoshub/logo.ico',
    webPreferences: {
      nodeIntegration: true,
    },
  })

  win.loadFile('index.html')
}

app.whenReady().then(() => {
  createWindow()

  // Handle activation event
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// Quit the app when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})