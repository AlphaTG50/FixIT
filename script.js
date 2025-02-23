class ToolManager {
    constructor() {
        // Loading Screen sofort anzeigen
        this.showLoadingScreen();
        
        // Lade gespeicherte Shortcuts
        this.shortcuts = this.loadShortcuts();
        
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
        
        this.selectedTags = new Set();
        this.initializeTagFilter();
        this.setupTagFilterEvents();
        
        // Verbesserte Suche mit Debounce
        let searchTimeout;
        document.getElementById('searchInput').addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => this.filterTools(), 300);
        });

        this.initializeSynonyms();
        this.setupSidebarEvents();
        this.setupScrollToTop();
        this.setupSearchAutocomplete();
        this.updateVersionBadge();

        // Loading Screen ausblenden nach Initialisierung
        this.hideLoadingScreen();

        this.loadBlueLightFilterSettings();
        
        // Initialisiere die Shortcut-Anzeige
        this.updateAllShortcutDisplays();
        this.setupShortcuts();
        this.setupEasterEggs();
    }

    initializeSynonyms() {
        this.synonyms = {
            // Netzwerk-bezogen
            'netzwerk': ['network', 'lan', 'wlan', 'wifi', 'verbindung', 'internet'],
            'wifi': ['wlan', 'wireless', 'funk', 'netzwerk'],
            
            // System & Hardware
            'system': ['windows', 'betriebssystem', 'os', 'computer'],
            'hardware': ['komponenten', 'gerät', 'geräte', 'ausstattung'],
            'cpu': ['prozessor', 'processor', 'rechner'],
            'gpu': ['grafikkarte', 'graphics', 'grafik'],
            'festplatte': ['hdd', 'ssd', 'speicher', 'storage', 'laufwerk'],
            
            // Sicherheit
            'sicherheit': ['security', 'schutz', 'protection', 'antivirus'],
            'virus': ['malware', 'schadsoftware', 'trojaner', 'spyware'],
            'firewall': ['brandmauer', 'schutzwall'],
            
            // Diagnose & Analyse
            'diagnose': ['analyse', 'test', 'prüfung', 'check'],
            'monitoring': ['überwachung', 'beobachtung', 'kontrolle'],
            'leistung': ['performance', 'geschwindigkeit', 'speed'],
            
            // Dateien & Ordner
            'datei': ['file', 'dokument', 'document'],
            'ordner': ['folder', 'verzeichnis', 'directory'],
            
            // Tools & Programme
            'software': ['programm', 'anwendung', 'app', 'tool'],
            'tool': ['werkzeug', 'hilfsmittel', 'utility'],
            
            // Email & Kommunikation
            'email': ['mail', 'e-mail', 'post'],
            'kommunikation': ['chat', 'messaging', 'nachricht'],
            
            // Reinigung & Optimierung
            'reinigung': ['cleaner', 'säuberung', 'bereinigung', 'cleanup'],
            'optimierung': ['tuning', 'verbesserung', 'optimization'],
            
            // Verschiedenes
            'backup': ['sicherung', 'kopie', 'reserve'],
            'update': ['aktualisierung', 'upgrade', 'patch'],
            'treiber': ['driver', 'gerätetreiber'],
            'remote': ['fern', 'entfernt', 'remote-zugriff']
        };

        // Reverse-Mapping für bessere Suche
        this.searchTerms = new Map();
        
        for (const [main, synonymsList] of Object.entries(this.synonyms)) {
            // Hauptbegriff zu sich selbst mappen
            this.searchTerms.set(main, main);
            
            // Synonyme zum Hauptbegriff mappen
            for (const synonym of synonymsList) {
                this.searchTerms.set(synonym.toLowerCase(), main);
            }
        }
    }

    setupEventListeners() {
        document.getElementById('searchInput').addEventListener('input', () => {
            this.filterTools();
        });
        
        // Globaler ESC-Handler für alle Modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                // Finde das zuletzt geöffnete Modal
                const openModals = [
                    { id: 'easterEggsModal', hide: () => this.hideEasterEggsModal() },
                    { id: 'shortcutsModal', hide: () => this.hideShortcutsModal() },
                    { id: 'historyModal', hide: () => this.hideHistoryModal() },
                    { id: 'bugReportModal', hide: () => this.hideBugReportModal() },
                    { id: 'aboutModal', hide: () => this.hideAboutModal() },
                    { id: 'settingsModal', hide: () => this.hideSettingsModal() }
                ].filter(modal => 
                    document.getElementById(modal.id).style.display === 'block'
                );
                
                // Schließe nur das oberste Modal
                if (openModals.length > 0) {
                    openModals[0].hide();
                }
            }
        });
        
        document.getElementById('darkModeToggle').addEventListener('change', (e) => {
            const isDarkMode = e.target.checked;
            this.setTheme(isDarkMode ? 'dark' : 'light');
            localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
        });
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
        
        // Favoriten löschen
        document.getElementById('clearFavoritesBtn').addEventListener('click', () => {
            this.showConfirmDialog(
                'Favoriten löschen',
                'Möchtest du wirklich alle Favoriten löschen? Diese Aktion kann nicht rückgängig gemacht werden.',
                () => {
                    localStorage.removeItem('favorites');
                    this.favorites = new Set();
                    this.renderTools(this.currentFilteredTools);
                    
                    // Bestätigung anzeigen
                    const confirmMessage = document.createElement('div');
                    confirmMessage.className = 'shortcut-confirm';
                    confirmMessage.innerHTML = '<i class="fas fa-check"></i> Alle Favoriten wurden gelöscht';
                    document.querySelector('.modal-content').appendChild(confirmMessage);
                    
                    setTimeout(() => {
                        confirmMessage.remove();
                    }, 2000);
                }
            );
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
                tags: ['suche', 'dateien', 'windows'],
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
                tags: ['system', 'hardware', 'diagnose'],
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
                tags: ['system', 'reinigung', 'software'],
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
                tags: ['hardware', 'monitoring', 'system'],
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
                tags: ['ki', 'chat', 'hilfe'],
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
                tags: ['virtualisierung', 'windows', 'linux'],
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
                tags: ['sicherheit', 'malware', 'scan'],
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
                tags: ['speicher', 'analyse', 'dateien'],
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
                tags: ['passwort', 'sicherheit', 'generator'],
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
                tags: ['farben', 'design', 'konverter'],
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
                tags: ['docker', 'container', 'entwicklung'],
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
                tags: ['regex', 'entwicklung', 'text'],
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
                tags: ['privacy', 'browser', 'sicherheit'],
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
                tags: ['speicher', 'raid', 'server'],
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
                tags: ['gaming', 'hardware', 'kompatibilität'],
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
                tags: ['passwort', 'hash', 'sicherheit'],
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
                tags: ['username', 'social', 'verfügbarkeit'],
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
                tags: ['hardware', 'pc-bau', 'kompatibilität'],
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
                tags: ['status', 'dienste', 'monitoring'],
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
                tags: ['grafikkarte', 'hardware', 'monitoring'],
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
                tags: ['prozessor', 'hardware', 'monitoring'],
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
                tags: ['hardware', 'temperatur', 'monitoring'],
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
                tags: ['stresstest', 'hardware', 'leistung'],
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
                tags: ['akku', 'hardware', 'diagnose'],
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
                tags: ['temperatur', 'cpu', 'monitoring'],
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
                tags: ['system', 'aktivität', 'protokoll'],
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
                tags: ['netzwerk', 'wlan', 'monitoring'],
                location: {
                    portable: 'resources/executable/wnetwatcher.exe',
                },
                website: 'https://www.nirsoft.net/utils/wireless_network_watcher.html',
                description: 'Zeigt alle Geräte, die mit einem WLAN-Netzwerk verbunden sind',
                logo: 'https://www.nirsoft.net/utils/wnetwatcher_icon.gif'
            },
            {
                id: '29',
                name: 'Advanced IP Scanner',
                category: 'portable',
                tags: ['netzwerk', 'scan', 'ip'],
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
                tags: ['system', 'hardware', 'diagnose'],
                location: {
                    portable: 'resources/executable/siw.exe',
                },
                website: 'https://www.gtopala.com/',
                description: 'Erweiterte Systeminformationen und Hardware-Analyse ',
                logo: 'https://www.gtopala.com/favicon.ico'
            },
            {
                id: '31',
                name: 'URLscan.io',
                category: 'website',
                tags: ['sicherheit', 'url', 'analyse'],
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
                tags: ['dateitransfer', 'wlan', 'sharing'],
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
                tags: ['dateitransfer', 'sharing', 'cloud'],
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
                tags: ['dateitransfer', 'sicherheit', 'cloud'],
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
                tags: ['sicherheit', 'phishing', 'training'],
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
                tags: ['email', 'test', 'diagnose'],
                location: {
                    portable: 'https://www.sendtestmail.com/',
                },
                website: 'https://www.sendtestmail.com/',
                description: 'Versende Test-E-Mails zur Überprüfung von SMTP-Konfigurationen',
                logo: 'https://cdn-icons-png.flaticon.com/512/12440/12440463.png'
            },
            {
                id: '37',
                name: 'Guerrilla Mail Tools',
                category: 'website',
                tags: ['email', 'temporär', 'privatsphäre'],
                location: {
                    portable: 'https://www.guerrillamail.com/',
                },
                website: 'https://www.guerrillamail.com/',
                description: 'Werkzeuge für temporäre E-Mails und Anonymität im Netz',
                logo: 'https://www.guerrillamail.com/favicon.ico'
            },
            {
                id: '38',
                name: 'Müllmail',
                category: 'website',
                tags: ['email', 'temporär', 'privatsphäre'],
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
                tags: ['netzwerk', 'dns', 'diagnose'],
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
                tags: ['ernährung', 'planung', 'gesundheit'],
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
                tags: ['rechner', 'konverter', 'tools'],
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
                tags: ['filme', 'unterhaltung', 'empfehlungen'],
                location: {
                    portable: 'https://datenightmovies.com/',
                },
                website: 'https://datenightmovies.com/',
                description: 'Empfiehlt Filme basierend auf den Vorlieben von zwei Personen',
                logo: 'https://datenightmovies.com/favicon.ico'
            },
            {
                id: '43',
                name: 'Wireshark',
                category: 'portable',
                tags: ['netzwerk', 'analyse', 'monitoring'],
                location: {
                    portable: 'resources/executable/wireshark.exe'
                },
                website: 'https://www.wireshark.org/',
                description: 'Ein Open-Source-Netzwerkprotokoll-Analysator zur Überwachung und Analyse von Netzwerkverkehr.',
                logo: 'https://i.imgur.com/V6FWrVG.png'
            },
            {
                id: '44',
                name: 'UniGetUI',
                category: 'portable',
                tags: ['paketmanager', 'software', 'installation'],
                location: {
                    portable: 'resources/executable/unigetui.exe'
                },
                website: 'https://github.com/goldenrithe/UniGetUI',
                description: 'Ein moderner Paketmanager für Windows mit Unterstützung für Chocolatey, Scoop und WinGet.',
                logo: 'https://store-images.s-microsoft.com/image/apps.24154.13516705259293103.17a2615c-0b9b-4b1b-ac77-f7377924d858.f82c2401-fef7-4d77-b4bd-188130de33fe?h=210'
            },
            {
                id: '45',
                name: 'Attribute Changer',
                category: 'portable',
                tags: ['dateien', 'attribute', 'system'],
                location: {
                    portable: 'resources/executable/attributechanger.exe'
                },
                website: 'https://www.petges.lu/home/',
                description: 'Ein Windows-Tool zum Ändern von Datei- und Ordnerattributen, Zeitstempeln und weiteren Eigenschaften.',
                logo: 'https://imgur.com/HkrIZ18.png'
            },
            {
                id: '46',
                name: 'Enigma Virtual Box',
                category: 'portable',
                tags: ['virtualisierung', 'software', 'portabilität'],
                location: {
                    portable: 'resources/executable/engimavb.exe'
                },
                website: 'https://enigmaprotector.com/en/aboutvb.html',
                description: 'Ein Tool zur Virtualisierung von Anwendungen, das alle Dateien in einer einzigen ausführbaren Datei bündelt.',
                logo: 'https://imgur.com/vkRgmTY.png'
            },
            {
                id: '47',
                name: 'Imgur Upload',
                category: 'website',
                tags: ['bilder', 'upload', 'sharing'],
                location: {
                    portable: 'https://imgur.com/upload'
                },
                website: 'https://imgur.com/upload',
                description: 'Ein einfacher und schneller Bild-Upload-Dienst für das Teilen von Bildern online.',
                logo: 'https://imgur.com/favicon.ico'
            },
            {
                id: '48',
                name: 'Microsoft Activation',
                category: 'scripts',
                tags: ['windows', 'aktivierung', 'lizenz'],
                location: {
                    portable: 'resources/executable/microsoft-activation.ps1'
                },
                website: 'https://github.com/massgravel/Microsoft-Activation-Scripts',
                description: 'Aktiviert Microsoft Windows und Office Produkte mit digitaler Lizenz.',
                logo: 'https://avatars.githubusercontent.com/u/59795046?v=4'
            },
        ];
    }

    initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);
        document.getElementById('darkModeToggle').checked = savedTheme === 'dark';
        
        const titleText = document.querySelector('.white-text');
        titleText.classList.toggle('dark-mode', savedTheme === 'dark');
        titleText.classList.toggle('light-mode', savedTheme === 'light');
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
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
        const activeCategory = document.querySelector('.nav-item.active').dataset.category;
        
        const filteredTools = this.tools.filter(tool => {
            // Prüfe zuerst die Kategorie
            if (activeCategory !== 'all' && tool.category !== activeCategory) {
                return false;
            }

            // Dann prüfe die Suche
            const matchesSearch = this.matchesSearchTerm(tool, searchTerm);
            const matchesTags = this.selectedTags.size === 0 || 
                (tool.tags && Array.from(this.selectedTags).every(tag => tool.tags.includes(tag)));

            return matchesSearch && matchesTags;
        });

        this.currentFilteredTools = filteredTools;
        this.renderTools(this.currentFilteredTools);
        
        const toolCounter = document.getElementById('toolCounter');
        if (toolCounter) {
            toolCounter.textContent = `${filteredTools.length} Tools gefunden`;
        }
    }

    matchesSearchTerm(tool, searchTerm) {
        if (!searchTerm) return true;
        
        // Suche nur im Tool-Namen
        return tool.name.toLowerCase().includes(searchTerm.toLowerCase());
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
            // Wenn es eine URL oder mailto ist, direkt öffnen
            if (location.startsWith('http') || location.startsWith('mailto:')) {
                window.electronAPI.launchTool(location);
            } 
            // Wenn es ein lokales Tool ist
            else {
                window.electronAPI.launchTool(location);
            }
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

        // Aktuelle Kategorie berücksichtigen
        const activeCategory = document.querySelector('.nav-item.active').dataset.category;
        const filteredTools = activeCategory === 'all' 
            ? toolsToRender 
            : toolsToRender.filter(tool => tool.category === activeCategory);

        // Sortiere Tools (Favoriten zuerst)
        const sortedTools = [...filteredTools].sort((a, b) => {
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

            let toolTags = '';
            if (tool.tags && tool.tags.length > 0) {
                toolTags = `<div class="tool-tags">`;
                tool.tags.forEach(tag => {
                    // Bestimme den Tag-Typ für das Styling
                    let tagType = this.getTagType(tag);
                    toolTags += `
                        <span class="tool-tag" 
                              data-type="${tagType}" 
                              onclick="toolManager.filterByTag('${tag}')"
                              title="Nach '${tag}' filtern">
                            ${tag}
                        </span>`;
                });
                toolTags += `</div>`;
            }

            const locationHtml = tool.category === 'website' 
                ? `
                    <div class="tool-location" onclick="toolManager.launchTool('${tool.location.portable}')">
                        <i class="fas fa-link"></i> ${tool.location.portable}
                    </div>
                ` 
                : tool.location.portable.startsWith('http') 
                    ? `
                        <div class="tool-location" onclick="toolManager.launchTool('${tool.location.portable}')">
                            <i class="fas fa-link"></i> ${tool.location.portable}
                        </div>
                    `
                    : `
                        <div class="tool-location">
                            <i class="fas fa-folder"></i> ${tool.location.portable}
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
                ${activeCategory === 'all' ? `
                    <div class="tool-category" data-category="${tool.category}">
                        <i class="fas ${this.getCategoryIcon(tool.category)}"></i> 
                        ${this.getCategoryName(tool.category)}
                    </div>
                ` : ''}
                <div class="tool-actions">
                    ${actionButtons}
                </div>
                ${websiteLink}
                ${toolTags}
                ${locationHtml}
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
                    <span class="tool-count">Anzahl der Tools: ${sortedTools.length}</span>
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

    getAllTags() {
        const tagsSet = new Set();
        this.tools.forEach(tool => {
            if (tool.tags) {
                tool.tags.forEach(tag => tagsSet.add(tag));
            }
        });
        return Array.from(tagsSet).sort();
    }

    initializeTagFilter() {
        this.updateTagList();
    }

    getAllTagsWithCount() {
        const tagCount = {};
        const activeCategory = document.querySelector('.nav-item.active').dataset.category;
        
        this.tools.forEach(tool => {
            // Prüfe zuerst, ob das Tool zur aktiven Kategorie gehört
            if (activeCategory === 'all' || tool.category === activeCategory) {
                if (tool.tags) {
                    tool.tags.forEach(tag => {
                        tagCount[tag] = (tagCount[tag] || 0) + 1;
                    });
                }
            }
        });

        // Konvertiere zu Array und sortiere
        const tagArray = Object.entries(tagCount)
            .map(([tag, count]) => ({
                tag,
                count,
                isSelected: this.selectedTags.has(tag)
            }));

        // Sortiere: Ausgewählte Tags zuerst, dann nach Häufigkeit
        return tagArray.sort((a, b) => {
            if (a.isSelected !== b.isSelected) {
                return a.isSelected ? -1 : 1;
            }
            return b.count - a.count;
        });
    }

    setupTagFilterEvents() {
        const tagFilterBtn = document.getElementById('tagFilterBtn');
        const tagDropdown = document.querySelector('.tag-dropdown');
        const tagSearch = document.querySelector('.tag-search input');
        const clearTagsBtn = document.querySelector('.clear-tags');

        // Tag Filter Button
        tagFilterBtn.addEventListener('click', () => {
            tagDropdown.classList.toggle('active');
        });

        // Schließen wenn außerhalb geklickt wird, aber nicht bei Klicks innerhalb des Dropdowns
        document.addEventListener('click', (e) => {
            // Prüfe ob der Klick außerhalb des Tag-Filters und Dropdowns war
            const isOutsideClick = !e.target.closest('.tag-filter-container') && 
                                 !e.target.closest('.tag-dropdown') &&
                                 !e.target.closest('.tag-item');
            
            if (isOutsideClick) {
                tagDropdown.classList.remove('active');
            }
        });

        // Tag Suche
        tagSearch.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const tagItems = document.querySelectorAll('.tag-item');
            tagItems.forEach(item => {
                const tag = item.textContent.toLowerCase();
                item.style.display = tag.includes(searchTerm) ? 'flex' : 'none';
            });
        });

        // Tags zurücksetzen
        clearTagsBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Verhindert das Schließen des Dropdowns
            this.selectedTags.clear();
            this.updateTagList();
            this.updateSelectedTags();
            this.filterTools();
        });
    }

    updateSelectedTags() {
        const selectedTagsContainer = document.querySelector('.selected-tags');
        const selectedCount = document.querySelector('.selected-count');
        
        // Update selected tags display
        selectedTagsContainer.innerHTML = Array.from(this.selectedTags).map(tag => `
            <div class="selected-tag">
                <span>${tag}</span>
                <button onclick="toolManager.removeTag('${tag}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');

        // Update count badge
        if (this.selectedTags.size > 0) {
            selectedCount.textContent = this.selectedTags.size;
            selectedCount.classList.add('active');
        } else {
            selectedCount.classList.remove('active');
        }
    }

    removeTag(tag) {
        this.selectedTags.delete(tag);
        this.updateTagList();
        this.updateSelectedTags();
        this.filterTools();
    }

    filterByTag(tag) {
        // Füge den Tag zu den ausgewählten Tags hinzu
        this.selectedTags.add(tag);
        
        // Aktualisiere die Tag-Anzeige und die gefilterten Tools
        this.updateTagList();
        this.updateSelectedTags();
        this.filterTools();
        
        // Optional: Scrolle nach oben, damit der Benutzer die gefilterten Ergebnisse sieht
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    getTagType(tag) {
        const hardwareTags = ['hardware', 'cpu', 'gpu', 'grafikkarte', 'prozessor', 'akku', 'temperatur'];
        const softwareTags = ['software', 'entwicklung', 'installation', 'portabilität', 'tools'];
        const securityTags = ['sicherheit', 'privacy', 'malware', 'phishing', 'scan'];
        const networkTags = ['netzwerk', 'wlan', 'ip', 'dns'];
        const systemTags = ['system', 'monitoring', 'diagnose', 'analyse'];

        if (hardwareTags.includes(tag)) return 'hardware';
        if (softwareTags.includes(tag)) return 'software';
        if (securityTags.includes(tag)) return 'security';
        if (networkTags.includes(tag)) return 'network';
        if (systemTags.includes(tag)) return 'system';
        return 'default';
    }

    updateTagList() {
        const tagList = document.querySelector('.tag-list');
        const tags = this.getAllTagsWithCount();
        
        tagList.innerHTML = tags.map(({tag, count, isSelected}) => `
            <div class="tag-item ${isSelected ? 'selected' : ''}" data-tag="${tag}">
                <span>${tag}</span>
                <span class="tag-count">${count}</span>
            </div>
        `).join('');

        // Event-Listener neu hinzufügen
        const tagItems = document.querySelectorAll('.tag-item');
        tagItems.forEach(item => {
            item.addEventListener('click', () => {
                const tag = item.dataset.tag;
                if (this.selectedTags.has(tag)) {
                    this.selectedTags.delete(tag);
                    item.classList.remove('selected');
                } else {
                    this.selectedTags.add(tag);
                    item.classList.add('selected');
                }
                this.updateSelectedTags();
                this.updateTagList(); // Liste neu sortieren
                this.filterTools();
            });
        });
    }

    setupSidebarEvents() {
        const sidebarItems = document.querySelectorAll('.nav-item');
        const searchInput = document.getElementById('searchInput');
        
        sidebarItems.forEach(item => {
            item.addEventListener('click', () => {
                // Aktiven Status aktualisieren
                sidebarItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                
                // Suchfeld und Tags zurücksetzen
                searchInput.value = '';
                this.selectedTags.clear();
                
                // Tag-Liste aktualisieren und neu rendern
                this.updateTagList();
                this.updateSelectedTags();
                
                // Tools filtern
                const category = item.dataset.category;
                if (category === 'all') {
                    this.filterTools();
                } else {
                    const filteredTools = this.tools.filter(tool => tool.category === category);
                    this.renderTools(filteredTools);
                }
            });
        });
    }

    setupScrollToTop() {
        const scrollBtn = document.querySelector('.scroll-to-top');
        const container = document.querySelector('.container');
        
        container.addEventListener('scroll', () => {
            const scrolled = container.scrollTop;
            if (scrolled > 300) {
                scrollBtn.classList.add('visible');
            } else {
                scrollBtn.classList.remove('visible');
            }
        });
        
        scrollBtn.addEventListener('click', () => {
            container.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    setupSearchAutocomplete() {
        const searchInput = document.getElementById('searchInput');
        const container = document.querySelector('.search-input-wrapper');
        
        const dropdown = document.createElement('div');
        dropdown.className = 'search-autocomplete';
        container.appendChild(dropdown);
        
        let selectedIndex = -1;
        
        searchInput.addEventListener('input', (e) => {
            const value = e.target.value.toLowerCase().trim();
            selectedIndex = -1; // Reset selection bei neuer Eingabe
            
            if (!value) {
                dropdown.style.display = 'none';
                return;
            }

            const activeCategory = document.querySelector('.nav-item.active').dataset.category;
            const categoryTools = activeCategory === 'all' 
                ? this.tools 
                : this.tools.filter(tool => tool.category === activeCategory);

            const suggestions = categoryTools
                .map(tool => {
                    const name = tool.name;
                    let score = 0;
                    
                    if (name.toLowerCase().startsWith(value)) {
                        score += 100;
                    }
                    
                    const words = name.toLowerCase().split(' ');
                    if (words.some(word => word.startsWith(value))) {
                        score += 75;
                    }
                    
                    if (name.toLowerCase().includes(value)) {
                        score += 50;
                    }
                    
                    return { name, score };
                })
                .filter(item => item.score > 0)
                .sort((a, b) => b.score - a.score)
                .slice(0, 5);

            if (suggestions.length > 0) {
                dropdown.innerHTML = suggestions
                    .map(item => `<div class="autocomplete-item">${item.name}</div>`)
                    .join('');
                dropdown.style.display = 'block';

                // Event-Listener für Klicks
                dropdown.querySelectorAll('.autocomplete-item').forEach((item, index) => {
                    item.addEventListener('click', () => {
                        searchInput.value = item.textContent;
                        dropdown.style.display = 'none';
                        this.filterTools();
                    });
                });
            } else {
                dropdown.style.display = 'none';
            }
        });

        // Tastaturnavigation
        searchInput.addEventListener('keydown', (e) => {
            const items = dropdown.querySelectorAll('.autocomplete-item');
            
            if (dropdown.style.display === 'block') {
                switch(e.key) {
                    case 'ArrowDown':
                        e.preventDefault();
                        selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
                        updateSelection();
                        break;
                        
                    case 'ArrowUp':
                        e.preventDefault();
                        selectedIndex = Math.max(selectedIndex - 1, -1);
                        updateSelection();
                        break;
                        
                    case 'Enter':
                        e.preventDefault();
                        if (selectedIndex >= 0) {
                            searchInput.value = items[selectedIndex].textContent;
                            dropdown.style.display = 'none';
                            this.filterTools();
                        }
                        break;
                        
                    case 'Escape':
                        dropdown.style.display = 'none';
                        selectedIndex = -1;
                        break;
                        
                    case 'Tab':
                        if (dropdown.style.display === 'block') {
                            e.preventDefault();
                            if (items.length > 0) {
                                searchInput.value = items[0].textContent;
                                dropdown.style.display = 'none';
                                this.filterTools();
                            }
                        }
                        break;
                }
            }
        });

        // Hilfsfunktion zum Aktualisieren der Auswahl
        const updateSelection = () => {
            const items = dropdown.querySelectorAll('.autocomplete-item');
            items.forEach((item, index) => {
                if (index === selectedIndex) {
                    item.classList.add('selected');
                    item.scrollIntoView({ block: 'nearest' });
                } else {
                    item.classList.remove('selected');
                }
            });
        };

        // Klick außerhalb schließt Dropdown
        document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) {
                dropdown.style.display = 'none';
                selectedIndex = -1;
            }
        });
    }

    showLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        loadingScreen.style.display = 'flex';
        loadingScreen.style.opacity = '1';
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        loadingScreen.classList.add('fade-out');
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }

    updateVersionBadge() {
        const version = window.electronAPI.getAppVersion();
        const versionBadge = document.querySelector('.version-badge');
        if (versionBadge) {
            versionBadge.textContent = `FixIT v${version}`;
        }
    }

    loadBlueLightFilterSettings() {
        const enabled = localStorage.getItem('blueLightFilter') === 'true';
        
        const checkbox = document.getElementById('blueLightFilter');
        
        checkbox.checked = enabled;
        
        if (enabled) {
            document.body.classList.add('blue-light-filter');
            document.documentElement.style.setProperty('--blue-light-filter-strength', '0.5');
        }
        
        // Event Listener für Checkbox
        checkbox.addEventListener('change', (e) => {
            const isEnabled = e.target.checked;
            localStorage.setItem('blueLightFilter', isEnabled);
            
            if (isEnabled) {
                document.body.classList.add('blue-light-filter');
                document.documentElement.style.setProperty('--blue-light-filter-strength', '0.5');
            } else {
                document.body.classList.remove('blue-light-filter');
            }
        });
    }

    loadShortcuts() {
        const defaultShortcuts = {
            settings: { key: ',', modifiers: ['ctrl'] },
            search: { key: 'f', modifiers: ['ctrl'] },
            darkMode: { key: 'd', modifiers: ['ctrl'] },
            allTools: { key: '1', modifiers: ['alt'] },
            websites: { key: '2', modifiers: ['alt'] },
            portable: { key: '3', modifiers: ['alt'] },
            scripts: { key: '4', modifiers: ['alt'] }
        };
        
        const savedShortcuts = localStorage.getItem('shortcuts');
        // Wenn keine gespeicherten Shortcuts existieren, speichere die Defaults
        if (!savedShortcuts) {
            localStorage.setItem('shortcuts', JSON.stringify(defaultShortcuts));
            return defaultShortcuts;
        }
        
        try {
            // Versuche die gespeicherten Shortcuts zu parsen
            const parsed = JSON.parse(savedShortcuts);
            // Stelle sicher, dass alle erforderlichen Shortcuts vorhanden sind
            return { ...defaultShortcuts, ...parsed };
        } catch (e) {
            // Bei Fehler verwende die Defaults
            console.error('Fehler beim Laden der Shortcuts:', e);
            return defaultShortcuts;
        }
    }

    saveShortcuts() {
        localStorage.setItem('shortcuts', JSON.stringify(this.shortcuts));
        // Aktualisiere die Anzeige nach dem Speichern
        this.updateAllShortcutDisplays();
    }

    setupShortcuts() {
        // Modal Steuerung
        document.getElementById('shortcutsBtn').addEventListener('click', () => {
            this.showShortcutsModal();
        });
        
        document.getElementById('closeShortcutsBtn').addEventListener('click', () => {
            this.hideShortcutsModal();
        });

        // Reset Button
        document.getElementById('resetShortcutsBtn').addEventListener('click', () => {
            this.resetShortcuts();
        });

        // Shortcut Items klickbar machen
        document.querySelectorAll('.shortcut-item').forEach(item => {
            item.addEventListener('click', () => this.editShortcut(item));
        });
        
        // Globale Shortcuts
        document.addEventListener('keydown', (e) => {
            if (this.isEditingShortcut) return;

            // Einstellungen öffnen
            if (this.matchesShortcut(e, this.shortcuts.settings)) {
                e.preventDefault();
                this.showSettingsModal();
            }
            
            // Suche fokussieren
            if (this.matchesShortcut(e, this.shortcuts.search)) {
                e.preventDefault();
                document.getElementById('searchInput').focus();
            }
            
            // Navigation
            if (this.matchesShortcut(e, this.shortcuts.allTools)) {
                e.preventDefault();
                document.querySelector('.nav-item[data-category="all"]').click();
            }
            if (this.matchesShortcut(e, this.shortcuts.websites)) {
                e.preventDefault();
                document.querySelector('.nav-item[data-category="website"]').click();
            }
            if (this.matchesShortcut(e, this.shortcuts.portable)) {
                e.preventDefault();
                document.querySelector('.nav-item[data-category="portable"]').click();
            }
            if (this.matchesShortcut(e, this.shortcuts.scripts)) {
                e.preventDefault();
                document.querySelector('.nav-item[data-category="scripts"]').click();
            }
            
            // Dark Mode umschalten
            if (this.matchesShortcut(e, this.shortcuts.darkMode)) {
                e.preventDefault();
                const darkModeToggle = document.getElementById('darkModeToggle');
                darkModeToggle.checked = !darkModeToggle.checked;
                this.setTheme(darkModeToggle.checked ? 'dark' : 'light');
                localStorage.setItem('theme', darkModeToggle.checked ? 'dark' : 'light');
            }
        });
    }

    matchesShortcut(event, shortcut) {
        const modifiersMatch = shortcut.modifiers.every(mod => {
            if (mod === 'ctrl') return event.ctrlKey;
            if (mod === 'alt') return event.altKey;
            if (mod === 'shift') return event.shiftKey;
            return false;
        });
        
        return modifiersMatch && event.key.toLowerCase() === shortcut.key.toLowerCase();
    }

    editShortcut(item) {
        if (this.isEditingShortcut) return;
        
        this.isEditingShortcut = true;
        item.classList.add('editing');
        const keysElement = item.querySelector('.shortcut-keys[data-shortcut]');
        if (!keysElement) return;
        
        const originalText = keysElement.innerHTML;
        keysElement.innerHTML = 'Drücke eine Tastenkombination...';
        keysElement.classList.add('editing');

        const handleKeyDown = (e) => {
            e.preventDefault();
            
            const modifiers = [];
            if (e.ctrlKey) modifiers.push('ctrl');
            if (e.altKey) modifiers.push('alt');
            if (e.shiftKey) modifiers.push('shift');
            
            // Ignoriere reine Modifier-Tasten
            if (['Control', 'Alt', 'Shift'].includes(e.key)) return;
            
            const shortcutId = keysElement.getAttribute('data-shortcut');
            if (!shortcutId || !this.shortcuts[shortcutId]) return;
            
            // Prüfe auf Duplikate
            const newShortcut = {
                key: e.key,
                modifiers: modifiers
            };
            
            const duplicate = this.findDuplicateShortcut(newShortcut, shortcutId);
            if (duplicate) {
                this.showShortcutError(`Dieser Shortcut wird bereits für "${duplicate}" verwendet`);
                
                // Setze den ursprünglichen Zustand zurück
                item.classList.remove('editing');
                keysElement.classList.remove('editing');
                this.updateShortcutDisplay(item, this.shortcuts[shortcutId]);
                this.isEditingShortcut = false;
                document.removeEventListener('keydown', handleKeyDown);
                return;
            }
            
            this.shortcuts[shortcutId] = {
                key: e.key,
                modifiers: modifiers
            };
            
            this.saveShortcuts();
            this.updateShortcutDisplay(item, this.shortcuts[shortcutId]);
            
            // Cleanup
            item.classList.remove('editing');
            keysElement.classList.remove('editing');
            this.isEditingShortcut = false;
            document.removeEventListener('keydown', handleKeyDown);
            
            // Aktualisiere die Anzeige
            this.updateAllShortcutDisplays();
        };

        document.addEventListener('keydown', handleKeyDown);
    }

    findDuplicateShortcut(newShortcut, currentId) {
        for (const [id, shortcut] of Object.entries(this.shortcuts)) {
            // Überspringe den aktuellen Shortcut
            if (id === currentId) continue;
            
            // Prüfe ob die Modifiers gleich sind
            const sameModifiers = shortcut.modifiers.length === newShortcut.modifiers.length &&
                shortcut.modifiers.every(mod => newShortcut.modifiers.includes(mod));
            
            // Prüfe ob die Taste gleich ist
            const sameKey = shortcut.key.toLowerCase() === newShortcut.key.toLowerCase();
            
            if (sameModifiers && sameKey) {
                // Gib den Namen des Shortcuts zurück
                const shortcutNames = {
                    settings: 'Einstellungen öffnen',
                    search: 'Suche fokussieren',
                    darkMode: 'Dark Mode umschalten',
                    allTools: 'Alle Tools',
                    websites: 'Websites',
                    portable: 'Portable',
                    scripts: 'Skripte'
                };
                return shortcutNames[id];
            }
        }
        return null;
    }

    showShortcutError(message) {
        const item = document.querySelector('.shortcut-item.editing');
        if (!item) return;
        
        // Entferne alte Fehlermeldungen
        const oldError = item.querySelector('.shortcut-error');
        if (oldError) oldError.remove();
        
        // Erstelle neue Fehlermeldung
        const error = document.createElement('div');
        error.className = 'shortcut-error';
        error.textContent = message;
        
        item.appendChild(error);
        
        // Animation starten
        requestAnimationFrame(() => {
            error.classList.add('show');
        });
        
        // Fehlermeldung nach 3 Sekunden ausblenden
        setTimeout(() => {
            error.classList.remove('show');
            setTimeout(() => error.remove(), 300);
        }, 3000);
    }

    updateShortcutDisplay(item, shortcut) {
        const keysElement = item.querySelector('.shortcut-keys[data-shortcut]');
        const modifierMap = {
            'ctrl': 'Strg',
            'alt': 'Alt',
            'shift': 'Shift'
        };
        const modifierTexts = shortcut.modifiers.map(mod => `<kbd>${modifierMap[mod] || mod}</kbd>`);
        keysElement.innerHTML = [...modifierTexts, `<kbd>${shortcut.key.toUpperCase()}</kbd>`].join(' + ');
    }

    showShortcutsModal() {
        document.getElementById('shortcutsModal').style.display = 'block';
    }
    
    hideShortcutsModal() {
        document.getElementById('shortcutsModal').style.display = 'none';
    }

    updateAllShortcutDisplays() {
        Object.entries(this.shortcuts).forEach(([id, shortcut]) => {
            const element = document.querySelector(`.shortcut-keys[data-shortcut="${id}"]`);
            if (element) {
                this.updateShortcutDisplay(element.closest('.shortcut-item'), shortcut);
            }
        });
    }

    resetShortcuts() {
        const defaultShortcuts = {
            settings: { key: ',', modifiers: ['ctrl'] },
            search: { key: 'f', modifiers: ['ctrl'] },
            darkMode: { key: 'd', modifiers: ['ctrl'] },
            allTools: { key: '1', modifiers: ['alt'] },
            websites: { key: '2', modifiers: ['alt'] },
            portable: { key: '3', modifiers: ['alt'] },
            scripts: { key: '4', modifiers: ['alt'] }
        };
    
        this.shortcuts = defaultShortcuts;
        this.saveShortcuts();
        this.updateAllShortcutDisplays();
    
        // Zeige Bestätigung
        const confirmMessage = document.createElement('div');
        confirmMessage.className = 'shortcut-confirm';
        confirmMessage.innerHTML = '<i class="fas fa-check"></i> Standard-Shortcuts wiederhergestellt';
        document.querySelector('.shortcuts-modal').appendChild(confirmMessage);
    
        setTimeout(() => {
            confirmMessage.remove();
        }, 2000);
    }

    setupEasterEggs() {
        // Lade bereits gefundene Easter Eggs
        this.loadUnlockedEasterEggs();
        
        document.getElementById('easterEggsBtn').addEventListener('click', () => {
            this.showEasterEggsModal();
        });
        
        document.getElementById('closeEasterEggsBtn').addEventListener('click', () => {
            this.hideEasterEggsModal();
        });
        
        // Reset Button für Easter Eggs
        document.getElementById('resetEasterEggsBtn').addEventListener('click', () => {
            this.showConfirmDialog(
                'Easter Eggs zurücksetzen',
                'Möchtest du wirklich alle gefundenen Easter Eggs zurücksetzen?',
                () => {
                    localStorage.removeItem('unlockedEasterEggs');
                    document.querySelectorAll('.easter-egg-item').forEach(item => {
                        const status = item.querySelector('.easter-egg-status');
                        const solution = item.querySelector('.easter-egg-solution');
                        status.textContent = 'Noch nicht gefunden';
                        status.setAttribute('data-unlocked', 'false');
                        if (solution) solution.style.display = 'none';
                    });
                    
                    // Bestätigung anzeigen
                    const confirmMessage = document.createElement('div');
                    confirmMessage.className = 'shortcut-confirm';
                    confirmMessage.innerHTML = '<i class="fas fa-check"></i> Alle Easter Eggs wurden zurückgesetzt';
                    document.querySelector('.easter-eggs-modal').appendChild(confirmMessage);
                    
                    setTimeout(() => {
                        confirmMessage.remove();
                    }, 2000);
                }
            );
        });
        
        // Konami Code
        let konamiCode = '';
        const validCode = 'ArrowUpArrowUpArrowDownArrowDownArrowLeftArrowRightArrowLeftArrowRightba';
        
        document.addEventListener('keydown', (e) => {
            konamiCode += e.key;
            if (konamiCode.length > validCode.length) {
                konamiCode = konamiCode.slice(-validCode.length);
            }
            
            if (konamiCode === validCode) {
                this.unlockEasterEgg('konami');
                // Liste aller Elemente, die den Regenbogen-Effekt bekommen sollen
                const elements = [
                    '.container',
                    '.tool-card',
                    '.sidebar',
                    '.tool-logo',
                    '.shortcut-group',
                    '.nav-item',
                    '.scroll-to-top',
                    'kbd',
                    '.tool-tag'
                ];
                
                // Füge die Animation zu allen Elementen hinzu
                elements.forEach(selector => {
                    document.querySelectorAll(selector).forEach(element => {
                        element.style.animation = 'rainbow 2s linear infinite';
                    });
                });
                
                setTimeout(() => {
                    // Entferne die Animation von allen Elementen
                    elements.forEach(selector => {
                        document.querySelectorAll(selector).forEach(element => {
                            element.style.animation = '';
                        });
                    });
                }, 5000);
            }
        });
        
        // Easter Egg Handler für die Suchleiste
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', (e) => {
            if (e.target.value === '99') {
                this.unlockEasterEgg('galaxy');
                
                const container = document.querySelector('.container');
                const answer = document.createElement('div');
                answer.className = 'galaxy-answer';
                answer.innerHTML = `
                    <div class="answer-content">
                        <div class="download-progress">
                            <div class="progress-bar">
                                <div class="progress-fill"></div>
                            </div>
                            <div class="progress-number">0%</div>
                        </div>
                        <div class="answer-text">Download läuft...</div>
                        <div class="answer-quote">Geschätzte Zeit: 5 Sekunden</div>
                        <div class="loading-tips">
                            <span class="tip">Tipp: Das könnte jetzt etwas länger dauern...</span>
                            <span class="tip">Tipp: 99% - Fast geschafft!</span>
                            <span class="tip">Tipp: Nur noch ein kleines bisschen...</span>
                            <span class="tip">Tipp: Irgendwann muss es ja fertig werden...</span>
                        </div>
                    </div>
                `;
                
                container.appendChild(answer);
                
                // Progress Animation
                const progressFill = answer.querySelector('.progress-fill');
                const progressNumber = answer.querySelector('.progress-number');
                const timeText = answer.querySelector('.answer-quote');
                let progress = 0;
                
                const progressInterval = setInterval(() => {
                    if (progress < 99) {
                        progress += 1;
                        progressFill.style.width = `${progress}%`;
                        progressNumber.textContent = `${progress}%`;
                        
                        if (progress === 99) {
                            timeText.textContent = 'Geschätzte Zeit: ♾️';
                        }
                    }
                }, 50); // Schnelle Animation bis 99%
                
                // Tips Animation
                let currentTip = 0;
                const tips = answer.querySelectorAll('.tip');
                tips[0].classList.add('show');
                
                const tipInterval = setInterval(() => {
                    tips[currentTip].classList.remove('show');
                    currentTip = (currentTip + 1) % tips.length;
                    tips[currentTip].classList.add('show');
                }, 3000);
                
                // Cleanup nach 15 Sekunden
                setTimeout(() => {
                    clearInterval(progressInterval);
                    clearInterval(tipInterval);
                    answer.classList.add('fade-out');
                    setTimeout(() => answer.remove(), 1000);
                }, 15000);
                
                e.target.value = '';
            }
        });

        // Füge diesen Code nach dem bestehenden Easter Egg Handler hinzu
        searchInput.addEventListener('input', (e) => {
            if (e.target.value.toLowerCase() === 'ticket') {
                this.unlockEasterEgg('support');
                
                const container = document.querySelector('.container');
                const answer = document.createElement('div');
                answer.className = 'galaxy-answer support-ticket';
                answer.innerHTML = `
                    <div class="answer-content">
                        <div class="ticket-header">
                            <div class="ticket-number">#12345</div>
                            <div class="ticket-priority">SUPER MEGA DRINGEND!!!</div>
                        </div>
                        <div class="chat-container">
                        </div>
                        <div class="ticket-footer">
                            <div class="admin-status">Max Mustermann</div>
                        </div>
                    </div>
                `;
                
                container.appendChild(answer);
                const chatContainer = answer.querySelector('.chat-container');
                
                // Chat-Nachrichten mit Verzögerungen
                const messages = [
                    {
                        type: 'user',
                        time: '08:00',
                        text: 'HILFE!!! Mein Bildschirm ist komplett schwarz!!!',
                        delay: 1000
                    },
                    {
                        type: 'admin',
                        time: '08:01',
                        text: 'Guten Morgen, keine Sorge, wir finden das Problem. Ist der PC eingeschaltet?',
                        delay: 4000
                    },
                    {
                        type: 'user',
                        time: '08:15',
                        text: 'Natürlich! Ich bin doch nicht dumm! Die Maus leuchtet auch!',
                        delay: 8000
                    },
                    {
                        type: 'admin',
                        time: '08:16',
                        text: 'Okay, und leuchtet die Power-LED am Monitor?',
                        delay: 12000
                    },
                    {
                        type: 'user',
                        time: '08:30',
                        text: 'Moment... der Stromstecker ist nicht eingesteckt. Jetzt FUNKTIONIERT ES!',
                        delay: 16000
                    },
                    {
                        type: 'admin',
                        time: '08:31',
                        text: '🤦',
                        delay: 20000
                    },
                ];

                // Funktion zum Hinzufügen einer Nachricht
                const addMessage = (message) => {
                    const messageDiv = document.createElement('div');
                    messageDiv.className = `chat-message ${message.type}`;
                    messageDiv.innerHTML = `
                        <div class="timestamp">${message.time}</div>
                        <div class="message">${message.text}</div>
                    `;
                    chatContainer.appendChild(messageDiv);
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                };

                // Nachrichten nacheinander mit Verzögerungen anzeigen
                messages.forEach(message => {
                    setTimeout(() => {
                        addMessage(message);
                    }, message.delay);
                });
                
                // Gesamte Animation nach 35 Sekunden beenden
                setTimeout(() => {
                    answer.classList.add('fade-out');
                    setTimeout(() => answer.remove(), 1000);
                }, 35000);
                
                e.target.value = '';
            }
        });
    }

    unlockEasterEgg(id) {
        const unlockedEggs = JSON.parse(localStorage.getItem('unlockedEasterEggs') || '[]');
        if (!unlockedEggs.includes(id)) {
            unlockedEggs.push(id);
            localStorage.setItem('unlockedEasterEggs', JSON.stringify(unlockedEggs));
            this.showEasterEggNotification();
        }
        
        const item = document.querySelector(`.easter-egg-item[data-id="${id}"]`);
        if (item) {
            const statusElement = item.querySelector('.easter-egg-status');
            const solutionElement = item.querySelector('.easter-egg-solution');
            
            if (statusElement) {
                statusElement.textContent = 'Gefunden!';
                statusElement.setAttribute('data-unlocked', 'true');
            }
            
            if (solutionElement) {
                solutionElement.style.display = 'block';
            }
        }
    }

    loadUnlockedEasterEggs() {
        const unlockedEggs = JSON.parse(localStorage.getItem('unlockedEasterEggs') || '[]');
        unlockedEggs.forEach(id => {
            const item = document.querySelector(`.easter-egg-item[data-id="${id}"]`);
            if (item) {
                const statusElement = item.querySelector('.easter-egg-status');
                const solutionElement = item.querySelector('.easter-egg-solution');
                
                if (statusElement) {
                    statusElement.textContent = 'Gefunden!';
                    statusElement.setAttribute('data-unlocked', 'true');
                }
                
                if (solutionElement) {
                    solutionElement.style.display = 'block';
                }
            }
        });
    }

    showEasterEggsModal() {
        document.getElementById('easterEggsModal').style.display = 'block';
    }
    
    hideEasterEggsModal() {
        document.getElementById('easterEggsModal').style.display = 'none';
    }

    showConfirmDialog(title, message, onConfirm) {
        const dialog = document.createElement('div');
        dialog.className = 'confirm-dialog';
        dialog.innerHTML = `
            <h3>${title}</h3>
            <p>${message}</p>
            <div class="confirm-dialog-buttons">
                <button class="cancel-btn">Abbrechen</button>
                <button class="confirm-btn">Löschen</button>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        const cancelBtn = dialog.querySelector('.cancel-btn');
        const confirmBtn = dialog.querySelector('.confirm-btn');
        
        cancelBtn.addEventListener('click', () => {
            dialog.remove();
        });
        
        confirmBtn.addEventListener('click', () => {
            onConfirm();
            dialog.remove();
        });
    }

    showEasterEggNotification() {
        // Entferne alte Benachrichtigungen
        const oldNotification = document.querySelector('.easter-egg-notification');
        if (oldNotification) oldNotification.remove();

        // Erstelle neue Benachrichtigung
        const notification = document.createElement('div');
        notification.className = 'easter-egg-notification';
        notification.innerHTML = `
            <i class="fas fa-star"></i>
            <div class="notification-content">
                <div class="notification-title">Easter Egg gefunden!</div>
                <div class="notification-message">Du hast ein verstecktes Feature entdeckt</div>
            </div>
        `;

        document.body.appendChild(notification);

        // Animation starten
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });

        // Benachrichtigung nach 3 Sekunden ausblenden
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

const toolManager = new ToolManager();