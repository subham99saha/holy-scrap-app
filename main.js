const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
// const scraper = require('./modules/scrape/services_pupp');  // Import Puppeteer code
const scraper = require('./modules/scrape/services_elec');  // Import Puppeteer code

let mainWindow;

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        width: 1100,
        height: 700,
        'minWidth': 1100,
        'minHeight': 700,
        autoHideMenuBar: true,
        webPreferences: {
            // preload: path.join(__dirname, 'preload.js'),  // Secure IPC communication
            nodeIntegration: true,  // Allows Node.js in frontend (React)
            contextIsolation: false,
            webviewTag: true
        }
    });

    // mainWindow.loadURL('http://localhost:3000');  // URL of React app
    mainWindow.loadURL(`file://${path.join(__dirname, './build/index.html')}`);  // URL of React app

    // Set the zoom level after the WebView has loaded
    // mainWindow.webContents.on('did-finish-load', async () => {
    //   const webview = mainWindow.webContents.getWebContents()[0]; // Get the webview content
    //   webview.setZoomFactor(0.5); // Set zoom level to 150%
    // });

    // Pass the mainWindow to services_elec
    scraper.initializeMessageSender(mainWindow);

});

ipcMain.handle('start-scrape', async (event, payload) => {
    const data = await scraper.fetchProducts(payload);  // Call the puppeteer scrape logic
    return data;  // Send scraped data back to React
});

// app.whenReady().then(() => {
//     createWindow();
    
//     app.on('activate', () => {
//       if (BrowserWindow.getAllWindows().length === 0) {
//         createWindow();
//       }
//     });
// });
  
// app.on('window-all-closed', () => {
//     if (process.platform !== 'darwin') {
//       app.quit();
//     }
// });