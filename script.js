class ToolManager {
    constructor() {
        this.loadFavorites();
        this.initializeTools();
        this.setupEventListeners();
        this.currentFilteredTools = this.tools;
        this.renderTools();
        this.initTheme();
        this.setupWindowControls();
        this.loadAlwaysOnTopSetting();
    }

    setupEventListeners() {
        document.getElementById('searchInput').addEventListener('input', () => this.filterTools());
        
        // Kategorie-Filter initialisieren (nur einmal beim Start)
        const categoryFilter = document.getElementById('categoryFilter');
        categoryFilter.innerHTML = this.getCategoryOptions();
        categoryFilter.addEventListener('change', () => this.filterTools());
        
        document.getElementById('darkModeToggle').addEventListener('click', () => this.toggleTheme());
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.showSettingsModal();
        });
        document.getElementById('closeSettingsBtn').addEventListener('click', () => {
            this.hideSettingsModal();
        });
        document.getElementById('alwaysOnTop').addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            window.electronAPI.setAlwaysOnTop(isChecked);
            localStorage.setItem('alwaysOnTop', isChecked);
            console.log('Immer im Vordergrund:', isChecked);
        });
        document.getElementById('aboutBtn').addEventListener('click', () => {
            this.showAboutModal();
        });
        document.getElementById('closeAboutBtn').addEventListener('click', () => {
            this.hideAboutModal();
        });
        document.getElementById('bugReportBtn').addEventListener('click', () => {
            this.showBugReportModal();
        });
        document.getElementById('closeBugReportBtn').addEventListener('click', () => {
            this.hideBugReportModal();
        });
        document.getElementById('bugReportForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitBugReport();
        });
    }

    initializeTools() {
        this.tools = [
            {
                id: '1',
                name: 'Everything',
                category: 'portable',
                location: {
                    portable: 'resources/executable/everything.exe',
                },
                website: 'https://www.voidtools.com',
                description: 'Schnelle Dateisuche für Windows',
                logo: 'assets/images/tools/everything.ico'
            },
            {
                id: '2',
                name: 'HiBit SystemInfo',
                category: 'portable',
                location: {
                    portable: 'resources/executable/hibitsysteminfo.exe',
                },
                website: 'https://hibitsoft.ir',
                description: 'Detaillierte Systeminformationen und Hardware-Überwachung',
                logo: 'https://www.hibitsoft.ir/images/System-Information-icon.png'
            },
            {
                id: '3',
                name: 'HiBit Uninstaller',
                category: 'portable',
                location: {
                    portable: 'resources/executable/hibituninstaller.exe',
                },
                website: 'https://hibitsoft.ir',
                description: 'Leistungsstarker Software-Uninstaller und Systemoptimierer',
                logo: 'https://www.hibitsoft.ir/images/Uninstaller-icon.png'
            },
            {
                id: '4',
                name: 'HWiNFO',
                category: 'portable',
                location: {
                    portable: 'resources/executable/hwinfo.exe',
                },
                website: 'https://www.hwinfo.com',
                description: 'Umfassende Hardware-Analyse und Überwachungssoftware',
                logo: 'https://www.hwinfo.com/images/hwi_logo_flat_192.png'
            },
            {
                id: '5',
                name: 'ChatGPT',
                category: 'website',
                location: {
                    portable: 'https://chat.openai.com',
                },
                website: 'https://chat.openai.com',
                description: 'KI-gestützter Chatbot für verschiedene Aufgaben',
                logo: 'https://chat.openai.com/favicon.ico'
            },
            {
                id: '6',
                name: 'Terminator',
                category: 'website',
                location: {
                    portable: 'https://terminator.aeza.net/en/',
                },
                website: 'https://terminator.aeza.net/en/',
                description: 'Kostenlose virtuelle Maschine mit Windows 10 oder Debian 12',
                logo: 'assets/images/tools/terminator.png'
            },
            {
                id: '7',
                name: 'VirusTotal',
                category: 'website',
                location: {
                    portable: 'https://www.virustotal.com',
                },
                website: 'https://www.virustotal.com',
                description: 'Online-Virenscanner und Dateianalyse-Tool',
                logo: 'assets/images/tools/virustotal.png'
            },
            {
                id: '8',
                name: 'TreeSize Free',
                category: 'portable',
                location: {
                    portable: 'resources/executable/treesizefree.exe',
                },
                website: 'https://www.jam-software.com/treesize_free',
                description: 'Visualisiert die Festplattennutzung und findet große Dateien',
                logo: 'https://images.sftcdn.net/images/t_app-icon-m/p/99f2adf4-96d9-11e6-bbea-00163ec9f5fa/2084259879/treesize-TreeSizeFree-Icon-256.png'
            },
            {
                id: '10',
                name: 'LastPass Generator',
                category: 'website',
                location: {
                    portable: 'https://www.lastpass.com/features/password-generator',
                },
                website: 'https://www.lastpass.com/features/password-generator',
                description: 'Generiert sichere und zufällige Passwörter',
                logo: 'https://assets.wheelhouse.com/media/_solution_logo_01232023_1740481.png'
            },
            {
                id: '11',
                name: 'Encycolorpedia',
                category: 'website',
                location: {
                    portable: 'https://encycolorpedia.com',
                },
                website: 'https://encycolorpedia.com',
                description: 'Umfassende Farbpaletten und Farbkonvertierung',
                logo: 'https://miro.medium.com/v2/resize:fit:2400/1*xqhKDCdzQu2AINEIGU8eXQ.png'
            },
            {
                id: '12',
                name: 'Play with Docker',
                category: 'website',
                location: {
                    portable: 'https://labs.play-with-docker.com',
                },
                website: 'https://labs.play-with-docker.com',
                description: 'Kostenloser Docker-Playground zum Lernen und Experimentieren im Browser',
                logo: 'https://galaxyproject.github.io/training-material/topics/admin/images/docker_whale.png'
            },
            {
                id: '13',
                name: 'RegExr',
                category: 'website',
                location: {
                    portable: 'https://regexr.com',
                },
                website: 'https://regexr.com',
                description: 'Online-Tool zum Lernen, Testen und Erstellen von regulären Ausdrücken',
                logo: 'https://cdn-1.webcatalog.io/catalog/regexr/regexr-icon-filled-256.png?v=1714775649617'
            },
            {
                id: '14',
                name: 'Browser Privacy Check',
                category: 'website',
                location: {
                    portable: 'https://www.experte.de/browser-privacy-check',
                },
                website: 'https://www.experte.de/browser-privacy-check',
                description: 'Überprüft welche Spuren Ihr Browser im Web hinterlässt',
                logo: 'assets/images/tools/experte.png'
            },
            {
                id: '15',
                name: 'RAID Calculator',
                category: 'website',
                location: {
                    portable: 'https://www.synology.com/de-de/support/RAID_calculator',
                },
                website: 'https://www.synology.com/de-de/support/RAID_calculator',
                description: 'Berechnet Speicherkapazität verschiedener RAID-Konfigurationen',
                logo: 'assets/images/tools/synology.png'
            },
            {
                id: '16',
                name: 'Can You RUN It',
                category: 'website',
                location: {
                    portable: 'https://www.systemrequirementslab.com/cyri',
                },
                website: 'https://www.systemrequirementslab.com/cyri',
                description: 'Prüft ob Ihr PC die Anforderungen bestimmter Spiele erfüllt',
                logo: 'assets/images/tools/canyourunit.png'
            },
            {
                id: '17',
                name: 'CrackStation',
                category: 'website',
                location: {
                    portable: 'https://crackstation.net',
                },
                website: 'https://crackstation.net',
                description: 'Online Hash-Cracker für nicht-gesalzene Passwort-Hashes',
                logo: 'assets/images/tools/crackstation.png'
            },
            {
                id: '18',
                name: 'NameChk',
                category: 'website',
                location: {
                    portable: 'https://namechk.com',
                },
                website: 'https://namechk.com',
                description: 'Überprüft die Verfügbarkeit von Benutzernamen auf verschiedenen Plattformen',
                logo: 'https://namechk.com/favicon.ico'
            },
            {
                id: '19',
                name: 'PCPartPicker',
                category: 'website',
                location: {
                    portable: 'https://pcpartpicker.com',
                },
                website: 'https://pcpartpicker.com',
                description: 'System Builder für PC-Komponenten mit Kompatibilitätsprüfung',
                logo: 'assets/images/tools/pcpartpicker.png'
            },
            {
                id: '20',
                name: 'Alle Störungen',
                category: 'website',
                location: {
                    portable: 'https://xn--allestrungen-9ib.de',
                },
                website: 'https://xn--allestrungen-9ib.de',
                description: 'Zeigt aktuelle Störungen und Ausfälle verschiedener Dienste',
                logo: 'https://xn--allestrungen-9ib.de/favicon.ico'
            }
        ];
    }

    initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.updateThemeIcon(newTheme);
    }

    updateThemeIcon(theme) {
        const icon = document.querySelector('#darkModeToggle i');
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    showModal(tool = null) {
        const modal = document.getElementById('toolModal');
        const modalTitle = document.getElementById('modalTitle');
        const form = document.getElementById('toolForm');

        modalTitle.textContent = tool ? 'Werkzeug bearbeiten' : 'Werkzeug hinzufügen';
        
        if (tool) {
            form.dataset.id = tool.id;
            document.getElementById('toolName').value = tool.name;
            document.getElementById('toolCategory').value = tool.category;
            document.getElementById('toolLocation').value = tool.location.portable || tool.location.install;
            document.getElementById('toolDescription').value = tool.description;
        } else {
            form.reset();
            delete form.dataset.id;
        }

        modal.style.display = 'block';
    }

    hideModal() {
        document.getElementById('toolModal').style.display = 'none';
    }

    handleFormSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const toolData = {
            id: form.dataset.id || Date.now().toString(),
            name: document.getElementById('toolName').value,
            category: document.getElementById('toolCategory').value,
            location: {
                portable: document.getElementById('toolLocation').value.split(',')[0].trim(),
                install: document.getElementById('toolLocation').value.split(',')[1].trim()
            },
            description: document.getElementById('toolDescription').value
        };

        if (form.dataset.id) {
            this.updateTool(toolData);
        } else {
            this.addTool(toolData);
        }

        this.hideModal();
        this.renderTools();
    }

    addTool(tool) {
        this.tools.push(tool);
        this.saveTools();
    }

    updateTool(updatedTool) {
        const index = this.tools.findIndex(tool => tool.id === updatedTool.id);
        if (index !== -1) {
            this.tools[index] = updatedTool;
            this.saveTools();
        }
    }

    deleteTool(id) {
        if (confirm('Möchten Sie dieses Werkzeug wirklich löschen?')) {
            this.tools = this.tools.filter(tool => tool.id !== id);
            this.saveTools();
            this.renderTools();
        }
    }

    saveTools() {
        localStorage.setItem('tools', JSON.stringify(this.tools));
    }

    filterTools() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const categoryFilter = document.getElementById('categoryFilter').value;

        this.currentFilteredTools = this.tools.filter(tool => {
            const matchesSearch = tool.name.toLowerCase().includes(searchTerm) ||
                                tool.description.toLowerCase().includes(searchTerm);
            const matchesCategory = !categoryFilter || tool.category === categoryFilter;
            return matchesSearch && matchesCategory;
        });

        // Sortiere die gefilterten Tools
        const sortedAndFilteredTools = [...this.currentFilteredTools].sort((a, b) => {
            const aIsFav = this.favorites.has(a.id);
            const bIsFav = this.favorites.has(b.id);
            
            if (aIsFav === bIsFav) {
                return a.name.localeCompare(b.name);
            }
            return aIsFav ? -1 : 1;
        });

        this.renderTools(sortedAndFilteredTools);
    }

    launchTool(location) {
        try {
            window.electronAPI.launchTool(location);
        } catch (error) {
            console.error('Fehler beim Starten des Tools:', error);
            alert('Das Tool konnte nicht gestartet werden. Bitte überprüfen Sie den Speicherort.');
        }
    }

    renderTools(toolsToRender = this.tools) {
        const toolsList = document.getElementById('toolsList');
        toolsList.innerHTML = '';

        // Sortiere Tools: Erst Favoriten, dann alphabetisch innerhalb der Gruppen
        const sortedTools = [...toolsToRender].sort((a, b) => {
            const aIsFav = this.favorites.has(a.id);
            const bIsFav = this.favorites.has(b.id);
            
            if (aIsFav === bIsFav) {
                return a.name.localeCompare(b.name);
            }
            return aIsFav ? -1 : 1;
        });

        sortedTools.forEach(tool => {
            const toolCard = document.createElement('div');
            toolCard.className = 'tool-card';
            
            const isFavorite = this.favorites.has(tool.id);
            const favoriteButton = `
                <button class="favorite-btn ${isFavorite ? 'active' : ''}" 
                        onclick="toolManager.toggleFavorite('${tool.id}')">
                    <i class="fas fa-star"></i>
                </button>
            `;

            // Buttons basierend auf der Kategorie
            let actionButtons = '';
            switch(tool.category) {
                case 'website':
                    actionButtons = `
                        <button class="launch-btn" onclick="window.electronAPI.launchTool('${tool.location.portable}')">
                            <i class="fas fa-external-link-alt"></i> Im Browser öffnen
                        </button>
                    `;
                    break;
                case 'scripts':
                case 'portable':
                    actionButtons = `
                        <button class="launch-btn portable" onclick="toolManager.launchTool('${tool.location.portable}')">
                            <i class="fas fa-play"></i> Ausführen
                        </button>
                    `;
                    break;
            }

            // Website-Link nur anzeigen, wenn es keine Website-Kategorie ist
            const websiteLink = tool.category === 'website' ? '' : `
                <div class="tool-website">
                    <a href="#" onclick="window.electronAPI.launchTool('${tool.website}'); return false;">
                        <i class="fas fa-external-link-alt"></i> Website
                    </a>
                </div>
            `;

            toolCard.innerHTML = `
                <div class="tool-header">
                    <img src="${tool.logo}" alt="${tool.name} logo" class="tool-logo">
                    <div class="tool-title">
                        <h3>${tool.name}</h3>
                    </div>
                    ${favoriteButton}
                </div>
                <div class="tool-category" data-category="${tool.category}">
                    <i class="fas ${this.getCategoryIcon(tool.category)}"></i> 
                    ${this.getCategoryName(tool.category)}
                </div>
                <div class="tool-actions">
                    ${actionButtons}
                </div>
                ${websiteLink}
                <div class="tool-location">
                    <i class="fas fa-folder"></i> ${tool.location.portable || tool.location.install}
                </div>
                <p>${tool.description}</p>
            `;
            toolsList.appendChild(toolCard);
        });

        // Füge nur den Footer hinzu, NICHT das Dropdown-Menü
        const footer = document.querySelector('.footer');
        footer.innerHTML = `
            <div class="social-links">
                <a href="#" onclick="window.electronAPI.launchTool('https://helpinformatik.de/'); return false;" title="Website">
                    <i class="fas fa-globe"></i>
                </a>
                <a href="#" onclick="window.electronAPI.launchTool('https://github.com/AlphaTG050'); return false;" title="GitHub">
                    <i class="fab fa-github"></i>
                </a>
                <a href="#" onclick="window.electronAPI.launchTool('https://www.instagram.com/helpit.informatik'); return false;" title="Instagram">
                    <i class="fab fa-instagram"></i>
                </a>
                <a href="mailto:guerkan.privat@gmail.com" title="E-Mail">
                    <i class="fas fa-envelope"></i>
                </a>
            </div>
            <p>© ${new Date().getFullYear()} HelpIT - Alle Rechte vorbehalten</p>
        `;
    }

    getCategoryIcon(category) {
        const icons = {
            website: 'fa-globe',
            scripts: 'fa-code',
            portable: 'fa-box'
        };
        return icons[category] || 'fa-tools';
    }

    getCategoryName(category) {
        const names = {
            website: 'Website',
            scripts: 'Skript',
            portable: 'Portable'
        };
        return names[category] || category;
    }

    getCategoryOptions() {
        return `
            <option value="" class="category-option">
                Alle Tools
            </option>
            <option value="website" class="category-option">
                Websites
            </option>
            <option value="scripts" class="category-option">
                Skripts
            </option>
            <option value="portable" class="category-option">
                Portable Apps
            </option>
        `;
    }

    setupWindowControls() {
        document.getElementById('minimizeBtn').addEventListener('click', () => {
            window.electronAPI.minimizeWindow();
        });

        document.getElementById('maximizeBtn').addEventListener('click', () => {
            window.electronAPI.maximizeWindow();
            this.updateMaximizeIcon();
        });

        document.getElementById('closeBtn').addEventListener('click', () => {
            window.electronAPI.closeWindow();
        });

        window.addEventListener('resize', () => this.updateMaximizeIcon());
    }

    updateMaximizeIcon() {
        const maximizeBtn = document.getElementById('maximizeBtn');
        const isMaximized = window.outerWidth === screen.availWidth && 
                           window.outerHeight === screen.availHeight;
        
        maximizeBtn.querySelector('i').className = isMaximized ? 
            'fas fa-window-restore' : 
            'fas fa-window-maximize';
    }

    showSettingsModal() {
        const modal = document.getElementById('settingsModal');
        modal.style.display = 'block';
        this.loadSettings();
    }

    hideSettingsModal() {
        document.getElementById('settingsModal').style.display = 'none';
    }

    loadSettings() {
        const defaultCategory = localStorage.getItem('defaultCategory') || '';
        const cardSize = localStorage.getItem('cardSize') || 'normal';
        const portablePath = localStorage.getItem('portablePath') || 'C:/PortableApps';
        const alwaysOnTop = localStorage.getItem('alwaysOnTop') === 'true';
        
        document.getElementById('defaultCategory').value = defaultCategory;
        document.getElementById('cardSize').value = cardSize;
        document.getElementById('portablePath').value = portablePath;
        document.getElementById('alwaysOnTop').checked = alwaysOnTop;
    }

    applyCardSize() {
        const size = localStorage.getItem('cardSize') || 'normal';
        const toolCards = document.querySelectorAll('.tool-card');
        
        toolCards.forEach(card => {
            card.classList.remove('compact', 'normal', 'large');
            card.classList.add(size);
        });
    }

    loadAlwaysOnTopSetting() {
        const alwaysOnTop = localStorage.getItem('alwaysOnTop') === 'true';
        document.getElementById('alwaysOnTop').checked = alwaysOnTop;
        window.electronAPI.setAlwaysOnTop(alwaysOnTop);
    }

    loadFavorites() {
        this.favorites = new Set(JSON.parse(localStorage.getItem('favorites') || '[]'));
    }

    saveFavorites() {
        localStorage.setItem('favorites', JSON.stringify([...this.favorites]));
    }

    toggleFavorite(toolId) {
        if (this.favorites.has(toolId)) {
            this.favorites.delete(toolId);
        } else {
            this.favorites.add(toolId);
        }
        this.saveFavorites();
        this.renderTools(this.currentFilteredTools);
    }

    showAboutModal() {
        const modal = document.getElementById('aboutModal');
        modal.style.display = 'block';
        this.loadSystemInfo();
    }

    hideAboutModal() {
        document.getElementById('aboutModal').style.display = 'none';
    }

    async loadSystemInfo() {
        const info = await window.electronAPI.getSystemInfo();
        document.getElementById('electronVersion').textContent = info.electron;
        document.getElementById('chromeVersion').textContent = info.chrome;
        document.getElementById('nodeVersion').textContent = info.node;
        document.getElementById('v8Version').textContent = info.v8;
        document.getElementById('osInfo').textContent = info.os;
        document.getElementById('platform').textContent = info.platform;
    }

    showBugReportModal() {
        const modal = document.getElementById('bugReportModal');
        modal.style.display = 'block';
    }

    hideBugReportModal() {
        document.getElementById('bugReportModal').style.display = 'none';
        document.getElementById('bugReportForm').reset();
    }

    async submitBugReport() {
        const type = document.getElementById('bugType').value;
        const title = document.getElementById('bugTitle').value;
        const description = document.getElementById('bugDescription').value;
        const steps = document.getElementById('bugSteps').value;
        const expected = document.getElementById('bugExpected').value;
        const actual = document.getElementById('bugActual').value;
        const includeSystemInfo = document.getElementById('includeSystemInfo').checked;
        
        let bodyParts = [];
        
        // Nur gefüllte Felder hinzufügen
        if (type) bodyParts.push(`Problemtyp: ${type}`);
        if (description) bodyParts.push(`Beschreibung:\n${description}`);
        if (steps) bodyParts.push(`Schritte zum Reproduzieren:\n${steps}`);
        if (expected) bodyParts.push(`Erwartetes Verhalten:\n${expected}`);
        if (actual) bodyParts.push(`Tatsächliches Verhalten:\n${actual}`);
        
        if (includeSystemInfo) {
            const info = await window.electronAPI.getSystemInfo();
            bodyParts.push(`System-Informationen:
- Electron: ${info.electron}
- Chrome: ${info.chrome}
- Node: ${info.node}
- V8: ${info.v8}
- Betriebssystem: ${info.os}
- Plattform: ${info.platform}`);
        }
        
        const body = bodyParts.join('\n\n');
        
        const mailtoLink = `mailto:guerkan.privat@gmail.com?subject=FixIT Bug Report: ${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
        window.electronAPI.launchTool(mailtoLink);
        
        this.hideBugReportModal();
    }
}

const toolManager = new ToolManager(); 