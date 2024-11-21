const { app, BrowserWindow, Menu, shell, ipcMain, dialog, Tray, Notification } = require('electron');
const { exec, execFile } = require('child_process');
const { version, devDependencies, author } = require('./package.json');
const axios = require('axios');
const path = require('path');
const { type } = require('os');
const { spawn } = require('child_process');
const fs = require('fs');

// Lizenzfenster-Erstellung
// function createLicenseWindow() { ... }

// Dynamischer Import von electron-store
let store;
(async () => {
    const Store = (await import('electron-store')).default;
    store = new Store();
})();

// Konstante Variablen und Initialisierungen
let mainWindow;
let tray = null;
let autostartEnabled = false;
let minimizeToTray = false;
const currentVersion = `v${version}`;
let licenseWindow;

// Am Anfang der Datei, nach den imports
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  // Wenn wir den Lock nicht bekommen, beende die neue Instanz
  app.quit();
} else {
  // Wenn eine zweite Instanz gestartet wird, fokussiere das existierende Fenster
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
      
      // Optional: Zeige eine Benachrichtigung
      const notification = new Notification({
        title: 'FixIT',
        body: 'FixIT läuft bereits',
        silent: true
      });
      notification.show();
    }
  });

  // Normale App-Initialisierung
  app.whenReady().then(async () => {
    Promise.all([
      import('electron-store'),
      listPortableApps()
    ]).then(([{ default: Store }]) => {
      store = new Store();
      createMainWindow();
    });
  });
}

// Am Anfang der Datei, nach den imports
if (process.platform === 'win32') {
  app.setAppUserModelId('com.helpit.fixit');
}

// Fügen Sie diese Zeile am Anfang der Datei hinzu
const isDev = process.env.NODE_ENV === 'development';

// ------------------- Funktionen -------------------

app.setPath('cache', path.join(app.getPath('userData'), 'cache'));

// Hauptfenster-Erstellung anpassen
function createMainWindow() {
    // Splash Screen erstellen
    const splash = new BrowserWindow({
        width: 400,
        height: 300,
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    splash.loadFile(path.join(__dirname, 'src', 'splash.html'));
    splash.center();

    // Hauptfenster im Hintergrund laden
    mainWindow = new BrowserWindow({
        width: 1024,
        height: 768,
        resizable: true,
        minWidth: 400,
        minHeight: 300,
        title: "FixIT",
        icon: path.join(process.resourcesPath, 'src/assets/images/logo/win/icon.ico'),
        backgroundColor: '#1a1a1a',
        show: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            devTools: true,
            webSecurity: true,
            allowRunningInsecureContent: false,
            nodeIntegrationInWorker: true,
            experimentalFeatures: true
        }
    });

    // Optimierte Ladesequenz
    mainWindow.loadFile(path.join(__dirname, 'src', 'index.html')).then(() => {
        loadUserPreferences();
        // Kurze Verzögerung für smootheren Übergang
        setTimeout(() => {
            splash.destroy();
            mainWindow.show();
            mainWindow.focus();
        }, 1500);
    });

    mainWindow.on('close', (event) => {
        if (minimizeToTray && !app.isQuiting) {
            event.preventDefault();
            mainWindow.hide();
            showTrayIcon();
            const notification = {           
                title: 'Minimiert in die Symbolleiste',
                body: 'Die Anwendung wurde in die Symbolleiste minimiert.',
                silent: true,
                icon: path.join(__dirname, './src/assets/images/logo/png/64x64.png')
            };
            new Notification(notification).show();
        } else {
            app.isQuiting = true;
            mainWindow = null;
            app.quit();
        }
    });
}

// Benutzerpräferenzen laden
const loadUserPreferences = () => {
    mainWindow.webContents.executeJavaScript(`localStorage.getItem('alwaysOnTop')`).then((result) => {
        const savedAlwaysOnTop = result === 'true';
        mainWindow.setAlwaysOnTop(savedAlwaysOnTop);
        const alwaysOnTopMenuItem = menu.getMenuItemById('alwaysOnTopToggle');
        alwaysOnTopMenuItem.checked = savedAlwaysOnTop;
    });

    mainWindow.webContents.executeJavaScript(`localStorage.getItem('darkMode')`).then((result) => {
        const savedDarkMode = result === 'true';
        mainWindow.webContents.send('toggle-dark-mode', savedDarkMode);
        const darkModeMenuItem = menu.getMenuItemById('darkModeToggle');
        darkModeMenuItem.checked = savedDarkMode;
    });

    mainWindow.webContents.executeJavaScript(`localStorage.getItem('minimizeToTray')`).then((result) => {
        minimizeToTray = result === 'true';
        const minimizeToTrayMenuItem = menu.getMenuItemById('minimizeToTrayToggle');
        minimizeToTrayMenuItem.checked = minimizeToTray;
    });

    mainWindow.webContents.executeJavaScript(`localStorage.getItem('autostart')`).then((result) => {
        autostartEnabled = result === 'true';
        const autostartMenuItem = menu.getMenuItemById('autostartToggle');
        autostartMenuItem.checked = autostartEnabled;
        
        app.setLoginItemSettings({
            openAtLogin: autostartEnabled,
            path: process.execPath,
            args: ['--hidden']
        });
    });
};

// Tray-Icon anzeigen
const showTrayIcon = () => {
    if (tray) return;
    tray = new Tray(path.join(__dirname, './src/assets/images/logo/png/32x32.png'));

    const contextMenu = Menu.buildFromTemplate([
        { label: 'Anzeigen', click: () => mainWindow.show() },
        { label: 'Beenden', click: () => { app.isQuiting = true; app.quit(); } }
    ]);

    tray.setToolTip('FixIT');
    tray.setContextMenu(contextMenu);
    tray.on('click', () => mainWindow.show());
};

// IPC-Handler für .exe-Ausführung anpassen
ipcMain.handle('execute-exe', async (event, exeName) => {
    return new Promise((resolve, reject) => {
        // Korrigierter Pfad für portable Apps
        const exePath = app.isPackaged 
            ? path.join(process.resourcesPath, 'portable-apps', `${exeName}.exe`)
            : path.join(__dirname, 'src', 'portable-apps', `${exeName}.exe`);
        
        console.log('Versuche Programm zu starten:', exePath);

        // Prüfen ob die Datei existiert
        if (!fs.existsSync(exePath)) {
            console.error(`Exe nicht gefunden: ${exePath}`);
            reject(new Error(`Programm ${exeName}.exe wurde nicht gefunden`));
            return;
        }

        try {
            const childProcess = exec(`"${exePath}"`, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Fehler beim Ausführen der .exe: ${error.message}`);
                    reject(error);
                    return;
                }
            });

            if (childProcess.pid) {
                console.log('Prozess erfolgreich gestartet mit PID:', childProcess.pid);
                setTimeout(() => {
                    resolve(true);
                }, 300);
            } else {
                reject(new Error('Prozess konnte nicht gestartet werden'));
            }

        } catch (error) {
            console.error('Fehler beim Ausführen:', error);
            reject(error);
        }
    });
});

// IPC-Handler für URL-Öffnen
ipcMain.handle('open-url', (event, url) => {
    shell.openExternal(url);
});

// Lizenz-IPC-Handler
ipcMain.on('license-valid', () => {
    store.set('licensed', true);
    createMainWindow();
    licenseWindow.close();
});

ipcMain.on('too-many-attempts', () => {
    dialog.showMessageBox({
        type: 'error',
        title: 'Zu viele Versuche',
        message: 'Sie haben zu oft einen falschen Lizenzschlüssel eingegeben. Die Anwendung wird beendet.',
        buttons: ['OK']
    }).then(() => {
        app.quit();
    });
});

// IPC-Handler für Programmstart
ipcMain.handle('execute', async (event, programName) => {
  try {
    const child = spawn(programName, [], {
      detached: true,
      stdio: 'ignore'
    });
    
    return new Promise((resolve, reject) => {
      child.on('spawn', () => {
        resolve(true);
      });
      
      child.on('error', (err) => {
        reject(err);
      });
    });
  } catch (error) {
    throw error;
  }
});

// Füge diesen IPC-Handler hinzu
ipcMain.handle('check-process', async (event, exeName) => {
    return new Promise((resolve) => {
        const command = process.platform === 'win32' 
            ? `tasklist /FI "IMAGENAME eq ${exeName}.exe" /NH`
            : `ps aux | grep ${exeName}`;
            
        exec(command, (error, stdout) => {
            if (error) {
                console.error(`Fehler beim Prüfen des Prozesses: ${error}`);
                resolve(false);
                return;
            }
            
            // Prüfe ob der Prozess in der Ausgabe gefunden wurde
            const isRunning = stdout.toLowerCase().includes(exeName.toLowerCase());
            resolve(isRunning);
        });
    });
});

// ------------------- Anwendung starten -------------------
app.whenReady().then(async () => {
    // Führen Sie zeitintensive Operationen asynchron aus
    Promise.all([
        import('electron-store'),
        listPortableApps()
    ]).then(([{ default: Store }]) => {
        store = new Store();
        createMainWindow();
    });
    
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// ------------------- Menü-Template -------------------
const template = [
    {
        label: 'Socials',
        submenu: [
            { label: 'Website', click: () => shell.openExternal('https://helpinformatik.de') },
            { label: 'Instagram', click: () => shell.openExternal('https://www.instagram.com/helpit.informatik') },
            { label: 'GitHub', click: () => shell.openExternal('https://github.com/alphatg050') },
            { label: 'E-Mail', click: () => shell.openExternal('mailto:guerkan.privat@gmail.com') }
        ]
    },
    {
        label: 'Optionen',
        submenu: [
            {
                label: 'Dark Mode',
                id: 'darkModeToggle',
                type: 'checkbox',
                checked: false,
                click: (menuItem) => {
                    const isDarkMode = menuItem.checked;
                    mainWindow.webContents.send('toggle-dark-mode', isDarkMode);
                    mainWindow.webContents.executeJavaScript(`localStorage.setItem('darkMode', ${isDarkMode});`);
                }
            },
            {
                label: 'Immer im Vordergrund',
                id: 'alwaysOnTopToggle',
                type: 'checkbox',
                checked: false,
                click: (menuItem) => {
                    mainWindow.setAlwaysOnTop(menuItem.checked);
                    mainWindow.webContents.executeJavaScript(`localStorage.setItem('alwaysOnTop', ${menuItem.checked});`);
                }
            },
            {
                label: 'In Symbolleiste minimieren',
                id: 'minimizeToTrayToggle',
                type: 'checkbox',
                checked: minimizeToTray,
                click: (menuItem) => {
                    minimizeToTray = menuItem.checked;
                    mainWindow.webContents.executeJavaScript(`localStorage.setItem('minimizeToTray', ${menuItem.checked});`);
                }
            },
            {
                label: 'Autostart',
                id: 'autostartToggle',
                type: 'checkbox',
                checked: autostartEnabled,
                click: (menuItem) => {
                    autostartEnabled = menuItem.checked;
                    mainWindow.webContents.executeJavaScript(`localStorage.setItem('autostart', ${autostartEnabled});`);
                    
                    app.setLoginItemSettings({
                        openAtLogin: autostartEnabled,
                        path: process.execPath,
                        args: ['--hidden']
                    });
                }
            },
            { type: 'separator' },
            { role: 'reload' },
            { role: 'forceReload' },
        ]
    },
    {
        label: 'Hilfe',
        submenu: [
            // Hilfe & Support Gruppe
            {
                label: 'Tutorial starten',
                click: () => {
                    mainWindow.webContents.executeJavaScript(`
                        localStorage.removeItem('tutorialShown');
                        startTutorial();
                    `);
                }
            },
            {
                label: 'Shortcuts anzeigen',
                click: () => {
                    const shortcutsWindow = new BrowserWindow({
                        width: 400,
                        height: 500,
                        title: "Shortcuts",
                        modal: false,
                        parent: mainWindow,
                        show: false,
                        frame: false,
                        webPreferences: {
                            nodeIntegration: true,
                            contextIsolation: false
                        },
                        backgroundColor: '#ffffff',
                        minimizable: false,
                        maximizable: false,
                        resizable: false,
                        autoHideMenuBar: true,
                        menuBarVisible: false,
                        alwaysOnTop: true
                    });

                    shortcutsWindow.setMenu(null);

                    shortcutsWindow.once('ready-to-show', () => {
                        shortcutsWindow.show();
                    });

                    shortcutsWindow.webContents.on('before-input-event', (event, input) => {
                        if (input.key === 'Escape') {
                            shortcutsWindow.close();
                        }
                    });

                    shortcutsWindow.loadFile(path.join(__dirname, 'src', 'shortcuts.html'));
                }
            },
            {
                label: 'TeamViewer QS',
                click: () => {
                    const exePath = app.isPackaged
                        ? path.join(process.resourcesPath, 'portable-apps', 'TeamViewerQS.exe')
                        : path.join(__dirname, 'src', 'portable-apps', 'TeamViewerQS.exe');

                    if (fs.existsSync(exePath)) {
                        exec(`"${exePath}"`, (error) => {
                            if (error) {
                                console.error(`Fehler beim Öffnen von TeamViewer: ${error}`);
                                dialog.showErrorBox('Fehler', 
                                    'TeamViewer QS konnte nicht gestartet werden.'
                                );
                            }
                        });
                    } else {
                        console.error('TeamViewer QS nicht gefunden:', exePath);
                        dialog.showErrorBox('Fehler', 
                            'TeamViewer QS wurde nicht gefunden.'
                        );
                    }
                }
            },
            { type: 'separator' },

            // Entwickler Tools
            {
                label: 'Entwickler',
                submenu: [
                    {
                        label: 'DevTools öffnen',
                        click: () => mainWindow.webContents.openDevTools()
                    },
                    {
                        label: 'Logs exportieren',
                        click: async () => {
                            try {
                                const { filePath } = await dialog.showSaveDialog(mainWindow, {
                                    title: 'Logs speichern',
                                    defaultPath: path.join(app.getPath('desktop'), 'FixIT-Logs.txt'),
                                    filters: [
                                        { name: 'Text Files', extensions: ['txt'] },
                                        { name: 'All Files', extensions: ['*'] }
                                    ]
                                });

                                if (filePath) {
                                    // Sammle Systeminformationen
                                    const os = require('os');
                                    const logContent = [
                                        `FixIT Logs - ${new Date().toLocaleString()}`,
                                        '----------------------------------------',
                                        'System Informationen:',
                                        `Hostname: ${os.hostname()}`,
                                        `Betriebssystem: ${os.type()} ${os.release()} ${os.arch()}`,
                                        `CPU: ${os.cpus()[0].model}`,
                                        `CPU Kerne: ${os.cpus().length}`,
                                        `Arbeitsspeicher: ${Math.round(os.totalmem() / 1024 / 1024 / 1024)} GB`,
                                        `Benutzer: ${os.userInfo().username}`,
                                        `Home Directory: ${os.homedir()}`,
                                        '----------------------------------------',
                                        'FixIT Informationen:',
                                        `Version: ${version}`,
                                        `Electron Version: ${process.versions.electron}`,
                                        `Chrome Version: ${process.versions.chrome}`,
                                        `Node Version: ${process.versions.node}`,
                                        `V8 Version: ${process.versions.v8}`,
                                        '----------------------------------------'
                                    ].join('\n');

                                    require('fs').writeFileSync(filePath, logContent);

                                    dialog.showMessageBox(mainWindow, {
                                        type: 'info',
                                        title: 'Logs exportiert',
                                        message: 'Die Logs wurden erfolgreich exportiert.',
                                        buttons: ['OK']
                                    });
                                }
                            } catch (error) {
                                dialog.showErrorBox('Fehler', 
                                    'Beim Exportieren der Logs ist ein Fehler aufgetreten: ' + error.message
                                );
                            }
                        }
                    }
                ]
            },
            { type: 'separator' },

            // Extras & Features
            {
                label: 'Easter Eggs',
                click: () => {
                    const easterEggWindow = new BrowserWindow({
                        width: 400,
                        height: 500,
                        title: "Easter Eggs",
                        modal: false,
                        parent: mainWindow,
                        show: false,
                        frame: false,
                        webPreferences: {
                            nodeIntegration: true,
                            contextIsolation: false
                        },
                        backgroundColor: '#e3ffe3',
                        minimizable: false,
                        maximizable: false,
                        resizable: false,
                        autoHideMenuBar: true,
                        menuBarVisible: false,
                        alwaysOnTop: true
                    });

                    easterEggWindow.setMenu(null);

                    easterEggWindow.once('ready-to-show', () => {
                        easterEggWindow.show();
                    });

                    easterEggWindow.webContents.on('before-input-event', (event, input) => {
                        if (input.key === 'Escape') {
                            easterEggWindow.close();
                        }
                    });

                    easterEggWindow.loadFile(path.join(__dirname, 'src', 'easter-eggs.html'));
                }
            },
            {
                label: 'Lizenz',
                click: () => {
                    dialog.showMessageBox(mainWindow, {
                        type: "warning",
                        title: 'Lizenzsteuerung',
                        message: `Work in Progress!`,
                        buttons: ['OK'],
                        noLink: true
                    });
                }
            },
            { type: 'separator' },

            // Info
            {
                label: 'Über FixIT',
                click: () => {
                    dialog.showMessageBox(mainWindow, {
                        type: "info",
                        title: 'FixIT',
                        message: `Version: ${version}\n\nEntwickelt von ${author}\nKontakt: guerkan.privat@gmail.com`,
                        buttons: ['OK'],
                        noLink: true
                    });
                }
            },
            {
                label: 'Updates prüfen',
                click: async () => {
                    checkForUpdates();
                }
            }
        ]
    }
];

// Menü erstellen und setzen
const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

// Fügen Sie diese Funktion am Anfang der Datei hinzu
function listPortableApps() {
    const portableAppsPath = app.isPackaged
        ? path.join(process.resourcesPath, 'portable-apps')
        : path.join(__dirname, 'src', 'portable-apps');
        
    try {
        if (!fs.existsSync(portableAppsPath)) {
            console.error('Portable-Apps Ordner existiert nicht:', portableAppsPath);
            return;
        }

        const files = fs.readdirSync(portableAppsPath);
        console.log('Gefundene portable Apps:', files);
        
        files.forEach(file => {
            const filePath = path.join(portableAppsPath, file);
            const stats = fs.statSync(filePath);
            console.log(`App: ${file}, Größe: ${stats.size} bytes`);
        });
    } catch (error) {
        console.error('Fehler beim Lesen des portable-apps Ordners:', error);
        console.error('Pfad:', portableAppsPath);
    }
}

// Update-Funktion aktualisieren
async function checkForUpdates() {
    try {
        const { data } = await axios.get('https://api.github.com/repos/AlphaTG50/FixIT/releases/latest');
        
        const latestVersion = data.tag_name.replace('v', '');
        const currentVersion = version;

        if (compareVersions(latestVersion, currentVersion) > 0) {
            const { response, checkboxChecked } = await dialog.showMessageBox({
                type: 'info',
                buttons: ['Jetzt installieren', 'Später'],
                title: 'Update verfügbar',
                message: `Eine neue Version (${data.tag_name}) ist verfügbar.`,
                detail: `Aktuelle Version: v${currentVersion}`,
                cancelId: 1,
                noLink: true
            });

            if (response === 0) {
                await downloadUpdate(data.assets[0].browser_download_url);
            }
        } else {
            dialog.showMessageBox({
                type: 'info',
                title: 'Keine Updates verfügbar',
                message: `Sie verwenden bereits die neueste Version.`
            });
        }
    } catch (error) {
        dialog.showErrorBox('Update-Fehler', 
            'Beim Prüfen auf Updates ist ein Fehler aufgetreten.\n' +
            'Bitte überprüfen Sie Ihre Internetverbindung.'
        );
        console.error('Update-Fehler:', error);
    }
}

async function downloadUpdate(downloadUrl) {
    const progressWindow = new BrowserWindow({
        width: 400,
        height: 150,
        frame: false,
        resizable: false,
        parent: mainWindow,
        modal: true,
        show: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    progressWindow.loadFile(path.join(__dirname, 'src', 'update-progress.html'));
    progressWindow.once('ready-to-show', () => progressWindow.show());

    progressWindow.on('close', () => {
        progressWindow.destroy();
    });

    try {
        // Download-Pfad für die Setup.exe
        const downloadPath = path.join(app.getPath('temp'), 'FixIT.Setup.exe');
        
        // Download durchführen
        const response = await axios({
            method: 'get',
            url: downloadUrl,
            responseType: 'stream',
            onDownloadProgress: (progressEvent) => {
                if (!progressWindow.isDestroyed()) {
                    const progress = (progressEvent.loaded / progressEvent.total) * 100;
                    progressWindow.webContents.send('download-progress', progress);
                }
            }
        });

        if (progressWindow.isDestroyed()) return;

        // Setup.exe speichern
        const writer = fs.createWriteStream(downloadPath);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        if (!progressWindow.isDestroyed()) {
            progressWindow.close();
            
            const installChoice = dialog.showMessageBoxSync({
                type: 'info',
                buttons: ['Jetzt installieren', 'Später'],
                title: 'Update bereit',
                message: 'Das Update wurde heruntergeladen. Die Anwendung wird geschlossen und das Update gestartet.'
            });

            if (installChoice === 0) {
                // Setup.exe ausführen und App beenden
                exec(`"${downloadPath}"`, (error) => {
                    if (error) {
                        dialog.showErrorBox('Update-Fehler', 
                            'Beim Starten des Updates ist ein Fehler aufgetreten.'
                        );
                        console.error('Update-Fehler:', error);
                        return;
                    }
                    app.quit();
                });
            }
        }

    } catch (error) {
        if (!progressWindow.isDestroyed()) {
            progressWindow.close();
            dialog.showErrorBox('Download-Fehler', 
                'Beim Herunterladen des Updates ist ein Fehler aufgetreten.'
            );
        }
        console.error('Download-Fehler:', error);
    }
}

// Hilfsfunktion zum Vergleichen von Versionen
function compareVersions(v1, v2) {
    const v1Parts = v1.split('.').map(Number);
    const v2Parts = v2.split('.').map(Number);
    
    for (let i = 0; i < 3; i++) {
        if (v1Parts[i] > v2Parts[i]) return 1;
        if (v1Parts[i] < v2Parts[i]) return -1;
    }
    return 0;
}
