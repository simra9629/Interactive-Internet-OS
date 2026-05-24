/* =========================================
   OS 12.0 - TRUTHFUL BOOT SEQUENCE
   Asynchronous Initialization & BSOD Recovery
========================================= */

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Construct the Boot Screen UI
    const bootScreen = document.createElement('div');
    bootScreen.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: #050505; color: #4af626; font-family: 'Courier New', monospace;
        font-size: 15px; padding: 30px; z-index: 999999; box-sizing: border-box;
        display: flex; flex-direction: column; gap: 8px;
    `;
    document.body.appendChild(bootScreen);

    // Helper function to print logs with a slight, realistic delay
    const printLog = async (msg, isErr = false, delayMs = 300) => {
        return new Promise(resolve => {
            setTimeout(() => {
                const line = document.createElement('div');
                const status = isErr ? '<span style="color:#ff5f56;">FAIL</span>' : '<span style="color:#fff;"> OK </span>';
                line.innerHTML = `[ ${status} ] ${msg}`;
                bootScreen.appendChild(line);
                resolve();
            }, delayMs);
        });
    };

    // 2. The Asynchronous Ignition Sequence
    try {
        await printLog("MODULAR BIOS v3.0 ACPI Revision 5.0 initialized.", false, 200);
        
        // Await true Kernel initializations
        let storageRes = await window.OSKernel.initStorage(); 
        await printLog(storageRes, false, 400);
        
        let vfsRes = await window.OSKernel.mountVFS(); 
        await printLog(vfsRes, false, 500);
        
        let setRes = await window.OSKernel.loadSettings(); 
        await printLog(setRes, false, 300);
        
        let ipcRes = await window.OSKernel.initIPC(); 
        await printLog(ipcRes, false, 200);
        
        await printLog("Starting Aggressive Process Monitor...", false, 300);
        window.OSKernel.ProcessManager.monitor();

        await printLog("Igniting Window Manager and Desktop Environment...", false, 400);

        // 3. Launch the OS
        setTimeout(() => {
            // Flash effect transition
            bootScreen.style.background = "#fff";
            bootScreen.style.color = "#fff";
            bootScreen.style.transition = "all 0.6s ease-out";
            
            setTimeout(() => {
                bootScreen.style.opacity = "0";
                setTimeout(() => {
                    bootScreen.remove();
                    
                    // Set State and Boot the UI!
                    window.OSKernel.State.mode = 'normal';
                    window.OS = new window.WindowManager();
                    
                    setTimeout(() => {
                        window.Notify("Welcome to Interactive OS 12.0", "info");
                    }, 500);

                }, 600);
            }, 150);
        }, 600);

    } catch (err) {
        // 4. FATAL KERNEL PANIC (RECOVERY MODE)
        await printLog(`FATAL EXCEPTION: ${err}`, true, 100);
        
        setTimeout(() => {
            bootScreen.style.background = "#0000aa"; // Classic BSOD Blue
            bootScreen.style.color = "#ffffff";
            bootScreen.innerHTML = `
                <div style="max-width: 800px; margin: 0 auto; margin-top: 10vh; font-family: 'Courier New', monospace;">
                    <h1 style="background: #fff; color: #0000aa; display: inline-block; padding: 2px 15px; margin-bottom: 20px;">OS RECOVERY MODE</h1>
                    <p style="font-size: 18px;">A fatal exception has occurred at memory address 0x00000000. The system has been halted to prevent damage to your virtual file system.</p>
                    <br>
                    <p><strong>Error Code:</strong> ${err}</p>
                    <br>
                    <p>Troubleshooting steps:</p>
                    <ul>
                        <li>If your browser is blocking third-party cookies or local storage, you must enable them for this OS to run.</li>
                        <li>If your Virtual File System JSON is corrupted, you must factory reset the system.</li>
                    </ul>
                    <br>
                    <p>Press the button below to completely wipe all local storage data, settings, and files, and attempt a clean reboot.</p>
                    <br>
                    <button onclick="localStorage.clear(); location.reload();" style="background: #fff; color: #0000aa; border: none; padding: 12px 24px; font-size: 16px; font-weight: bold; font-family: 'Courier New', monospace; cursor: pointer; text-transform: uppercase;">Wipe Storage & Reboot</button>
                </div>
            `;
        }, 1000);
    }
});