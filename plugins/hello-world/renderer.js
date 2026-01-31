/**
 * Hello World Plugin - A simple test plugin for MyCode
 * Demonstrates plugin functionality including new UI features
 */

// Register this plugin globally so the PluginLoader can find it
(function() {
    let statusBarItem = null;
    let sidebarPanel = null;
    let bottomPanel = null;

    const pluginModule = {
        /**
         * Called when the plugin is activated
         * @param {import('../../../../shared/plugin-types').PluginAPI} api
         */
        activate(api) {
            console.log('[HelloWorld] Plugin activated!');

            // --- Status Bar Item ---
            statusBarItem = api.ui.createStatusBarItem({
                id: 'hello-status',
                text: '👋 Hello',
                tooltip: 'Click to say hello',
                command: 'hello-world.sayHello',
                priority: 100
            });
            statusBarItem.show();

            // --- Sidebar Panel ---
            sidebarPanel = api.ui.registerSidebarPanel({
                id: 'hello-sidebar',
                title: 'Hello World',
                icon: '👋'
            });
            sidebarPanel.element.innerHTML = `
                <div style="padding: 8px;">
                    <h3 style="margin: 0 0 12px;">Hello World Plugin</h3>
                    <p style="color: var(--text-secondary); margin-bottom: 16px;">
                        This sidebar panel was created by the Hello World plugin.
                    </p>
                    <button id="hello-sidebar-btn" style="padding: 8px 16px; cursor: pointer;">
                        Say Hello
                    </button>
                    <button id="hello-input-btn" style="padding: 8px 16px; cursor: pointer; margin-left: 8px;">
                        Input Box
                    </button>
                    <button id="hello-diff-btn" style="padding: 8px 16px; cursor: pointer; margin-left: 8px;">
                        Show Diff
                    </button>
                </div>
            `;
            // Attach event handlers
            setTimeout(() => {
                const btn = document.getElementById('hello-sidebar-btn');
                if (btn) btn.onclick = () => api.commands.execute('hello-world.sayHello');

                const inputBtn = document.getElementById('hello-input-btn');
                if (inputBtn) inputBtn.onclick = () => api.commands.execute('hello-world.showInputBox');

                const diffBtn = document.getElementById('hello-diff-btn');
                if (diffBtn) diffBtn.onclick = () => api.commands.execute('hello-world.showDiff');
            }, 100);

            // --- Register Commands ---

            // Say Hello command
            api.commands.register('hello-world.sayHello', () => {
                api.ui.showNotification('Hello from MyCode Plugin System! 👋', 'success', 5000);
                console.log('[HelloWorld] Said hello!');
            });

            // Show Info command
            api.commands.register('hello-world.showInfo', () => {
                const content = api.editor.getContent();
                const language = api.editor.getLanguage();
                const cursor = api.editor.getCursorPosition();
                const selection = api.editor.getSelection();
                const filePath = api.workspace.getActiveFilePath();

                const info = [
                    `File: ${filePath || 'Untitled'}`,
                    `Language: ${language}`,
                    `Lines: ${content.split('\n').length}`,
                    `Characters: ${content.length}`,
                    `Cursor: Line ${cursor.line}, Column ${cursor.column}`,
                    `Selection: ${selection.start.line}:${selection.start.column} - ${selection.end.line}:${selection.end.column}`
                ].join('\n');

                api.ui.showNotification(info, 'info', 10000);
                console.log('[HelloWorld] Editor info:', info);
            });

            // Show Input Box command
            api.commands.register('hello-world.showInputBox', async () => {
                const result = await api.ui.showInputBox({
                    title: 'Hello World Input',
                    prompt: 'Enter your name:',
                    placeHolder: 'Your name here...',
                    value: '',
                    validateInput: (value) => {
                        if (!value || value.trim().length === 0) {
                            return 'Name cannot be empty';
                        }
                        return undefined;
                    }
                });

                if (result) {
                    api.ui.showNotification(`Hello, ${result}! 👋`, 'success', 5000);
                }
            });

            // Show Diff command
            api.commands.register('hello-world.showDiff', () => {
                const original = `function hello() {
    console.log("Hello, World!");
}

hello();`;

                const modified = `function hello(name) {
    console.log("Hello, " + name + "!");
}

function goodbye(name) {
    console.log("Goodbye, " + name + "!");
}

hello("MyCode");
goodbye("World");`;

                api.ui.showDiff(original, modified, {
                    title: 'Example Diff - Before/After',
                    language: 'javascript',
                    readOnly: true
                });
            });

            // --- Event Hooks ---

            // Listen for file save events
            api.hooks.register('workspace:didSave', (data) => {
                console.log('[HelloWorld] File saved:', data.path);
                // Update status bar
                if (statusBarItem) {
                    statusBarItem.update({ text: '✓ Saved' });
                    setTimeout(() => {
                        statusBarItem.update({ text: '👋 Hello' });
                    }, 2000);
                }
            });

            // Log activation complete
            api.ui.showNotification('Hello World plugin activated!', 'success', 3000);
            console.log('[HelloWorld] Activation complete, commands registered');
        },

        /**
         * Called when the plugin is deactivated
         */
        deactivate() {
            console.log('[HelloWorld] Plugin deactivated');
            if (statusBarItem) statusBarItem.dispose();
            if (sidebarPanel) sidebarPanel.dispose();
            if (bottomPanel) bottomPanel.dispose();
        }
    };

    // Register the plugin globally
    window.__MYCODE_PLUGINS__ = window.__MYCODE_PLUGINS__ || {};
    window.__MYCODE_PLUGINS__['mycode-hello-world'] = pluginModule;

    // Also register via callback if loader is waiting
    const callbackName = '__plugin_mycode_hello_world__';
    if (window[callbackName]) {
        window[callbackName](pluginModule);
    }
})();
