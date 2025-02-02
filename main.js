const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const os = require('os');
const process = require('process');

// Fügen Sie App-Metadaten hinzu
app.setAppUserModelId('com.helpit.tools');

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        frame: false,
        minWidth: 580,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
            devTools: true
        }
    });

    const splash = new BrowserWindow({
        width: 500,
        height: 300,
        transparent: true,
        frame: false,
        alwaysOnTop: true
    });

    splash.loadFile('splash.html');
    splash.center();

    win.loadFile('index.html');

    win.once('ready-to-show', () => {
        splash.destroy();
        win.show();
    });

    win.on('maximize', () => {
        win.webContents.send('maximize-change', true);
    });

    win.on('unmaximize', () => {
        win.webContents.send('maximize-change', false);
    });
}

function createWebWindow(url) {
    const webWin = new BrowserWindow({
        width: 1200,
        height: 800,
        frame: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });
    
    webWin.loadURL(url);
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Handle tool launching
ipcMain.on('launch-tool', (event, toolPath) => {
    if (toolPath.startsWith('mailto:')) {
        // E-Mail-Links mit shell.openExternal öffnen
        require('electron').shell.openExternal(toolPath);
    } else if (toolPath.startsWith('http')) {
        // Web-URLs mit shell.openExternal öffnen
        require('electron').shell.openExternal(toolPath);
    } else {
        // Lokale Programme mit exec ausführen
        const absolutePath = toolPath.startsWith('assets') 
            ? path.join(__dirname, toolPath)
            : toolPath;
            
        console.log('Launching tool:', absolutePath);
        
        exec(`"${absolutePath}"`, (error) => {
            if (error) {
                console.error('Error launching tool:', error);
            }
        });
    }
});

// Neue IPC Handler für Fenster-Kontrolle
ipcMain.on('minimize-window', () => {
    const win = BrowserWindow.getFocusedWindow();
    win.minimize();
});

ipcMain.on('maximize-window', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win.isMaximized()) {
        win.unmaximize();
    } else {
        win.maximize();
    }
    win.webContents.send('maximize-change', win.isMaximized());
});

ipcMain.on('close-window', () => {
    const win = BrowserWindow.getFocusedWindow();
    win.close();
});

ipcMain.on('set-always-on-top', (event, enabled) => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
        win.setAlwaysOnTop(enabled);
    }
});

// Neue IPC Handler hinzufügen:
ipcMain.handle('get-system-info', () => {
    return {
        electron: process.versions.electron,
        chrome: process.versions.chrome,
        node: process.versions.node,
        v8: process.versions.v8,
        os: `${os.type()} ${os.release()}`,
        platform: process.platform
    };
}); 