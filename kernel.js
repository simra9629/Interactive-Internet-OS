/* =========================================
   OS 12.0 - TRUE KERNEL CORE
   State-Driven, Crash-Capable, Full Window Manager
========================================= */

window.OSKernel = {
    // --- 1. THE CENTRAL AUTHORITY ---
    State: {
        mode: 'booting', // 'booting', 'normal', 'recovery'
        fs: null,
        processes: {},
        windows: [],
        settings: {},
        metrics: { cpu: 2, mem: 50 }
    },

    // --- 2. ASYNC BOOT METHODS ---
    async initStorage() {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try { 
                    localStorage.setItem('_test', '1'); 
                    localStorage.removeItem('_test'); 
                    resolve("Storage Controller OK"); 
                } catch(e) { 
                    this.State.mode = 'recovery'; 
                    reject("STORAGE_BLOCKED"); 
                }
            }, 400);
        });
    },

    async mountVFS() {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                let data = localStorage.getItem('os_vfs_v12');
                if(!data) {
                    this.State.fs = { "system": {}, "documents": {}, "images": {}, "audio": {}, "video": {}, "code": {} };
                    localStorage.setItem('os_vfs_v12', JSON.stringify(this.State.fs));
                } else {
                    try { 
                        this.State.fs = JSON.parse(data); 
                    } catch(e) { 
                        this.State.mode = 'recovery';
                        reject("VFS_CORRUPT"); 
                        return; 
                    }
                }
                resolve("VFS Mounted Successfully");
            }, 500);
        });
    },

    async loadSettings() {
        return new Promise((resolve) => {
            setTimeout(() => {
                let s = localStorage.getItem('os_set_v12');
                this.State.settings = s ? JSON.parse(s) : { accent: '#00f3ff', glass: '0.7', bg: 'linear-gradient(135deg, #1e1e1e, #000)' };
                
                document.documentElement.style.setProperty('--neon-accent', this.State.settings.accent);
                document.documentElement.style.setProperty('--glass-bg', `rgba(20, 20, 30, ${this.State.settings.glass})`);
                document.documentElement.style.setProperty('--sys-bg', this.State.settings.bg);
                
                resolve("System Configuration Applied");
            }, 300);
        });
    },

    async initIPC() {
        return new Promise((resolve) => {
            setTimeout(() => {
                window.EventBus = {
                    listeners: {},
                    on(event, callback) { 
                        if(!this.listeners[event]) this.listeners[event] = []; 
                        this.listeners[event].push(callback); 
                    },
                    off(event, callback) { 
                        if(this.listeners[event]) {
                            this.listeners[event] = this.listeners[event].filter(f => f !== callback); 
                        }
                    },
                    emit(event, data) { 
                        if(this.listeners[event]) {
                            this.listeners[event].forEach(callback => callback(data)); 
                        }
                    }
                };
                resolve("Inter-Process Communication Ready");
            }, 200);
        });
    },

    // --- 3. SYSTEM APIs ---
    VFS: {
        save() { 
            localStorage.setItem('os_vfs_v12', JSON.stringify(OSKernel.State.fs)); 
            window.EventBus.emit('fs:updated'); 
        },
        stat(path) { 
            let parts = path.split('/').filter(x => x); 
            let current = OSKernel.State.fs; 
            for(let i=0; i < parts.length; i++) { 
                if(!current[parts[i]]) return null; 
                current = current[parts[i]]; 
            } 
            return current; 
        },
        readDir(path) { 
            let target = this.stat(path); 
            return (target && typeof target === 'object') ? Object.keys(target) : []; 
        },
        readFile(path) { 
            let target = this.stat(path); 
            return typeof target === 'string' ? target : null; 
        },
        writeFile(path, data) { 
            let parts = path.split('/').filter(x => x); 
            let fileName = parts.pop(); 
            let current = OSKernel.State.fs; 
            
            // Build directory tree if it doesn't exist
            for(let i=0; i < parts.length; i++) { 
                if(typeof current[parts[i]] !== 'object') current[parts[i]] = {}; 
                current = current[parts[i]]; 
            } 
            current[fileName] = data; 
            this.save(); 
            return true; 
        },
        mkdir(path) { 
            this.writeFile(path + '/_sys_hidden', ''); 
            return true; 
        },
        deleteNode(path) { 
            let parts = path.split('/').filter(x => x); 
            let fileName = parts.pop(); 
            let current = OSKernel.State.fs; 
            for(let i=0; i < parts.length; i++) { 
                if(!current[parts[i]]) return false; 
                current = current[parts[i]]; 
            } 
            delete current[fileName]; 
            this.save(); 
            return true; 
        },
        wipeSystem() { 
            localStorage.clear(); 
            location.reload(); 
        }
    },

    ProcessManager: {
        start(id, appId, cpu, mem) { 
            OSKernel.State.processes[id] = { appId, cpu, mem, status: 'running' }; 
            window.EventBus.emit('proc:update'); 
        },
        setStatus(id, status) { 
            if(OSKernel.State.processes[id]) { 
                OSKernel.State.processes[id].status = status; 
                window.EventBus.emit('proc:update');
            } 
        },
        kill(id) { 
            delete OSKernel.State.processes[id]; 
            let winElement = document.getElementById(id); 
            if(winElement) winElement.remove(); 
            window.EventBus.emit('proc:update'); 
        },
        monitor() {
            setInterval(() => {
                let totalCpu = 2; // Base OS load
                let totalMem = 50; 
                let procs = Object.keys(OSKernel.State.processes);
                
                procs.forEach(id => { 
                    let p = OSKernel.State.processes[id];
                    // Background processes consume half CPU
                    totalCpu += p.status === 'background' ? Math.max(1, Math.floor(p.cpu/2)) : p.cpu; 
                    totalMem += p.mem; 
                });
                
                OSKernel.State.metrics = { cpu: totalCpu, mem: totalMem };

                // Glitch effect if CPU is overloaded
                if(totalCpu > 90) { 
                    document.body.style.filter = "grayscale(100%) contrast(120%)"; 
                    setTimeout(() => document.body.style.filter = "none", 1500); 
                }
                
                // Panic: Kill random task if memory is critical
                if((totalMem > 300 || totalCpu > 95) && procs.length > 0) {
                    let victim = procs[Math.floor(Math.random() * procs.length)];
                    this.kill(victim);
                    window.Notify(`KERNEL PANIC: Process terminated to free memory.`, 'err');
                }
            }, 3000);
        }
    }
};

// --- GLOBAL MAPPINGS ---
window.VFS = OSKernel.VFS;
window.ProcessManager = OSKernel.ProcessManager;
window.Notify = (msg, type='info') => {
    const container = document.getElementById('notifications'); 
    if(!container) return;
    
    const toast = document.createElement('div'); 
    toast.className = 'toast'; 
    if(type === 'warn') toast.style.borderLeftColor = '#ffbd44'; 
    if(type === 'err') toast.style.borderLeftColor = '#ff5f56';
    toast.innerHTML = msg; 
    
    container.appendChild(toast);
    setTimeout(() => { 
        toast.style.opacity = 0; 
        setTimeout(() => toast.remove(), 300); 
    }, 3000);
};

// --- 4. THE FULL WINDOW MANAGER ---
window.WindowManager = class WindowManager {
    constructor() {
        this.desktop = document.getElementById('desktop');
        this.dock = document.getElementById('dock');
        this.windows = []; 
        this.baseZIndex = 10;
        
        this.isDragging = false; 
        this.isResizing = false; 
        this.activeWindow = null;
        
        this.setupGlobalListeners();
        setTimeout(() => this.renderDesktopIcons(), 100);
    }

    renderDesktopIcons() {
        const container = document.getElementById('desktop-icons');
        if (!container || !window.AppRegistry) return;
        container.innerHTML = '';
        
        const savedPositions = JSON.parse(localStorage.getItem('os_icons_v12')) || {};

        Object.values(window.AppRegistry).forEach((app, index) => {
            if (!app.iconClass) return;
            
            const el = document.createElement('div'); 
            el.className = 'desktop-icon';
            el.dataset.app = app.id;
            el.innerHTML = `
                <div class="icon-emoji ${app.themeClass || ''}"><i class="${app.iconClass}"></i></div>
                <div class="icon-name">${app.name}</div>
            `;
            
            // Use saved position or calculate grid position
            if (savedPositions[app.id]) {
                el.style.left = savedPositions[app.id].x;
                el.style.top = savedPositions[app.id].y;
            } else {
                el.style.left = (20 + Math.floor(index / 7) * 110) + "px";
                el.style.top = (20 + (index % 7) * 120) + "px";
            }

            let isIconDragging = false, startX, startY, origX, origY;
            
            el.onmousedown = (e) => { 
                isIconDragging = true; 
                startX = e.clientX; 
                startY = e.clientY; 
                origX = parseInt(el.style.left, 10) || 0; 
                origY = parseInt(el.style.top, 10) || 0; 
                el.style.zIndex = 100; 
            };
            
            document.addEventListener('mousemove', (e) => { 
                if(isIconDragging) { 
                    el.style.left = (origX + (e.clientX - startX)) + "px"; 
                    el.style.top = (origY + (e.clientY - startY)) + "px"; 
                } 
            });
            
            document.addEventListener('mouseup', () => { 
                if(isIconDragging){ 
                    isIconDragging = false; 
                    el.style.zIndex = 1; 
                    
                    // Save new position
                    savedPositions[app.id] = { x: el.style.left, y: el.style.top };
                    localStorage.setItem('os_icons_v12', JSON.stringify(savedPositions));
                } 
            });
            
            el.ondblclick = (e) => { 
                e.stopPropagation(); 
                this.openApp(app.id); 
            };
            
            container.appendChild(el);
        });
    }

    openApp(appId, startX=150, startY=50, width='450px', height='350px', context=null) {
        if (!window.AppRegistry || !window.AppRegistry[appId]) {
            window.Notify(`App ${appId} not found.`, 'err');
            return;
        }
        
        const appDef = window.AppRegistry[appId];
        const winId = "win-" + appId + "-" + Date.now();
        
        const winEl = document.createElement('div');
        winEl.className = 'os-window focused'; 
        winEl.id = winId;
        
        // Stagger window spawn position
        const stagger = (this.windows.length * 30) % 200;
        winEl.style.left = (startX + stagger) + "px"; 
        winEl.style.top = (startY + stagger) + "px";
        winEl.style.width = width; 
        winEl.style.height = height;

        // Store original dims for un-maximizing
        winEl.dataset.prevX = winEl.style.left;
        winEl.dataset.prevY = winEl.style.top;
        winEl.dataset.prevW = width;
        winEl.dataset.prevH = height;

        winEl.innerHTML = `
            <div class="title-bar">
                <span class="title-text">${appDef.name}</span>
                <div class="win-ctrls">
                    <button class="btn-m" title="Minimize"><i class="fa-solid fa-minus"></i></button>
                    <button class="btn-f" title="Maximize"><i class="fa-regular fa-square"></i></button>
                    <button class="btn-x" title="Close"><i class="fa-solid fa-xmark"></i></button>
                </div>
            </div>
            <div class="win-content"></div>
            <div class="resize-h r-r" data-dir="r"></div>
            <div class="resize-h r-b" data-dir="b"></div>
            <div class="resize-h r-br" data-dir="br"></div>
        `;

        // Focus and un-suspend on click
        winEl.onmousedown = () => { 
            this.focus(winId); 
            window.ProcessManager.setStatus(winId, 'running'); 
        };
        
        // Close Button
        winEl.querySelector('.btn-x').onclick = (e) => { 
            e.stopPropagation(); 
            if(appDef.onClose) appDef.onClose(winEl); 
            if(winEl._cleanup) winEl._cleanup(); 
            window.ProcessManager.kill(winId); 
            this.windows = this.windows.filter(w => w.id !== winId); 
        };
        
        // Minimize Button
        winEl.querySelector('.btn-m').onclick = (e) => {
            e.stopPropagation(); 
            winEl.classList.add('minimized'); 
            window.ProcessManager.setStatus(winId, 'background'); // Throttle CPU
            
            // Create Dock Icon
            const dockIcon = document.createElement('div'); 
            dockIcon.className = 'dock-item'; 
            dockIcon.innerHTML = `<i class="${appDef.iconClass}"></i>`;
            dockIcon.onclick = () => { 
                winEl.classList.remove('minimized'); 
                dockIcon.remove(); 
                this.focus(winId); 
                window.ProcessManager.setStatus(winId, 'running'); 
            };
            this.dock.appendChild(dockIcon);
        };

        // Maximize Button
        winEl.querySelector('.btn-f').onclick = (e) => { 
            e.stopPropagation(); 
            const isMax = winEl.classList.toggle('maximized'); 
            if (isMax) {
                winEl.dataset.prevX = winEl.style.left;
                winEl.dataset.prevY = winEl.style.top;
                winEl.dataset.prevW = winEl.style.width;
                winEl.dataset.prevH = winEl.style.height;
            } else {
                winEl.style.left = winEl.dataset.prevX;
                winEl.style.top = winEl.dataset.prevY;
                winEl.style.width = winEl.dataset.prevW;
                winEl.style.height = winEl.dataset.prevH;
            }
        };

        // Dragging Logic
        winEl.querySelector('.title-bar').onmousedown = (e) => { 
            if(winEl.classList.contains('maximized') || e.target.tagName === 'BUTTON' || e.target.tagName === 'I') return; 
            this.isDragging = true; 
            this.activeWindow = winEl; 
            this.offsetX = e.clientX - winEl.offsetLeft; 
            this.offsetY = e.clientY - winEl.offsetTop; 
        };

        // Resizing Logic
        winEl.querySelectorAll('.resize-h').forEach(h => {
            h.onmousedown = (e) => { 
                e.stopPropagation(); 
                this.focus(winId); 
                this.isResizing = true; 
                this.resizeDir = h.dataset.dir; 
                this.activeWindow = winEl; 
                const r = winEl.getBoundingClientRect(); 
                this.startW = r.width; 
                this.startH = r.height; 
                this.offsetX = e.clientX; 
                this.offsetY = e.clientY; 
            };
        });

        this.desktop.appendChild(winEl);
        this.windows.push({ id: winId, appId: appId, element: winEl });
        
        // Register process with Kernel
        window.ProcessManager.start(winId, appId, appDef.cpu, appDef.mem);
        
        if (appDef.onOpen) appDef.onOpen(winEl, this, context);
        this.focus(winId);
    }

    focus(id) {
        this.baseZIndex++;
        this.windows.forEach(w => { 
            if(w.id === id){ 
                w.element.style.zIndex = this.baseZIndex; 
                w.element.classList.add('focused'); 
            } else {
                w.element.classList.remove('focused'); 
            }
        });
    }

    setupGlobalListeners() {
        // Window Drag and Resize Handlers
        document.addEventListener('mousemove', (e) => {
            if(!this.activeWindow) return;
            
            if(this.isDragging) { 
                this.activeWindow.style.left = (e.clientX - this.offsetX) + "px"; 
                this.activeWindow.style.top = (e.clientY - this.offsetY) + "px"; 
            }
            
            if(this.isResizing) {
                if(this.resizeDir.includes('r')) {
                    this.activeWindow.style.width = Math.max(250, this.startW + (e.clientX - this.offsetX)) + "px";
                }
                if(this.resizeDir.includes('b')) {
                    this.activeWindow.style.height = Math.max(150, this.startH + (e.clientY - this.offsetY)) + "px";
                }
            }
        });
        
        document.addEventListener('mouseup', () => { 
            this.isDragging = false; 
            this.isResizing = false; 
            this.activeWindow = null; 
        });

        // Desktop Context Menu Logic
        this.desktop.addEventListener('contextmenu', (e) => {
            if (e.target !== this.desktop && e.target.id !== 'desktop-icons') return;
            e.preventDefault();
            
            const menu = document.getElementById('context-menu');
            if(!menu) return;

            menu.style.display = 'flex';
            menu.style.left = e.clientX + "px";
            menu.style.top = e.clientY + "px";
            
            menu.innerHTML = '<div style="padding: 5px 10px; font-size: 10px; color: gray; border-bottom: 1px solid #333; margin-bottom: 5px;">SYSTEM COMMANDS</div>';
            
            const refreshItem = document.createElement('div');
            refreshItem.className = 'context-item';
            refreshItem.innerHTML = `<span><i class="fa-solid fa-rotate-right"></i></span><span>Reboot OS</span>`;
            refreshItem.onclick = () => location.reload();
            
            const resetItem = document.createElement('div');
            resetItem.className = 'context-item';
            resetItem.style.color = '#ff5f56';
            resetItem.innerHTML = `<span><i class="fa-solid fa-skull"></i></span><span>Factory Reset</span>`;
            resetItem.onclick = () => { 
                if(confirm("Delete all files and reset OS?")) window.VFS.wipeSystem(); 
            };
            
            menu.appendChild(refreshItem);
            menu.appendChild(resetItem);
        });

        // Hide context menu on click anywhere else
        document.addEventListener('click', () => {
            const menu = document.getElementById('context-menu');
            if (menu) menu.style.display = 'none';
        });
    }
};

window.OS = null;