const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs').promises;
const path = require('path');
const JSZip = require('jszip');
const https = require('https');
const { app } = require('electron');

// Pfad zur .env Datei anpassen
const envPath = process.env.NODE_ENV === 'development' 
    ? path.join(__dirname, 'resources', '.env')
    : path.join(process.resourcesPath, '.env');

require('dotenv').config({ path: envPath });

// Version aus package.json lesen
const appVersion = require('./package.json').version;

// GitHub API Konfiguration
const GITHUB_API_URL = 'https://api.github.com/repos/AlphaTG50/FixIT/releases/latest';

// Funktion zum Herunterladen des Updates
async function downloadUpdate(url, onProgress) {
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'User-Agent': 'FixIT-App',
                'Accept': 'application/octet-stream'
            }
        };

        const request = https.get(url, options, (response) => {
            // Umleitung folgen (wichtig für GitHub Asset Downloads)
            if (response.statusCode === 302 || response.statusCode === 301) {
                // Bei Umleitung den Authorization-Header für die neue URL verwenden
                downloadUpdate(response.headers.location, onProgress)
                    .then(resolve)
                    .catch(reject);
                return;
            }

            if (response.statusCode !== 200) {
                reject(new Error(`Download fehlgeschlagen: ${response.statusCode}`));
                return;
            }

            const totalSize = parseInt(response.headers['content-length'], 10);
            let downloadedSize = 0;
            const chunks = [];

            response.on('data', (chunk) => {
                chunks.push(chunk);
                downloadedSize += chunk.length;
                if (totalSize) {
                    onProgress(Math.round((downloadedSize / totalSize) * 100));
                }
            });

            response.on('end', () => {
                const buffer = Buffer.concat(chunks);
                resolve(buffer);
            });

            response.on('error', (error) => {
                console.error('Fehler beim Download:', error);
                reject(error);
            });
        });

        request.on('error', (error) => {
            console.error('Fehler bei der Anfrage:', error);
            reject(error);
        });

        // Timeout setzen
        request.setTimeout(30000, () => {
            request.destroy();
            reject(new Error('Download-Timeout nach 30 Sekunden'));
        });
    });
}

// Funktion zum Prüfen auf Updates
async function checkForUpdates() {
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'User-Agent': 'FixIT-App',
                'Accept': 'application/vnd.github.v3+json'
            }
        };

        console.log('Starte Update-Prüfung...');
        console.log('API URL:', GITHUB_API_URL);

        https.get(GITHUB_API_URL, options, (res) => {
            console.log('API Antwort Status:', res.statusCode);
            
            let data = '';
            res.on('data', (chunk) => data += chunk);
            
            res.on('end', () => {
                try {
                    if (res.statusCode !== 200) {
                        console.error('API Fehler:', data);
                        reject(new Error(`GitHub API Fehler: ${res.statusCode} - ${data}`));
                        return;
                    }

                    const release = JSON.parse(data);
                    console.log('Release Daten:', release);
                    
                    if (!release.tag_name) {
                        reject(new Error('Keine Version gefunden'));
                        return;
                    }

                    const latestVersion = release.tag_name.replace('v', '');
                    const updateAvailable = compareVersions(latestVersion, appVersion) > 0;
                    
                    // Verwende die Assets-URL für private Repositories
                    const asset = release.assets.find(asset => asset.name.includes('Setup'));
                    const downloadUrl = asset ? asset.url : null;
                    
                    console.log('Aktuelle Version:', appVersion);
                    console.log('Neueste Version:', latestVersion);
                    console.log('Update verfügbar:', updateAvailable);
                    
                    resolve({
                        currentVersion: appVersion,
                        latestVersion: latestVersion,
                        updateAvailable: updateAvailable,
                        downloadUrl: downloadUrl,
                        fileName: asset ? asset.name : null
                    });
                } catch (error) {
                    console.error('Fehler beim Verarbeiten der API-Antwort:', error);
                    reject(error);
                }
            });
        }).on('error', (error) => {
            console.error('Netzwerkfehler:', error);
            reject(error);
        });
    });
}

// Versionsnummern vergleichen
function compareVersions(v1, v2) {
    const v1Parts = v1.split('.').map(Number);
    const v2Parts = v2.split('.').map(Number);
    
    for (let i = 0; i < 3; i++) {
        if (v1Parts[i] > v2Parts[i]) return 1;
        if (v1Parts[i] < v2Parts[i]) return -1;
    }
    return 0;
}

async function downloadLatestRelease() {
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'User-Agent': 'FixIT-App'
            }
        };
        https.get('https://api.github.com/repos/AlphaTG50/FixIT/releases/latest', options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const release = JSON.parse(data);
                    const asset = release.assets.find(a =>
                        a.name.startsWith('FixIT.Setup.v') && a.name.endsWith('.exe')
                    );
                    if (!asset) return reject('Keine passende Setup-Datei gefunden!');
                    const downloadUrl = asset.browser_download_url;
                    const downloadsPath = app.getPath('downloads');
                    const filePath = path.join(downloadsPath, asset.name);

                    // Jetzt die Datei herunterladen
                    const file = fs.createWriteStream(filePath);
                    https.get(downloadUrl, options, (response) => {
                        response.pipe(file);
                        file.on('finish', () => {
                            file.close();
                            resolve(filePath);
                        });
                    }).on('error', (err) => {
                        fs.unlink(filePath, () => {});
                        reject(err.message);
                    });
                } catch (e) {
                    reject(e.message);
                }
            });
        }).on('error', reject);
    });
}

contextBridge.exposeInMainWorld('electronAPI', {
    minimizeWindow: () => ipcRenderer.send('minimize-window'),
    maximizeWindow: () => ipcRenderer.send('maximize-window'),
    closeWindow: () => ipcRenderer.send('close-window'),
    launchTool: (path) => ipcRenderer.send('launch-tool', path),
    onMaximizeChange: (callback) => {
        ipcRenderer.on('maximize-change', (_event, value) => callback(value));
    },
    setAlwaysOnTop: (enabled) => ipcRenderer.send('set-always-on-top', enabled),
    checkFileExists: async (filePath) => {
        try {
            const expandedPath = filePath.replace('%LOCALAPPDATA%', process.env.LOCALAPPDATA);
            await fs.access(expandedPath);
            return true;
        } catch {
            return false;
        }
    },
    getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
    // Version zur Verfügung stellen
    getAppVersion: () => appVersion,
    saveAndOpenZip: async (files) => ipcRenderer.invoke('save-and-open-zip', files),
    showFolder: (folderPath) => ipcRenderer.send('show-folder', folderPath),
    // Update-bezogene Funktionen
    checkForUpdates: async () => {
        try {
            return await checkForUpdates();
        } catch (error) {
            console.error('Fehler beim Prüfen auf Updates:', error);
            throw error;
        }
    },
    getCurrentVersion: () => appVersion,
    downloadUpdate: async (url, onProgress) => {
        try {
            // Hole zuerst die Update-Informationen
            const updateInfo = await checkForUpdates();
            const buffer = await downloadUpdate(url, onProgress);
            const downloadsPath = path.join(process.env.USERPROFILE, 'Downloads');
            // Nutze den Original-Dateinamen aus den Update-Informationen
            const fileName = updateInfo.fileName;
            const filePath = path.join(downloadsPath, fileName);
            await fs.writeFile(filePath, buffer);
            return filePath;
        } catch (error) {
            console.error('Fehler beim Herunterladen des Updates:', error);
            throw error;
        }
    },
    downloadLatestRelease: downloadLatestRelease,
    onToolLaunched: (callback) => ipcRenderer.on('tool-launched', (event, success) => callback(success))
}); 