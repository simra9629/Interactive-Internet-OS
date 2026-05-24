/* =========================================================
   OS 12.0 — MODULAR APP REGISTRY
   18-App Ecosystem | Dark/Light Theme | Clean Architecture
   ========================================================= */

/* ----------------------------------------------------------
   THEME SYSTEM
   All apps read from these CSS custom properties.
   Toggle by calling: ThemeManager.set('dark' | 'light')
   ---------------------------------------------------------- */
window.ThemeManager = (() => {
  const THEMES = {
    dark: {
      '--app-bg':          '#141414',
      '--app-surface':     '#1e1e1e',
      '--app-surface-2':   '#252526',
      '--app-surface-3':   '#2d2d2d',
      '--app-border':      '#333333',
      '--app-text':        '#e8e8e8',
      '--app-text-2':      '#a0a0a0',
      '--app-text-3':      '#606060',
      '--app-accent':      'var(--neon-accent, #00f3ff)',
      '--app-accent-text': '#000000',
      '--app-danger':      '#ff5f56',
      '--app-success':     '#43e97b',
      '--app-toolbar':     '#1a1a1a',
      '--app-input-bg':    '#111111',
      '--app-scrollbar':   '#333333',
    },
    light: {
      '--app-bg':          '#f5f5f5',
      '--app-surface':     '#ffffff',
      '--app-surface-2':   '#f0f0f0',
      '--app-surface-3':   '#e8e8e8',
      '--app-border':      '#d0d0d0',
      '--app-text':        '#1a1a1a',
      '--app-text-2':      '#555555',
      '--app-text-3':      '#999999',
      '--app-accent':      'var(--neon-accent, #0066ff)',
      '--app-accent-text': '#ffffff',
      '--app-danger':      '#d93025',
      '--app-success':     '#1e8e3e',
      '--app-toolbar':     '#f8f8f8',
      '--app-input-bg':    '#ffffff',
      '--app-scrollbar':   '#cccccc',
    }
  };

  let current = localStorage.getItem('os_theme') || 'dark';

  const apply = (mode) => {
    const root = document.documentElement;
    const vars = THEMES[mode];
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
    root.setAttribute('data-theme', mode);
    current = mode;
    localStorage.setItem('os_theme', mode);
    if (window.EventBus) window.EventBus.emit('theme:changed', mode);
  };

  apply(current);

  return {
    set: apply,
    toggle: () => apply(current === 'dark' ? 'light' : 'dark'),
    get: () => current,
    vars: () => THEMES[current],
  };
})();

/* ----------------------------------------------------------
   SHARED HELPERS
   Utility functions used by multiple apps.
   ---------------------------------------------------------- */
const _H = {
  /** Inject scoped CSS once per app type */
  injectStyle: (id, css) => {
    if (!document.getElementById(id)) {
      const s = document.createElement('style');
      s.id = id;
      s.textContent = css;
      document.head.appendChild(s);
    }
  },

  /** Standard toolbar HTML */
  toolbar: (children, extraStyle = '') =>
    `<div class="app-toolbar" style="${extraStyle}">${children}</div>`,

  /** Flush red save-then-reset button feedback */
  flashSave: (btn, label = 'Save') => {
    const orig = btn.innerHTML;
    btn.innerHTML = `<i class="fa-solid fa-check"></i> Saved!`;
    setTimeout(() => (btn.innerHTML = orig || label), 1500);
  },

  /** Path or default */
  pathOr: (ctx, fallback) => ctx?.path || fallback,

  /** Format seconds → M:SS */
  fmtTime: (s) =>
    isNaN(s) ? '0:00' : `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`,
};

/* ----------------------------------------------------------
   SHARED GLOBAL STYLES (injected once)
   ---------------------------------------------------------- */
_H.injectStyle('os-app-globals', `
  .app-toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 12px;
    background: var(--app-toolbar);
    border-bottom: 1px solid var(--app-border);
    flex-shrink: 0;
    flex-wrap: wrap;
  }
  .app-toolbar button {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 11px;
    border: 1px solid var(--app-border);
    border-radius: 5px;
    background: var(--app-surface-2);
    color: var(--app-text);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
    white-space: nowrap;
  }
  .app-toolbar button:hover { background: var(--app-surface-3); }
  .app-toolbar button.btn-accent {
    background: var(--app-accent);
    color: var(--app-accent-text);
    border-color: transparent;
    font-weight: 600;
  }
  .app-toolbar button.btn-accent:hover { filter: brightness(1.1); }
  .app-toolbar button.btn-danger {
    background: var(--app-danger);
    color: #fff;
    border-color: transparent;
  }
  .app-toolbar input[type="text"], .app-toolbar input[type="file"]:not([style*="none"]),
  .app-toolbar select {
    background: var(--app-input-bg);
    color: var(--app-text);
    border: 1px solid var(--app-border);
    border-radius: 5px;
    padding: 5px 9px;
    font-size: 12px;
    outline: none;
  }
  .app-toolbar select { cursor: pointer; }
  .app-toolbar .sep {
    width: 1px;
    height: 20px;
    background: var(--app-border);
    flex-shrink: 0;
  }
  .app-body {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    background: var(--app-bg);
    color: var(--app-text);
    min-height: 0;
  }
  /* Shared scrollbar */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--app-scrollbar); border-radius: 3px; }
`);


/* =========================================================
   APP REGISTRY
   ========================================================= */
window.AppRegistry = {

  /* -------------------------------------------------------
     TIER 1 — SYSTEM
     ------------------------------------------------------- */

terminal: {
    id: 'terminal', name: 'Terminal Pro',
    iconClass: 'fa-solid fa-terminal', themeClass: 'ic-term',
    cpu: 2, mem: 15,

    onOpen(w, wm) {
      const c = w.querySelector('.win-content');
      let cwd = '/';
      const history = [];
      let histIdx = -1;

      c.innerHTML = `
        <div class="term-log app-body" id="tlog" style="
          flex: 1; padding: 12px 14px; overflow-y: auto;
          font-family: 'JetBrains Mono', 'Cascadia Code', monospace;
          font-size: 13px; line-height: 1.6;
          background: var(--app-bg); color: var(--app-text);">
          <div style="color: var(--app-accent)">OS Modular Kernel v12 — type <b>help</b></div>
        </div>
        <div style="
          display: flex; align-items: center; gap: 8px;
          padding: 8px 14px; background: var(--app-surface-2);
          border-top: 1px solid var(--app-border);">
          <span id="term-pwd" style="color: var(--app-success); font-family: monospace; font-size: 13px; white-space: nowrap;">root@os:/$</span>
          <input id="term-in" type="text" autocomplete="off" spellcheck="false" style="
            flex: 1; background: transparent; border: none; outline: none;
            color: var(--app-text); font-family: monospace; font-size: 13px;">
        </div>`;

      const log = c.querySelector('#tlog');
      const inp = c.querySelector('#term-in');
      const pwdEl = c.querySelector('#term-pwd');

      const print = (text, color) =>
        (log.innerHTML += `<div style="${color ? `color:${color}` : ''}">${text}</div>`);

      const COMMANDS = {
        help:  () => print('Commands: clear, pwd, ls, cd &lt;dir&gt;, mkdir &lt;name&gt;, touch &lt;file&gt;, rm &lt;path&gt;, read &lt;file&gt;, open &lt;app|file&gt;', 'var(--app-accent)'),
        clear: () => (log.innerHTML = ''),
        pwd:   () => print(cwd),
        ls:    () => {
          const entries = window.VFS.readDir(cwd);
          print(entries.length ? entries.map(e => `<span style="color:var(--app-accent)">${e}</span>`).join('  ') : '<em style="color:var(--app-text-2)">Empty directory</em>');
        },
        cd: (args) => {
          const dir = args[1];
          if (!dir) return;
          const next = dir === '/' ? '/' : (cwd === '/' ? `/${dir}` : `${cwd}/${dir}`);
          if (window.VFS.stat(next)) { cwd = next; pwdEl.innerText = `root@os:${cwd}$`; }
          else print('cd: no such directory', 'var(--app-danger)');
        },
        mkdir: (args) => { if (args[1]) window.VFS.mkdir(`${cwd === '/' ? '' : cwd}/${args[1]}`); },
        touch: (args) => { if (args[1]) window.VFS.writeFile(`${cwd === '/' ? '' : cwd}/${args[1]}`, ''); },
        rm:    (args) => { if (args[1]) window.VFS.deleteNode(`${cwd === '/' ? '' : cwd}/${args[1]}`); },
        read:  (args) => {
          if (!args[1]) return;
          const data = window.VFS.readFile(`${cwd === '/' ? '' : cwd}/${args[1]}`);
          data !== null ? print(data.replace(/</g, '&lt;').replace(/\n/g, '<br>')) : print('File not found', 'var(--app-danger)');
        },
        open: (args) => {
          const target = args[1];
          if (!target) return;
          const filePath = `${cwd === '/' ? '' : cwd}/${target}`;
          if (window.VFS.readFile(filePath) !== null) {
            const ext = target.split('.').pop().toLowerCase();
            // Fallback to viewer if no association exists
            wm.openApp(window.FileAssociations?.[ext] || 'viewer', null, null, null, null, { path: filePath });
          } else {
            // Check if it's an app ID
            if (window.AppRegistry[target] || target === 'calc') {
                wm.openApp(target === 'calc' ? 'calculator' : target);
            } else {
                print(`open: ${target} not found`, 'var(--app-danger)');
            }
          }
        },
      };

      inp.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowUp') { 
            e.preventDefault(); 
            if (histIdx > 0) inp.value = history[--histIdx]; 
            return; 
        }
        if (e.key === 'ArrowDown') { 
            e.preventDefault(); 
            inp.value = histIdx < history.length - 1 ? history[++histIdx] : (histIdx = history.length, ''); 
            return; 
        }
        if (e.key !== 'Enter') return;

        const raw = inp.value.trim();
        if (!raw) return;
        
        history.push(raw); histIdx = history.length;
        print(`<span style="color:var(--app-success)">root@os:${cwd}$</span> ${raw}`);
        inp.value = '';

        const args = raw.split(/\s+/);
        const cmd = COMMANDS[args[0].toLowerCase()];
        cmd ? cmd(args) : print(`${args[0]}: command not found`, 'var(--app-danger)');
        log.scrollTop = log.scrollHeight;
      });

      setTimeout(() => inp.focus(), 50);
    },
  },

  /* ------------------------------------------------------- */

  files: {
    id: 'files', name: 'Explorer Pro',
    iconClass: 'fa-solid fa-folder-open', themeClass: 'ic-file',
    cpu: 3, mem: 20,

    onOpen(w, wm) {
      w.style.width = '620px'; w.style.height = '460px';
      let cwd = '/';
      const c = w.querySelector('.win-content');

      const EXT_MAP = {
        png: { icon: 'fa-image',      color: '#84fab0', app: 'viewer'     },
        jpg: { icon: 'fa-image',      color: '#84fab0', app: 'viewer'     },
        gif: { icon: 'fa-image',      color: '#84fab0', app: 'viewer'     },
        js:  { icon: 'fa-code',       color: '#43e97b', app: 'ide'        },
        html:{ icon: 'fa-code',       color: '#f6d365', app: 'ide'        },
        css: { icon: 'fa-code',       color: '#00c6fb', app: 'ide'        },
        rtf: { icon: 'fa-file-word',  color: '#00c6fb', app: 'word'       },
        json:{ icon: 'fa-file-excel', color: '#43e97b', app: 'excel'      },
        pdf: { icon: 'fa-file-pdf',   color: '#ff5f56', app: 'pdf'        },
        mp3: { icon: 'fa-music',      color: '#d57eeb', app: 'music'      },
        wav: { icon: 'fa-music',      color: '#d57eeb', app: 'music'      },
      };

      c.innerHTML = `
        <div class="app-toolbar">
          <button id="fs-up"><i class="fa-solid fa-arrow-up"></i></button>
          <input id="fs-path" type="text" readonly value="/" style="flex:1; font-family:monospace;">
          <button id="fs-nw"><i class="fa-solid fa-folder-plus"></i> New Folder</button>
          <button id="fs-upld" class="btn-accent"><i class="fa-solid fa-upload"></i> Upload</button>
          <input type="file" id="fs-fi" style="display:none;" multiple>
        </div>
        <div id="f-grid" class="app-body" style="
          flex-direction: row; flex-wrap: wrap; align-content: flex-start;
          gap: 12px; padding: 16px; overflow-y: auto;"></div>`;

      const grid = c.querySelector('#f-grid');

      const render = () => {
        if (!w.isConnected) return;
        c.querySelector('#fs-path').value = cwd;
        const files = window.VFS.readDir(cwd);
        grid.innerHTML = '';

        if (!files.length) {
          grid.innerHTML = `<div style="width:100%;text-align:center;padding:50px;color:var(--app-text-3);font-style:italic;">Folder is empty</div>`;
          return;
        }

        files.forEach(name => {
          const fullPath = cwd === '/' ? `/${name}` : `${cwd}/${name}`;
          const stat = window.VFS.stat(fullPath);
          const isDir = stat && typeof stat === 'object';
          const ext = isDir ? null : name.split('.').pop().toLowerCase();
          const meta = (!isDir && EXT_MAP[ext]) || null;

          const icon  = isDir ? 'fa-folder' : (meta?.icon  || 'fa-file');
          const color = isDir ? '#f6d365'   : (meta?.color || 'var(--app-text-2)');
          const app   = isDir ? null        : (meta?.app   || 'notes');

          const item = document.createElement('div');
          item.style.cssText = `
            position: relative; width: 72px; display: flex; flex-direction: column;
            align-items: center; gap: 6px; padding: 10px 6px; border-radius: 8px;
            cursor: pointer; transition: background 0.15s;`;

          item.innerHTML = `
            <button class="f-del" title="Delete" style="
              position:absolute; top:2px; right:2px; width:18px; height:18px;
              background:var(--app-danger); color:#fff; border:none; border-radius:50%;
              font-size:9px; cursor:pointer; opacity:0; transition:opacity 0.15s;
              display:flex; align-items:center; justify-content:center;">
              <i class="fa-solid fa-xmark"></i></button>
            <i class="fa-solid ${icon}" style="color:${color}; font-size:36px;"></i>
            <span style="font-size:10px; text-align:center; word-break:break-all; color:var(--app-text); font-weight:500; line-height:1.3;">${name}</span>`;

          item.addEventListener('mouseenter', () => {
            item.style.background = 'var(--app-surface-3)';
            item.querySelector('.f-del').style.opacity = '1';
          });
          item.addEventListener('mouseleave', () => {
            item.style.background = 'transparent';
            item.querySelector('.f-del').style.opacity = '0';
          });
          item.querySelector('.f-del').onclick = (e) => {
            e.stopPropagation();
            if (confirm(`Delete "${name}"?`)) window.VFS.deleteNode(fullPath);
          };
          item.ondblclick = () => {
            if (isDir) { cwd = fullPath; render(); }
            else wm.openApp(app, null, null, null, null, { path: fullPath });
          };
          grid.appendChild(item);
        });
      };

      c.querySelector('#fs-up').onclick = () => {
        if (cwd !== '/') { const parts = cwd.split('/'); parts.pop(); cwd = parts.join('/') || '/'; render(); }
      };
      c.querySelector('#fs-nw').onclick = () => {
        const fn = prompt('Folder name:');
        if (fn) window.VFS.mkdir(`${cwd === '/' ? '' : cwd}/${fn}`);
      };
      c.querySelector('#fs-upld').onclick = () => c.querySelector('#fs-fi').click();
      c.querySelector('#fs-fi').onchange = (e) => {
        Array.from(e.target.files).forEach(file => {
          const reader = new FileReader();
          reader.onload = (ev) => window.VFS.writeFile(`${cwd === '/' ? '' : cwd}/${file.name}`, ev.target.result);
          reader.readAsDataURL(file);
        });
      };

      render();
      window.EventBus.on('fs:updated', render);
      w._cleanup = () => window.EventBus.off('fs:updated', render);
    },
  },

  /* ------------------------------------------------------- */

'settings': {
      id: 'settings', name: 'Control Panel',
      iconClass: 'fa-solid fa-gear', themeClass: 'ic-set',
      cpu: 1, mem: 15,

      onOpen(w) {
        w.style.width = '550px'; w.style.height = '480px';
        
        // Failsafe load if SystemSettings class isn't fully bound yet
        let s = {};
        try { s = JSON.parse(localStorage.getItem('os_set_v12')) || { accent: '#00f3ff', glass: 0.6, bg: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' }; } catch(e){}
        
        const c = w.querySelector('.win-content');
        const isDark = window.ThemeManager ? window.ThemeManager.get() === 'dark' : true;

        c.innerHTML = `
          <div style="display:flex; height:100%; background:var(--app-bg); color:var(--app-text); font-family:sans-serif;">
            <nav style="width:170px; background:var(--app-surface-2); border-right:1px solid var(--app-border); padding:20px 0; display:flex; flex-direction:column; gap:5px;">
              <div class="set-tab active" data-tab="personalize" style="padding:12px 20px; font-size:13px; font-weight:600; cursor:pointer; background:var(--app-surface); border-left:3px solid var(--app-accent); color:var(--app-text); transition:0.2s;"><i class="fa-solid fa-paint-roller" style="margin-right:8px;"></i> Personalize</div>
              <div class="set-tab" data-tab="system" style="padding:12px 20px; font-size:13px; font-weight:600; cursor:pointer; border-left:3px solid transparent; color:var(--app-text-2); transition:0.2s;"><i class="fa-solid fa-triangle-exclamation" style="margin-right:8px;"></i> System</div>
              <div style="flex:1;"></div>
              <div class="set-tab" data-tab="about" style="padding:12px 20px; font-size:13px; font-weight:600; cursor:pointer; border-left:3px solid transparent; color:var(--app-text-2); transition:0.2s;"><i class="fa-solid fa-circle-info" style="margin-right:8px;"></i> About OS</div>
            </nav>

            <div style="flex:1; padding:25px 30px; overflow-y:auto; display:flex; flex-direction:column; gap:25px;">
              
              <div id="tab-personalize" class="set-pane">
                <h2 style="margin:0 0 20px; font-size:20px; border-bottom:1px solid var(--app-border); padding-bottom:10px;">Personalization</h2>
                
                <div style="margin-bottom:20px;">
                  <label style="font-size:11px; font-weight:bold; color:var(--app-text-2); display:block; margin-bottom:8px; text-transform:uppercase; letter-spacing:1px;">App Theme</label>
                  <div style="display:flex; gap:10px;">
                    <button id="btn-dark" style="flex:1; padding:12px; border-radius:6px; border:2px solid ${isDark ? 'var(--app-accent)' : 'var(--app-border)'}; background:var(--app-surface-3); color:var(--app-text); cursor:pointer; font-weight:bold; transition:0.2s;"><i class="fa-solid fa-moon"></i> Dark</button>
                    <button id="btn-light" style="flex:1; padding:12px; border-radius:6px; border:2px solid ${!isDark ? 'var(--app-accent)' : 'var(--app-border)'}; background:var(--app-surface-3); color:var(--app-text); cursor:pointer; font-weight:bold; transition:0.2s;"><i class="fa-solid fa-sun"></i> Light</button>
                  </div>
                </div>

                <div style="margin-bottom:20px;">
                  <label style="font-size:11px; font-weight:bold; color:var(--app-text-2); display:block; margin-bottom:8px; text-transform:uppercase; letter-spacing:1px;">Desktop Wallpaper</label>
                  <select id="bg-sel" style="width:100%; padding:10px; border-radius:6px; border:1px solid var(--app-border); background:var(--app-input-bg); color:var(--app-text); outline:none; cursor:pointer; font-size:13px;">
                    <option value="linear-gradient(135deg, #0f0c29, #302b63, #24243e)" ${s.bg?.includes('0f0c29') ? 'selected' : ''}>Dark Space</option>
                    <option value="linear-gradient(135deg, #1A2980, #26D0CE)" ${s.bg?.includes('1A2980') ? 'selected' : ''}>Cyber Blue</option>
                    <option value="linear-gradient(135deg, #232526, #414345)" ${s.bg?.includes('232526') ? 'selected' : ''}>Carbon</option>
                    <option value="linear-gradient(135deg, #f5f7fa, #c3cfe2)" ${s.bg?.includes('f5f7fa') ? 'selected' : ''}>Soft Light</option>
                    <option value="url('https://images.unsplash.com/photo-1707343843437-caacff5cfa74')" ${s.bg?.includes('url') ? 'selected' : ''}>Mountain View</option>
                  </select>
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; background:var(--app-surface-2); padding:15px; border-radius:8px; border:1px solid var(--app-border);">
                  <span style="font-weight:600; font-size:13px;">System Accent Color</span>
                  <div style="display:flex; align-items:center; gap:10px;">
                    <span id="ac-val" style="font-family:monospace; font-size:12px; color:var(--app-text-2);">${s.accent || '#00f3ff'}</span>
                    <input type="color" id="ac-col" value="${s.accent || '#00f3ff'}" style="width:36px; height:36px; padding:0; border:none; border-radius:50%; cursor:pointer; background:transparent;">
                  </div>
                </div>

                <div style="background:var(--app-surface-2); padding:15px; border-radius:8px; border:1px solid var(--app-border);">
                  <div style="display:flex; justify-content:space-between; margin-bottom:10px;"><span style="font-weight:600; font-size:13px;">Window Glass Opacity</span><span id="gl-val" style="font-family:monospace; font-size:12px; color:var(--app-text-2);">${s.glass || 0.6}</span></div>
                  <input type="range" id="gl-op" min="0.1" max="0.95" step="0.05" value="${s.glass || 0.6}" style="width:100%; accent-color:var(--app-accent); cursor:pointer;">
                </div>
              </div>

              <div id="tab-system" class="set-pane" style="display:none;">
                <h2 style="margin:0 0 20px; font-size:20px; border-bottom:1px solid var(--app-border); padding-bottom:10px;">System Configuration</h2>
                <div style="background:var(--app-surface-2); border:1px solid var(--app-danger); border-radius:8px; padding:20px;">
                  <h3 style="margin:0 0 10px; color:var(--app-danger); font-size:16px;"><i class="fa-solid fa-triangle-exclamation"></i> Danger Zone</h3>
                  <p style="font-size:13px; color:var(--app-text-2); margin-bottom:20px; line-height:1.5;">This will permanently wipe the Virtual File System, clear localStorage, and factory reset the entire OS. This action cannot be undone.</p>
                  <button id="sys-rst" style="background:var(--app-danger); color:#fff; border:none; padding:10px 20px; border-radius:6px; font-weight:bold; cursor:pointer; width:100%; transition:filter 0.2s;">Factory Reset OS</button>
                </div>
              </div>

              <div id="tab-about" class="set-pane" style="display:none; text-align:center;">
                <i class="fa-brands fa-connectdevelop" style="font-size:64px; color:var(--app-accent); margin-bottom:15px; display:block; text-shadow:0 0 20px rgba(0,243,255,0.4);"></i>
                <h2 style="margin:0 0 5px; font-size:24px;">Modular OS</h2>
                <p style="margin:0 0 25px; color:var(--app-text-2); font-weight:bold;">Version 12.0 Pro</p>
                
                <div style="background:var(--app-surface-2); border-radius:8px; border:1px solid var(--app-border); padding:15px; text-align:left; font-size:13px; line-height:2.2;">
                  <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--app-border);"><span>Kernel Architecture</span><span style="color:var(--app-text-2);">State-Driven Async</span></div>
                  <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--app-border);"><span>Virtual File System</span><span style="color:var(--app-text-2);">Active (VFS v12)</span></div>
                  <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--app-border);"><span>Window Manager</span><span style="color:var(--app-text-2);">v4.2</span></div>
                  <div style="display:flex; justify-content:space-between;"><span>Registered Applications</span><span style="color:var(--app-text-2);">18 Modules</span></div>
                </div>
              </div>

            </div>
          </div>
        `;

        // Tab Switching Logic
        c.querySelectorAll('.set-tab').forEach(tab => {
          tab.onclick = () => {
            c.querySelectorAll('.set-tab').forEach(t => {
              t.style.background = 'transparent'; t.style.borderLeftColor = 'transparent'; t.style.color = 'var(--app-text-2)';
            });
            tab.style.background = 'var(--app-surface)'; tab.style.borderLeftColor = 'var(--app-accent)'; tab.style.color = 'var(--app-text)';
            c.querySelectorAll('.set-pane').forEach(p => p.style.display = 'none');
            c.querySelector('#tab-' + tab.dataset.tab).style.display = 'block';
          };
        });

        // Theme Toggle Logic
        const btnDark = c.querySelector('#btn-dark');
        const btnLight = c.querySelector('#btn-light');
        const updateThemeButtons = (theme) => {
          btnDark.style.borderColor = theme === 'dark' ? 'var(--app-accent)' : 'var(--app-border)';
          btnLight.style.borderColor = theme === 'light' ? 'var(--app-accent)' : 'var(--app-border)';
        };
        btnDark.onclick = () => { if(window.ThemeManager) window.ThemeManager.set('dark'); updateThemeButtons('dark'); };
        btnLight.onclick = () => { if(window.ThemeManager) window.ThemeManager.set('light'); updateThemeButtons('light'); };

        // Save Function helper
        const saveSys = (key, val) => {
            s[key] = val;
            localStorage.setItem('os_set_v12', JSON.stringify(s));
        };

        // Core Settings Handlers
        c.querySelector('#bg-sel').onchange = (e) => {
            saveSys('bg', e.target.value);
            document.documentElement.style.setProperty('--sys-bg', s.bg);
        };
        c.querySelector('#ac-col').oninput = (e) => {
            c.querySelector('#ac-val').innerText = e.target.value;
            saveSys('accent', e.target.value);
            document.documentElement.style.setProperty('--neon-accent', s.accent);
        };
        c.querySelector('#gl-op').oninput = (e) => {
            c.querySelector('#gl-val').innerText = e.target.value;
            saveSys('glass', e.target.value);
            document.documentElement.style.setProperty('--glass-bg', `rgba(20, 20, 30, ${s.glass})`);
        };
        c.querySelector('#sys-rst').onclick = () => { if(confirm("WARNING: Wipe all data? This cannot be undone.")) window.VFS.wipeSystem(); };
      }
    },

  /* ------------------------------------------------------- */

monitor: {
    id: 'monitor', name: 'Task Manager',
    iconClass: 'fa-solid fa-microchip', themeClass: 'ic-mon',
    cpu: 1, mem: 5,

    onOpen(w) {
      w.style.width = '450px'; w.style.height = '550px';
      const c = w.querySelector('.win-content');

      c.innerHTML = `
        <div class="app-body" style="padding:0; background:var(--app-bg); display:flex; flex-direction:column; height:100%;">
          
          <div style="padding:20px; background:var(--app-surface-2); border-bottom:1px solid var(--app-border); display:flex; flex-direction:column; gap:15px;">
              <div>
                  <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:6px; color:var(--app-text-2); font-weight:700; text-transform:uppercase; letter-spacing:1px;">
                      <span><i class="fa-solid fa-microchip" style="margin-right:5px;"></i> Total CPU</span><span id="tm-cpu-txt" style="font-family:monospace;">0%</span>
                  </div>
                  <div style="height:8px; background:var(--app-surface-3); border-radius:4px; overflow:hidden;">
                      <div id="tm-cpu-bar" style="height:100%; width:0%; background:var(--app-success); transition:width 0.4s ease;"></div>
                  </div>
              </div>
              <div>
                  <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:6px; color:var(--app-text-2); font-weight:700; text-transform:uppercase; letter-spacing:1px;">
                      <span><i class="fa-solid fa-memory" style="margin-right:5px;"></i> Memory</span><span id="tm-mem-txt" style="font-family:monospace;">0 MB / 512 MB</span>
                  </div>
                  <div style="height:8px; background:var(--app-surface-3); border-radius:4px; overflow:hidden;">
                      <div id="tm-mem-bar" style="height:100%; width:0%; background:var(--app-accent); transition:width 0.4s ease;"></div>
                  </div>
              </div>
          </div>

          <div style="padding:10px 20px; background:var(--app-surface); border-bottom:1px solid var(--app-border); display:flex; font-size:11px; font-weight:700; color:var(--app-text-3); text-transform:uppercase;">
              <div style="flex:2; cursor:pointer;" id="sort-name" class="tm-sort">Process <i class="fa-solid fa-sort"></i></div>
              <div style="flex:1; text-align:center; cursor:pointer;" id="sort-cpu" class="tm-sort">CPU <i class="fa-solid fa-sort"></i></div>
              <div style="flex:1; text-align:right; cursor:pointer;" id="sort-mem" class="tm-sort">RAM <i class="fa-solid fa-sort"></i></div>
              <div style="width:40px;"></div>
          </div>

          <div id="tm-list" style="flex:1; overflow-y:auto; padding:10px; display:flex; flex-direction:column; gap:4px;"></div>
          
          <div style="padding:10px 20px; background:var(--app-surface-2); border-top:1px solid var(--app-border); font-size:11px; color:var(--app-text-3); display:flex; justify-content:space-between;">
              <span id="tm-count">0 tasks</span>
              <span id="tm-uptime">Uptime: 00:00:00</span>
          </div>
        </div>`;

      let sortBy = 'mem', sortDesc = true, startTime = Date.now();
      const list = c.querySelector('#tm-list');

      const updateUI = () => {
        if (!w.isConnected) return;
        if (!window.OSKernel?.State?.processes) return;
        
        let totalCpu = 2, totalMem = 50, procs = [];

        Object.entries(window.OSKernel.State.processes).forEach(([pid, p]) => {
            const def = window.AppRegistry?.[p.appId];
            let cCpu = p.cpu || 1;
            if (p.status === 'background') cCpu = Math.max(1, Math.floor(cCpu / 2));
            totalCpu += cCpu; totalMem += p.mem;

            procs.push({
                pid, name: def?.name || p.appId,
                icon: def?.iconClass || 'fa-solid fa-window-maximize',
                cpu: cCpu, mem: p.mem, status: p.status
            });
        });

        procs.push({ pid: 'sys', name: 'Kernel System', icon: 'fa-solid fa-microchip', cpu: 2, mem: 50, status: 'system' });

        procs.sort((a, b) => {
            let vA = a[sortBy], vB = b[sortBy];
            if (vA < vB) return sortDesc ? 1 : -1;
            if (vA > vB) return sortDesc ? -1 : 1;
            return 0;
        });

        list.innerHTML = procs.map(p => `
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:12px; padding:8px 10px; background:var(--app-surface-2); border-radius:6px; opacity:${p.status==='background'?0.6:1};">
            <span style="flex:2; overflow:hidden; text-overflow:ellipsis; display:flex; align-items:center;">
              <div style="width:6px; height:6px; border-radius:50%; background:${p.status==='running'?'var(--app-success)':p.status==='system'?'#888':'var(--app-danger)'}; margin-right:8px;"></div>
              <i class="${p.icon}" style="margin-right:8px; width:14px; text-align:center;"></i> 
              <b>${p.name}</b>
            </span>
            <span style="flex:1; text-align:center; font-family:monospace;">${p.cpu}%</span>
            <span style="flex:1; text-align:right; font-family:monospace;">${p.mem}MB</span>
            <div style="width:40px; text-align:right;">
              ${p.pid !== 'sys' ? `<button class="tm-kill" data-pid="${p.pid}" style="background:transparent; border:1px solid var(--app-danger); color:var(--app-danger); border-radius:4px; cursor:pointer; width:24px; height:24px;"><i class="fa-solid fa-xmark"></i></button>` : ''}
            </div>
          </div>`).join('');

        // Update Global Stats
        c.querySelector('#tm-cpu-txt').innerText = `${Math.min(totalCpu, 100)}%`;
        c.querySelector('#tm-cpu-bar').style.width = `${Math.min(totalCpu, 100)}%`;
        c.querySelector('#tm-mem-txt').innerText = `${totalMem} MB / 512 MB`;
        c.querySelector('#tm-mem-bar').style.width = `${(totalMem/512)*100}%`;
        c.querySelector('#tm-count').innerText = `${procs.length} active tasks`;
        
        const sec = Math.floor((Date.now() - startTime)/1000);
        c.querySelector('#tm-uptime').innerText = `Uptime: ${String(Math.floor(sec/3600)).padStart(2,'0')}:${String(Math.floor((sec%3600)/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;

        // FIX: The event binding must happen AFTER the innerHTML is set
        list.querySelectorAll('.tm-kill').forEach(btn => {
            btn.onclick = () => {
                const pid = btn.getAttribute('data-pid');
                const targetWindow = document.getElementById(pid);
                if (targetWindow) {
                    // Trigger the actual close button of that window
                    targetWindow.querySelector('.btn-x')?.click();
                } else {
                    // Fallback: If window is gone but process exists, kill manually
                    window.ProcessManager?.kill(pid);
                }
            };
        });
      };

      w._procInt = setInterval(updateUI, 1000);
      updateUI();
      w._cleanup = () => clearInterval(w._procInt);
    },
  },  
  /* -------------------------------------------------------
     TIER 2 — PRODUCTIVITY
     ------------------------------------------------------- */

'notes': {
      id: 'notes', name: 'Notepad Pro',
      iconClass: 'fa-solid fa-file-lines', themeClass: 'ic-note',
      cpu: 1, mem: 10,

      onOpen(w, wm, ctx) {
        let p = (ctx && ctx.path) ? ctx.path : '/documents/note.txt';
        w.style.width = '550px'; w.style.height = '450px';
        const c = w.querySelector('.win-content');

        c.innerHTML = `
          <div class="app-toolbar">
            <i class="fa-solid fa-file-lines" style="color:var(--app-text-2); margin-left:5px;"></i>
            <input id="n-path" type="text" value="${p}" style="flex:1; font-family:monospace; font-size:12px; border:none; background:transparent; border-bottom:1px solid transparent; transition:0.2s;" onfocus="this.style.borderBottom='1px solid var(--app-accent)'" onblur="this.style.borderBottom='1px solid transparent'">
            <div class="sep"></div>
            <button id="n-wrap" title="Toggle Word Wrap"><i class="fa-solid fa-align-left"></i> Wrap</button>
            <button id="n-save" class="btn-accent"><i class="fa-solid fa-floppy-disk"></i> Save</button>
          </div>
          <div style="flex:1; display:flex; flex-direction:column; background:var(--app-bg);">
              <textarea id="n-ta" spellcheck="false" style="
                flex:1; border:none; padding:20px; resize:none; outline:none;
                font-family:'JetBrains Mono', Consolas, monospace; font-size:14px; line-height:1.6;
                background:var(--app-surface); color:var(--app-text); white-space:nowrap; overflow:auto;"
              >${window.VFS.readFile(p) || ''}</textarea>
              
              <div style="background:var(--app-toolbar); border-top:1px solid var(--app-border); padding:6px 15px; display:flex; justify-content:space-between; font-size:11px; color:var(--app-text-2); font-family:monospace; text-transform:uppercase; letter-spacing:0.5px;">
                  <span id="n-stat">Ln 1, Col 1</span>
                  <span><span id="n-count">0</span> Chars | UTF-8</span>
              </div>
          </div>`;

        let wrapped = false;
        const ta = c.querySelector('#n-ta');
        const stat = c.querySelector('#n-stat');
        const count = c.querySelector('#n-count');

        // Real-time metrics
        const updateStats = () => {
            const text = ta.value;
            const lines = text.substr(0, ta.selectionStart).split('\n');
            const currentLine = lines.length;
            const currentCol = lines[lines.length - 1].length + 1;
            
            stat.innerText = `Ln ${currentLine}, Col ${currentCol}`;
            count.innerText = text.length;
        };

        ta.addEventListener('input', updateStats);
        ta.addEventListener('keyup', updateStats);
        ta.addEventListener('click', updateStats);
        updateStats();

        // Word Wrap Toggle
        c.querySelector('#n-wrap').onclick = () => {
          wrapped = !wrapped;
          ta.style.whiteSpace = wrapped ? 'pre-wrap' : 'nowrap';
          c.querySelector('#n-wrap').style.background = wrapped ? 'var(--app-surface-3)' : 'var(--app-surface-2)';
          c.querySelector('#n-wrap').style.color = wrapped ? 'var(--app-accent)' : 'var(--app-text)';
        };

        // Save Function
        c.querySelector('#n-save').onclick = function () {
          window.VFS.writeFile(c.querySelector('#n-path').value, ta.value);
          const orig = this.innerHTML;
          this.innerHTML = '<i class="fa-solid fa-check"></i> Saved';
          setTimeout(() => this.innerHTML = orig, 1500);
        };
        
        // Hotkeys (Ctrl+S / Cmd+S)
        w._kh = (e) => {
            if (w.classList.contains('focused') && (e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                c.querySelector('#n-save').click();
            }
        };
        document.addEventListener('keydown', w._kh);
      },
      
      onClose(w) {
          document.removeEventListener('keydown', w._kh);
      }
    },
  /* ------------------------------------------------------- */

  word: {
    id: 'word', name: 'Word Pro',
    iconClass: 'fa-solid fa-file-word', themeClass: 'ic-wrd',
    cpu: 2, mem: 20,

    onOpen(w, wm, ctx) {
      let p = _H.pathOr(ctx, '/documents/document.rtf');
      w.style.width = '660px'; w.style.height = '560px';
      const c = w.querySelector('.win-content');

      const cmd = (c, v = null) => () => document.execCommand(c, false, v);

      c.innerHTML = `
        <div class="app-toolbar" style="flex-wrap:wrap; gap:4px;">
          <button onclick="document.execCommand('bold',false,null)"><b>B</b></button>
          <button onclick="document.execCommand('italic',false,null)"><i>I</i></button>
          <button onclick="document.execCommand('underline',false,null)"><u>U</u></button>
          <button onclick="document.execCommand('strikeThrough',false,null)"><s>S</s></button>
          <div class="sep"></div>
          <button onclick="document.execCommand('justifyLeft',false,null)"><i class="fa-solid fa-align-left"></i></button>
          <button onclick="document.execCommand('justifyCenter',false,null)"><i class="fa-solid fa-align-center"></i></button>
          <button onclick="document.execCommand('justifyRight',false,null)"><i class="fa-solid fa-align-right"></i></button>
          <div class="sep"></div>
          <button onclick="document.execCommand('insertUnorderedList',false,null)"><i class="fa-solid fa-list-ul"></i></button>
          <button onclick="document.execCommand('insertOrderedList',false,null)"><i class="fa-solid fa-list-ol"></i></button>
          <div class="sep"></div>
          <input type="color" onchange="document.execCommand('foreColor',false,this.value)" title="Text Color" style="width:28px; height:28px; padding:2px; border:1px solid var(--app-border); border-radius:4px; cursor:pointer; background:transparent;">
          <input type="color" onchange="document.execCommand('hiliteColor',false,this.value)" value="#ffff00" title="Highlight" style="width:28px; height:28px; padding:2px; border:1px solid var(--app-border); border-radius:4px; cursor:pointer; background:transparent;">
          <select onchange="document.execCommand('fontSize',false,this.value)" style="height:28px;">
            <option value="3">Normal</option><option value="5">Large</option><option value="7">Huge</option>
          </select>
          <div style="flex:1;"></div>
          <input id="w-path" type="text" value="${p}" style="width:130px; font-size:11px; font-family:monospace;">
          <button id="w-save" class="btn-accent"><i class="fa-solid fa-floppy-disk"></i> Save</button>
        </div>
        <div style="flex:1; background:var(--app-surface-2); display:flex; justify-content:center; padding:20px; overflow-y:auto;">
          <div id="w-edit" contenteditable="true" style="
            width:100%; max-width:800px; min-height:800px;
            background:#ffffff; color:#000000;
            padding:40px 60px; outline:none; line-height:1.65;
            font-family:Georgia, serif; font-size:14px;
            box-shadow:0 4px 20px rgba(0,0,0,0.15);">
            ${window.VFS.readFile(p) || 'Start typing…'}
          </div>
        </div>`;

      c.querySelector('#w-save').onclick = function () {
        window.VFS.writeFile(c.querySelector('#w-path').value, c.querySelector('#w-edit').innerHTML);
        _H.flashSave(this);
      };
    },
  },

  /* ------------------------------------------------------- */

  excel: {
    id: 'excel', name: 'Spreadsheet Pro',
    iconClass: 'fa-solid fa-file-excel', themeClass: 'ic-xls',
    cpu: 3, mem: 30,

    onOpen(w, wm, ctx) {
      w.style.width = '720px'; w.style.height = '520px';
      const p = _H.pathOr(ctx, '/documents/finances.json');
      let sData = {};
      try { sData = JSON.parse(window.VFS.readFile(p)) || {}; } catch (_) {}

      const COLS = 12, ROWS = 25;
      let tableHTML = `
        <table class="xls-table" style="border-collapse:collapse; font-size:12px; font-family:monospace; min-width:100%;">
          <thead><tr>
            <th style="width:36px; position:sticky; top:0; left:0; z-index:3; background:var(--app-surface-2); border:1px solid var(--app-border);"></th>`;

      for (let col = 0; col < COLS; col++) {
        tableHTML += `<th style="min-width:80px; position:sticky; top:0; z-index:2; background:var(--app-surface-2); border:1px solid var(--app-border); padding:5px 8px; color:var(--app-text-2); font-weight:600;">${String.fromCharCode(65 + col)}</th>`;
      }
      tableHTML += '</tr></thead><tbody>';

      for (let r = 1; r <= ROWS; r++) {
        tableHTML += `<tr><td style="position:sticky; left:0; z-index:1; background:var(--app-surface-2); border:1px solid var(--app-border); text-align:center; font-weight:600; padding:4px 6px; color:var(--app-text-2); width:36px;">${r}</td>`;
        for (let col = 0; col < COLS; col++) {
          const id = `${String.fromCharCode(65 + col)}${r}`;
          tableHTML += `<td style="border:1px solid var(--app-border); padding:0;">
            <input type="text" id="c-${id}" value="${sData[id] || ''}" style="
              width:100%; height:100%; border:none; padding:5px 7px; box-sizing:border-box;
              background:transparent; color:var(--app-text); font-family:monospace; font-size:12px;
              outline:none;">
          </td>`;
        }
        tableHTML += '</tr>';
      }
      tableHTML += '</tbody></table>';

      const c = w.querySelector('.win-content');
      c.innerHTML = `
        <div class="app-toolbar">
          <button onclick="document.execCommand('bold')"><b>B</b></button>
          <input type="color" onchange="document.execCommand('foreColor',false,this.value)" title="Text Color" style="width:28px; height:28px; padding:2px; border:1px solid var(--app-border); border-radius:4px; cursor:pointer; background:transparent;">
          <div class="sep"></div>
          <code style="font-size:11px; color:var(--app-accent); opacity:.8;">=SUM(A1:A5) · =AVG(B1:B3) · =A1+B1</code>
          <div style="flex:1;"></div>
          <input id="x-path" type="text" value="${p}" style="width:160px; font-size:11px; font-family:monospace;">
          <button id="x-save" class="btn-accent"><i class="fa-solid fa-floppy-disk"></i> Save</button>
        </div>
        <div style="flex:1; overflow:auto; background:var(--app-surface);">${tableHTML}</div>`;

      const getVal = (id) => { const el = c.querySelector(`#c-${id}`); return el ? (parseFloat(el.value) || 0) : 0; };

      const evaluate = (expr) => {
        if (!expr.startsWith('=')) return expr;
        try {
          let f = expr.slice(1).toUpperCase()
            .replace(/(SUM|AVG)\(([A-Z])(\d+):([A-Z])(\d+)\)/g, (_, fn, c1, r1, c2, r2) => {
              let total = 0, count = 0;
              for (let cc = c1.charCodeAt(0); cc <= c2.charCodeAt(0); cc++)
                for (let rr = +r1; rr <= +r2; rr++) { total += getVal(String.fromCharCode(cc) + rr); count++; }
              return fn === 'SUM' ? total : (total / (count || 1));
            })
            .replace(/[A-Z]\d+/g, m => getVal(m));
          // eslint-disable-next-line no-new-func
          return new Function('return ' + f)();
        } catch (_) { return 'ERR'; }
      };

      c.querySelectorAll('.xls-table input').forEach(inp => {
        if (inp.value.startsWith('=')) inp.dataset.formula = inp.value;
        inp.onfocus = () => { inp.style.background = 'var(--app-surface-2)'; if (inp.dataset.formula) inp.value = inp.dataset.formula; };
        inp.onblur = () => {
          inp.style.background = 'transparent';
          if (inp.value.startsWith('=')) { inp.dataset.formula = inp.value; inp.value = evaluate(inp.value); }
          else delete inp.dataset.formula;
        };
        if (inp.value.startsWith('=')) inp.onblur();
      });

      c.querySelector('#x-save').onclick = function () {
        const data = {};
        c.querySelectorAll('.xls-table input').forEach(inp => {
          const v = inp.dataset.formula || inp.value;
          if (v.trim()) data[inp.id.replace('c-', '')] = v;
        });
        window.VFS.writeFile(c.querySelector('#x-path').value, JSON.stringify(data));
        _H.flashSave(this, 'Save');
      };
    },
  },

  /* ------------------------------------------------------- */

'calculator': {
      id: 'calculator', name: 'Calc Pro',
      iconClass: 'fa-solid fa-calculator', themeClass: 'ic-calc',
      cpu: 1, mem: 10,

      onOpen(w) {
        w.style.width = '380px'; w.style.height = '540px';
        const c = w.querySelector('.win-content');

        const LABELS = { 
            'del': '<i class="fa-solid fa-delete-left"></i>', 
            '/': '÷', '*': '×', 'sqrt': '√', 'pi': 'π', '^': 'xʸ',
            'log': 'log₁₀', 'ln': 'ln'
        };

        c.innerHTML = `
          <div class="app-body" style="padding:18px; gap:12px; background:var(--app-bg);">
            
            <div id="c-disp" style="
              background:var(--app-surface-2); border-radius:12px; border:1px solid var(--app-border);
              padding:20px; display:flex; flex-direction:column; align-items:flex-end; justify-content:flex-end;
              box-shadow:inset 0 4px 15px rgba(0,0,0,0.1); min-height:90px;">
              <div id="c-expr" style="font-size:14px; color:var(--app-text-2); font-family:'JetBrains Mono', monospace; min-height:20px; word-break:break-all; margin-bottom:5px;"></div>
              <div id="c-res" style="font-size:42px; font-weight:700; font-family:'JetBrains Mono', monospace; color:var(--app-text); word-break:break-all; line-height:1.1; overflow-x:auto; max-width:100%;">0</div>
            </div>

            <div id="c-grid" style="flex:1; display:grid; grid-template-columns:repeat(5, 1fr); grid-template-rows:repeat(6, 1fr); gap:8px;"></div>
          </div>`;

        const grid = c.querySelector('#c-grid');
        const resEl = c.querySelector('#c-res');
        const exprEl = c.querySelector('#c-expr');

        // Layout: 6 Rows, 5 Columns
        const BUTTONS = [
          ['sin', 'cos', 'tan', 'pi', 'e'],
          ['(', ')', '^', 'sqrt', 'log'],
          ['7', '8', '9', 'del', 'C'],
          ['4', '5', '6', '*', '/'],
          ['1', '2', '3', '+', '-'],
          ['0', '.', 'ln', 'exp', '=']
        ];

        BUTTONS.forEach((row) => {
          row.forEach((v) => {
            const btn = document.createElement('button');
            const isNum = /^[\d\.]$/.test(v);
            const isOp = ['+', '-', '*', '/', '^'].includes(v);
            const isEq = v === '=';
            const isC = ['C', 'del'].includes(v);
            
            // Dynamic theme mapping
            let bg, color;
            if (isNum) { bg = 'var(--app-surface-3)'; color = 'var(--app-text)'; }
            else if (isOp) { bg = 'var(--app-surface-2)'; color = 'var(--app-accent)'; }
            else if (isEq) { bg = 'var(--app-accent)'; color = 'var(--app-accent-text)'; }
            else if (isC) { bg = 'var(--app-danger)'; color = '#fff'; }
            else { bg = 'var(--app-surface)'; color = 'var(--app-text-2)'; }

            btn.dataset.v = v;
            btn.innerHTML = LABELS[v] || v;
            btn.style.cssText = `
              border: 1px solid var(--app-border); border-radius: 8px; cursor:pointer;
              font-size: ${isNum ? '20px' : '15px'}; font-weight: ${isNum || isEq ? '700' : '600'};
              background: ${bg}; color: ${color};
              transition: transform 0.1s, filter 0.1s; display:flex; align-items:center; justify-content:center;
              box-shadow: 0 2px 5px rgba(0,0,0,0.05); user-select:none; outline:none;`;
              
            btn.addEventListener('mousedown', () => { btn.style.transform = 'scale(0.92)'; btn.style.filter = 'brightness(1.2)'; });
            btn.addEventListener('mouseup', () => { btn.style.transform = 'scale(1)'; btn.style.filter = 'brightness(1)'; });
            btn.addEventListener('mouseleave', () => { btn.style.transform = 'scale(1)'; btn.style.filter = 'brightness(1)'; });
            
            grid.appendChild(btn);
          });
        });

        let exp = '';
        const process = (v) => {
          if (v === 'C') {
              exp = '';
              exprEl.innerText = '';
          }
          else if (v === 'del') exp = exp.slice(0, -1);
          else if (v === '=') {
            exprEl.innerText = exp + ' =';
            try {
              let parsed = exp
                .replace(/sin\(/g, 'Math.sin(').replace(/cos\(/g, 'Math.cos(')
                .replace(/tan\(/g, 'Math.tan(').replace(/sqrt\(/g, 'Math.sqrt(')
                .replace(/log\(/g, 'Math.log10(').replace(/ln\(/g, 'Math.log(')
                .replace(/exp\(/g, 'Math.exp(')
                .replace(/pi/g, 'Math.PI').replace(/e/g, 'Math.E')
                .replace(/\^/g, '**');
              
              // Safely evaluate math logic
              // eslint-disable-next-line no-new-func
              let result = new Function('return ' + parsed)();
              
              // Handle JS floating point weirdness (e.g., 0.1 + 0.2)
              if (typeof result === 'number' && !Number.isInteger(result)) {
                  result = parseFloat(result.toFixed(10)); 
              }
              exp = result.toString();
            } catch (_) { exp = 'Error'; }
          } else {
            if (exp === 'Error') exp = '';
            
            // Auto-append opening parentheses for functions
            if (['sin', 'cos', 'tan', 'sqrt', 'log', 'ln', 'exp'].includes(v)) {
                exp += v + '(';
            } else {
                exp += v;
            }
          }
          resEl.innerText = exp || '0';
        };

        grid.querySelectorAll('button').forEach(btn => btn.onclick = () => process(btn.dataset.v));

        // Full Keyboard Support
        w._kh = (e) => {
          if (!w.classList.contains('focused')) return;
          const map = { Enter: '=', Escape: 'C', Backspace: 'del' };
          const v = map[e.key] || e.key;
          
          const validKeys = ['0','1','2','3','4','5','6','7','8','9','/','*','-','+','(',')','.','^','=','C','del'];
          if (validKeys.includes(v)) {
            e.preventDefault(); 
            process(v);
            
            // Trigger visual button press if it exists
            const btn = Array.from(grid.querySelectorAll('button')).find(b => b.dataset.v === v);
            if (btn) {
                btn.style.transform = 'scale(0.92)'; btn.style.filter = 'brightness(1.2)';
                setTimeout(() => { btn.style.transform = 'scale(1)'; btn.style.filter = 'brightness(1)'; }, 100);
            }
          }
        };
        document.addEventListener('keydown', w._kh);
      },

      onClose(w) { document.removeEventListener('keydown', w._kh); },
    },
  /* ------------------------------------------------------- */

clock: {
    id: 'clock', name: 'Clock Pro',
    iconClass: 'fa-regular fa-clock', themeClass: 'ic-clk',
    cpu: 1, mem: 5,

    onOpen(w) {
      w.style.width = '340px'; w.style.height = '380px';
      const c = w.querySelector('.win-content');

      c.innerHTML = `
        <div class="app-body" style="align-items:stretch; gap:0;">
          <div style="display:flex; border-bottom:1px solid var(--app-border); background:var(--app-surface-2);">
            <button id="tab-ana" class="clk-tab" style="flex:1; border:none; padding:10px; cursor:pointer; font-weight:600; font-size:12px; background:var(--app-surface); color:var(--app-accent); border-bottom:2px solid var(--app-accent);">Analog</button>
            <button id="tab-dig" class="clk-tab" style="flex:1; border:none; padding:10px; cursor:pointer; font-weight:600; font-size:12px; background:transparent; color:var(--app-text-2); border-bottom:2px solid transparent;">Digital</button>
            <button id="tab-sw" class="clk-tab" style="flex:1; border:none; padding:10px; cursor:pointer; font-weight:600; font-size:12px; background:transparent; color:var(--app-text-2); border-bottom:2px solid transparent;">Stopwatch</button>
          </div>
          
          <div id="view-ana" style="flex:1; display:flex; align-items:center; justify-content:center;">
            <div style="position:relative; width:200px; height:200px; border-radius:50%; border:3px solid var(--app-border); background:var(--app-surface-2); box-shadow:inset 0 0 20px rgba(0,0,0,.1);">
              <div style="position:absolute; top:50%; left:50%; width:10px; height:10px; background:var(--app-accent); border-radius:50%; transform:translate(-50%,-50%); z-index:10;"></div>
              <div id="hand-hr"  style="position:absolute; top:30%;   left:48.5%; width:3%;   height:20%; background:var(--app-text);     transform-origin:bottom center; border-radius:3px;"></div>
              <div id="hand-min" style="position:absolute; top:16%;   left:49%;   width:2%;   height:34%; background:var(--app-text-2);   transform-origin:bottom center; border-radius:3px;"></div>
              <div id="hand-sec" style="position:absolute; top:10%;   left:49.5%; width:1%;   height:40%; background:var(--app-danger);   transform-origin:bottom center;"></div>
            </div>
          </div>
          
          <div id="view-dig" style="flex:1; display:none; align-items:center; justify-content:center; flex-direction:column; gap:6px;">
            <div id="clk-t" style="font-size:48px; font-family:monospace; font-weight:700; letter-spacing:2px; color:var(--app-text);">00:00:00</div>
            <div id="clk-d" style="font-size:14px; color:var(--app-text-2);">—</div>
          </div>

          <div id="view-sw" style="flex:1; display:none; align-items:center; justify-content:center; flex-direction:column; gap:16px;">
            <div id="sw-t" style="font-size:44px; font-family:monospace; font-weight:700; letter-spacing:2px; color:var(--app-accent);">00:00.00</div>
            <div style="display:flex; gap:12px;">
                <button id="sw-start" style="padding:8px 24px; background:var(--app-success); border:none; border-radius:20px; color:#fff; font-weight:bold; cursor:pointer;">Start</button>
                <button id="sw-reset" style="padding:8px 24px; background:var(--app-surface-3); border:none; border-radius:20px; color:var(--app-text); font-weight:bold; cursor:pointer;">Reset</button>
            </div>
          </div>
        </div>`;

      const tabs = { ana: c.querySelector('#tab-ana'), dig: c.querySelector('#tab-dig'), sw: c.querySelector('#tab-sw') };
      const views = { ana: c.querySelector('#view-ana'), dig: c.querySelector('#view-dig'), sw: c.querySelector('#view-sw') };

      const switchTab = (active) => {
        Object.entries(tabs).forEach(([k, btn]) => {
          const isActive = k === active;
          btn.style.background = isActive ? 'var(--app-surface)' : 'transparent';
          btn.style.color = isActive ? 'var(--app-accent)' : 'var(--app-text-2)';
          btn.style.borderBottomColor = isActive ? 'var(--app-accent)' : 'transparent';
        });
        Object.entries(views).forEach(([k, v]) => (v.style.display = k === active ? 'flex' : 'none'));
      };

      tabs.ana.onclick = () => switchTab('ana');
      tabs.dig.onclick = () => switchTab('dig');
      tabs.sw.onclick = () => switchTab('sw');

      // --- Clock Logic ---
      const hands = { hr: c.querySelector('#hand-hr'), min: c.querySelector('#hand-min'), sec: c.querySelector('#hand-sec') };
      const tick = () => {
        if (!w.isConnected) return;
        const d = new Date();
        const h = d.getHours(), m = d.getMinutes(), s = d.getSeconds();
        c.querySelector('#clk-t').innerText = `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
        c.querySelector('#clk-d').innerText = d.toDateString();
        hands.sec.style.transform = `rotate(${s * 6}deg)`;
        hands.min.style.transform = `rotate(${m * 6 + s / 10}deg)`;
        hands.hr.style.transform  = `rotate(${(h % 12) * 30 + m / 2}deg)`;
      };
      w._int = setInterval(tick, 1000); tick();

      // --- Stopwatch Logic ---
      let swRunning = false, swStart = 0, swElapsed = 0;
      const swDisplay = c.querySelector('#sw-t'), btnStart = c.querySelector('#sw-start');
      
      const formatSw = (ms) => {
          let mins = Math.floor(ms / 60000).toString().padStart(2, '0');
          let secs = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0');
          let msec = Math.floor((ms % 1000) / 10).toString().padStart(2, '0');
          return `${mins}:${secs}.${msec}`;
      };
      
      const updateSw = () => { 
          if(swRunning) { 
              swDisplay.innerText = formatSw(Date.now() - swStart + swElapsed); 
              requestAnimationFrame(updateSw); 
          } 
      };
      
      btnStart.onclick = () => {
          if(swRunning) { 
              swRunning = false; swElapsed += Date.now() - swStart; 
              btnStart.innerText = "Start"; btnStart.style.background = "var(--app-success)"; 
          } else { 
              swRunning = true; swStart = Date.now(); updateSw(); 
              btnStart.innerText = "Stop"; btnStart.style.background = "var(--app-danger)"; 
          }
      };
      
      c.querySelector('#sw-reset').onclick = () => { 
          swRunning = false; swElapsed = 0; swDisplay.innerText = "00:00.00"; 
          btnStart.innerText = "Start"; btnStart.style.background = "var(--app-success)"; 
      };

      w._cleanup = () => { clearInterval(w._int); swRunning = false; };
    },
  },

  /* -------------------------------------------------------
     TIER 3 — CREATIVE & EXECUTION
     ------------------------------------------------------- */

  paint: {
    id: 'paint', name: 'Canvas Pro',
    iconClass: 'fa-solid fa-palette', themeClass: 'ic-pnt',
    cpu: 4, mem: 40,

    onOpen(w) {
      w.style.width = '720px'; w.style.height = '560px';
      const c = w.querySelector('.win-content');

      c.innerHTML = `
        <div class="app-toolbar">
          <input type="color" id="p-col" value="#000000" style="width:30px; height:30px; padding:2px; border:1px solid var(--app-border); border-radius:4px; cursor:pointer; background:transparent;" title="Color">
          <input type="range" id="p-siz" min="1" max="50" value="4" style="width:80px; accent-color:var(--app-accent);" title="Size">
          <select id="p-tool">
            <option value="brush">Brush</option><option value="eraser">Eraser</option>
            <option value="rect">Rectangle</option><option value="circ">Circle</option>
            <option value="line">Line</option><option value="text">Text</option>
          </select>
          <input type="text" id="p-text" placeholder="Stamp text…" style="width:100px; display:none;">
          <div class="sep"></div>
          <button id="p-undo"><i class="fa-solid fa-rotate-left"></i> Undo</button>
          <button id="p-clr" class="btn-danger"><i class="fa-solid fa-trash"></i> Clear</button>
          <div style="flex:1;"></div>
          <button id="p-sv" class="btn-accent"><i class="fa-solid fa-download"></i> Export PNG</button>
        </div>
        <div id="p-con" style="flex:1; background:#f8f8f8; position:relative; overflow:hidden;">
          <canvas id="p-cvs" style="position:absolute; top:0; left:0; cursor:crosshair; background:#ffffff;"></canvas>
        </div>`;

      const cvs = c.querySelector('#p-cvs');
      const ctx = cvs.getContext('2d');
      const toolSel = c.querySelector('#p-tool');
      const colInp = c.querySelector('#p-col');
      const sizInp = c.querySelector('#p-siz');
      const txtInp = c.querySelector('#p-text');

      let painting = false, startX, startY, snapshot;
      const undoStack = [];

      const saveState = () => {
        if (undoStack.length > 20) undoStack.shift();
        undoStack.push(ctx.getImageData(0, 0, cvs.width, cvs.height));
      };

      toolSel.onchange = () => { txtInp.style.display = toolSel.value === 'text' ? 'inline-block' : 'none'; };

      setTimeout(() => {
        const con = c.querySelector('#p-con');
        cvs.width = con.clientWidth; cvs.height = con.clientHeight;
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, cvs.width, cvs.height);
        saveState();
      }, 80);

      const pos = (e) => { const r = cvs.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };

      cvs.onmousedown = (e) => {
        [startX, startY] = pos(e);
        snapshot = ctx.getImageData(0, 0, cvs.width, cvs.height);
        if (toolSel.value === 'text') {
          ctx.font = `${+sizInp.value * 3}px sans-serif`;
          ctx.fillStyle = colInp.value;
          ctx.fillText(txtInp.value || 'Text', startX, startY);
          saveState(); return;
        }
        painting = true;
        if (toolSel.value === 'brush' || toolSel.value === 'eraser') { ctx.beginPath(); ctx.moveTo(startX, startY); }
      };

      cvs.onmousemove = (e) => {
        if (!painting) return;
        const [x, y] = pos(e);
        ctx.lineWidth = sizInp.value; ctx.lineCap = 'round';
        if (toolSel.value === 'brush') {
          ctx.strokeStyle = colInp.value; ctx.lineTo(x, y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, y);
        } else if (toolSel.value === 'eraser') {
          ctx.strokeStyle = '#ffffff'; ctx.lineTo(x, y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, y);
        } else {
          ctx.putImageData(snapshot, 0, 0);
          ctx.strokeStyle = colInp.value; ctx.beginPath();
          if (toolSel.value === 'rect') ctx.strokeRect(startX, startY, x - startX, y - startY);
          if (toolSel.value === 'circ') { ctx.arc(startX, startY, Math.hypot(x - startX, y - startY), 0, Math.PI * 2); ctx.stroke(); }
          if (toolSel.value === 'line') { ctx.moveTo(startX, startY); ctx.lineTo(x, y); ctx.stroke(); }
        }
      };

      cvs.onmouseup = cvs.onmouseleave = () => { if (painting) { painting = false; saveState(); } };

      c.querySelector('#p-undo').onclick = () => {
        if (undoStack.length > 1) { undoStack.pop(); ctx.putImageData(undoStack[undoStack.length - 1], 0, 0); }
        else { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, cvs.width, cvs.height); }
      };
      c.querySelector('#p-clr').onclick  = () => { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, cvs.width, cvs.height); saveState(); };
      c.querySelector('#p-sv').onclick   = function () {
        window.VFS.writeFile(`/images/artwork_${Date.now()}.png`, cvs.toDataURL());
        _H.flashSave(this, '<i class="fa-solid fa-download"></i> Export PNG');
      };
    },
  },

  /* ------------------------------------------------------- */

  whiteboard: {
    id: 'whiteboard', name: 'Mind Map Pro',
    iconClass: 'fa-solid fa-diagram-project', themeClass: 'ic-wbd',
    cpu: 4, mem: 30,

    onOpen(w) {
      w.style.width = '800px'; w.style.height = '600px';
      const c = w.querySelector('.win-content');

      c.innerHTML = `
        <div class="app-toolbar">
          <span style="font-size:11px; color:var(--app-text-2);">
            <i class="fa-solid fa-info-circle"></i>
            Dbl-click canvas to add node · <b>Shift+click</b> two nodes to connect
          </span>
          <div style="flex:1;"></div>
          <button id="wb-clr" class="btn-danger"><i class="fa-solid fa-trash"></i> Clear Board</button>
        </div>
        <div id="wb-canvas" style="
          flex:1; position:relative; overflow:hidden;
          background-color:var(--app-bg);
          background-image:linear-gradient(var(--app-border) 1px, transparent 1px),linear-gradient(90deg, var(--app-border) 1px, transparent 1px);
          background-size:24px 24px;">
          <svg id="wb-svg" style="position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:1;"></svg>
        </div>`;

      const canvas = c.querySelector('#wb-canvas');
      const svg = c.querySelector('#wb-svg');
      let nodes = [], lines = [], selected = null;

      const drawLines = () => {
        svg.innerHTML = '';
        const cr = canvas.getBoundingClientRect();
        lines.forEach(({ n1, n2 }) => {
          const r1 = n1.getBoundingClientRect(), r2 = n2.getBoundingClientRect();
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', r1.left - cr.left + r1.width / 2);
          line.setAttribute('y1', r1.top - cr.top + r1.height / 2);
          line.setAttribute('x2', r2.left - cr.left + r2.width / 2);
          line.setAttribute('y2', r2.top - cr.top + r2.height / 2);
          line.setAttribute('stroke', 'var(--app-accent)');
          line.setAttribute('stroke-width', '2');
          svg.appendChild(line);
        });
      };

      canvas.ondblclick = (e) => {
        if (e.target !== canvas) return;
        const node = document.createElement('div');
        node.contentEditable = true;
        node.innerText = 'New Idea';
        node.style.cssText = `
          position:absolute; left:${e.offsetX - 50}px; top:${e.offsetY - 20}px;
          background:var(--app-accent); color:var(--app-accent-text);
          padding:8px 16px; border-radius:8px; min-width:80px; text-align:center;
          font-size:13px; font-weight:600; cursor:grab; outline:none; z-index:10;
          box-shadow:0 4px 12px rgba(0,0,0,.2); border:2px solid transparent;`;

        let dragging = false, ox, oy;

        node.onmousedown = (ev) => {
          if (ev.button === 2) { ev.preventDefault(); node.remove(); lines = lines.filter(l => l.n1 !== node && l.n2 !== node); drawLines(); return; }
          if (ev.shiftKey) {
            ev.preventDefault();
            if (!selected) { selected = node; node.style.borderColor = '#fff'; }
            else if (selected !== node) { lines.push({ n1: selected, n2: node }); selected.style.borderColor = 'transparent'; selected = null; drawLines(); }
            else { selected.style.borderColor = 'transparent'; selected = null; }
            return;
          }
          if (document.activeElement === node) return;
          dragging = true; node.style.cursor = 'grabbing';
          ox = ev.clientX - node.offsetLeft; oy = ev.clientY - node.offsetTop; node.style.zIndex = 100;
        };
        const mm = (ev) => { if (dragging) { node.style.left = `${ev.clientX - ox}px`; node.style.top = `${ev.clientY - oy}px`; drawLines(); } };
        const mu = () => { if (dragging) { dragging = false; node.style.cursor = 'grab'; node.style.zIndex = 10; } };
        document.addEventListener('mousemove', mm);
        document.addEventListener('mouseup', mu);
        canvas.appendChild(node); nodes.push(node); node.focus();
      };

      c.querySelector('#wb-clr').onclick = () => {
        if (confirm('Clear board?')) { canvas.querySelectorAll('div').forEach(n => n.remove()); svg.innerHTML = ''; lines = []; nodes = []; }
      };

      w._int = setInterval(drawLines, 60);
      w._cleanup = () => clearInterval(w._int);
    },
  },

  /* ------------------------------------------------------- */

present: {
    id: 'present', name: 'Present Pro',
    iconClass: 'fa-solid fa-person-chalkboard', themeClass: 'ic-ppt',
    cpu: 3, mem: 35,

    onOpen(w) {
      w.style.width = '960px'; w.style.height = '660px';
      const c = w.querySelector('.win-content');
      
      // Initial state
      let slides = [{ html: `<div class='ppt-tb' contenteditable='true' style='position:absolute;top:35%;left:15%;width:70%;font-size:44px;text-align:center;font-weight:700;z-index:2;'>Untitled Presentation</div>`, theme: 'th-classic' }];
      let cur = 0;
      let activeEl = null; // Currently selected text box

      c.innerHTML = `
        <div class="app-toolbar" style="background:var(--app-surface-2); border-bottom:1px solid var(--app-border);">
          <button id="pr-play" class="btn-accent" title="Present Fullscreen"><i class="fa-solid fa-play"></i> Present</button>
          <div class="sep"></div>
          <button id="pr-add" title="New Slide"><i class="fa-solid fa-plus"></i> Slide</button>
          <button id="pr-del" title="Delete Slide" style="color:var(--app-danger);"><i class="fa-solid fa-trash"></i></button>
          <div class="sep"></div>
          <button id="pr-txt" title="Add Text Box"><i class="fa-solid fa-font"></i> Text</button>
          <button onclick="document.execCommand('bold',false,null)"><b>B</b></button>
          <button onclick="document.execCommand('italic',false,null)"><i>I</i></button>
          <button onclick="document.execCommand('underline',false,null)"><u>U</u></button>
          <input type="color" onchange="document.execCommand('foreColor',false,this.value)" title="Text Color" style="width:26px; height:26px; padding:0; border:1px solid var(--app-border); cursor:pointer;">
          <div class="sep"></div>
          <select id="pr-theme" title="Slide Theme" style="max-width:110px;">
            <option value="th-classic">Classic Light</option>
            <option value="th-dark">Modern Dark</option>
            <option value="th-grad">Sunset Gradient</option>
            <option value="th-neon">Cyber Neon</option>
          </select>
          <select id="pr-anim" title="Element Animation" style="max-width:110px;">
            <option value="">No Animation</option>
            <option value="an-fade">Fade In</option>
            <option value="an-slide">Slide Up</option>
            <option value="an-bounce">Bounce</option>
          </select>
        </div>
        <div style="display:flex; flex:1; background:var(--app-bg); min-height:0;">
          
          <div id="pr-sidebar" style="width:160px; background:var(--app-surface); border-right:1px solid var(--app-border); overflow-y:auto; padding:10px; display:flex; flex-direction:column; gap:10px;"></div>
          
          <div style="flex:1; display:flex; align-items:center; justify-content:center; padding:20px; overflow:auto; background:var(--app-bg);">
            <style>
              /* Themes */
              .th-classic { background: #ffffff; color: #222222; font-family: Arial, sans-serif; }
              .th-dark { background: #222222; color: #ffffff; font-family: 'Segoe UI', sans-serif; }
              .th-grad { background: linear-gradient(135deg, #ff9a9e, #fecfef); color: #333; font-family: Georgia, serif; }
              .th-neon { background: #000000; color: #00f3ff; font-family: monospace; text-shadow: 0 0 5px #00f3ff; }
              
              /* Animations */
              .an-fade { animation: prFade 0.8s ease forwards; } @keyframes prFade { from { opacity:0; } to { opacity:1; } }
              .an-slide { animation: prSlide 0.6s ease-out forwards; } @keyframes prSlide { from { transform:translateY(30px); opacity:0; } to { transform:translateY(0); opacity:1; } }
              .an-bounce { animation: prBounce 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; } @keyframes prBounce { 0% { transform:scale(0.8); opacity:0; } 100% { transform:scale(1); opacity:1; } }
              
              /* Editor UI */
              .ppt-tb { outline:1px dashed transparent; padding:8px; cursor:text; min-width:50px; min-height:30px; word-wrap:break-word; }
              .ppt-tb:hover, .ppt-tb.active { outline:2px dashed var(--app-accent); }
              .pr-thumb { width:100%; height:80px; border:2px solid var(--app-border); border-radius:4px; cursor:pointer; opacity:0.7; transition:0.2s; position:relative; overflow:hidden; background:#fff; }
              .pr-thumb.active { border-color:var(--app-accent); opacity:1; box-shadow:0 0 10px rgba(0,243,255,0.2); }
              .pr-thumb:hover { opacity:1; }
              .pr-thumb-num { position:absolute; bottom:2px; left:4px; font-size:10px; font-weight:bold; color:#000; background:rgba(255,255,255,0.8); padding:1px 4px; border-radius:2px; }
            </style>
            
            <div id="pr-cvs" style="width:800px; height:450px; box-shadow:0 8px 30px rgba(0,0,0,0.5); position:relative; overflow:hidden; border-radius:4px; transition:background 0.3s;">
                <div id="pr-content" style="width:100%; height:100%; position:relative;"></div>
            </div>
          </div>
        </div>`;

      const cvs = c.querySelector('#pr-cvs');
      const contentArea = c.querySelector('#pr-content');
      const sidebar = c.querySelector('#pr-sidebar');
      const themeSel = c.querySelector('#pr-theme');
      const animSel = c.querySelector('#pr-anim');

      const saveCurrentSlide = () => {
          if (contentArea.innerHTML) {
              slides[cur].html = contentArea.innerHTML;
          }
      };

      const makeDraggableAndSelectable = () => {
        contentArea.querySelectorAll('.ppt-tb').forEach(tb => {
          // Selection logic
          tb.onclick = (e) => {
              e.stopPropagation();
              contentArea.querySelectorAll('.ppt-tb').forEach(t => t.classList.remove('active'));
              tb.classList.add('active');
              activeEl = tb;
              
              // Sync animation dropdown to current element
              let currentAnim = Array.from(tb.classList).find(cls => cls.startsWith('an-'));
              animSel.value = currentAnim || "";
          };

          // Dragging logic
          if (tb._drag) return; tb._drag = true;
          let dragging = false, ox, oy;
          
          tb.onmousedown = (e) => {
            if (document.activeElement === tb) return; // Allow text selection if editing
            dragging = true; 
            ox = e.clientX - tb.offsetLeft; 
            oy = e.clientY - tb.offsetTop; 
            tb.style.zIndex = 100; 
          };
          
          document.addEventListener('mousemove', (e) => { 
              if (dragging) { 
                  tb.style.left = `${e.clientX - ox}px`; 
                  tb.style.top = `${e.clientY - oy}px`; 
              } 
          });
          
          document.addEventListener('mouseup', () => { 
              if (dragging) { 
                  dragging = false; 
                  tb.style.zIndex = ''; 
                  saveCurrentSlide(); 
              } 
          });
          
          tb.onkeyup = () => saveCurrentSlide();
        });
      };

      const renderSidebar = () => {
          sidebar.innerHTML = '';
          slides.forEach((sl, i) => {
              const thumb = document.createElement('div');
              thumb.className = `pr-thumb ${i === cur ? 'active' : ''} ${sl.theme}`;
              // Miniature preview approximation
              thumb.innerHTML = `<div style="transform:scale(0.15); transform-origin:top left; width:800px; height:450px; pointer-events:none;">${sl.html}</div><div class="pr-thumb-num">${i + 1}</div>`;
              thumb.onclick = () => { saveCurrentSlide(); cur = i; renderSlide(); };
              sidebar.appendChild(thumb);
          });
      };

      const renderSlide = () => {
        activeEl = null;
        animSel.value = "";
        
        cvs.className = slides[cur].theme; // Apply theme class
        themeSel.value = slides[cur].theme;
        
        // Re-trigger animations by cloning and replacing content
        contentArea.innerHTML = slides[cur].html;
        const cloned = contentArea.cloneNode(true);
        cvs.replaceChild(cloned, contentArea);
        
        // Update reference after replacement
        w.querySelector('.win-content').querySelector('#pr-content').id = 'pr-content'; 
        
        makeDraggableAndSelectable();
        renderSidebar();
      };

      // Deselect elements when clicking canvas background
      cvs.onclick = () => {
          contentArea.querySelectorAll('.ppt-tb').forEach(t => t.classList.remove('active'));
          activeEl = null;
          animSel.value = "";
      };

      // Toolbar Actions
      c.querySelector('#pr-add').onclick = () => {
        saveCurrentSlide();
        slides.splice(cur + 1, 0, { html: `<div class='ppt-tb' contenteditable='true' style='position:absolute;top:40%;left:30%;width:40%;font-size:32px;text-align:center;font-weight:bold;z-index:2;'>New Slide</div>`, theme: slides[cur].theme });
        cur++; renderSlide();
      };

      c.querySelector('#pr-del').onclick = () => {
          if (slides.length > 1) {
              slides.splice(cur, 1);
              if (cur >= slides.length) cur = slides.length - 1;
              renderSlide();
          } else {
              window.Notify("Cannot delete the last slide.", "warn");
          }
      };

      c.querySelector('#pr-txt').onclick = () => {
        const tb = document.createElement('div');
        tb.className = 'ppt-tb'; tb.contentEditable = 'true'; tb.innerText = 'Edit Text';
        tb.style.cssText = 'position:absolute; top:45%; left:35%; font-size:24px; min-width:150px; z-index:10;';
        c.querySelector('#pr-content').appendChild(tb); 
        saveCurrentSlide(); makeDraggableAndSelectable(); tb.focus();
      };

      themeSel.onchange = (e) => {
          slides[cur].theme = e.target.value;
          renderSlide();
      };

      animSel.onchange = (e) => {
          if (!activeEl) {
              window.Notify("Select a text box first to apply an animation.", "warn");
              animSel.value = "";
              return;
          }
          // Remove old animation classes
          activeEl.classList.remove('an-fade', 'an-slide', 'an-bounce');
          if (e.target.value) {
              activeEl.classList.add(e.target.value);
              // Force animation re-trigger for preview
              activeEl.style.animation = 'none';
              activeEl.offsetHeight; /* trigger reflow */
              activeEl.style.animation = null; 
          }
          saveCurrentSlide();
      };

      // Fullscreen Play Logic
      c.querySelector('#pr-play').onclick = () => {
          if (cvs.requestFullscreen) {
              cvs.requestFullscreen();
          } else if (cvs.webkitRequestFullscreen) { /* Safari */
              cvs.webkitRequestFullscreen();
          } else if (cvs.msRequestFullscreen) { /* IE11 */
              cvs.msRequestFullscreen();
          }
      };

      // Keyboard navigation for presentation
      w._kh = (e) => {
          if (!w.classList.contains('focused') && !document.fullscreenElement) return;
          if (document.activeElement && document.activeElement.classList.contains('ppt-tb')) return; // Don't flip slides while typing
          
          if (e.key === 'ArrowRight' || e.key === ' ') {
              e.preventDefault();
              if (cur < slides.length - 1) { saveCurrentSlide(); cur++; renderSlide(); }
          } else if (e.key === 'ArrowLeft') {
              e.preventDefault();
              if (cur > 0) { saveCurrentSlide(); cur--; renderSlide(); }
          }
      };
      document.addEventListener('keydown', w._kh);

      // Initial render
      renderSlide();
    },
    
    onClose(w) { document.removeEventListener('keydown', w._kh); }
  },
  
  /* ------------------------------------------------------- */

ide: {
    id: 'ide', name: 'IDE Pro',
    iconClass: 'fa-solid fa-code', themeClass: 'ic-ide',
    cpu: 3, mem: 40,

    onOpen(w, wm, ctx) {
      w.style.width = '900px'; w.style.height = '650px';
      const root = ctx?.path || '/code';

      // Bootstrap a default CodePen-style project if the folder is empty
      const existingFiles = window.VFS.readDir(root).filter(f => f !== '_sys_hidden');
      if (existingFiles.length === 0) {
        window.VFS.writeFile(`${root}/index.html`, '<h1>Hello World!</h1>\n<button id="btn">Click Me</button>');
        window.VFS.writeFile(`${root}/style.css`,  'body {\n  background: #1e1e1e;\n  color: #00f3ff;\n  font-family: monospace;\n  text-align: center;\n  margin-top: 50px;\n}\nbutton {\n  padding: 10px 20px;\n  background: #00f3ff;\n  border: none;\n  cursor: pointer;\n  font-weight: bold;\n}');
        window.VFS.writeFile(`${root}/script.js`,  'document.getElementById("btn").onclick = () => {\n  alert("IDE Pro is fully functional!");\n};');
      }

      const c = w.querySelector('.win-content');
      c.innerHTML = `
        <div class="app-toolbar" style="background:var(--app-surface-2);">
          <i class="fa-solid fa-folder-tree" style="color:var(--app-text-2);"></i>
          <code style="font-size:12px; color:var(--app-text-2); font-weight:bold;">${root}</code>
          <div class="sep"></div>
          <button id="i-new" title="New File"><i class="fa-solid fa-file-circle-plus"></i> New File</button>
          <div style="flex:1;"></div>
          <button id="i-save" style="background:var(--app-surface-3); color:var(--app-text); border-color:transparent;">
            <i class="fa-solid fa-floppy-disk"></i> Save
          </button>
          <button id="i-run" class="btn-accent"><i class="fa-solid fa-play"></i> Run Preview</button>
        </div>
        <div style="display:flex; flex:1; min-height:0; background:var(--app-bg);">
          
          <div style="flex:1; display:flex; flex-direction:column; border-right:1px solid var(--app-border); min-width:0;">
            
            <div id="ide-tabs" style="display:flex; background:var(--app-surface-2); border-bottom:1px solid var(--app-border); overflow-x:auto; flex-shrink:0;">
                </div>
            
            <div style="display:flex; flex:1; overflow:hidden;">
              <div id="i-lines" style="
                width:45px; background:var(--app-surface-2); color:var(--app-text-3);
                text-align:right; padding:16px 8px; font-family:'JetBrains Mono', Consolas, monospace; font-size:13px;
                user-select:none; overflow:hidden; flex-shrink:0; line-height:1.6; border-right:1px solid var(--app-border);">1</div>
              <textarea id="i-code" spellcheck="false" style="
                flex:1; background:var(--app-bg); color:var(--app-text); border:none;
                padding:16px 14px; font-family:'JetBrains Mono', Consolas, monospace;
                font-size:13px; line-height:1.6; outline:none; resize:none;
                white-space:pre; tab-size:4; overflow-y:auto;"></textarea>
            </div>
          </div>
          
          <div style="flex:1; display:flex; flex-direction:column; background:#ffffff; min-width:0;">
            <div style="background:var(--app-surface-3); color:var(--app-text); padding:8px 14px; font-size:12px; font-weight:600; border-bottom:1px solid var(--app-border); flex-shrink:0; display:flex; justify-content:space-between;">
              <span><i class="fa-solid fa-globe"></i> Live Preview</span>
              <span style="color:var(--app-text-3); font-weight:normal; font-family:monospace;">sandbox="allow-scripts allow-modals"</span>
            </div>
            <iframe id="i-frame" sandbox="allow-scripts allow-modals" style="width:100%; flex:1; border:none; background:#fff;"></iframe>
          </div>
        </div>`;

      let activeFile = 'index.html';
      const editor = c.querySelector('#i-code');
      const iframe = c.querySelector('#i-frame');
      const lineNos = c.querySelector('#i-lines');
      const tabsContainer = c.querySelector('#ide-tabs');

      // Sync Line Numbers
      const updateLines = () => {
        const n = editor.value.split('\n').length;
        lineNos.innerHTML = Array.from({ length: n }, (_, i) => i + 1).join('<br>');
        lineNos.scrollTop = editor.scrollTop;
      };

      editor.addEventListener('input', updateLines);
      editor.addEventListener('scroll', () => { lineNos.scrollTop = editor.scrollTop; });
      
      // Editor Hotkeys
      editor.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          e.preventDefault();
          const s = editor.selectionStart, en = editor.selectionEnd;
          editor.value = `${editor.value.slice(0, s)}    ${editor.value.slice(en)}`;
          editor.selectionStart = editor.selectionEnd = s + 4; updateLines();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 's') { 
            e.preventDefault(); 
            c.querySelector('#i-save').click(); 
        }
      });

      // Render Dynamic Tabs
      const renderTabs = () => {
          tabsContainer.innerHTML = '';
          const files = window.VFS.readDir(root).filter(f => f !== '_sys_hidden');
          
          files.forEach(fn => {
              const ext = fn.split('.').pop().toLowerCase();
              let icon = 'fa-file-code'; let color = 'var(--app-text-2)';
              if (ext === 'html') { icon = 'fa-html5'; color = '#e34f26'; }
              else if (ext === 'css') { icon = 'fa-css3-alt'; color = '#264de4'; }
              else if (ext === 'js') { icon = 'fa-js'; color = '#f7df1e'; }
              else if (ext === 'json') { icon = 'fa-brackets-curly'; color = '#00f3ff'; }

              const isActive = fn === activeFile;
              const btn = document.createElement('button');
              btn.style.cssText = `
                  border:none; padding:10px 18px; cursor:pointer; font-size:12px; font-weight:600; font-family:monospace; white-space:nowrap;
                  background:${isActive ? 'var(--app-bg)' : 'transparent'}; 
                  color:${isActive ? 'var(--app-text)' : 'var(--app-text-2)'}; 
                  border-top:2px solid ${isActive ? 'var(--app-accent)' : 'transparent'};
                  transition:0.1s;
              `;
              btn.innerHTML = `<i class="fa-brands ${icon} fallback-icon fa-solid" style="color:${isActive ? color : 'inherit'}; margin-right:5px;"></i> ${fn}`;
              
              btn.onclick = () => {
                  c.querySelector('#i-save').click(); // Auto-save current
                  loadFile(fn);
              };
              tabsContainer.appendChild(btn);
          });
      };

      // Load a specific file into the editor
      const loadFile = (fn) => {
        activeFile = fn;
        editor.value = window.VFS.readFile(`${root}/${fn}`) || '';
        updateLines();
        renderTabs();
      };

      // CodePen Bundler
      const run = () => {
        c.querySelector('#i-save').click();
        const html = window.VFS.readFile(`${root}/index.html`) || '';
        const css  = window.VFS.readFile(`${root}/style.css`)  || '';
        const js   = window.VFS.readFile(`${root}/script.js`)  || '';
        
        // Assemble standard web document
        const full = `<!DOCTYPE html>\n<html>\n<head>\n<style>\n${css}\n</style>\n</head>\n<body>\n${html}\n<script>\n${js}\n<\/script>\n</body>\n</html>`;
        
        const blob = new Blob([full], { type: 'text/html' });
        if (iframe.src?.startsWith('blob:')) URL.revokeObjectURL(iframe.src);
        iframe.src = URL.createObjectURL(blob);
      };

      // Toolbar Actions
      c.querySelector('#i-save').onclick = function () {
        window.VFS.writeFile(`${root}/${activeFile}`, editor.value);
        if (window._H && window._H.flashSave) window._H.flashSave(this, '<i class="fa-solid fa-floppy-disk"></i> Save');
        else {
            let orig = this.innerHTML;
            this.innerHTML = '<i class="fa-solid fa-check"></i> Saved';
            setTimeout(() => this.innerHTML = orig, 1000);
        }
      };

      c.querySelector('#i-new').onclick = () => {
          const fn = prompt("Enter new filename (e.g., config.json):");
          if (fn && fn.trim() !== '') {
              const safeName = fn.trim().replace(/[^a-zA-Z0-9.-]/g, '_');
              if (window.VFS.readFile(`${root}/${safeName}`) === null) {
                  window.VFS.writeFile(`${root}/${safeName}`, '');
                  loadFile(safeName);
              } else {
                  if (window.Notify) window.Notify("File already exists.", "warn");
              }
          }
      };

      c.querySelector('#i-run').onclick = run;

      // Initialize
      if (existingFiles.length === 0) loadFile('index.html');
      else loadFile(existingFiles.includes('index.html') ? 'index.html' : existingFiles[0]);
      
      run();
    },
  },

  /* -------------------------------------------------------
     TIER 4 — MEDIA & UTILITIES
     ------------------------------------------------------- */

  viewer: {
    id: 'viewer', name: 'Media Pro',
    iconClass: 'fa-regular fa-image', themeClass: 'ic-view',
    cpu: 2, mem: 25,

    onOpen(w, wm, ctx) {
      w.style.width = '660px'; w.style.height = '510px';
      const path = ctx?.path || '';
      const data = path ? window.VFS.readFile(path) : null;
      const c = w.querySelector('.win-content');

      const isImage  = data && (['.png','.jpg','.gif','.jpeg'].some(e => path.toLowerCase().endsWith(e)) || data.startsWith('data:image'));
      const isPDF    = data && (path.toLowerCase().endsWith('.pdf') || data.startsWith('data:application/pdf'));

      let content = '';
      if (!data) {
        content = `<div style="display:flex; flex-direction:column; align-items:center; justify-content:center; flex:1; gap:12px; color:var(--app-text-2);">
          <i class="fa-regular fa-folder-open" style="font-size:48px; color:var(--app-accent);"></i>
          <p style="margin:0; font-weight:600;">No media loaded</p>
          <p style="margin:0; font-size:12px;">Load a path or import a file above.</p>
        </div>`;
      } else if (isImage) {
        content = `
          <div style="flex:1; display:flex; align-items:center; justify-content:center; overflow:auto; position:relative; background:var(--app-surface-2);">
            <img id="v-img" src="${data}" style="max-width:95%; max-height:95%; object-fit:contain; box-shadow:0 8px 30px rgba(0,0,0,.3); transition:transform .2s;">
            <div style="position:absolute; bottom:16px; display:flex; gap:8px; background:rgba(0,0,0,.6); padding:6px 14px; border-radius:20px;">
              <button id="v-zi" style="background:transparent; border:none; color:#fff; cursor:pointer; font-size:15px;" title="Zoom in"><i class="fa-solid fa-magnifying-glass-plus"></i></button>
              <button id="v-zo" style="background:transparent; border:none; color:#fff; cursor:pointer; font-size:15px;" title="Zoom out"><i class="fa-solid fa-magnifying-glass-minus"></i></button>
            </div>
          </div>`;
      } else if (isPDF) {
        content = `<iframe src="${data}" style="width:100%; flex:1; border:none; background:#fff;"></iframe>`;
      } else {
        content = `<pre style="flex:1; margin:0; padding:16px; overflow:auto; font-family:monospace; font-size:12px; line-height:1.6; background:var(--app-surface); color:var(--app-text); white-space:pre-wrap;">${data.replace(/</g, '&lt;')}</pre>`;
      }

      c.innerHTML = `
        <div class="app-toolbar">
          <input id="v-p" type="text" value="${path}" placeholder="/images/photo.png" style="flex:1; font-family:monospace; font-size:11px;">
          <button id="v-ld"><i class="fa-solid fa-magnifying-glass"></i> Load</button>
          <button id="v-up" class="btn-accent"><i class="fa-solid fa-upload"></i> Import</button>
          <input type="file" id="v-fi" style="display:none;">
        </div>
        ${content}`;

      let zoom = 1;
      const img = c.querySelector('#v-img');
      if (img) {
        c.querySelector('#v-zi').onclick = () => { zoom = Math.min(zoom + 0.2, 5); img.style.transform = `scale(${zoom})`; };
        c.querySelector('#v-zo').onclick = () => { zoom = Math.max(zoom - 0.2, 0.1); img.style.transform = `scale(${zoom})`; };
      }

      c.querySelector('#v-ld').onclick = () => { wm.openApp('viewer', null, null, null, null, { path: c.querySelector('#v-p').value }); w.querySelector('.btn-x').click(); };
      c.querySelector('#v-up').onclick = () => c.querySelector('#v-fi').click();
      c.querySelector('#v-fi').onchange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          const dir = file.type.includes('image') ? '/images/' : '/documents/';
          window.VFS.writeFile(dir + file.name, ev.target.result);
          wm.openApp('viewer', null, null, null, null, { path: dir + file.name });
          w.querySelector('.btn-x').click();
        };
        reader.readAsDataURL(file);
      };
    },
  },

  /* ------------------------------------------------------- */

  pdf: {
    id: 'pdf', name: 'PDF Pro',
    iconClass: 'fa-solid fa-file-pdf', themeClass: 'ic-view',
    cpu: 2, mem: 25,

    onOpen(w, wm, ctx) {
      w.style.width = '700px'; w.style.height = '660px';
      const c = w.querySelector('.win-content');
      const path = ctx?.path;
      const data = path ? window.VFS.readFile(path) : null;
      const src  = data?.startsWith('data:application/pdf') ? data : null;

      const buildUI = (frameSrc) => {
        c.innerHTML = `
          <div class="app-toolbar" style="background:#b71c1c;">
            <span style="font-weight:700; font-size:13px; color:#fff;"><i class="fa-solid fa-file-pdf"></i> PDF Reader</span>
            <div style="flex:1;"></div>
            <button id="pdf-up" style="background:#fff; color:#b71c1c; border-color:transparent; font-weight:600;">
              <i class="fa-solid fa-upload"></i> Upload PDF
            </button>
            <input type="file" id="pdf-fi" accept="application/pdf" style="display:none;">
          </div>
          <div style="flex:1; background:#525659; display:flex; align-items:center; justify-content:center;">
            ${frameSrc
              ? `<iframe src="${frameSrc}" style="width:100%; height:100%; border:none;"></iframe>`
              : `<div style="text-align:center; color:var(--app-text-2); padding:40px;">
                   <i class="fa-solid fa-file-arrow-up" style="font-size:48px; margin-bottom:12px; display:block;"></i>
                   Upload a PDF to view it here
                 </div>`
            }
          </div>`;

        c.querySelector('#pdf-up').onclick = () => c.querySelector('#pdf-fi').click();
        c.querySelector('#pdf-fi').onchange = (e) => {
          if (e.target.files?.[0]) buildUI(URL.createObjectURL(e.target.files[0]));
        };
      };

      buildUI(src);
    },
  },

  /* ------------------------------------------------------- */

  music: {
    id: 'music', name: 'Music Pro',
    iconClass: 'fa-solid fa-music', themeClass: 'ic-mus',
    cpu: 2, mem: 20,

    onOpen(w) {
      w.style.width = '400px'; w.style.height = '530px';
      w._audio = new Audio(); w._audio.volume = 0.5;
      let playlist = [], cur = 0, loop = 0; // 0=off 1=all 2=track

      w.querySelector('.win-content').innerHTML = `
        <div style="padding:20px; text-align:center; background:var(--app-surface-2); border-bottom:1px solid var(--app-border);">
          <div id="m-ti" style="font-weight:700; font-size:18px; margin-bottom:4px; color:var(--app-text);">No Track</div>
          <div id="m-ar" style="color:var(--app-accent); font-size:12px; font-weight:600;">—</div>
          <div style="margin:16px 0 0; display:flex; align-items:center; gap:8px; font-size:11px; font-family:monospace; color:var(--app-text-2);">
            <span id="m-cr">0:00</span>
            <input type="range" id="m-pr" value="0" style="flex:1; accent-color:var(--app-accent); height:3px; cursor:pointer;">
            <span id="m-tt">0:00</span>
          </div>
          <div style="display:flex; justify-content:center; align-items:center; gap:20px; margin-top:16px;">
            <button id="m-p" style="background:transparent; border:none; color:var(--app-text-2); font-size:20px; cursor:pointer;"><i class="fa-solid fa-backward-step"></i></button>
            <button id="m-pl" style="background:var(--app-accent); border:none; color:var(--app-accent-text); width:52px; height:52px; border-radius:50%; font-size:20px; cursor:pointer; box-shadow:0 0 16px rgba(0,243,255,.3); display:flex; align-items:center; justify-content:center;"><i class="fa-solid fa-play"></i></button>
            <button id="m-n" style="background:transparent; border:none; color:var(--app-text-2); font-size:20px; cursor:pointer;"><i class="fa-solid fa-forward-step"></i></button>
          </div>
        </div>
        <div class="app-toolbar">
          <button id="m-lp"><i class="fa-solid fa-repeat"></i> Loop: Off</button>
          <div style="flex:1;"></div>
          <button id="m-up" class="btn-accent"><i class="fa-solid fa-folder-plus"></i> Add Files</button>
          <input type="file" id="m-file" accept="audio/*" multiple style="display:none;">
        </div>
        <div id="m-list" style="flex:1; overflow-y:auto; padding:10px; background:var(--app-bg);"></div>`;

      const audio = w._audio;
      const playBtn = w.querySelector('#m-pl');
      const listEl  = w.querySelector('#m-list');

      const renderList = () => {
        if (!playlist.length) {
          listEl.innerHTML = `<div style="text-align:center; padding:30px; color:var(--app-text-3); font-size:13px;">Add audio files to start listening.</div>`;
          return;
        }
        listEl.innerHTML = '';
        playlist.forEach((t, i) => {
          const d = document.createElement('div');
          d.style.cssText = `
            display:flex; justify-content:space-between; align-items:center;
            padding:10px 12px; border-radius:7px; margin-bottom:6px; cursor:pointer;
            transition:background .15s;
            background:${i === cur ? 'rgba(0,243,255,.08)' : 'var(--app-surface-2)'};
            border-left:3px solid ${i === cur ? 'var(--app-accent)' : 'transparent'};`;
          d.innerHTML = `
            <div style="overflow:hidden; min-width:0;">
              <div style="font-size:13px; font-weight:600; color:${i === cur ? 'var(--app-text)' : 'var(--app-text-2)'}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${t.title}</div>
              <div style="font-size:11px; color:var(--app-text-3); margin-top:2px;">${t.artist}</div>
            </div>
            <button class="m-del" style="background:transparent; border:none; color:var(--app-danger); cursor:pointer; font-size:13px; padding:4px 6px; flex-shrink:0;"><i class="fa-solid fa-trash"></i></button>`;
          d.onclick = () => load(i, true);
          d.querySelector('.m-del').onclick = (e) => {
            e.stopPropagation();
            playlist.splice(i, 1);
            if (cur === i) {
              audio.pause();
              if (playlist.length) load(0, true);
              else { audio.src = ''; w.querySelector('#m-ti').innerText = 'No Track'; w.querySelector('#m-ar').innerText = '—'; playBtn.innerHTML = '<i class="fa-solid fa-play"></i>'; renderList(); }
            } else if (cur > i) cur--;
            renderList();
          };
          listEl.appendChild(d);
        });
      };

      const load = (i, play = false) => {
        if (!playlist.length) return;
        cur = i; audio.src = playlist[cur].url;
        w.querySelector('#m-ti').innerText = playlist[cur].title;
        w.querySelector('#m-ar').innerText = playlist[cur].artist;
        renderList();
        if (play) { audio.play().catch(() => {}); playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>'; }
      };

      playBtn.onclick = () => {
        if (!audio.src && playlist.length) load(0);
        if (audio.paused && audio.src) { audio.play(); playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>'; }
        else { audio.pause(); playBtn.innerHTML = '<i class="fa-solid fa-play"></i>'; }
      };
      w.querySelector('#m-n').onclick = () => { if (playlist.length) load((cur + 1) % playlist.length, true); };
      w.querySelector('#m-p').onclick = () => { if (playlist.length) load((cur - 1 + playlist.length) % playlist.length, true); };
      w.querySelector('#m-lp').onclick = (e) => {
        loop = (loop + 1) % 3;
        const labels = ["<i class='fa-solid fa-repeat'></i> Loop: Off", "<i class='fa-solid fa-repeat'></i> Loop: All", "<i class='fa-solid fa-rotate'></i> Loop: Track"];
        e.target.innerHTML = labels[loop];
        e.target.style.color = loop > 0 ? 'var(--app-accent)' : 'var(--app-text)';
      };

      audio.ontimeupdate = () => {
        if (!audio.duration) return;
        w.querySelector('#m-pr').value = (audio.currentTime / audio.duration) * 100;
        w.querySelector('#m-cr').innerText = _H.fmtTime(audio.currentTime);
        w.querySelector('#m-tt').innerText = _H.fmtTime(audio.duration);
      };
      audio.onended = () => {
        if (loop === 2) load(cur, true);
        else if (loop === 1 || cur < playlist.length - 1) load((cur + 1) % playlist.length, true);
        else playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
      };
      w.querySelector('#m-pr').oninput = (e) => { audio.currentTime = (e.target.value / 100) * audio.duration; };

      w.querySelector('#m-up').onclick = () => w.querySelector('#m-file').click();
      w.querySelector('#m-file').onchange = (e) => {
        Array.from(e.target.files).forEach(f => playlist.push({ title: f.name.replace(/\.[^/.]+$/, ''), artist: 'Local Upload', url: URL.createObjectURL(f) }));
        renderList(); if (!audio.src) load(0);
      };
      renderList();
    },

    onClose(w) { if (w._audio) { w._audio.pause(); w._audio.src = ''; w._audio = null; } },
  },


  /* -------------------------------------------------------
     TIER 5 — GAMES & EXTRAS
     ------------------------------------------------------- */

'sticky': {
      id: 'sticky', name: 'Sticky Notes',
      iconClass: 'fa-regular fa-note-sticky', themeClass: 'ic-note',
      cpu: 1, mem: 10,

      onOpen(w) {
        w.style.width = '280px'; w.style.height = '320px';
        const c = w.querySelector('.win-content');
        
        // Load global state (so it persists even if you close the app or reboot)
        let saved = { text: 'Quick note...', bg: '#fdfd96', font: "'Comic Sans MS', 'Chalkboard SE', cursive" };
        try {
            let raw = localStorage.getItem('os_sticky_v12');
            if (raw) saved = JSON.parse(raw);
        } catch(e) {}

        // Pastel sticky note colors
        const COLORS = ['#fdfd96', '#ffb3ba', '#bae1ff', '#baffc9', '#ffdfba'];

        c.innerHTML = `
          <div class="app-toolbar" style="justify-content:center; gap:8px; padding:8px; background:var(--app-surface-2); border-bottom:1px solid var(--app-border);">
            ${COLORS.map(col => `
                <button class="stk-col" data-col="${col}" style="
                    width:20px; height:20px; border-radius:50%; background:${col}; 
                    border:2px solid ${saved.bg === col ? 'var(--app-accent)' : 'var(--app-border)'}; 
                    cursor:pointer; padding:0; transition:transform 0.1s, border 0.2s;" title="Change Color">
                </button>
            `).join('')}
            <div class="sep"></div>
            <select id="stk-fnt" style="border:1px solid var(--app-border); background:var(--app-input-bg); color:var(--app-text); border-radius:4px; padding:3px 5px; font-size:11px; outline:none; cursor:pointer;">
              <option value="'Comic Sans MS', 'Chalkboard SE', cursive" ${saved.font.includes('Comic') ? 'selected' : ''}>Handwriting</option>
              <option value="system-ui, sans-serif" ${saved.font.includes('system') ? 'selected' : ''}>Clean</option>
              <option value="'JetBrains Mono', Consolas, monospace" ${saved.font.includes('Mono') ? 'selected' : ''}>Code</option>
            </select>
          </div>
          <textarea id="stk-txt" spellcheck="false" style="
            flex:1; border:none; padding:18px; resize:none; outline:none;
            font-family:${saved.font}; font-size:16px; line-height:1.5; color:#222222;
            background:${saved.bg}; transition:background 0.3s; 
            box-shadow:inset 0 0 20px rgba(0,0,0,0.05);"></textarea>
        `;

        const ta = c.querySelector('#stk-txt');
        const save = () => localStorage.setItem('os_sticky_v12', JSON.stringify(saved));

        // Set initial text
        ta.value = saved.text;

        // Color Picker Logic
        c.querySelectorAll('.stk-col').forEach(btn => {
          btn.onclick = () => { 
              saved.bg = btn.dataset.col; 
              ta.style.background = saved.bg; 
              
              // Update borders
              c.querySelectorAll('.stk-col').forEach(b => b.style.borderColor = 'var(--app-border)');
              btn.style.borderColor = 'var(--app-accent)';
              save(); 
          };
          btn.onmouseenter = () => btn.style.transform = 'scale(1.15)';
          btn.onmouseleave = () => btn.style.transform = 'scale(1)';
        });

        // Font Picker Logic
        c.querySelector('#stk-fnt').onchange = (e) => { 
            saved.font = e.target.value; 
            ta.style.fontFamily = saved.font; 
            save(); 
        };

        // Text Input Logic (Auto-save)
        ta.oninput = (e) => { 
            saved.text = e.target.value; 
            save(); 
        };
      }
    },
    
  /* ------------------------------------------------------- */

  game2048: {
    id: 'game2048', name: '2048',
    iconClass: 'fa-solid fa-border-all', themeClass: 'ic-game',
    cpu: 2, mem: 15,

    onOpen(w) {
      w.style.width = '340px'; w.style.height = '460px';
      const c = w.querySelector('.win-content');

      c.innerHTML = `
        <div class="app-body" style="align-items:center; padding:20px; gap:16px; background:#faf8ef; color:#776e65;">
          <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
            <h2 style="margin:0; font-size:28px; font-weight:800; color:#776e65;">2048</h2>
            <div style="background:#bbada0; color:#fff; padding:6px 14px; border-radius:6px; font-size:13px; font-weight:700;">
              Score <span id="s2048">0</span>
            </div>
          </div>
          <div id="g2048" style="display:grid; grid-template-columns:repeat(4,1fr); gap:10px; background:#bbada0; padding:10px; border-radius:8px; width:100%; box-sizing:border-box;"></div>
          <button id="restart-2048" style="background:#8f7a66; color:#fff; border:none; padding:8px 20px; border-radius:6px; font-weight:600; cursor:pointer; font-size:13px;">New Game</button>
          <p style="margin:0; font-size:11px; color:#bbada0;">Use Arrow Keys</p>
        </div>`;

      const TILE_COLORS = { 2:'#eee4da',4:'#ede0c8',8:'#f2b179',16:'#f59563',32:'#f67c5f',64:'#f65e3b',128:'#edcf72',256:'#edcc61',512:'#edc850',1024:'#edc53f',2048:'#edc22e' };
      let board = Array(16).fill(0), score = 0;

      const addTile = () => {
        const empty = board.map((v, i) => v === 0 ? i : -1).filter(v => v !== -1);
        if (empty.length) board[empty[Math.floor(Math.random() * empty.length)]] = Math.random() > 0.1 ? 2 : 4;
      };

      const draw = () => {
        const g = c.querySelector('#g2048');
        g.innerHTML = '';
        board.forEach(v => {
          const tile = document.createElement('div');
          tile.style.cssText = `
            height:60px; border-radius:5px; display:flex; align-items:center; justify-content:center;
            font-size:${v > 512 ? '16px' : '22px'}; font-weight:800;
            background:${TILE_COLORS[v] || (v ? '#3c3a32' : 'rgba(238,228,218,.35)')};
            color:${v > 4 ? '#f9f6f2' : '#776e65'};`;
          if (v) tile.innerText = v;
          g.appendChild(tile);
        });
        c.querySelector('#s2048').innerText = score;
      };

      const slide = (arr) => {
        let a = arr.filter(v => v);
        for (let i = 0; i < a.length - 1; i++) {
          if (a[i] === a[i + 1]) { a[i] *= 2; score += a[i]; a.splice(i + 1, 1); }
        }
        while (a.length < 4) a.push(0);
        return a;
      };

      const move = (dir) => {
        let moved = false;
        for (let i = 0; i < 4; i++) {
          const row = dir === 'L' || dir === 'R'
            ? [board[i*4], board[i*4+1], board[i*4+2], board[i*4+3]]
            : [board[i], board[i+4], board[i+8], board[i+12]];
          const slid = dir === 'R' || dir === 'D' ? slide([...row].reverse()).reverse() : slide([...row]);
          if (row.join() !== slid.join()) moved = true;
          slid.forEach((v, j) => { if (dir === 'L' || dir === 'R') board[i*4+j] = v; else board[i+j*4] = v; });
        }
        if (moved) { addTile(); draw(); }
      };

      const restart = () => { board = Array(16).fill(0); score = 0; addTile(); addTile(); draw(); };

      c.querySelector('#restart-2048').onclick = restart;

      w._kh = (e) => {
        if (!w.classList.contains('focused')) return;
        const map = { ArrowLeft:'L', ArrowRight:'R', ArrowUp:'U', ArrowDown:'D' };
        if (map[e.key]) { e.preventDefault(); move(map[e.key]); }
      };
      document.addEventListener('keydown', w._kh);
      restart();
    },

    onClose(w) { document.removeEventListener('keydown', w._kh); },
  },

  /* ------------------------------------------------------- */

flappy: {
    id: 'flappy', name: 'Flappy Pro',
    iconClass: 'fa-solid fa-kiwi-bird', themeClass: 'ic-game',
    cpu: 4, mem: 20,

    onOpen(w) {
      w.style.width = '340px'; w.style.height = '520px';
      const c = w.querySelector('.win-content');

      // UI Overlay HTML
      c.innerHTML = `
        <div style="position:relative; width:100%; height:100%; background:#70c5ce; overflow:hidden; user-select:none;">
          <canvas id="fl-cvs" width="340" height="490" style="display:block;"></canvas>
          
          <div id="fl-ui-start" style="position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; z-index:10;">
             <img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='60'><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Impact, sans-serif' font-size='40' fill='%23fff' stroke='%23000' stroke-width='2'>FLAPPY</text></svg>" style="margin-bottom:20px; filter:drop-shadow(0 4px 0 rgba(0,0,0,0.2));">
             <div style="color:#fff; font-family:'Press Start 2P', Impact, sans-serif; font-size:20px; -webkit-text-stroke: 1px #000; text-shadow: 0 3px 0 #000, 0 4px 5px rgba(0,0,0,0.5); animation: pulse 1s infinite;">TAP TO FLY</div>
          </div>

          <div id="fl-ui-over" style="position:absolute; inset:0; display:none; flex-direction:column; align-items:center; justify-content:center; z-index:10; background:rgba(0,0,0,0.3);">
             <div style="color:#ff5f56; font-family:Impact, sans-serif; font-size:48px; -webkit-text-stroke: 2px #fff; text-shadow: 0 4px 0 #000; margin-bottom:20px;">GAME OVER</div>
             <div style="background:#ded895; border:4px solid #555; border-radius:10px; width:220px; padding:15px; box-shadow: 0 8px 0 rgba(0,0,0,0.2); text-align:center; position:relative;">
                <div style="color:#e67e22; font-family:Impact, sans-serif; font-size:20px; text-transform:uppercase;">Score</div>
                <div id="fl-score-val" style="color:#fff; font-family:Impact, sans-serif; font-size:36px; -webkit-text-stroke: 1.5px #000; text-shadow: 0 2px 0 #000;">0</div>
                <div style="color:#e67e22; font-family:Impact, sans-serif; font-size:20px; text-transform:uppercase; margin-top:10px;">Best</div>
                <div id="fl-best-val" style="color:#fff; font-family:Impact, sans-serif; font-size:36px; -webkit-text-stroke: 1.5px #000; text-shadow: 0 2px 0 #000;">0</div>
             </div>
             <button id="fl-btn-ok" style="margin-top:30px; background:#e67e22; border:3px solid #fff; border-radius:8px; color:#fff; font-family:Impact; font-size:24px; padding:10px 30px; cursor:pointer; box-shadow: 0 4px 0 #000; transition:transform 0.1s;">OK</button>
          </div>
          
          <div id="fl-ui-live" style="position:absolute; top:20px; width:100%; text-align:center; display:none; z-index:5;">
            <span id="fl-live-val" style="color:#fff; font-family:Impact, sans-serif; font-size:54px; -webkit-text-stroke: 2px #000; text-shadow: 0 4px 0 rgba(0,0,0,0.5);">0</span>
          </div>

          <style>@keyframes pulse { 0% { transform:scale(1); } 50% { transform:scale(1.05); } 100% { transform:scale(1); } }</style>
        </div>`;

      const cvs = c.querySelector('#fl-cvs');
      const ctx = cvs.getContext('2d');
      const uiStart = c.querySelector('#fl-ui-start');
      const uiOver = c.querySelector('#fl-ui-over');
      const uiLive = c.querySelector('#fl-ui-live');
      const txtLive = c.querySelector('#fl-live-val');
      const btnOk = c.querySelector('#fl-btn-ok');

      // --- GAME STATE ---
      let frames = 0, score = 0;
      let state = { current: 0, getReady: 0, game: 1, over: 2 };
      let bestScore = parseInt(localStorage.getItem('os_flappy_best')) || 0;

      // --- GAME OBJECTS ---
      const bg = {
        sX: 0, sY: 0, w: 340, h: 226, x: 0, y: 490 - 226 - 110,
        draw() {
            ctx.fillStyle = '#70c5ce'; ctx.fillRect(0, 0, 340, 490);
            // Draw City Silhouette
            ctx.fillStyle = '#d1f4f5'; ctx.fillRect(0, this.y + 50, 340, 200);
            ctx.fillStyle = '#a1e4e6'; ctx.fillRect(20, this.y + 80, 40, 150);
            ctx.fillRect(80, this.y + 60, 60, 150);
            ctx.fillRect(180, this.y + 90, 50, 150);
            ctx.fillRect(260, this.y + 70, 70, 150);
        }
      };

      const fg = {
        h: 110, x: 0, y: 490 - 110,
        draw() {
            ctx.fillStyle = '#ded895'; ctx.fillRect(this.x, this.y, 340, this.h);
            ctx.fillStyle = '#73bf2e'; ctx.fillRect(this.x, this.y, 340, 15);
            ctx.fillStyle = '#543847'; ctx.fillRect(this.x, this.y, 340, 3);
            
            // Angled stripes to simulate motion
            ctx.strokeStyle = '#d0ca83'; ctx.lineWidth = 10;
            for(let i = 0; i < 25; i++) {
                ctx.beginPath();
                ctx.moveTo(this.x + (i * 25), this.y + 15);
                ctx.lineTo(this.x + (i * 25) - 30, this.y + this.h);
                ctx.stroke();
            }
        },
        update() { if(state.current === state.game) this.x = (this.x - 2) % 25; }
      };

      const bird = {
        x: 60, y: 150, w: 34, h: 24, radius: 12,
        gravity: 0.25, jump: 4.6, speed: 0, rotation: 0,
        
        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);

            // Wing animation logic
            let flapPos = state.current === state.getReady ? (frames % 20 < 10 ? 2 : -2) : (this.speed < 0 ? -4 : 2);

            // Body
            ctx.fillStyle = '#f1c40f'; ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI*2); ctx.fill();
            ctx.lineWidth = 2; ctx.strokeStyle = '#000'; ctx.stroke();
            
            // Eye & Pupil
            ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(5, -4, 5, 0, Math.PI*2); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(7, -4, 2, 0, Math.PI*2); ctx.fill();
            
            // Beak
            ctx.fillStyle = '#e67e22'; ctx.beginPath(); ctx.rect(8, 0, 12, 6); ctx.fill(); ctx.stroke();
            
            // Wing
            ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(-4, flapPos, 6, 4, -0.2, 0, Math.PI*2); ctx.fill(); ctx.stroke();

            ctx.restore();
        },
        
        flap() { this.speed = -this.jump; },
        
        update() {
            if(state.current === state.getReady) {
                this.y = 150 + Math.cos(frames/10) * 5; // Hover
                this.rotation = 0;
            } else {
                this.speed += this.gravity;
                this.y += this.speed;

                // Floor collision
                if(this.y + this.radius >= fg.y) {
                    this.y = fg.y - this.radius;
                    if(state.current === state.game) gameOver();
                }
                
                // Ceiling collision
                if(this.y - this.radius <= 0) {
                    this.y = this.radius;
                    this.speed = 0;
                }

                // Tilt calculation
                if(this.speed >= this.jump) {
                    this.rotation = Math.min(Math.PI/2, this.rotation + 0.1);
                } else {
                    this.rotation = -0.3; // Nose up when flapping
                }
            }
        }
      };

      const pipes = {
        position: [], width: 52, gap: 110, dx: 2,
        
        draw() {
            for(let i = 0; i < this.position.length; i++) {
                let p = this.position[i];
                let topY = p.y;
                let bottomY = p.y + this.gap;

                // Top Pipe Body
                ctx.fillStyle = '#73bf2e'; ctx.fillRect(p.x, 0, this.width, topY);
                ctx.lineWidth = 2; ctx.strokeStyle = '#543847'; ctx.strokeRect(p.x, -2, this.width, topY + 2);
                // Top Cap
                ctx.fillRect(p.x - 4, topY - 24, this.width + 8, 24);
                ctx.strokeRect(p.x - 4, topY - 24, this.width + 8, 24);

                // Bottom Pipe Body
                ctx.fillRect(p.x, bottomY, this.width, fg.y - bottomY);
                ctx.strokeRect(p.x, bottomY, this.width, fg.y - bottomY);
                // Bottom Cap
                ctx.fillRect(p.x - 4, bottomY, this.width + 8, 24);
                ctx.strokeRect(p.x - 4, bottomY, this.width + 8, 24);
            }
        },
        
        update() {
            if(state.current !== state.game) return;
            
            // Add pipes
            if(frames % 100 === 0) {
                this.position.push({ x: 340, y: Math.random() * 200 + 50, passed: false });
            }

            for(let i = 0; i < this.position.length; i++) {
                let p = this.position[i];
                p.x -= this.dx;

                // Collision Detection (Circle vs Rectangles)
                let birdL = bird.x - bird.radius + 4; // Tolerance
                let birdR = bird.x + bird.radius - 4;
                let birdT = bird.y - bird.radius + 4;
                let birdB = bird.y + bird.radius - 4;

                if(birdR > p.x && birdL < p.x + this.width) {
                    if(birdT < p.y || birdB > p.y + this.gap) {
                        gameOver();
                    }
                }

                // Score increment
                if(p.x + this.width < bird.x && !p.passed) {
                    score++; p.passed = true;
                    txtLive.innerText = score;
                }

                // Remove off-screen pipes
                if(p.x + this.width <= 0) { this.position.shift(); i--; }
            }
        },
        reset() { this.position = []; }
      };

      // --- GAME FLOW ---
      const gameOver = () => {
          state.current = state.over;
          uiLive.style.display = 'none';
          uiOver.style.display = 'flex';
          c.querySelector('#fl-score-val').innerText = score;
          
          if(score > bestScore) {
              bestScore = score;
              localStorage.setItem('os_flappy_best', bestScore);
          }
          c.querySelector('#fl-best-val').innerText = bestScore;
      };

      const loop = () => {
          if (!w.isConnected) return; // Kill loop if window closed
          
          ctx.clearRect(0, 0, 340, 490);
          bg.draw();
          pipes.draw();
          pipes.update();
          fg.draw();
          fg.update();
          bird.draw();
          bird.update();
          
          frames++;
          w._reqAnim = requestAnimationFrame(loop);
      };

      // --- CONTROLS ---
      const input = () => {
          switch(state.current) {
              case state.getReady:
                  state.current = state.game;
                  uiStart.style.display = 'none';
                  uiLive.style.display = 'block';
                  txtLive.innerText = score;
                  bird.flap();
                  break;
              case state.game:
                  bird.flap();
                  break;
          }
      };

      btnOk.onclick = () => {
          pipes.reset();
          bird.speed = 0; bird.y = 150; bird.rotation = 0;
          score = 0; frames = 0;
          state.current = state.getReady;
          uiOver.style.display = 'none';
          uiStart.style.display = 'flex';
      };

      btnOk.onmousedown = () => btnOk.style.transform = 'scale(0.9)';
      btnOk.onmouseup = () => btnOk.style.transform = 'scale(1)';

      // Mouse/Touch
      c.querySelector('canvas').onmousedown = input;

      // Keyboard
      w._kh = (e) => {
          if (w.classList.contains('focused') && (e.code === 'Space' || e.code === 'ArrowUp')) {
              e.preventDefault();
              input();
          }
      };
      document.addEventListener('keydown', w._kh);

      // Start the engine
      loop();
    },

    onClose(w) { 
        document.removeEventListener('keydown', w._kh); 
        cancelAnimationFrame(w._reqAnim); 
    }
  },
  /* ------------------------------------------------------- */

  'sudoku': {
      id: 'sudoku', name: 'Sudoku Pro',
      iconClass: 'fa-solid fa-table-cells', themeClass: 'ic-game',
      cpu: 2, mem: 15,

      onOpen(w) {
        w.style.width = '420px'; w.style.height = '520px';
        const c = w.querySelector('.win-content');

        c.innerHTML = `
          <div class="app-toolbar">
            <select id="su-diff" style="font-weight:600;">
              <option value="30">Easy</option>
              <option value="45" selected>Medium</option>
              <option value="55">Hard</option>
              <option value="64">Expert</option>
            </select>
            <button id="su-new"><i class="fa-solid fa-rotate"></i> New Game</button>
            <div style="flex:1;"></div>
            <button id="su-chk" class="btn-accent"><i class="fa-solid fa-check-double"></i> Check Board</button>
          </div>
          <div class="app-body" style="align-items:center; justify-content:center; padding:15px; background:var(--app-bg);">
            <div id="su-grid" style="
              display:grid; grid-template-columns:repeat(9, 1fr); gap:1px; 
              background:var(--app-border); border:3px solid var(--app-border); 
              border-radius:4px; box-shadow:0 8px 25px rgba(0,0,0,0.2);">
            </div>
          </div>`;

        const grid = c.querySelector('#su-grid');
        const diffSel = c.querySelector('#su-diff');
        let currentSolution = [];
        let currentPuzzle = [];

        // Engine: Generates infinite puzzles by shuffling a valid base board
        const generateGame = (difficulty) => {
          // A valid, complete base board
          let sol = [
            5,3,4,6,7,8,9,1,2, 6,7,2,1,9,5,3,4,8, 1,9,8,3,4,2,5,6,7,
            8,5,9,7,6,1,4,2,3, 4,2,6,8,5,3,7,9,1, 7,1,3,9,2,4,8,5,6,
            9,6,1,5,3,7,2,8,4, 2,8,7,4,1,9,6,3,5, 3,4,5,2,8,6,1,7,9
          ];

          // Shuffle digits (e.g., swap all 1s with 7s) to create unique variations
          for(let i=1; i<=9; i++) {
              let r = Math.floor(Math.random() * 9) + 1;
              sol = sol.map(x => x === i ? -1 : (x === r ? i : x)).map(x => x === -1 ? r : x);
          }

          currentSolution = [...sol];
          currentPuzzle = [...sol];

          // Masking: Remove cells based on difficulty
          let removed = 0;
          while (removed < difficulty) {
              let idx = Math.floor(Math.random() * 81);
              if (currentPuzzle[idx] !== 0) {
                  currentPuzzle[idx] = 0;
                  removed++;
              }
          }
          
          renderBoard();
        };

        const renderBoard = () => {
          grid.innerHTML = '';
          currentPuzzle.forEach((v, i) => {
            const col = i % 9, row = Math.floor(i / 9);
            const cell = document.createElement('input');
            
            cell.type = 'text'; cell.maxLength = 1;
            cell.dataset.i = i;

            // Thick borders for the 3x3 sub-grids
            const thickR = (col === 2 || col === 5) ? 'border-right:3px solid var(--app-border);' : '';
            const thickB = (row === 2 || row === 5) ? 'border-bottom:3px solid var(--app-border);' : '';
            
            // Checkerboard subtle shading for 3x3 zones
            const isAltZone = (Math.floor(col/3) + Math.floor(row/3)) % 2 === 0;

            cell.style.cssText = `
              width:38px; height:38px; border:none; outline:none; text-align:center;
              font-size:20px; font-weight:700; color:var(--app-text); transition:0.2s;
              background:${isAltZone ? 'var(--app-surface-2)' : 'var(--app-surface)'};
              ${thickR} ${thickB}
            `;

            if (v !== 0) { 
                cell.value = v; 
                cell.readOnly = true; 
            } else {
                cell.style.color = 'var(--app-accent)'; // User inputs are neon colored
                cell.style.cursor = 'text';
                
                // Focus styling
                cell.onfocus = () => cell.style.background = 'var(--app-surface-3)';
                cell.onblur = () => cell.style.background = isAltZone ? 'var(--app-surface-2)' : 'var(--app-surface)';
                
                // Input restriction (1-9 only)
                cell.oninput = function() { 
                    this.value = this.value.replace(/[^1-9]/g, ''); 
                    this.style.color = 'var(--app-accent)'; // Reset color if fixing a mistake
                };
            }
            grid.appendChild(cell);
          });
        };

        // Event Listeners
        c.querySelector('#su-new').onclick = () => generateGame(parseInt(diffSel.value));
        
        c.querySelector('#su-chk').onclick = function() {
          let win = true;
          let emptyFound = false;

          grid.querySelectorAll('input').forEach(cell => {
            if (cell.readOnly && cell.style.color !== 'var(--app-danger)' && cell.style.color !== 'var(--app-success)') return; // Skip original locked cells
            
            if (cell.value === '') {
                emptyFound = true;
                win = false;
                return;
            }

            const val = parseInt(cell.value);
            const idx = parseInt(cell.dataset.i);
            
            if (val === currentSolution[idx]) {
                cell.style.color = 'var(--app-success)';
                cell.style.backgroundColor = 'rgba(67, 233, 123, 0.1)';
                cell.readOnly = true; // Lock correct answers
            } else {
                cell.style.color = 'var(--app-danger)';
                cell.style.backgroundColor = 'rgba(255, 95, 86, 0.1)';
                win = false;
            }
          });

          if (win) {
              window.Notify('🎉 Perfect! You solved the puzzle!', 'success');
              if (window._H) window._H.flashSave(this, '<i class="fa-solid fa-trophy"></i> Solved!');
          } else if (!emptyFound) {
              window.Notify('Oops! You have some incorrect numbers (marked in red).', 'err');
          } else {
              window.Notify('Keep going! There are still empty cells.', 'info');
          }
        };

        // Boot the first game automatically
        generateGame(parseInt(diffSel.value));
      }
    },


  /* -------------------------------------------------------
     TIER 6 — NETWORK & SYSTEM TOOLS
     ------------------------------------------------------- */

browser: {
    id: 'browser', name: 'Web Browser',
    iconClass: 'fa-solid fa-globe', themeClass: 'ic-view',
    cpu: 4, mem: 40,

    onOpen(w) {
      w.style.width = '850px'; w.style.height = '600px';
      const c = w.querySelector('.win-content');

      // Stunning Native Homepage HTML
      const homeHTML = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
          <style>
            body { 
                margin: 0; padding: 0; font-family: 'Segoe UI', system-ui, sans-serif; 
                background: url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072') center/cover no-repeat; 
                color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; 
                height: 100vh; overflow: hidden;
            }
            .overlay { position: absolute; inset: 0; background: rgba(10, 10, 20, 0.7); backdrop-filter: blur(8px); z-index: -1; }
            #clock { font-size: 5rem; font-weight: 300; margin-bottom: 30px; letter-spacing: 2px; text-shadow: 0 4px 20px rgba(0,0,0,0.5); }
            
            .search-box { 
                display: flex; align-items: center; background: rgba(255,255,255,0.1); 
                border: 1px solid rgba(255,255,255,0.2); padding: 15px 25px; border-radius: 30px; 
                width: 100%; max-width: 550px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); 
                transition: 0.3s;
            }
            .search-box:focus-within { 
                background: rgba(255,255,255,0.15); border-color: var(--neon-accent, #00f3ff); 
                box-shadow: 0 10px 40px rgba(0, 243, 255, 0.2); 
            }
            .search-box input { 
                flex: 1; background: transparent; border: none; outline: none; 
                color: #fff; font-size: 16px; margin-left: 15px; 
            }
            .search-box input::placeholder { color: rgba(255,255,255,0.6); }
            
            .quick-links { display: flex; gap: 25px; margin-top: 50px; }
            .ql-item { 
                display: flex; flex-direction: column; align-items: center; 
                text-decoration: none; color: #fff; transition: 0.2s; cursor: pointer; position: relative;
            }
            .ql-item:hover { transform: translateY(-5px); }
            .ql-icon { 
                width: 55px; height: 55px; background: rgba(255,255,255,0.1); 
                border: 1px solid rgba(255,255,255,0.2); border-radius: 14px; 
                display: flex; align-items: center; justify-content: center; 
                font-size: 26px; margin-bottom: 10px; transition: 0.2s;
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            }
            .ql-item:hover .ql-icon { 
                background: rgba(0,243,255,0.2); border-color: #00f3ff; color: #00f3ff;
            }
            .ql-text { font-size: 12px; font-weight: 500; opacity: 0.9; text-shadow: 0 2px 5px rgba(0,0,0,0.5); display: flex; align-items: center; gap: 4px; }
          </style>
        </head>
        <body>
          <div class="overlay"></div>
          <div id="clock">12:00</div>
          
          <div class="search-box">
            <i class="fa-brands fa-bing" style="color:#00f3ff; font-size:22px;"></i>
            <input type="text" id="search-input" placeholder="Search the web..." autocomplete="off" autofocus>
          </div>
          
          <div class="quick-links">
            <a class="ql-item" href="https://en.wikipedia.org/wiki/Main_Page"><div class="ql-icon"><i class="fa-brands fa-wikipedia-w"></i></div><div class="ql-text">Wikipedia</div></a>
            <a class="ql-item" href="https://duckduckgo.com"><div class="ql-icon"><i class="fa-solid fa-user-secret"></i></div><div class="ql-text">DuckDuckGo</div></a>
            <a class="ql-item" href="https://www.w3schools.com"><div class="ql-icon"><i class="fa-solid fa-code"></i></div><div class="ql-text">W3Schools</div></a>
            <a class="ql-item" href="https://www.openstreetmap.org"><div class="ql-icon"><i class="fa-solid fa-map-location-dot"></i></div><div class="ql-text">Maps</div></a>
          </div>

          <script>
            // Live Clock
            const updateClock = () => {
              const d = new Date();
              document.getElementById('clock').innerText = d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            };
            setInterval(updateClock, 1000); updateClock();
            
            // Search Engine Routing
            const input = document.getElementById('search-input');
            input.addEventListener('keydown', (e) => {
              if(e.key === 'Enter' && input.value.trim() !== '') {
                const query = input.value.trim();
                const isUrl = /^([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(?:\\/.*)?$/.test(query);
                if(isUrl) {
                    window.location.href = query.startsWith('http') ? query : 'https://' + query;
                } else {
                    window.location.href = 'https://www.bing.com/search?q=' + encodeURIComponent(query);
                }
              }
            });
          </script>
        </body>
        </html>
      `;
      const homeBlob = new Blob([homeHTML], { type: 'text/html' });
      const homeUrl = URL.createObjectURL(homeBlob);

      c.innerHTML = `
        <div class="app-toolbar" style="background:var(--app-surface-2); padding:8px 12px; gap:8px;">
          <button id="br-back" title="Back" style="width:32px; justify-content:center; padding:5px 0;"><i class="fa-solid fa-arrow-left"></i></button>
          <button id="br-fwd" title="Forward" style="width:32px; justify-content:center; padding:5px 0;"><i class="fa-solid fa-arrow-right"></i></button>
          <button id="br-ref" title="Reload" style="width:32px; justify-content:center; padding:5px 0;"><i class="fa-solid fa-rotate-right"></i></button>
          <button id="br-home" title="Home" style="width:32px; justify-content:center; padding:5px 0;"><i class="fa-solid fa-house"></i></button>
          
          <div style="flex:1; display:flex; align-items:center; background:var(--app-input-bg); border:1px solid var(--app-border); border-radius:15px; padding:0 12px; transition:0.2s;" id="url-container">
            <i class="fa-solid fa-globe" style="color:var(--app-text-3); font-size:12px;"></i>
            <input id="url-bar" type="text" placeholder="Search or enter web address" style="flex:1; border:none; background:transparent; padding:8px 10px; outline:none; font-size:13px; color:var(--app-text);">
          </div>
        </div>
        <div style="flex:1; background:var(--app-bg); position:relative; overflow:hidden;">
            <div id="br-loader" style="position:absolute; top:0; left:0; width:0%; height:2px; background:var(--app-accent); transition:0.2s; z-index:10;"></div>
            <iframe id="web-frame" sandbox="allow-scripts allow-modals allow-same-origin allow-forms allow-popups" src="${homeUrl}" style="width:100%; height:100%; border:none; background:#fff;"></iframe>
        </div>`;

      const frame = c.querySelector('#web-frame');
      const urlBar = c.querySelector('#url-bar');
      const urlContainer = c.querySelector('#url-container');
      const loader = c.querySelector('#br-loader');

      urlBar.onfocus = () => urlContainer.style.borderColor = 'var(--app-accent)';
      urlBar.onblur = () => urlContainer.style.borderColor = 'var(--app-border)';

      const simulateLoad = () => {
          loader.style.width = '30%'; loader.style.opacity = '1';
          setTimeout(() => loader.style.width = '70%', 300);
          setTimeout(() => { loader.style.width = '100%'; setTimeout(() => loader.style.opacity = '0', 200); }, 800);
      };

      const navigate = () => {
        let query = urlBar.value.trim();
        if (query === '') return;
        const isUrl = /^([a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|localhost|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?:\/.*)?$/.test(query) || query.startsWith('http');

        let finalUrl = isUrl ? (query.startsWith('http') ? query : 'https://' + query) : 'https://www.bing.com/search?q=' + encodeURIComponent(query);

        simulateLoad();
        frame.src = finalUrl;
        if (isUrl) urlBar.value = finalUrl;
      };

      urlBar.addEventListener('keydown', (e) => { if (e.key === 'Enter') navigate(); });

      c.querySelector('#br-home').onclick = () => { urlBar.value = ''; simulateLoad(); frame.src = homeUrl; };
      c.querySelector('#br-ref').onclick = () => { simulateLoad(); frame.src = frame.src; };
      c.querySelector('#br-back').onclick = () => { simulateLoad(); try { frame.contentWindow.history.back(); } catch (_) { window.Notify("Cannot go back (Cross-Origin restricted)", "warn"); } };
      c.querySelector('#br-fwd').onclick = () => { simulateLoad(); try { frame.contentWindow.history.forward(); } catch (_) {} };

      w._cleanup = () => { URL.revokeObjectURL(homeUrl); };
    },
  },
    /* ------------------------------------------------------- */

  weather: {
    id: 'weather', name: 'Live Weather',
    iconClass: 'fa-solid fa-cloud-sun', themeClass: 'ic-view',
    cpu: 1, mem: 10,

    onOpen(w) {
      w.style.width = '280px'; w.style.height = '240px';
      const c = w.querySelector('.win-content');

      c.innerHTML = `
        <div style="display:flex; height:100%; align-items:center; justify-content:center;
          background:linear-gradient(135deg, #1A2980, #26D0CE); color:#fff; text-align:center; padding:20px; box-sizing:border-box;">
          <div id="w-inner" style="display:flex; flex-direction:column; align-items:center; gap:8px;">
            <div id="w-loader" style="font-size:13px; opacity:.7;">Detecting location…</div>
          </div>
        </div>`;

      const inner = c.querySelector('#w-inner');
      const loader = c.querySelector('#w-loader');

      const WMO = { 0:'☀️',1:'🌤',2:'⛅',3:'☁️',45:'🌫',48:'🌫',51:'🌦',53:'🌦',55:'🌧',61:'🌧',63:'🌧',80:'🌦',95:'⛈' };

      navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
          const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&current_weather=true`);
          const d = await res.json();
          const cw = d.current_weather;
          loader.style.display = 'none';
          inner.innerHTML += `
            <div style="font-size:52px; line-height:1;">${WMO[cw.weathercode] || '🌡'}</div>
            <div style="font-size:42px; font-weight:700;">${cw.temperature}°C</div>
            <div style="font-size:13px; opacity:.8;">Wind ${cw.windspeed} km/h</div>`;
        } catch (_) { loader.innerText = 'Fetch failed.'; }
      }, () => { loader.innerText = 'Location denied.'; });
    },
  },

  /* ------------------------------------------------------- */

  video: {
    id: 'video', name: 'Video Player',
    iconClass: 'fa-solid fa-film', themeClass: 'ic-view',
    cpu: 4, mem: 35,

    onOpen(w) {
      w.style.width = '620px'; w.style.height = '460px';
      const c = w.querySelector('.win-content');

      c.innerHTML = `
        <div class="app-toolbar">
          <button id="vid-up" class="btn-accent"><i class="fa-solid fa-upload"></i> Select Video</button>
          <input type="file" id="vid-fi" accept="video/mp4,video/webm,video/ogg" style="display:none;">
        </div>
        <div style="flex:1; background:#000; display:flex; align-items:center; justify-content:center;">
          <video id="vid-player" controls style="max-width:100%; max-height:100%; display:none;"></video>
          <div id="vid-msg" style="color:#444; text-align:center;">
            <i class="fa-solid fa-video" style="font-size:48px; margin-bottom:10px; display:block;"></i>
            <span style="font-size:13px;">Select a local video file</span>
          </div>
        </div>`;

      const player = c.querySelector('#vid-player');
      const msg    = c.querySelector('#vid-msg');

      c.querySelector('#vid-up').onclick = () => c.querySelector('#vid-fi').click();
      c.querySelector('#vid-fi').onchange = (e) => {
        if (e.target.files?.[0]) {
          player.src = URL.createObjectURL(e.target.files[0]);
          player.style.display = 'block'; msg.style.display = 'none'; player.play();
        }
      };
    },
  },

  recorder: {
    id: 'recorder', name: 'Voice Recorder',
    iconClass: 'fa-solid fa-microphone', themeClass: 'ic-mus',
    cpu: 3, mem: 20,

    onOpen(w) {
      w.style.width = '400px'; w.style.height = '450px';
      const c = w.querySelector('.win-content');

      c.innerHTML = `
        <div class="app-body" style="background:var(--app-bg); align-items:center; padding:20px; gap:20px;">
          <div id="rec-timer" style="font-family:monospace; font-size:42px; font-weight:bold; color:var(--app-text);">00:00</div>
          
          <canvas id="rec-canvas" width="300" height="100" style="width:100%; height:100px; background:var(--app-surface-2); border-radius:8px; border:1px solid var(--app-border);"></canvas>
          
          <div style="display:flex; gap:20px; align-items:center;">
              <button id="rec-start" style="width:64px; height:64px; border-radius:50%; background:var(--app-danger); border:none; color:#fff; font-size:24px; cursor:pointer; box-shadow:0 0 15px rgba(255,95,86,0.3); transition:0.2s;">
                  <i class="fa-solid fa-microphone"></i>
              </button>
              <button id="rec-stop" disabled style="width:50px; height:50px; border-radius:50%; background:var(--app-surface-3); border:none; color:var(--app-text); font-size:18px; cursor:pointer; opacity:0.5;">
                  <i class="fa-solid fa-stop"></i>
              </button>
          </div>

          <div id="rec-status" style="font-size:12px; color:var(--app-text-2); font-family:monospace;">Click microphone to record memo</div>
          
          <div id="rec-list" style="flex:1; width:100%; overflow-y:auto; background:var(--app-surface); border-radius:8px; padding:10px; display:flex; flex-direction:column; gap:5px; border:1px solid var(--app-border);">
              <div style="text-align:center; padding:20px; color:var(--app-text-3); font-size:12px;">No recordings yet</div>
          </div>
        </div>`;

      let mediaRecorder, chunks = [], startTime, timerInt, audioCtx, analyser, dataArray, animationId;
      const btnStart = c.querySelector('#rec-start'), btnStop = c.querySelector('#rec-stop');
      const timerEl = c.querySelector('#rec-timer'), statusEl = c.querySelector('#rec-status');
      const canvas = c.querySelector('#rec-canvas'), ctx = canvas.getContext('2d');
      const listEl = c.querySelector('#rec-list');

      const drawVisualizer = () => {
        animationId = requestAnimationFrame(drawVisualizer);
        analyser.getByteTimeDomainData(dataArray);
        ctx.fillStyle = 'rgba(30, 30, 30, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.lineWidth = 2; ctx.strokeStyle = 'var(--app-accent)';
        ctx.beginPath();
        let sliceWidth = canvas.width / analyser.frequencyBinCount, x = 0;
        for (let i = 0; i < analyser.frequencyBinCount; i++) {
          let v = dataArray[i] / 128.0, y = v * canvas.height / 2;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          x += sliceWidth;
        }
        ctx.lineTo(canvas.width, canvas.height / 2); ctx.stroke();
      };

      btnStart.onclick = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          // Audio Setup for Visualizer
          audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          const source = audioCtx.createMediaStreamSource(stream);
          analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);
          dataArray = new Uint8Array(analyser.frequencyBinCount);
          drawVisualizer();

          mediaRecorder = new MediaRecorder(stream);
          mediaRecorder.ondataavailable = e => chunks.push(e.data);
          mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'audio/webm' });
            const reader = new FileReader();
            reader.onload = ev => {
              const fn = `audio/memo_${Date.now()}.webm`;
              window.VFS.writeFile(fn, ev.target.result);
              renderList();
            };
            reader.readAsDataURL(blob);
            stream.getTracks().forEach(t => t.stop());
          };

          chunks = []; mediaRecorder.start(); startTime = Date.now();
          timerInt = setInterval(() => {
            let sec = Math.floor((Date.now() - startTime) / 1000);
            timerEl.innerText = `${Math.floor(sec/60).toString().padStart(2,'0')}:${(sec%60).toString().padStart(2,'0')}`;
          }, 1000);

          btnStart.disabled = true; btnStart.style.opacity = '0.5'; btnStart.style.animation = 'pulse 1s infinite';
          btnStop.disabled = false; btnStop.style.opacity = '1';
          statusEl.innerText = "● RECORDING..."; statusEl.style.color = "var(--app-danger)";
        } catch (err) { alert("Microphone access denied."); }
      };

      btnStop.onclick = () => {
        mediaRecorder.stop(); clearInterval(timerInt); cancelAnimationFrame(animationId);
        if (audioCtx) audioCtx.close();
        btnStart.disabled = false; btnStart.style.opacity = '1'; btnStart.style.animation = 'none';
        btnStop.disabled = true; btnStop.style.opacity = '0.5';
        statusEl.innerText = "Processing & Saving..."; statusEl.style.color = "var(--app-text-2)";
      };

      const renderList = () => {
        const files = window.VFS.readDir('audio').filter(f => f.endsWith('.webm'));
        if (!files.length) return;
        listEl.innerHTML = files.map(f => `
          <div style="background:var(--app-surface-2); padding:8px; border-radius:4px; display:flex; justify-content:space-between; align-items:center; font-size:11px;">
            <span style="overflow:hidden; text-overflow:ellipsis;">${f}</span>
            <button onclick="new Audio('${window.VFS.readFile('audio/'+f)}').play()" style="background:var(--app-accent); border:none; border-radius:3px; padding:3px 8px; cursor:pointer; color:#000;"><i class="fa-solid fa-play"></i></button>
          </div>
        `).reverse().join('');
      };
      renderList();
    }
  },

assistant: {
    id: 'assistant', name: 'Kaira AI',
    iconClass: 'fa-solid fa-wand-magic-sparkles', themeClass: 'ic-view',
    cpu: 3, mem: 25,

    onOpen(w, wm) {
      w.style.width = '400px'; w.style.height = '450px';
      const c = w.querySelector('.win-content');

      c.innerHTML = `
        <div class="app-body" style="background:var(--app-bg); align-items:center; padding:30px; text-align:center;">
          <div id="kaira-orb" style="width:120px; height:120px; border-radius:50%; background:radial-gradient(circle, var(--app-accent) 0%, transparent 70%); box-shadow:0 0 20px var(--app-accent); margin-bottom:30px; transition:0.5s; display:flex; align-items:center; justify-content:center; cursor:pointer; position:relative;">
            <div id="kaira-pulse" style="position:absolute; inset:0; border-radius:50%; border:2px solid var(--app-accent); opacity:0;"></div>
            <i class="fa-solid fa-microchip" style="color:var(--app-accent); font-size:40px; text-shadow: 0 0 10px var(--app-accent);"></i>
          </div>
          <h2 style="margin:0; font-size:24px; color:var(--app-text);">Kaira Intelligence</h2>
          <p id="kaira-status" style="font-size:13px; color:var(--app-text-2); margin-top:10px;">Click Core to Initialize</p>
          
          <div style="margin-top:20px; padding:15px; background:var(--app-surface-2); border-radius:8px; border:1px solid var(--app-border); width:100%; box-sizing:border-box;">
             <div id="kaira-log" style="font-style:italic; color:var(--app-accent); font-size:14px; min-height:20px;">Awaiting Neural Link...</div>
          </div>
          <div style="margin-top:15px; font-size:11px; color:var(--app-text-3);">Status: <span id="kaira-mic-indicator">🔴 Mic Offline</span></div>
        </div>`;

      const orb = c.querySelector('#kaira-orb'), pulse = c.querySelector('#kaira-pulse');
      const status = c.querySelector('#kaira-status'), log = c.querySelector('#kaira-log');
      const micInd = c.querySelector('#kaira-mic-indicator');
      
      let isListening = false;

      const speak = (msg) => {
        const synth = window.speechSynthesis;
        const utter = new SpeechSynthesisUtterance(msg);
        const voices = synth.getVoices();
        utter.voice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Samantha')) || voices[0];
        utter.pitch = 1.1; utter.rate = 1.0;
        synth.speak(utter);
      };

      const processIntent = (input) => {
        const cmd = input.toLowerCase();
        if (cmd.includes('terminal') || cmd.includes('console')) {
            speak("Opening terminal."); wm.openApp('terminal');
        } else if (cmd.includes('file') || cmd.includes('explorer')) {
            speak("Opening explorer."); wm.openApp('files');
        } else if (cmd.includes('time')) {
            speak(`The time is ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`);
        } else if (cmd.includes('dark mode')) {
            speak("Switching to dark mode."); window.ThemeManager.set('dark');
        } else if (cmd.includes('light mode')) {
            speak("Switching to light mode."); window.ThemeManager.set('light');
        } else {
            speak("I heard you, but I don't have a protocol for that command.");
        }
      };

      const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!Recognition) {
        status.innerText = "Speech API not supported.";
        return;
      }

      const rec = new Recognition();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        isListening = true;
        micInd.innerText = "🟢 Mic Active";
        micInd.style.color = "var(--app-success)";
        status.innerText = "Always Listening for 'Kaira'...";
      };

      rec.onresult = (e) => {
        const transcript = e.results[e.results.length - 1][0].transcript.trim().toLowerCase();
        console.log("Kaira heard:", transcript); // DEBUG LOG
        
        // Phonetic matching for the wake word
        const wakeWords = ['kaira', 'kyra', 'kira', 'cara', 'kara', 'clara'];
        const foundWakeWord = wakeWords.some(word => transcript.includes(word));

        if (foundWakeWord) {
            pulse.style.animation = 'kaira-ping 1s ease-out';
            setTimeout(() => pulse.style.animation = '', 1000);
            
            // Logic to find the command after the wake word
            let commandText = "";
            wakeWords.forEach(word => {
               if(transcript.includes(word)) {
                   commandText = transcript.split(word).pop().trim();
               }
            });

            if (commandText.length > 0) {
                log.innerText = `"${commandText}"`;
                processIntent(commandText);
            } else {
                speak("Yes? I'm listening.");
                log.innerText = "Waiting for command...";
            }
        }
      };

      rec.onerror = (e) => {
          console.error("Speech Recognition Error:", e.error);
          if(e.error === 'not-allowed') status.innerText = "Mic Permission Denied";
      };

      rec.onend = () => {
        if (isListening) rec.start(); // Keep alive
      };

      orb.onclick = () => {
        if (!isListening) {
            rec.start();
            speak("Kaira system online. I am listening.");
        } else {
            isListening = false;
            rec.stop();
            micInd.innerText = "🔴 Mic Offline";
            status.innerText = "Kaira Sleep Mode.";
        }
      };

      const style = document.createElement('style');
      style.innerHTML = `@keyframes kaira-ping { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(2); opacity: 0; } }`;
      document.head.appendChild(style);
    }
  },
  
  calendar: {
    id: 'calendar', name: 'Calendar Pro',
    iconClass: 'fa-regular fa-calendar-days', themeClass: 'ic-clk',
    cpu: 1, mem: 10,

    onOpen(w) {
      w.style.width = '500px'; w.style.height = '580px';
      const c = w.querySelector('.win-content');
      
      let viewDate = new Date();
      let events = {};

      // Load events from VFS
      try {
        const data = window.VFS.readFile('/documents/calendar_events.json');
        if (data) events = JSON.parse(data);
      } catch(e) { events = {}; }

      const render = () => {
        const month = viewDate.getMonth();
        const year = viewDate.getFullYear();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();

        c.innerHTML = `
          <div class="app-toolbar" style="justify-content: space-between;">
            <div style="display:flex; gap:5px;">
              <button id="cal-prev"><i class="fa-solid fa-chevron-left"></i></button>
              <button id="cal-next"><i class="fa-solid fa-chevron-right"></i></button>
              <button id="cal-today">Today</button>
            </div>
            <div style="font-weight:bold; font-size:14px; color:var(--app-text);">
              ${viewDate.toLocaleString('default', { month: 'long' })} ${year}
            </div>
            <div style="width:80px; text-align:right;">
               <button id="cal-save" class="btn-accent" style="display:none;">Save</button>
            </div>
          </div>
          <div class="app-body" style="padding:15px; background:var(--app-bg);">
            <div style="display:grid; grid-template-columns:repeat(7, 1fr); text-align:center; font-size:11px; font-weight:bold; color:var(--app-text-3); margin-bottom:10px; text-transform:uppercase;">
              <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
            </div>
            <div id="cal-grid" style="display:grid; grid-template-columns:repeat(7, 1fr); gap:1px; background:var(--app-border); border:1px solid var(--app-border); border-radius:6px; overflow:hidden;">
            </div>
            
            <div id="cal-editor" style="display:none; margin-top:15px; padding:15px; background:var(--app-surface-2); border-radius:8px; border:1px solid var(--app-border);">
               <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                  <span id="ed-date" style="font-weight:bold; font-size:13px; color:var(--app-accent);"></span>
                  <button id="ed-close" style="background:transparent; border:none; color:var(--app-text-3); cursor:pointer;"><i class="fa-solid fa-xmark"></i></button>
               </div>
               <textarea id="ed-text" placeholder="Add events for this day..." style="width:100%; height:80px; background:var(--app-input-bg); color:var(--app-text); border:1px solid var(--app-border); border-radius:5px; padding:10px; resize:none; font-family:sans-serif; font-size:13px; outline:none;"></textarea>
            </div>
          </div>`;

        const grid = c.querySelector('#cal-grid');
        
        // Add padding for empty days
        for (let i = 0; i < firstDay; i++) {
          grid.innerHTML += `<div style="background:var(--app-surface-2); height:65px;"></div>`;
        }

        // Generate Days
        for (let d = 1; d <= daysInMonth; d++) {
          const isToday = today.getDate() === d && today.getMonth() === month && today.getFullYear() === year;
          const dateKey = `${year}-${month + 1}-${d}`;
          const hasEvent = events[dateKey] && events[dateKey].trim() !== "";
          
          const dayCell = document.createElement('div');
          dayCell.style.cssText = `
            background: ${isToday ? 'rgba(0, 243, 255, 0.05)' : 'var(--app-surface)'};
            height: 65px; padding: 5px; cursor: pointer; position: relative;
            border: 1px solid transparent; transition: 0.2s;
          `;
          if (isToday) dayCell.style.border = '1px solid var(--app-accent)';
          
          dayCell.innerHTML = `
            <span style="font-size:12px; font-weight:${isToday ? '800' : '600'}; color:${isToday ? 'var(--app-accent)' : 'var(--app-text)'};">${d}</span>
            ${hasEvent ? `<div style="width:4px; height:4px; border-radius:50%; background:var(--app-accent); position:absolute; bottom:8px; left:50%; transform:translateX(-50%);"></div>` : ''}
          `;

          dayCell.onclick = () => openEditor(dateKey, d);
          dayCell.onmouseenter = () => dayCell.style.background = 'var(--app-surface-3)';
          dayCell.onmouseleave = () => dayCell.style.background = isToday ? 'rgba(0, 243, 255, 0.05)' : 'var(--app-surface)';
          
          grid.appendChild(dayCell);
        }

        // Logic for Controls
        c.querySelector('#cal-prev').onclick = () => { viewDate.setMonth(viewDate.getMonth() - 1); render(); };
        c.querySelector('#cal-next').onclick = () => { viewDate.setMonth(viewDate.getMonth() + 1); render(); };
        c.querySelector('#cal-today').onclick = () => { viewDate = new Date(); render(); };
      };

      const openEditor = (key, dayNum) => {
        const editor = c.querySelector('#cal-editor');
        const textArea = c.querySelector('#ed-text');
        const saveBtn = c.querySelector('#cal-save');
        const dateLabel = c.querySelector('#ed-date');

        editor.style.display = 'block';
        saveBtn.style.display = 'block';
        dateLabel.innerText = `${viewDate.toLocaleString('default', { month: 'long' })} ${dayNum}, ${viewDate.getFullYear()}`;
        textArea.value = events[key] || "";
        textArea.focus();

        c.querySelector('#ed-close').onclick = () => {
          editor.style.display = 'none';
          saveBtn.style.display = 'none';
        };

        saveBtn.onclick = () => {
          if (textArea.value.trim()) {
            events[key] = textArea.value;
          } else {
            delete events[key];
          }
          window.VFS.writeFile('/documents/calendar_events.json', JSON.stringify(events));
          if (window._H) window._H.flashSave(saveBtn, 'Save');
          render();
        };
      };

      render();
    }
  },
  translator: {
    id: 'translator', name: 'Translator Pro',
    iconClass: 'fa-solid fa-language', themeClass: 'ic-view',
    cpu: 2, mem: 15,

    onOpen(w) {
      w.style.width = '450px'; w.style.height = '500px';
      const c = w.querySelector('.win-content');

      c.innerHTML = `
        <div class="app-body" style="padding:20px; background:var(--app-bg); gap:15px;">
          <div style="display:flex; flex-direction:column; gap:8px;">
            <select id="tr-src-lang" style="width:100%; padding:8px; border-radius:6px; background:var(--app-surface-2); border:1px solid var(--app-border); color:var(--app-text);">
              <option value="autodetect">Auto-Detect</option>
              <option value="en">English</option><option value="es">Spanish</option>
              <option value="fr">French</option><option value="de">German</option>
              <option value="it">Italian</option><option value="ja">Japanese</option>
              <option value="zh">Chinese</option>
            </select>
            <textarea id="tr-input" placeholder="Type text to translate..." style="width:100%; height:120px; background:var(--app-input-bg); color:var(--app-text); border:1px solid var(--app-border); border-radius:8px; padding:12px; resize:none; font-size:14px; outline:none;"></textarea>
          </div>

          <div style="display:flex; justify-content:center; align-items:center; gap:10px;">
            <button id="tr-swap" style="background:var(--app-surface-3); border:none; color:var(--app-text); padding:8px 12px; border-radius:50%; cursor:pointer;"><i class="fa-solid fa-repeat"></i></button>
            <button id="tr-run" class="btn-accent" style="flex:1; height:40px;"><i class="fa-solid fa-wand-magic-sparkles"></i> Translate</button>
          </div>

          <div style="display:flex; flex-direction:column; gap:8px;">
            <select id="tr-target-lang" style="width:100%; padding:8px; border-radius:6px; background:var(--app-surface-2); border:1px solid var(--app-border); color:var(--app-text);">
              <option value="en">English</option><option value="es" selected>Spanish</option>
              <option value="fr">French</option><option value="de">German</option>
              <option value="it">Italian</option><option value="ja">Japanese</option>
              <option value="zh">Chinese</option>
            </select>
            <div id="tr-output" style="width:100%; min-height:120px; background:var(--app-surface-2); color:var(--app-accent); border:1px dotted var(--app-border); border-radius:8px; padding:12px; font-size:14px; word-wrap:break-word;">
              Translation will appear here...
            </div>
          </div>
        </div>`;

      const input = c.querySelector('#tr-input');
      const output = c.querySelector('#tr-output');
      const btn = c.querySelector('#tr-run');
      const srcLang = c.querySelector('#tr-src-lang');
      const targetLang = c.querySelector('#tr-target-lang');

      btn.onclick = async () => {
        const text = input.value.trim();
        if (!text) return;
        
        output.innerText = "Translating...";
        output.style.opacity = "0.5";

        try {
          const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${srcLang.value}|${targetLang.value}`);
          const data = await res.json();
          output.innerText = data.responseData.translatedText;
          output.style.opacity = "1";
        } catch (err) {
          output.innerText = "Error: Could not reach translation service.";
          output.style.color = "var(--app-danger)";
        }
      };

      c.querySelector('#tr-swap').onclick = () => {
          const temp = srcLang.value;
          if (temp === 'autodetect') return; // Can't swap autodetect
          srcLang.value = targetLang.value;
          targetLang.value = temp;
      };
    }
  },
}; 
// end AppRegistry

