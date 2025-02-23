const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const os = require('os');
const process = require('process');
const fs = require('fs');
const JSZip = require('jszip');

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

    win.loadFile('index.html');

    win.once('ready-to-show', () => {
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
        shell.openExternal(toolPath);
    } else if (toolPath.startsWith('http')) {
        shell.openExternal(toolPath);
    } else {
        let absolutePath;
        if (toolPath.startsWith('resources/executable')) {
            if (app.isPackaged) {
                absolutePath = path.join(process.resourcesPath, 'executable', path.basename(toolPath));
            } else {
                absolutePath = path.join(__dirname, toolPath);
            }
        } else {
            absolutePath = toolPath;
        }
            
        console.log('Launching tool:', absolutePath);
        
        // PowerShell-Skripte mit erhöhten Rechten ausführen
        if (absolutePath.endsWith('.ps1')) {
            exec(`powershell -ExecutionPolicy Bypass -File "${absolutePath}"`, (error) => {
                if (error) {
                    console.error('Error launching PowerShell script:', error);
                }
            });
        } else {
            exec(`"${absolutePath}"`, (error) => {
                if (error) {
                    console.error('Error launching tool:', error);
                }
            });
        }
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

// Handler für ZIP-Erstellung
ipcMain.handle('save-and-open-zip', async (event, files) => {
    const zip = new JSZip();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const zipName = `bug-report-${timestamp}.zip`;
    const downloadsPath = app.getPath('downloads');
    const zipPath = path.join(downloadsPath, zipName);

    // Füge Dateien zum ZIP hinzu
    files.forEach(file => {
        zip.file(file.name, file.data.split('base64,')[1], {base64: true});
    });

    // Generiere und speichere ZIP
    const content = await zip.generateAsync({type: "nodebuffer"});
    fs.writeFileSync(zipPath, content);

    // Öffne den Downloads-Ordner direkt
    await shell.openPath(downloadsPath);
    
    return zipPath;
});

// Handler für Ordner öffnen
ipcMain.on('show-folder', (event, folderPath) => {
    const absolutePath = path.join(__dirname, folderPath);
    shell.openPath(absolutePath);
}); 