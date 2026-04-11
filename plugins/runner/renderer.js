/**
 * Language Runner Plugin for MyCode
 *
 * Provides a unified Run / Stop for all Fragillidae languages:
 *   BEAM  (.bas, .yab)  → runtimes/beam
 *   EZ    (.ez)         → runtimes/ez
 *   Forge (.fg)         → runtimes/forge
 *   Plain (.plain)      → runtimes/plain
 *   Steps (.building, .floor, .step) → runtimes/steps
 *
 * Runtime binaries are located relative to app.getAppPath():
 *   Development : <appPath>/runtimes/<name>
 *   Packaged    : <appPath>/../runtimes/<name>   (extraResources target)
 *
 * Fragillidae Software — Runner v1.0.0
 */

(function () {

    // -----------------------------------------------------------------------
    // Extension → runtime mapping
    //   args     : arguments inserted BEFORE the path argument
    //   pathMode : 'file' → pass the full file path (default)
    //              'dir'  → pass the file's parent directory instead
    // -----------------------------------------------------------------------
    const EXT_MAP = {
        '.bas':      { runtime: 'beam',  label: 'BEAM',  args: [],           pathMode: 'file' },
        '.yab':      { runtime: 'beam',  label: 'BEAM',  args: [],           pathMode: 'file' },
        '.ez':       { runtime: 'ez',    label: 'EZ',    args: [],           pathMode: 'file' },
        '.fg':       { runtime: 'forge', label: 'Forge', args: ['run'],      pathMode: 'file' },
        '.plain':    { runtime: 'plain', label: 'Plain', args: [],           pathMode: 'file' },
        '.building': { runtime: 'steps', label: 'Steps', args: ['run'],      pathMode: 'dir'  },
        '.floor':    { runtime: 'steps', label: 'Steps', args: ['run-step'], pathMode: 'file' },
        '.step':     { runtime: 'steps', label: 'Steps', args: ['run-step'], pathMode: 'file' },
    };

    // -----------------------------------------------------------------------
    // Runtime state
    // -----------------------------------------------------------------------
    let runStatusItem   = null;
    let stopStatusItem  = null;
    let outputPanel     = null;
    let runnerXterm     = null;   // xterm Terminal instance for program output
    let runnerFitAddon  = null;   // FitAddon for runnerXterm
    let terminalId      = null;   // active PTY terminal id
    let capturingOutput = false;  // gate: only relay output for the current run
    let appPath         = null;   // resolved app path from main process
    let appImageDir     = null;   // directory containing the .AppImage file (null if not AppImage)
    let currentLabel    = 'Run';  // updated per-run for status bar text

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    // Write a status/info line to the xterm panel.
    // Converts bare \n → \r\n so xterm renders newlines correctly.
    // Raw PTY output is written directly (xterm handles ANSI escape codes).
    function appendOutput(text) {
        if (!runnerXterm) return;
        runnerXterm.write(text.replace(/\r?\n/g, '\r\n'));
    }

    function clearOutput() {
        if (runnerXterm) runnerXterm.reset();
    }

    // Resize the xterm to its container, then sync PTY dimensions.
    function fitXterm() {
        if (!runnerFitAddon || !runnerXterm) return;
        try {
            runnerFitAddon.fit();
            if (terminalId) {
                window.mycode.terminal.resize(terminalId, runnerXterm.cols, runnerXterm.rows);
            }
        } catch (_) { /* ignore errors during initial layout */ }
    }

    function setRunning(yes, label) {
        if (yes) currentLabel = label || currentLabel;
        if (runStatusItem) {
            runStatusItem.update({
                text: yes ? ('⏸ ' + currentLabel + ' running...') : '▶ Run'
            });
        }
        if (stopStatusItem) {
            if (yes) stopStatusItem.show(); else stopStatusItem.hide();
        }
    }

    // Return the file extension (lower-case, including the dot), or '' if none.
    function getExt(filePath) {
        const m = filePath.match(/(\.[^./\\]+)$/);
        return m ? m[1].toLowerCase() : '';
    }

    // Resolve the runtime binary path for a given runtime name.
    // Candidate order:
    //   1. <appImageDir>/runtimes/<name>  — AppImage with external runtimes folder
    //   2. <appPath>/runtimes/<name>      — dev (npm start)
    //   3. <appPath>/../runtimes/<name>   — embedded extraResources in packaged build
    async function resolveRuntime(runtimeName) {
        const candidates = [];

        if (appImageDir) {
            candidates.push(appImageDir + '/runtimes/' + runtimeName);
        }
        if (appPath) {
            candidates.push(appPath + '/runtimes/' + runtimeName);
            candidates.push(appPath + '/../runtimes/' + runtimeName);
        }

        for (const p of candidates) {
            try {
                if (await window.mycode.file.exists(p)) return p;
            } catch (_) { /* keep trying */ }
        }
        return null;
    }

    // -----------------------------------------------------------------------
    // Main plugin module
    // -----------------------------------------------------------------------
    const pluginModule = {

        async activate(api) {
            console.log('[Runner] Plugin activating...');

            // Fetch app path once at startup
            if (window.mycode && window.mycode.app && window.mycode.app.getAppPath) {
                appPath = await window.mycode.app.getAppPath();
                console.log('[Runner] appPath:', appPath);
            }

            // Load this plugin's main module so we can call getAppImageDir()
            // via invokeMain — the main module reads process.env.APPIMAGE which
            // is only accessible in the Node.js main process, not the renderer.
            try {
                await window.mycode.plugins.load('mycode-runner');
                appImageDir = await window.mycode.plugins.invokeMain('mycode-runner', 'getAppImageDir', []);
                if (appImageDir) console.log('[Runner] AppImage dir (via main module):', appImageDir);
            } catch (_) {
                // Fall back to the preload method if available (requires rebuilt AppImage)
                if (window.mycode && window.mycode.app && window.mycode.app.getAppImageDir) {
                    try {
                        appImageDir = await window.mycode.app.getAppImageDir();
                    } catch (_2) { /* ignore */ }
                }
            }
            if (appImageDir) {
                console.log('[Runner] AppImage dir:', appImageDir);
            } else {
                console.log('[Runner] Not running as AppImage (or APPIMAGE env not set)');
            }

            // -----------------------------------------------------------
            // 1. Output bottom panel
            // -----------------------------------------------------------
            outputPanel = api.ui.registerBottomPanel({
                id:    'runner-output',
                title: 'Program Output',
                icon:  '▶',
            });

            // Add a "Clear" button into the tab strip, right after the panel tab.
            // We look it up immediately after registerBottomPanel() creates it.
            const panelTab = document.querySelector('.bottom-tab-btn[data-panel="runner-output"]');
            if (panelTab && panelTab.parentElement) {
                const clearBtn = document.createElement('button');
                clearBtn.title   = 'Clear output (runner.clear)';
                clearBtn.textContent = '🗑';
                clearBtn.style.cssText = [
                    'background:none', 'border:none',
                    'color:var(--text-secondary)', 'cursor:pointer',
                    'padding:2px 6px', 'font-size:13px',
                    'border-radius:4px', 'line-height:1',
                ].join(';');
                clearBtn.onmouseenter = () => {
                    clearBtn.style.color      = 'var(--text-primary)';
                    clearBtn.style.background = 'var(--bg-secondary)';
                };
                clearBtn.onmouseleave = () => {
                    clearBtn.style.color      = 'var(--text-secondary)';
                    clearBtn.style.background = 'none';
                };
                clearBtn.onclick = () => clearOutput();
                panelTab.insertAdjacentElement('afterend', clearBtn);
            }

            // Create an xterm Terminal inside the output panel so that
            // interactive programs can receive keyboard input from the user.
            const xtermContainer = document.createElement('div');
            xtermContainer.style.cssText = 'width:100%;height:100%;';

            if (outputPanel.element) {
                outputPanel.element.style.cssText = 'height:100%;overflow:hidden;';
                outputPanel.element.appendChild(xtermContainer);
            }

            if (window.XTerm && window.FitAddon) {
                runnerXterm = new window.XTerm({
                    fontFamily: "'Fira Code', 'Droid Sans Mono', 'monospace', monospace",
                    fontSize: 13,
                    theme: {
                        background: '#1a1a1a',
                        foreground: '#d0d0d0',
                        cursor:     '#ffffff',
                        selectionBackground: '#264f78',
                    },
                    cursorBlink: true,
                    convertEol:  true,
                });
                runnerFitAddon = new window.FitAddon();
                runnerXterm.loadAddon(runnerFitAddon);
                runnerXterm.open(xtermContainer);

                // Forward user keystrokes to the active process.
                runnerXterm.onData((data) => {
                    if (terminalId) window.mycode.terminal.write(terminalId, data);
                });

                // Keep xterm sized to its container whenever the panel resizes.
                new ResizeObserver(fitXterm).observe(xtermContainer);
            } else {
                console.warn('[Runner] XTerm/FitAddon globals not found — interactive input disabled');
            }

            // -----------------------------------------------------------
            // 2. Terminal data / exit listeners (wired once at activate)
            // -----------------------------------------------------------
            if (window.mycode && window.mycode.terminal) {
                window.mycode.terminal.onData((id, data) => {
                    // Write raw PTY output directly to xterm (it handles ANSI codes).
                    if (id === terminalId && capturingOutput && runnerXterm) {
                        runnerXterm.write(data);
                    }
                });

                window.mycode.terminal.onExit((id, exitCode) => {
                    if (id === terminalId) {
                        capturingOutput = false;
                        appendOutput('\r\n\x1b[90m[' + currentLabel + '] Process exited (code ' + exitCode + ')\x1b[0m\r\n');
                        terminalId = null;
                        setRunning(false);
                    }
                });
            }

            // -----------------------------------------------------------
            // 3. Run command
            // -----------------------------------------------------------
            api.commands.register('runner.run', async () => {
                const filePath = api.workspace.getActiveFilePath();
                if (!filePath) {
                    api.ui.showNotification('Runner: No file open', 'error', 3000);
                    return;
                }

                const ext = getExt(filePath);
                const mapping = EXT_MAP[ext];
                if (!mapping) {
                    api.ui.showNotification(
                        'Runner: No runtime configured for *' + (ext || '<no extension>') + ' files',
                        'warning', 3000);
                    return;
                }

                const { runtime, label, args: leadingArgs, pathMode } = mapping;

                const runtimePath = await resolveRuntime(runtime);
                if (!runtimePath) {
                    api.ui.showNotification(
                        'Runner: Could not find runtime "' + runtime + '". ' +
                        'Make sure the runtimes/ folder is present.',
                        'error', 6000);
                    return;
                }

                // Stop any existing run first
                if (terminalId && window.mycode && window.mycode.terminal) {
                    capturingOutput = false;
                    const oldId = terminalId;
                    terminalId = null;
                    window.mycode.terminal.destroy(oldId).catch(() => {});
                }

                // Save file before running
                try {
                    const content = api.editor.getContent();
                    await api.workspace.writeFile(filePath, content);
                } catch (e) {
                    api.ui.showNotification('Runner: Could not save file: ' + e.message, 'error', 4000);
                    return;
                }

                const dir = filePath.replace(/[/\\][^/\\]*$/, '') || '.';

                // For 'dir' mode (e.g. Steps .building) pass the project folder,
                // not the file itself — Steps runs whole projects from a directory.
                const pathArg = (pathMode === 'dir') ? dir : filePath;
                const processArgs = leadingArgs.concat([pathArg]);

                clearOutput();
                const cmdDisplay = [runtimePath].concat(processArgs).join(' ');
                appendOutput('\x1b[90m[' + label + '] Running: ' + cmdDisplay + '\x1b[0m\r\n\r\n');
                outputPanel.show();
                // Re-fit xterm now that the panel is visible so the PTY gets
                // the correct initial dimensions (avoids a tiny/wrong-sized pty).
                setTimeout(fitXterm, 50);
                setRunning(true, label);
                capturingOutput = false;

                if (!window.mycode || !window.mycode.terminal) {
                    api.ui.showNotification('Runner: Terminal API not available', 'error', 4000);
                    setRunning(false);
                    return;
                }

                try {
                    // Spawn the runtime binary directly — no shell wrapper.
                    // This avoids shell startup noise, exec timing issues, and
                    // any environment pollution (e.g. AppImage LD_LIBRARY_PATH).
                    terminalId = await window.mycode.terminal.createProcess(
                        runtimePath, processArgs, dir, 120, 30);
                    capturingOutput = true;
                } catch (e) {
                    appendOutput('[' + label + '] Error starting process: ' + e.message + '\n');
                    setRunning(false);
                }
            });

            // -----------------------------------------------------------
            // 4. Stop command
            // -----------------------------------------------------------
            api.commands.register('runner.stop', () => {
                if (!terminalId) {
                    api.ui.showNotification('Runner: No program running', 'info', 2000);
                    return;
                }
                if (!window.mycode || !window.mycode.terminal) return;

                capturingOutput = false;
                appendOutput('\n[' + currentLabel + '] Stopped.\n');

                const idToKill = terminalId;
                terminalId = null;
                setRunning(false);

                // Send Ctrl+C before destroying so the process gets a chance
                // to clean up (important for BEAM's SDL window, for example).
                window.mycode.terminal.write(idToKill, '\x03');
                setTimeout(() => {
                    window.mycode.terminal.destroy(idToKill).catch(() => {});
                }, 200);

                api.ui.showNotification('Runner: Program stopped', 'info', 2000);
            });

            // -----------------------------------------------------------
            // 5. Status bar items
            // -----------------------------------------------------------
            runStatusItem = api.ui.createStatusBarItem({
                id:        'runner-run',
                text:      '▶ Run',
                tooltip:   'Run the current program (runner.run)',
                command:   'runner.run',
                alignment: 'left',
                priority:  50,
            });
            runStatusItem.show();

            stopStatusItem = api.ui.createStatusBarItem({
                id:        'runner-stop',
                text:      '■ Stop',
                tooltip:   'Stop the running program (runner.stop)',
                command:   'runner.stop',
                alignment: 'left',
                priority:  49,
            });
            // Hidden until a run is active

            // -----------------------------------------------------------
            // 6. Clear command
            // -----------------------------------------------------------
            api.commands.register('runner.clear', () => {
                clearOutput();
            });

            // -----------------------------------------------------------
            // 7. Tools menu items
            // -----------------------------------------------------------
            api.menus.registerMenuItem({
                id:      'runner.menu.run',
                label:   'Run Program',
                command: 'runner.run',
                group:   'tools',
            });
            api.menus.registerMenuItem({
                id:      'runner.menu.stop',
                label:   'Stop Program',
                command: 'runner.stop',
                group:   'tools',
            });
            api.menus.registerMenuItem({
                id:      'runner.menu.clear',
                label:   'Clear Program Output',
                command: 'runner.clear',
                group:   'tools',
            });

            console.log('[Runner] Plugin activated — Run/Stop ready for BEAM, EZ, Forge, Plain, Steps');
        },

        deactivate() {
            console.log('[Runner] Plugin deactivated');
            capturingOutput = false;
            if (terminalId && window.mycode && window.mycode.terminal) {
                window.mycode.terminal.destroy(terminalId).catch(() => {});
                terminalId = null;
            }
            if (runStatusItem)  { runStatusItem.dispose();  runStatusItem  = null; }
            if (stopStatusItem) { stopStatusItem.dispose(); stopStatusItem = null; }
            if (outputPanel)    { outputPanel.dispose();    outputPanel    = null; }
            if (runnerXterm)    { runnerXterm.dispose();    runnerXterm    = null; }
            runnerFitAddon = null;
        }
    };

    // -----------------------------------------------------------------------
    // Register with MyCode plugin loader
    // -----------------------------------------------------------------------
    window.__MYCODE_PLUGINS__ = window.__MYCODE_PLUGINS__ || {};
    window.__MYCODE_PLUGINS__['mycode-runner'] = pluginModule;

    const callbackName = '__plugin_mycode_runner__';
    if (window[callbackName]) {
        window[callbackName](pluginModule);
    }

})();
