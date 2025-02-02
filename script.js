class ToolManager {
    constructor() {
        // Zuerst Tools und Favoriten laden
        this.initializeTools();
        this.loadFavorites();
        
        // Dann die aktuelle Ansicht initialisieren
        this.currentFilteredTools = this.tools;
        
        // Event Listener einrichten
        this.setupEventListeners();
        
        // Erst jetzt die Tools rendern
        this.renderTools(this.tools);
        
        // Rest der Initialisierung
        this.initTheme();
        this.setupWindowControls();
        this.loadAlwaysOnTopSetting();
        this.toolHistory = this.loadHistory();
        this.setupHistoryEventListeners();
        this.setupImageUpload();
    }

    setupEventListeners() {
        document.getElementById('searchInput').addEventListener('input', () => {
            this.filterTools();
        });
        
        const categoryFilter = document.getElementById('categoryFilter');
        categoryFilter.innerHTML = this.getCategoryOptions();
        categoryFilter.addEventListener('change', () => {
            this.filterTools();
        });
        
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

    setupHistoryEventListeners() {
        document.getElementById('historyBtn').addEventListener('click', () => {
            this.showHistoryModal();
        });
        document.getElementById('closeHistoryBtn').addEventListener('click', () => {
            this.hideHistoryModal();
        });
        document.getElementById('clearHistoryBtn').addEventListener('click', () => {
            this.clearHistory();
        });
    }

    clearHistory() {
        this.toolHistory = {};
        this.saveHistory();
        this.showHistoryModal();
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
            },
            {
                id: '21',
                name: 'GPU-Z',
                category: 'portable',
                location: {
                    portable: 'resources/executable/gpuz.exe',
                },
                website: 'https://www.techpowerup.com/gpuz/',
                description: 'Detaillierte Informationen über die GPU-Hardware',
                logo: 'https://www.techpowerup.com/favicon.ico'
            },
            {
                id: '22',
                name: 'CPU-Z',
                category: 'portable',
                location: {
                    portable: 'resources/executable/cpuz.exe',
                },
                website: 'https://www.cpuid.com/softwares/cpu-z.html',
                description: 'Detaillierte Informationen zur CPU, RAM und Mainboard',
                logo: 'https://www.cpuid.com/medias/images/softwares/cpu-z.svg'
            },   
            {
                id: '23',
                name: 'HWMonitor',
                category: 'portable',
                location: {
                    portable: 'resources/executable/hwmonitor.exe',
                },
                website: 'https://www.cpuid.com/softwares/hwmonitor.html',
                description: 'Überwachung von CPU-, GPU- und Festplattentemperaturen',
                logo: 'https://www.cpuid.com/medias/images/softwares/hwmonitor.svg'
            },  
            {
                id: '24',
                name: 'HeavyLoad',
                category: 'portable',
                location: {
                    portable: 'resources/executable/heavyload.exe',
                },
                website: 'https://www.jam-software.com/heavyload/',
                description: 'Stresstest-Tool für CPU, RAM, GPU und Festplatte',
                logo: 'https://www.jam-software.de/sites/default/files/2017-10/HeavyLoad.png'
            },
            {
                id: '25',
                name: 'BatteryInfoView',
                category: 'portable',
                location: {
                    portable: 'resources/executable/batteryinfoview.exe',
                },
                website: 'https://www.nirsoft.net/utils/battery_information_view.html',
                description: 'Detaillierte Informationen zum Laptop-Akku',
                logo: 'https://www.nirsoft.net/utils/batteryinfoview_icon.gif'
            },
            {
                id: '26',
                name: 'Core Temp',
                category: 'portable',
                location: {
                    portable: 'resources/executable/coretemp.exe',
                },
                website: 'https://www.alcpu.com/CoreTemp/',
                description: 'Überwachung der CPU-Temperaturen',
                logo: 'https://pics.computerbase.de/2/0/5/5/2/logo-256.png'
            },
            {
                id: '27',
                name: 'LastActivityView',
                category: 'portable',
                location: {
                    portable: 'resources/executable/lastactivityview.exe',
                },
                website: 'https://www.nirsoft.net/utils/computer_activity_view.html',
                description: 'Zeigt die letzten Aktivitäten auf einem Computer an',
                logo: 'assets/images/tools/lastactivityview.png'
            },
            {
                id: '28',
                name: 'Wireless Network Watcher',
                category: 'portable',
                location: {
                    portable: 'resources/executable/wnwatcher.exe',
                },
                website: 'https://www.nirsoft.net/utils/wireless_network_watcher.html',
                description: 'Zeigt alle Geräte, die mit einem WLAN-Netzwerk verbunden sind',
                logo: 'https://www.nirsoft.net/utils/wnetwatcher_icon.gif'
            },
            {
                id: '29',
                name: 'Advanced IP Scanner',
                category: 'portable',
                location: {
                    portable: 'resources/executable/advancedipscanner.exe',
                },
                website: 'https://www.advanced-ip-scanner.com/',
                description: 'Einfacher Netzwerkscanner für IP- und MAC-Adressen',
                logo: 'https://www.advanced-ip-scanner.com/favicon.ico'
            },
            {
                id: '30',
                name: 'System Information for Windows',
                category: 'portable',
                location: {
                    portable: 'resources/executable/siw64.exe',
                },
                website: 'https://www.gtopala.com/',
                description: 'Erweiterte Systeminformationen und Hardware-Analyse ',
                logo: 'https://www.gtopala.com/favicon.ico'
            },
            {
                id: '31',
                name: 'URLscan.io',
                category: 'website',
                location: {
                    portable: 'https://urlscan.io/',
                },
                website: 'https://urlscan.io/',
                description: 'Analysiert URLs auf Phishing, Malware und Tracking',
                logo: 'https://urlscan.io/favicon.ico'
            },
            {
                id: '32',
                name: 'Snapdrop',
                category: 'website',
                location: {
                    portable: 'https://snapdrop.net/',
                },
                website: 'https://snapdrop.net/',
                description: 'AirDrop-Alternative für schnelle Dateiübertragung im WLAN',
                logo: 'https://raw.githubusercontent.com/snapdrop/snapdrop/master/client/images/logo_transparent_512x512.png'
            },
            {
                id: '33',
                name: 'Send Anywhere',
                category: 'website',
                location: {
                    portable: 'https://send-anywhere.com/',
                },
                website: 'https://send-anywhere.com/',
                description: 'Plattformübergreifende Dateiübertragung mit direktem Link',
                logo: 'https://m.media-amazon.com/images/I/51wcsWQkfKL.png'
            },
            {
                id: '34',
                name: 'SwissTransfer',
                category: 'website',
                location: {
                    portable: 'https://www.swisstransfer.com/',
                },
                website: 'https://www.swisstransfer.com/',
                description: 'Sicherer und verschlüsselter Datei-Transfer mit hoher Geschwindigkeit',
                logo: 'https://www.swisstransfer.com/favicon.ico'
            },      
            {
                id: '35',
                name: 'Google Phishing Quiz',
                category: 'website',
                location: {
                    portable: 'https://phishingquiz.withgoogle.com/',
                },
                website: 'https://phishingquiz.withgoogle.com/',
                description: 'Interaktives Quiz zum Erkennen von Phishing-Versuchen',
                logo: 'https://cdn-icons-png.flaticon.com/512/9177/9177811.png'
            },
            {
                id: '36',
                name: 'Send Test Email',
                category: 'website',
                location: {
                    portable: 'https://sendtestemail.com/?act=send-test-email',
                },
                website: 'https://sendtestemail.com/?act=send-test-email',
                description: 'Versende Test-E-Mails zur Überprüfung von SMTP-Konfigurationen',
                logo: 'https://sendtestemail.com/favicon.ico'
            },
            {
                id: '37',
                name: 'Guerrilla Mail Tools',
                category: 'website',
                location: {
                    portable: 'https://www.guerrillamail.com/tools',
                },
                website: 'https://www.guerrillamail.com/tools',
                description: 'Werkzeuge für temporäre E-Mails und Anonymität im Netz',
                logo: 'https://www.guerrillamail.com/favicon.ico'
            },
            {
                id: '38',
                name: 'Müllmail',
                category: 'website',
                location: {
                    portable: 'https://muellmail.com/',
                },
                website: 'https://muellmail.com/',
                description: 'Erstellt temporäre E-Mail-Adressen zum Schutz vor Spam',
                logo: 'https://muellmail.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fnewmail-corner.ff3b98de.webp&w=256&q=75'
            },
            {
                id: '39',
                name: 'DNSChecker - All Tools',
                category: 'website',
                location: {
                    portable: 'https://dnschecker.org/all-tools.php',
                },
                website: 'https://dnschecker.org/all-tools.php',
                description: 'Sammlung von DNS- und Netzwerk-Tools zur Überprüfung von Domains, IPs und mehr',
                logo: 'assets/images/tools/dnschecker.png'
            },
            {
                id: '40',
                name: 'Eat This Much',
                category: 'website',
                location: {
                    portable: 'https://www.eatthismuch.com/',
                },
                website: 'https://www.eatthismuch.com/',
                description: 'Automatisierter Ernährungsplaner basierend auf Kalorien- und Makrozielen',
                logo: 'https://www.eatthismuch.com/favicon.ico'
            },
            {
                id: '41',
                name: 'Omni Calculator',
                category: 'website',
                location: {
                    portable: 'https://www.omnicalculator.com/',
                },
                website: 'https://www.omnicalculator.com/',
                description: 'Sammlung von über 3000 spezialisierten Online-Rechnern für alle Bereiche',
                logo: 'assets/images/tools/omnicalculator.png'
            },
            {
                id: '42',
                name: 'Date Night Movies',
                category: 'website',
                location: {
                    portable: 'https://datenightmovies.com/',
                },
                website: 'https://datenightmovies.com/',
                description: 'Empfiehlt Filme basierend auf den Vorlieben von zwei Personen',
                logo: 'https://datenightmovies.com/favicon.ico'
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

        // Filtere die Tools
        const filteredTools = this.tools.filter(tool => {
            const matchesSearch = tool.name.toLowerCase().includes(searchTerm) ||
                                tool.description.toLowerCase().includes(searchTerm);
            const matchesCategory = !categoryFilter || tool.category === categoryFilter;
            return matchesSearch && matchesCategory;
        });

        // Aktualisiere currentFilteredTools und rendere
        this.currentFilteredTools = filteredTools;
        this.renderTools(this.currentFilteredTools);
    }

    launchTool(location) {
        // Finde das Tool anhand der Location oder Website URL
        const tool = this.tools.find(t => 
            t.location.portable === location || 
            t.website === location
        );
        
        if (tool) {
            this.trackToolUsage(tool);
        }
        
        try {
            window.electronAPI.launchTool(location);
        } catch (error) {
            console.error('Fehler beim Starten des Tools:', error);
            alert('Das Tool konnte nicht gestartet werden.');
        }
    }

    renderTools(toolsToRender) {
        const toolsList = document.getElementById('toolsList');
        toolsList.innerHTML = '';

        if (!toolsToRender || toolsToRender.length === 0) {
            toolsList.innerHTML = '<div class="no-tools">Keine Tools gefunden</div>';
            return;
        }

        // Sortiere Tools (Favoriten zuerst)
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
                        onclick="event.stopPropagation(); toolManager.toggleFavorite('${tool.id}')">
                    <i class="fas fa-star"></i>
                </button>
            `;

            // Buttons basierend auf der Kategorie
            let actionButtons = '';
            switch(tool.category) {
                case 'website':
                    actionButtons = `
                        <button class="launch-btn" onclick="toolManager.launchTool('${tool.location.portable}')">
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
                    <a href="#" onclick="toolManager.launchTool('${tool.website}'); return false;">
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

        // Footer aktualisieren
        const footer = document.querySelector('.footer');
        footer.innerHTML = `
            <div class="social-links">
                <a href="#" onclick="window.electronAPI.launchTool('https://helpinformatik.de/'); return false;" title="Website">
                    <i class="fas fa-globe"></i>
                </a>
                <a href="#" onclick="window.electronAPI.launchTool('https://github.com/AlphaTG50'); return false;" title="GitHub">
                    <i class="fab fa-github"></i>
                </a>
                <a href="#" onclick="window.electronAPI.launchTool('https://www.instagram.com/helpit.informatik'); return false;" title="Instagram">
                    <i class="fab fa-instagram"></i>
                </a>
                <a href="mailto:guerkan.privat@gmail.com" title="E-Mail">
                    <i class="fas fa-envelope"></i>
                </a>
            </div>
            <div class="footer-bottom">
                <div class="footer-text">
                    <span class="tool-count">Anzahl der Tools: ${toolsToRender.length}</span>
                    <p>© 2024 HelpIT - Alle Rechte vorbehalten</p>
                </div>
            </div>
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
            <option value="">Alle Kategorien</option>
            <option value="website">Website</option>
            <option value="scripts">Skripts</option>
            <option value="portable">Portable</option>
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
        const savedFavorites = localStorage.getItem('favorites');
        this.favorites = new Set(savedFavorites ? JSON.parse(savedFavorites) : []);
    }

    saveFavorites() {
        localStorage.setItem('favorites', JSON.stringify([...this.favorites]));
    }

    toggleFavorite(toolId) {
        // Toggle Favorit-Status
        if (this.favorites.has(toolId)) {
            this.favorites.delete(toolId);
        } else {
            this.favorites.add(toolId);
        }

        // Speichern
        localStorage.setItem('favorites', JSON.stringify([...this.favorites]));

        // Aktuelle Ansicht neu rendern
        this.renderTools(this.currentFilteredTools);
    }

    showAboutModal() {
        const modal = document.getElementById('aboutModal');
        modal.style.display = 'block';
        this.loadSystemInfo();
        
        // Version über die electronAPI abrufen
        const version = window.electronAPI.getAppVersion();
        document.getElementById('appVersion').textContent = version;
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
        
        // Sammle alle Dateien
        const fileItems = document.querySelectorAll('.file-item');
        const files = Array.from(fileItems).map(item => ({
            name: item.querySelector('span').textContent,
            data: item.dataset.file
        }));

        if (files.length > 0) {
            try {
                const zipPath = await window.electronAPI.saveAndOpenZip(files);
                bodyParts.push(`\nAngehängte Dateien wurden als ZIP-Archiv gespeichert:\n${zipPath}`);
                this.showToast('Screenshots wurden als ZIP-Archiv gespeichert. Der Ordner wurde geöffnet.', 'info');
            } catch (error) {
                console.error('Fehler beim Erstellen des ZIP-Archivs:', error);
                this.showToast('Fehler beim Speichern der Dateien', 'error');
            }
        }
        
        const body = bodyParts.join('\n\n');
        
        const mailtoLink = `mailto:guerkan.privat@gmail.com?subject=FixIT Bug Report: ${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
        window.electronAPI.launchTool(mailtoLink);
        
        // Zurücksetzen des Upload-Bereichs
        const uploadArea = document.getElementById('imageUploadArea');
        const uploadPlaceholder = uploadArea.querySelector('.upload-placeholder');
        
        // Entferne alle file-items
        uploadArea.querySelectorAll('.file-item').forEach(item => item.remove());
        
        // Zeige den Placeholder wieder an
        uploadPlaceholder.style.display = 'flex';
        
        this.hideBugReportModal();
    }

    loadHistory() {
        return JSON.parse(localStorage.getItem('toolHistory') || '{}');
    }

    saveHistory() {
        localStorage.setItem('toolHistory', JSON.stringify(this.toolHistory));
    }

    trackToolUsage(tool) {
        const now = new Date();
        if (!this.toolHistory[tool.id]) {
            this.toolHistory[tool.id] = {
                name: tool.name,
                logo: tool.logo,
                count: 0,
                lastUsed: null
            };
        }
        
        this.toolHistory[tool.id].count++;
        this.toolHistory[tool.id].lastUsed = now.toISOString();
        this.saveHistory();
    }

    showHistoryModal() {
        const modal = document.getElementById('historyModal');
        const historyList = document.getElementById('historyList');
        
        // Sortiere nach letzter Nutzung
        const sortedHistory = Object.entries(this.toolHistory)
            .sort(([,a], [,b]) => new Date(b.lastUsed) - new Date(a.lastUsed));

        historyList.innerHTML = sortedHistory.map(([id, data]) => {
            const lastUsed = new Date(data.lastUsed).toLocaleString();
            return `
                <div class="history-item">
                    <div class="history-item-left">
                        <img src="${data.logo}" alt="${data.name}" class="history-item-icon">
                        <div class="history-item-details">
                            <div class="history-item-name">${data.name}</div>
                            <div class="history-item-meta">Zuletzt: ${lastUsed}</div>
                        </div>
                    </div>
                    <span class="history-item-count">${data.count}x</span>
                </div>
            `;
        }).join('');

        modal.style.display = 'block';
    }

    hideHistoryModal() {
        document.getElementById('historyModal').style.display = 'none';
    }

    setupImageUpload() {
        const uploadArea = document.getElementById('imageUploadArea');
        const fileInput = document.getElementById('bugImages');
        const imagePreview = document.getElementById('imagePreview');
        
        // Drag & Drop Events
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('drag-over');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            const files = e.dataTransfer.files;
            this.handleFiles(files);
        });
        
        // Normaler File Input
        fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });
    }

    showToast(message, type = 'error') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(toast);

        // Toast nach 3 Sekunden entfernen
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    handleFiles(files) {
        const uploadArea = document.getElementById('imageUploadArea');
        const uploadPlaceholder = uploadArea.querySelector('.upload-placeholder');
        
        Array.from(files).forEach(file => {
            if (!file.type.startsWith('image/')) {
                this.showToast('Nur Bilder im Format JPG oder PNG sind erlaubt.');
                return;
            }
            
            if (file.size > 5 * 1024 * 1024) {
                this.showToast('Die Datei ist zu groß. Maximale Größe ist 5MB.');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                const fileItem = document.createElement('div');
                fileItem.className = 'file-item';
                fileItem.dataset.file = e.target.result; // Speichere Base64-Daten
                fileItem.innerHTML = `
                    <i class="fas fa-image"></i>
                    <span title="${file.name}">${file.name}</span>
                    <button class="remove-file" title="Entfernen">
                        <i class="fas fa-times"></i>
                    </button>
                `;

                const removeBtn = fileItem.querySelector('.remove-file');
                removeBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    fileItem.remove();
                    
                    const hasFiles = uploadArea.querySelectorAll('.file-item').length > 0;
                    uploadPlaceholder.style.display = hasFiles ? 'none' : 'flex';
                });
                
                uploadArea.insertBefore(fileItem, uploadPlaceholder);
                uploadPlaceholder.style.display = 'none';
            };
            reader.readAsDataURL(file);
        });
    }
}

const toolManager = new ToolManager();