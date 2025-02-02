const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs').promises;
const path = require('path');
const JSZip = require('jszip');

// Version aus package.json lesen
const appVersion = require('./package.json').version;

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
    showFolder: (folderPath) => ipcRenderer.send('show-folder', folderPath)
}); 