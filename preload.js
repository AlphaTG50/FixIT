const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs').promises;
const path = require('path');

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
    getSystemInfo: () => ipcRenderer.invoke('get-system-info')
}); 