const {app, BrowserWindow, ipcMain, ipcRenderer} = require('electron')
const path = require('path')
const express = require('express')
var bodyParser = require('body-parser')

let serverStarted = false;
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400, 
    height: 700,
    backgroundColor: '#333',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true
    },
  })
  mainWindow.loadURL("http://localhost:8000")
  // mainWindow.webContents.openDevTools()
}

app.whenReady().then(() => {
  
  createWindow()
  
  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  
  ipcMain.on('start-server', (_, config) => {
    
    console.log(config);
    
    if (!serverStarted) {
      
      const httpApp = express()

      httpApp.use(bodyParser.json());
      
      httpApp.get('/', (req, res) => {
        const data = req.body;
        if (data.map.name === "start") {
          switch (data.map.game_state) {
            case "DOTA_GAMERULES_STATE_HERO_SELECTION":
              console.log("Choosing hero...")    
              mainWindow.webContents.send('toggle_drafting_cover', {visible: true});
              mainWindow.webContents.send('toggle_minimap_cover', {visible: false});
              break
            case "DOTA_GAMERULES_STATE_PLAYING":
              mainWindow.webContents.send('toggle_drafting_cover', {visible: false});
              mainWindow.webContents.send('toggle_minimap_cover', {visible: true});
              break
            case "DOTA_GAMERULES_STATE_POST_GAME":
              mainWindow.webContents.send('toggle_drafting_cover', {visible: false});
              mainWindow.webContents.send('toggle_minimap_cover', {visible: false});
              break
            default:
              mainWindow.webContents.send('toggle_drafting_cover', {visible: false})
              mainWindow.webContents.send('toggle_minimap_cover', {visible: false});
              break
          }
        }
        res.sendStatus(200)
      })
      httpApp.listen(31558, () => console.log('Server running on port 31558!'))
      serverStarted = true;
    }
  })

  app.on('window-all-closed', () => {
    if(process.platform !== 'darwin') app.quit()
  })

});
