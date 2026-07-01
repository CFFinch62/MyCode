/**
 * Language Runner Plugin for MyCode
 *
 * Provides Compile / Run / Stop for any language configured via
 * Preferences → Runner.  Buttons are shown/hidden dynamically based
 * on the active file's extension and whether compile/run commands
 * have been configured for that extension.
 *
 * Configuration is stored centrally in runner-config.json and
 * accessed via window.mycode.runnerConfig.  Each entry specifies:
 *
 *   label   – display name (e.g. "Python", "C", "BEAM")
 *   type    – "bundled" (resolved from runtimes/) or "system" (from PATH)
 *   compile – optional compile command with placeholders
 *   run     – optional run command with placeholders
 *
 * Placeholders (Geany-compatible):
 *   %f  – full file path       (/home/chuck/hello.py)
 *   %e  – filename without ext (hello)
 *   %d  – directory            (/home/chuck)
 *   %b  – basename with ext    (hello.py)
 *
 * Fragillidae Software — Runner v2.0.0
 */

(function () {

    // -----------------------------------------------------------------------
    // Runtime state
    // -----------------------------------------------------------------------
    let compileStatusItem = null;  // status bar: Compile button
    let runStatusItem     = null;  // status bar: Run button
    let stopStatusItem    = null;  // status bar: Stop button
    let outputPanel       = null;
    let runnerXterm       = null;  // xterm Terminal instance for program output
    let runnerFitAddon    = null;  // FitAddon for runnerXterm
    let terminalId        = null;  // active PTY terminal id
    let capturingOutput   = false; // gate: only relay output for the current run
    let appPath           = null;  // resolved app path from main process
    let appImageDir       = null;  // directory containing the .AppImage file
    let currentLabel      = '';    // updated per-run for status bar text
    let runnerConfigs     = {};    // extension → RunnerEntry (loaded from config)
    let pluginApi         = null;  // saved reference to the plugin API

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    // Write a status/info line to the xterm panel.
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
                text: yes ? ('\u23F8 ' + currentLabel + ' running...') : ('\u25B6 Run ' + currentLabel)
            });
        }
        if (compileStatusItem) {
            // Disable compile while running
            if (yes) compileStatusItem.hide(); else updateButtonVisibility();
        }
        if (stopStatusItem) {
            if (yes) stopStatusItem.show(); else stopStatusItem.hide();
        }
    }

    // Return the file extension (lower-case, including the dot), or '' if none.
    function getExt(filePath) {
        var m = filePath.match(/(\.[^./\\]+)$/);
        return m ? m[1].toLowerCase() : '';
    }

    // Substitute Geany-style placeholders in a command string.
    // Values containing spaces are automatically quoted.
    function substitutePlaceholders(cmdStr, filePath) {
        var dir = filePath.replace(/[/\\][^/\\]*$/, '') || '.';
        var basename = filePath.replace(/^.*[/\\]/, '');
        var nameNoExt = basename.replace(/\.[^.]+$/, '');

        function q(val) {
            // Wrap in double-quotes if the value contains spaces
            return val.indexOf(' ') >= 0 ? '"' + val + '"' : val;
        }

        return cmdStr
            .replace(/%f/g, q(filePath))
            .replace(/%d/g, q(dir))
            .replace(/%b/g, q(basename))
            .replace(/%e/g, q(nameNoExt));
    }

    // Parse a command string into [executable, ...args].
    // Handles basic quoting (double-quotes only).
    function parseCommand(cmdStr) {
        var parts = [];
        var current = '';
        var inQuote = false;
        for (var i = 0; i < cmdStr.length; i++) {
            var ch = cmdStr[i];
            if (ch === '"') {
                inQuote = !inQuote;
            } else if (ch === ' ' && !inQuote) {
                if (current.length > 0) {
                    parts.push(current);
                    current = '';
                }
            } else {
                current += ch;
            }
        }
        if (current.length > 0) parts.push(current);
        return parts;
    }

    // Resolve the runtime binary path for a given runtime name.
    // Candidate order:
    //   1. <appImageDir>/runtimes/<name>  — AppImage with external runtimes folder
    //   2. <appPath>/runtimes/<name>      — dev (npm start)
    //   3. <appPath>/../runtimes/<name>   — embedded extraResources in packaged build
    async function resolveRuntime(runtimeName) {
        var candidates = [];

        if (appImageDir) {
            candidates.push(appImageDir + '/runtimes/' + runtimeName);
        }
        if (appPath) {
            candidates.push(appPath + '/runtimes/' + runtimeName);
            candidates.push(appPath + '/../runtimes/' + runtimeName);
        }

        for (var p of candidates) {
            try {
                if (await window.mycode.file.exists(p)) return p;
            } catch (_) { /* keep trying */ }
        }
        return null;
    }

    // Resolve a command string for execution.
    // For 'bundled' type, the first token is resolved from runtimes/.
    // For 'system' type, the first token is used as-is.
    // Returns { exe, args } or null if resolution fails.
    async function resolveCommand(cmdStr, type, filePath) {
        var expanded = substitutePlaceholders(cmdStr, filePath);
        var parts = parseCommand(expanded);
        if (parts.length === 0) return null;

        var exe = parts[0];
        var args = parts.slice(1);

        if (type === 'bundled') {
            var resolved = await resolveRuntime(exe);
            if (!resolved) return null;
            exe = resolved;
        }

        return { exe: exe, args: args };
    }

    // Update Compile / Run button visibility based on current file.
    function updateButtonVisibility() {
        var filePath = pluginApi ? pluginApi.workspace.getActiveFilePath() : null;
        if (!filePath) {
            if (compileStatusItem) compileStatusItem.hide();
            if (runStatusItem) runStatusItem.hide();
            return;
        }

        var ext = getExt(filePath);
        var entry = runnerConfigs[ext];

        if (entry && entry.compile) {
            if (compileStatusItem) {
                compileStatusItem.update({ text: '\uD83D\uDD28 Compile ' + entry.label });
                compileStatusItem.show();
            }
        } else {
            if (compileStatusItem) compileStatusItem.hide();
        }

        if (entry && entry.run) {
            if (runStatusItem) {
                currentLabel = entry.label;
                runStatusItem.update({ text: '\u25B6 Run ' + entry.label });
                runStatusItem.show();
            }
        } else {
            if (runStatusItem) runStatusItem.hide();
        }
    }

    // Reload runner configs from the main process.
    async function reloadConfigs() {
        if (window.mycode && window.mycode.runnerConfig) {
            try {
                runnerConfigs = await window.mycode.runnerConfig.getAll();
            } catch (e) {
                console.error('[Runner] Failed to load runner configs:', e);
                runnerConfigs = {};
            }
        }
    }

    // Execute a command string (compile or run) in the output panel.
    // Returns a promise that resolves when the process exits.
    async function executeCommand(cmdStr, type, filePath, label, actionName) {
        var dir = filePath.replace(/[/\\][^/\\]*$/, '') || '.';
        var resolved = await resolveCommand(cmdStr, type, filePath);

        if (!resolved) {
            var firstToken = parseCommand(cmdStr)[0] || cmdStr;
            pluginApi.ui.showNotification(
                'Runner: Could not resolve "' + firstToken + '". ' +
                (type === 'bundled' ? 'Check runtimes/ folder.' : 'Check system PATH.'),
                'error', 6000);
            return false;
        }

        // Stop any existing run first
        if (terminalId && window.mycode && window.mycode.terminal) {
            capturingOutput = false;
            var oldId = terminalId;
            terminalId = null;
            window.mycode.terminal.destroy(oldId).catch(function () {});
        }

        // Save file before executing
        try {
            var content = pluginApi.editor.getContent();
            await pluginApi.workspace.writeFile(filePath, content);
        } catch (e) {
            pluginApi.ui.showNotification('Runner: Could not save file: ' + e.message, 'error', 4000);
            return false;
        }

        clearOutput();
        var cmdDisplay = [resolved.exe].concat(resolved.args).join(' ');
        appendOutput('\x1b[90m[' + label + '] ' + actionName + ': ' + cmdDisplay + '\x1b[0m\r\n\r\n');
        outputPanel.show();
        setTimeout(fitXterm, 50);
        setRunning(true, label);
        capturingOutput = false;

        if (!window.mycode || !window.mycode.terminal) {
            pluginApi.ui.showNotification('Runner: Terminal API not available', 'error', 4000);
            setRunning(false);
            return false;
        }

        try {
            terminalId = await window.mycode.terminal.createProcess(
                resolved.exe, resolved.args, dir, 120, 30);
            capturingOutput = true;
        } catch (e) {
            appendOutput('[' + label + '] Error starting process: ' + e.message + '\n');
            setRunning(false);
            return false;
        }

        return true;
    }

    // -----------------------------------------------------------------------
    // Main plugin module
    // -----------------------------------------------------------------------
    var pluginModule = {

        async activate(api) {
            console.log('[Runner] Plugin activating...');
            pluginApi = api;

            // Fetch app path once at startup
            if (window.mycode && window.mycode.app && window.mycode.app.getAppPath) {
                appPath = await window.mycode.app.getAppPath();
                console.log('[Runner] appPath:', appPath);
            }

            // Load this plugin's main module so we can call getAppImageDir()
            try {
                await window.mycode.plugins.load('mycode-runner');
                appImageDir = await window.mycode.plugins.invokeMain('mycode-runner', 'getAppImageDir', []);
                if (appImageDir) console.log('[Runner] AppImage dir (via main module):', appImageDir);
            } catch (_) {
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

            // Load runner configurations
            await reloadConfigs();
            console.log('[Runner] Loaded configs for extensions:', Object.keys(runnerConfigs).join(', ') || '(none)');

            // -----------------------------------------------------------
            // 1. Output bottom panel
            // -----------------------------------------------------------
            outputPanel = api.ui.registerBottomPanel({
                id:    'runner-output',
                title: 'Program Output',
                icon:  '\u25B6',
            });

            // Add a "Clear" button into the tab strip
            var panelTab = document.querySelector('.bottom-tab-btn[data-panel="runner-output"]');
            if (panelTab && panelTab.parentElement) {
                var clearBtn = document.createElement('button');
                clearBtn.title   = 'Clear output (runner.clear)';
                clearBtn.textContent = '\uD83D\uDDD1';
                clearBtn.style.cssText = [
                    'background:none', 'border:none',
                    'color:var(--text-secondary)', 'cursor:pointer',
                    'padding:2px 6px', 'font-size:13px',
                    'border-radius:4px', 'line-height:1',
                ].join(';');
                clearBtn.onmouseenter = function () {
                    clearBtn.style.color      = 'var(--text-primary)';
                    clearBtn.style.background = 'var(--bg-secondary)';
                };
                clearBtn.onmouseleave = function () {
                    clearBtn.style.color      = 'var(--text-secondary)';
                    clearBtn.style.background = 'none';
                };
                clearBtn.onclick = function () { clearOutput(); };
                panelTab.insertAdjacentElement('afterend', clearBtn);
            }

            // Create an xterm Terminal inside the output panel
            var xtermContainer = document.createElement('div');
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
                runnerXterm.onData(function (data) {
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
                window.mycode.terminal.onData(function (id, data) {
                    if (id === terminalId && capturingOutput && runnerXterm) {
                        runnerXterm.write(data);
                    }
                });

                window.mycode.terminal.onExit(function (id, exitCode) {
                    if (id === terminalId) {
                        capturingOutput = false;
                        appendOutput('\r\n\x1b[90m[' + currentLabel + '] Process exited (code ' + exitCode + ')\x1b[0m\r\n');
                        terminalId = null;
                        setRunning(false);
                    }
                });
            }

            // -----------------------------------------------------------
            // 3. Compile command
            // -----------------------------------------------------------
            api.commands.register('runner.compile', async function () {
                var filePath = api.workspace.getActiveFilePath();
                if (!filePath) {
                    api.ui.showNotification('Runner: No file open', 'error', 3000);
                    return;
                }

                var ext = getExt(filePath);
                var entry = runnerConfigs[ext];
                if (!entry || !entry.compile) {
                    api.ui.showNotification(
                        'Runner: No compile command for *' + (ext || '<no extension>') + ' files',
                        'warning', 3000);
                    return;
                }

                await executeCommand(entry.compile, entry.type, filePath, entry.label, 'Compiling');
            });

            // -----------------------------------------------------------
            // 4. Run command
            // -----------------------------------------------------------
            api.commands.register('runner.run', async function () {
                var filePath = api.workspace.getActiveFilePath();
                if (!filePath) {
                    api.ui.showNotification('Runner: No file open', 'error', 3000);
                    return;
                }

                var ext = getExt(filePath);
                var entry = runnerConfigs[ext];
                if (!entry || !entry.run) {
                    api.ui.showNotification(
                        'Runner: No run command for *' + (ext || '<no extension>') + ' files',
                        'warning', 3000);
                    return;
                }

                await executeCommand(entry.run, entry.type, filePath, entry.label, 'Running');
            });

            // -----------------------------------------------------------
            // 5. Stop command
            // -----------------------------------------------------------
            api.commands.register('runner.stop', function () {
                if (!terminalId) {
                    api.ui.showNotification('Runner: No program running', 'info', 2000);
                    return;
                }
                if (!window.mycode || !window.mycode.terminal) return;

                capturingOutput = false;
                appendOutput('\n[' + currentLabel + '] Stopped.\n');

                var idToKill = terminalId;
                terminalId = null;
                setRunning(false);

                // Send Ctrl+C before destroying so the process gets a chance to clean up.
                window.mycode.terminal.write(idToKill, '\x03');
                setTimeout(function () {
                    window.mycode.terminal.destroy(idToKill).catch(function () {});
                }, 200);

                api.ui.showNotification('Runner: Program stopped', 'info', 2000);
            });

            // -----------------------------------------------------------
            // 6. Status bar items (Compile, Run, Stop)
            // -----------------------------------------------------------
            compileStatusItem = api.ui.createStatusBarItem({
                id:        'runner-compile',
                text:      '\uD83D\uDD28 Compile',
                tooltip:   'Compile the current file (runner.compile)',
                command:   'runner.compile',
                alignment: 'left',
                priority:  51,
            });
            // Hidden by default, shown when a compile command is configured
            compileStatusItem.hide();

            runStatusItem = api.ui.createStatusBarItem({
                id:        'runner-run',
                text:      '\u25B6 Run',
                tooltip:   'Run the current program (runner.run)',
                command:   'runner.run',
                alignment: 'left',
                priority:  50,
            });
            // Hidden by default, shown when a run command is configured
            runStatusItem.hide();

            stopStatusItem = api.ui.createStatusBarItem({
                id:        'runner-stop',
                text:      '\u25A0 Stop',
                tooltip:   'Stop the running program (runner.stop)',
                command:   'runner.stop',
                alignment: 'left',
                priority:  49,
            });
            // Hidden until a run is active

            // -----------------------------------------------------------
            // 7. Clear command
            // -----------------------------------------------------------
            api.commands.register('runner.clear', function () {
                clearOutput();
            });

            // -----------------------------------------------------------
            // 8. Reload configs command (called from Preferences save)
            // -----------------------------------------------------------
            api.commands.register('runner.reloadConfigs', async function () {
                await reloadConfigs();
                updateButtonVisibility();
                console.log('[Runner] Configs reloaded:', Object.keys(runnerConfigs).join(', '));
            });

            // -----------------------------------------------------------
            // 9. Tools menu items
            // -----------------------------------------------------------
            api.menus.registerMenuItem({
                id:      'runner.menu.compile',
                label:   'Compile',
                command: 'runner.compile',
                group:   'tools',
            });
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

            // -----------------------------------------------------------
            // 10. React to file open / tab switch to update buttons
            // -----------------------------------------------------------
            api.workspace.onDidOpenFile(function () {
                updateButtonVisibility();
            });

            // Initial visibility based on whatever file is currently open
            updateButtonVisibility();

            console.log('[Runner] Plugin activated — Compile/Run/Stop ready');
        },

        deactivate() {
            console.log('[Runner] Plugin deactivated');
            capturingOutput = false;
            if (terminalId && window.mycode && window.mycode.terminal) {
                window.mycode.terminal.destroy(terminalId).catch(function () {});
                terminalId = null;
            }
            if (compileStatusItem) { compileStatusItem.dispose(); compileStatusItem = null; }
            if (runStatusItem)     { runStatusItem.dispose();     runStatusItem     = null; }
            if (stopStatusItem)    { stopStatusItem.dispose();    stopStatusItem    = null; }
            if (outputPanel)       { outputPanel.dispose();       outputPanel       = null; }
            if (runnerXterm)       { runnerXterm.dispose();       runnerXterm       = null; }
            runnerFitAddon = null;
            pluginApi = null;
        }
    };

    // -----------------------------------------------------------------------
    // Register with MyCode plugin loader
    // -----------------------------------------------------------------------
    window.__MYCODE_PLUGINS__ = window.__MYCODE_PLUGINS__ || {};
    window.__MYCODE_PLUGINS__['mycode-runner'] = pluginModule;

    var callbackName = '__plugin_mycode_runner__';
    if (window[callbackName]) {
        window[callbackName](pluginModule);
    }

})();
