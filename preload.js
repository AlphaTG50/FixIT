const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs').promises;
const path = require('path');
const JSZip = require('jszip');
const https = require('https');

// Pfad zur .env Datei anpassen
const envPath = process.env.NODE_ENV === 'development' 
    ? path.join(__dirname, 'resources', '.env')
    : path.join(process.resourcesPath, '.env');

require('dotenv').config({ path: envPath });

// Version aus package.json lesen
const appVersion = require('./package.json').version;

// GitHub API Konfiguration
const GITHUB_TOKEN = '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';
const GITHUB_API_URL = 'https://api.github.com/repos/AlphaTG50/FixIT/releases/latest';

// Funktion zum Herunterladen des Updates
async function downloadUpdate(url, onProgress) {
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'User-Agent': 'FixIT-App',
                'Authorization': `token ${GITHUB_TOKEN}`,
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
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        };

        https.get(GITHUB_API_URL, options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const release = JSON.parse(data);
                    const latestVersion = release.tag_name.replace('v', '');
                    const updateAvailable = compareVersions(latestVersion, appVersion) > 0;
                    
                    // Verwende die Assets-URL für private Repositories
                    const asset = release.assets.find(asset => asset.name.includes('Setup'));
                    const downloadUrl = asset ? asset.url : null;
                    
                    resolve({
                        currentVersion: appVersion,
                        latestVersion: latestVersion,
                        updateAvailable: updateAvailable,
                        downloadUrl: downloadUrl,
                        fileName: asset ? asset.name : null
                    });
                } catch (error) {
                    reject(error);
                }
            });
        }).on('error', reject);
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
    }
}); 