/**
 * PluginContext - Creates the Plugin API context for renderer-side plugins
 * This is the main API object passed to plugins during activation
 */

import {
    PluginAPI,
    EditorAPI,
    WorkspaceAPI,
    UIAPI,
    CommandsAPI,
    MenusAPI,
    SettingsAPI,
    LanguagesAPI,
    HooksAPI,
    UtilsAPI,
    Disposable,
    Selection,
    Position,
    DecorationOptions,
    ContentChangeEvent,
    CursorChangeEvent,
    LanguageChangeEvent,
    FileEvent,
    WillSaveEvent,
    NotificationType,
    QuickPickItem,
    InputBoxOptions,
    StatusBarItemOptions,
    StatusBarItem,
    SidebarPanelOptions,
    SidebarPanel,
    BottomPanelOptions,
    BottomPanel,
    DiffOptions,
    MenuItemOptions,
    ContextMenuItemOptions,
    SaveContext,
    FileContext,
    PasteContext,
    DocumentFormatter,
    RangeFormatter,
    Linter,
    Diagnostic,
    FormattingOptions,
    TextEdit,
} from '../../shared/plugin-types';

// Import managers that plugins interact with (these will be set during init)
let editorManager: any = null;
let tabManager: any = null;

/**
 * Set the editor manager reference for plugin access
 */
export function setEditorManager(manager: any): void {
    editorManager = manager;
}

/**
 * Set the tab manager reference for plugin access
 */
export function setTabManager(manager: any): void {
    tabManager = manager;
}

// Event emitters for plugin hooks
type HookCallback = (...args: any[]) => any;
const hooks: Map<string, Set<HookCallback>> = new Map();

// Registries for formatters and linters (language -> formatter/linter)
const formatters: Map<string, DocumentFormatter> = new Map();
const rangeFormatters: Map<string, RangeFormatter> = new Map();
const linters: Map<string, Linter[]> = new Map();

function addHook(name: string, callback: HookCallback): Disposable {
    if (!hooks.has(name)) {
        hooks.set(name, new Set());
    }
    hooks.get(name)!.add(callback);
    return {
        dispose: () => {
            hooks.get(name)?.delete(callback);
        }
    };
}

export function triggerHook(name: string, ...args: any[]): void {
    const callbacks = hooks.get(name);
    if (callbacks) {
        for (const callback of callbacks) {
            try {
                callback(...args);
            } catch (error) {
                console.error(`[PluginContext] Hook ${name} error:`, error);
            }
        }
    }
}

export async function triggerAsyncHook<T>(name: string, value: T, ...args: any[]): Promise<T> {
    const callbacks = hooks.get(name);
    if (callbacks) {
        for (const callback of callbacks) {
            try {
                const result = await callback(value, ...args);
                if (result !== undefined) {
                    value = result;
                }
            } catch (error) {
                console.error(`[PluginContext] Async hook ${name} error:`, error);
            }
        }
    }
    return value;
}

// Command registry
const commands: Map<string, (...args: any[]) => any> = new Map();

/**
 * Create a Plugin API context for a specific plugin
 */
export function createPluginContext(pluginId: string): PluginAPI {
    return {
        editor: createEditorAPI(pluginId),
        workspace: createWorkspaceAPI(pluginId),
        ui: createUIAPI(pluginId),
        commands: createCommandsAPI(pluginId),
        menus: createMenusAPI(pluginId),
        settings: createSettingsAPI(pluginId),
        languages: createLanguagesAPI(pluginId),
        hooks: createHooksAPI(pluginId),
        utils: createUtilsAPI(pluginId),
    };
}

function createEditorAPI(pluginId: string): EditorAPI {
    return {
        getContent(): string {
            return editorManager?.getContent() || '';
        },
        setContent(content: string): void {
            editorManager?.setContent(content);
        },
        getSelection(): Selection {
            const sel = editorManager?.getSelection();
            return sel || { start: { line: 1, column: 1 }, end: { line: 1, column: 1 } };
        },
        setSelection(selection: Selection): void {
            editorManager?.setSelection(selection);
        },
        getSelectedText(): string {
            return editorManager?.getSelectedText() || '';
        },
        replaceSelection(text: string): void {
            editorManager?.replaceSelection(text);
        },
        getCursorPosition(): Position {
            const pos = editorManager?.getCursorPosition();
            return pos || { line: 1, column: 1 };
        },
        setCursorPosition(position: Position): void {
            editorManager?.setCursorPosition(position);
        },
        getLanguage(): string {
            return editorManager?.getLanguage() || 'plaintext';
        },
        setLanguage(language: string): void {
            editorManager?.setLanguage(language);
        },
        addDecoration(options: DecorationOptions): Disposable {
            const id = editorManager?.addDecoration(options);
            return {
                dispose: () => editorManager?.removeDecoration(id)
            };
        },
        onDidChangeContent(callback: (e: ContentChangeEvent) => void): Disposable {
            return addHook('editor:contentChange', callback);
        },
        onDidChangeCursorPosition(callback: (e: CursorChangeEvent) => void): Disposable {
            return addHook('editor:cursorChange', callback);
        },
        onDidChangeLanguage(callback: (e: LanguageChangeEvent) => void): Disposable {
            return addHook('editor:languageChange', callback);
        },
        getMonacoEditor(): any {
            return editorManager?.getMonacoEditor();
        },
        getMonaco(): any {
            return (window as any).monaco;
        },
        focus(): void {
            editorManager?.focus();
        },
        revealLine(line: number): void {
            editorManager?.revealLine(line);
        },
    };
}

function createWorkspaceAPI(pluginId: string): WorkspaceAPI {
    return {
        getActiveFilePath(): string | null {
            return tabManager?.getActiveFilePath() || null;
        },
        getOpenFiles(): string[] {
            return tabManager?.getOpenFiles() || [];
        },
        async openFile(path: string): Promise<void> {
            await tabManager?.openFile(path);
        },
        async saveFile(path?: string): Promise<void> {
            await tabManager?.saveFile(path);
        },
        async readFile(path: string): Promise<string> {
            const result = await window.mycode.file.read(path);
            return result.content || '';
        },
        async writeFile(path: string, content: string): Promise<void> {
            await window.mycode.file.save(path, content);
        },
        getOpenFolders(): string[] {
            // Return workspace folders if available
            return [];
        },
        onDidOpenFile(callback: (e: FileEvent) => void): Disposable {
            return addHook('workspace:fileOpen', callback);
        },
        onDidSaveFile(callback: (e: FileEvent) => void): Disposable {
            return addHook('workspace:fileSave', callback);
        },
        onDidCloseFile(callback: (e: FileEvent) => void): Disposable {
            return addHook('workspace:fileClose', callback);
        },
        onWillSaveFile(callback: (e: WillSaveEvent) => void): Disposable {
            return addHook('workspace:willSave', callback);
        },
    };
}

// Track notification stacking
let notificationStack: HTMLElement[] = [];

function createUIAPI(pluginId: string): UIAPI {
    return {
        showNotification(message: string, type: NotificationType = 'info', duration: number = 3000): void {
            const notification = document.createElement('div');
            notification.className = `plugin-notification plugin-notification-${type}`;
            notification.textContent = message;

            // Stack notifications
            const offset = notificationStack.length * 60;
            notification.style.bottom = `${40 + offset}px`;

            document.body.appendChild(notification);
            notificationStack.push(notification);

            const removeNotification = () => {
                notification.style.animation = 'notificationSlideOut 0.3s ease';
                setTimeout(() => {
                    const index = notificationStack.indexOf(notification);
                    if (index > -1) {
                        notificationStack.splice(index, 1);
                        // Reposition remaining notifications
                        notificationStack.forEach((n, i) => {
                            n.style.bottom = `${40 + i * 60}px`;
                        });
                    }
                    notification.remove();
                }, 300);
            };

            setTimeout(removeNotification, duration);
        },

        async showQuickPick(items: QuickPickItem[], options?: { placeholder?: string }): Promise<QuickPickItem | undefined> {
            return new Promise((resolve) => {
                const overlay = document.createElement('div');
                overlay.className = 'plugin-input-overlay';

                const picker = document.createElement('div');
                picker.className = 'plugin-input-dialog';

                const header = document.createElement('div');
                header.className = 'plugin-input-header';
                if (options?.placeholder) {
                    const title = document.createElement('h3');
                    title.textContent = options.placeholder;
                    header.appendChild(title);
                }

                const content = document.createElement('div');
                content.className = 'plugin-input-content';
                content.style.padding = '0';

                const list = document.createElement('div');
                list.style.cssText = 'max-height: 300px; overflow-y: auto;';

                let selectedIndex = 0;
                const itemElements: HTMLElement[] = [];

                const updateSelection = () => {
                    itemElements.forEach((el, i) => {
                        el.style.background = i === selectedIndex ? 'var(--bg-tertiary)' : 'transparent';
                    });
                };

                items.forEach((item, index) => {
                    const el = document.createElement('div');
                    el.style.cssText = 'padding: 10px 16px; cursor: pointer;';
                    el.innerHTML = `<div style="font-weight: 500;">${item.label}</div>` +
                        (item.description ? `<div style="font-size: 11px; color: var(--text-secondary);">${item.description}</div>` : '');
                    el.onmouseenter = () => {
                        selectedIndex = index;
                        updateSelection();
                    };
                    el.onclick = () => {
                        overlay.remove();
                        resolve(item);
                    };
                    list.appendChild(el);
                    itemElements.push(el);
                });

                updateSelection();

                // Keyboard navigation
                const handleKeydown = (e: KeyboardEvent) => {
                    if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
                        updateSelection();
                    } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        selectedIndex = Math.max(selectedIndex - 1, 0);
                        updateSelection();
                    } else if (e.key === 'Enter') {
                        overlay.remove();
                        document.removeEventListener('keydown', handleKeydown);
                        resolve(items[selectedIndex]);
                    } else if (e.key === 'Escape') {
                        overlay.remove();
                        document.removeEventListener('keydown', handleKeydown);
                        resolve(undefined);
                    }
                };
                document.addEventListener('keydown', handleKeydown);

                content.appendChild(list);
                if (header.children.length > 0) picker.appendChild(header);
                picker.appendChild(content);
                overlay.appendChild(picker);
                document.body.appendChild(overlay);

                overlay.onclick = (e) => {
                    if (e.target === overlay) {
                        overlay.remove();
                        document.removeEventListener('keydown', handleKeydown);
                        resolve(undefined);
                    }
                };
            });
        },

        async showInputBox(options: InputBoxOptions): Promise<string | undefined> {
            return new Promise((resolve) => {
                const overlay = document.createElement('div');
                overlay.className = 'plugin-input-overlay';

                const dialog = document.createElement('div');
                dialog.className = 'plugin-input-dialog';

                // Header
                const header = document.createElement('div');
                header.className = 'plugin-input-header';
                if (options.title) {
                    const title = document.createElement('h3');
                    title.textContent = options.title;
                    header.appendChild(title);
                }
                if (options.prompt) {
                    const prompt = document.createElement('p');
                    prompt.textContent = options.prompt;
                    header.appendChild(prompt);
                }

                // Content
                const content = document.createElement('div');
                content.className = 'plugin-input-content';

                const input = document.createElement('input');
                input.type = options.password ? 'password' : 'text';
                input.value = options.value || '';
                input.placeholder = options.placeHolder || '';

                const validationError = document.createElement('div');
                validationError.className = 'validation-error';
                validationError.style.display = 'none';

                content.appendChild(input);
                content.appendChild(validationError);

                // Footer
                const footer = document.createElement('div');
                footer.className = 'plugin-input-footer';

                const cancelBtn = document.createElement('button');
                cancelBtn.className = 'text-btn';
                cancelBtn.textContent = 'Cancel';
                cancelBtn.onclick = () => {
                    overlay.remove();
                    resolve(undefined);
                };

                const okBtn = document.createElement('button');
                okBtn.className = 'text-btn primary';
                okBtn.textContent = 'OK';
                okBtn.onclick = () => {
                    if (options.validateInput) {
                        const error = options.validateInput(input.value);
                        if (error) {
                            validationError.textContent = error;
                            validationError.style.display = 'block';
                            return;
                        }
                    }
                    overlay.remove();
                    resolve(input.value);
                };

                footer.appendChild(cancelBtn);
                footer.appendChild(okBtn);

                // Validation on input
                input.oninput = () => {
                    if (options.validateInput) {
                        const error = options.validateInput(input.value);
                        if (error) {
                            validationError.textContent = error;
                            validationError.style.display = 'block';
                        } else {
                            validationError.style.display = 'none';
                        }
                    }
                };

                // Keyboard handling
                input.onkeydown = (e) => {
                    if (e.key === 'Enter') {
                        okBtn.click();
                    } else if (e.key === 'Escape') {
                        overlay.remove();
                        resolve(undefined);
                    }
                };

                dialog.appendChild(header);
                dialog.appendChild(content);
                dialog.appendChild(footer);
                overlay.appendChild(dialog);
                document.body.appendChild(overlay);

                input.focus();
                input.select();
            });
        },

        createStatusBarItem(options: StatusBarItemOptions): StatusBarItem {
            const statusBarRight = document.getElementById('status-bar-right');
            if (!statusBarRight) {
                console.warn('[Plugin] Status bar not found');
                return {
                    ...options,
                    show() {},
                    hide() {},
                    dispose() {},
                    update() {}
                };
            }

            const item = document.createElement('div');
            item.className = 'status-bar-item';
            item.id = `status-item-${pluginId}-${options.id || Date.now()}`;
            item.dataset.plugin = pluginId; // Track which plugin owns this item
            if (options.tooltip) item.title = options.tooltip;
            if (options.command) item.classList.add('clickable');

            const updateContent = (opts: Partial<StatusBarItemOptions>) => {
                item.innerHTML = '';
                if (opts.icon) {
                    const icon = document.createElement('span');
                    icon.className = 'icon';
                    icon.textContent = opts.icon;
                    item.appendChild(icon);
                }
                if (opts.text) {
                    const text = document.createElement('span');
                    text.textContent = opts.text;
                    item.appendChild(text);
                }
                if (opts.tooltip) item.title = opts.tooltip;
            };

            updateContent(options);

            if (options.command) {
                item.onclick = () => {
                    const handler = commands.get(options.command!);
                    if (handler) handler();
                };
            }

            let currentOptions = { ...options };

            return {
                ...options,
                show() {
                    if (!item.parentElement) {
                        statusBarRight.appendChild(item);
                    }
                    item.style.display = 'flex';
                },
                hide() {
                    item.style.display = 'none';
                },
                dispose() {
                    item.remove();
                },
                update(newOptions: Partial<StatusBarItemOptions>) {
                    currentOptions = { ...currentOptions, ...newOptions };
                    updateContent(currentOptions);
                }
            };
        },

        registerSidebarPanel(options: SidebarPanelOptions): SidebarPanel {
            const sidebarTabs = document.querySelector('.sidebar-tabs');
            const sidebarPanels = document.querySelector('.sidebar-panels');

            if (!sidebarTabs || !sidebarPanels) {
                console.warn('[Plugin] Sidebar structure not found');
                const element = document.createElement('div');
                return {
                    id: options.id,
                    title: options.title,
                    element,
                    show() {},
                    hide() {},
                    dispose() {}
                };
            }

            // Create tab button
            const tabBtn = document.createElement('button');
            tabBtn.className = 'sidebar-tab-btn';
            tabBtn.dataset.panel = options.id;
            tabBtn.dataset.plugin = pluginId; // Add plugin ID for context menu support
            tabBtn.title = options.title;
            tabBtn.textContent = options.icon || '📋';

            // Create panel
            const panel = document.createElement('div');
            panel.id = `sidebar-panel-${options.id}`;
            panel.className = 'sidebar-panel plugin-sidebar-panel';

            // Add header if title provided
            const header = document.createElement('div');
            header.className = 'sidebar-header';
            header.innerHTML = `<h2>${options.title}</h2>`;
            panel.appendChild(header);

            // Content area
            const content = document.createElement('div');
            content.className = 'sidebar-panel-content';
            content.style.cssText = 'flex: 1; overflow: auto; padding: 8px;';
            panel.appendChild(content);

            // Tab switching
            tabBtn.onclick = () => {
                // Deactivate all tabs and panels
                document.querySelectorAll('.sidebar-tab-btn').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.sidebar-panel').forEach(p => p.classList.remove('active'));
                // Activate this tab and panel
                tabBtn.classList.add('active');
                panel.classList.add('active');
            };

            sidebarTabs.appendChild(tabBtn);
            sidebarPanels.appendChild(panel);

            return {
                id: options.id,
                title: options.title,
                element: content,
                show() {
                    tabBtn.click();
                },
                hide() {
                    // Switch back to files panel
                    const filesTab = document.querySelector('.sidebar-tab-btn[data-panel="files"]') as HTMLElement;
                    if (filesTab) filesTab.click();
                },
                dispose() {
                    tabBtn.remove();
                    panel.remove();
                }
            };
        },

        registerBottomPanel(options: BottomPanelOptions): BottomPanel {
            const bottomArea = document.getElementById('bottom-panel-area');
            const bottomTabs = document.querySelector('.bottom-panel-tabs');
            const bottomContent = document.getElementById('bottom-panel-content');

            if (!bottomArea || !bottomTabs || !bottomContent) {
                console.warn('[Plugin] Bottom panel structure not found');
                const element = document.createElement('div');
                return {
                    id: options.id,
                    title: options.title,
                    element,
                    show() {},
                    hide() {},
                    dispose() {}
                };
            }

            // Create tab button
            const tabBtn = document.createElement('button');
            tabBtn.className = 'bottom-tab-btn';
            tabBtn.dataset.panel = options.id;
            tabBtn.textContent = options.title;

            // Create panel content
            const panel = document.createElement('div');
            panel.id = `bottom-panel-${options.id}`;
            panel.className = 'bottom-panel-plugin';
            panel.style.display = 'none';

            // Tab switching
            tabBtn.onclick = () => {
                // Deactivate all tabs
                document.querySelectorAll('.bottom-tab-btn').forEach(t => t.classList.remove('active'));
                // Hide all bottom panels
                bottomContent.querySelectorAll('.bottom-panel-plugin').forEach(p => (p as HTMLElement).style.display = 'none');
                // Also hide terminal if it exists
                const terminal = document.getElementById('terminal-container');
                if (terminal) terminal.style.display = 'none';

                // Activate this tab and panel
                tabBtn.classList.add('active');
                panel.style.display = 'block';
            };

            bottomTabs.appendChild(tabBtn);
            bottomContent.appendChild(panel);

            return {
                id: options.id,
                title: options.title,
                element: panel,
                show() {
                    bottomArea.classList.remove('hidden');
                    tabBtn.click();
                },
                hide() {
                    panel.style.display = 'none';
                },
                dispose() {
                    tabBtn.remove();
                    panel.remove();
                    // Hide bottom area if no more tabs
                    if (bottomTabs.children.length <= 1) {
                        bottomArea.classList.add('hidden');
                    }
                }
            };
        },

        showDiff(original: string, modified: string, options?: DiffOptions): void {
            // Create diff viewer overlay
            const overlay = document.createElement('div');
            overlay.className = 'plugin-diff-overlay';

            const dialog = document.createElement('div');
            dialog.className = 'plugin-diff-dialog';

            // Header
            const header = document.createElement('div');
            header.className = 'plugin-diff-header';
            const title = document.createElement('h3');
            title.textContent = options?.title || 'Diff Viewer';
            const closeBtn = document.createElement('button');
            closeBtn.className = 'icon-btn';
            closeBtn.textContent = '×';
            closeBtn.onclick = () => overlay.remove();
            header.appendChild(title);
            header.appendChild(closeBtn);

            // Content - Monaco Diff Editor
            const content = document.createElement('div');
            content.className = 'plugin-diff-content';

            dialog.appendChild(header);
            dialog.appendChild(content);
            overlay.appendChild(dialog);
            document.body.appendChild(overlay);

            // Create Monaco diff editor
            // @ts-ignore - monaco is global
            if (typeof monaco !== 'undefined') {
                const originalModel = monaco.editor.createModel(original, options?.language || 'text');
                const modifiedModel = monaco.editor.createModel(modified, options?.language || 'text');

                const diffEditor = monaco.editor.createDiffEditor(content, {
                    automaticLayout: true,
                    readOnly: options?.readOnly ?? true,
                    renderSideBySide: true,
                    minimap: { enabled: false },
                });

                diffEditor.setModel({
                    original: originalModel,
                    modified: modifiedModel
                });

                // Cleanup on close
                closeBtn.onclick = () => {
                    diffEditor.dispose();
                    originalModel.dispose();
                    modifiedModel.dispose();
                    overlay.remove();
                };

                // ESC to close
                overlay.onkeydown = (e) => {
                    if (e.key === 'Escape') {
                        closeBtn.click();
                    }
                };
            } else {
                content.innerHTML = '<p style="padding: 20px;">Monaco editor not available for diff view.</p>';
            }
        },

        showDiffInEditor(original: string, modified: string, options?: DiffOptions): Disposable {
            if (!tabManager) {
                console.error('[Plugin] TabManager not available for diff view');
                return { dispose: () => {} };
            }

            // Create a diff tab using the TabManager
            const tab = tabManager.createDiffTab(original, modified, {
                title: options?.title || 'Diff',
                language: options?.language || 'plaintext',
            });

            return {
                dispose: () => {
                    // Close the diff tab
                    tabManager.closeTab(tab.id);
                }
            };
        },
    };
}

function createCommandsAPI(pluginId: string): CommandsAPI {
    return {
        register(id: string, handler: (...args: any[]) => any): Disposable {
            const fullId = id.includes('.') ? id : `${pluginId}.${id}`;
            commands.set(fullId, handler);
            return {
                dispose: () => commands.delete(fullId)
            };
        },
        async execute<T = any>(id: string, ...args: any[]): Promise<T> {
            const handler = commands.get(id);
            if (!handler) {
                throw new Error(`Command not found: ${id}`);
            }
            return handler(...args);
        },
        getCommands(): string[] {
            return Array.from(commands.keys());
        },
    };
}

function createMenusAPI(pluginId: string): MenusAPI {
    return {
        registerMenuItem(options: MenuItemOptions): Disposable {
            // Placeholder - integrate with menu system
            console.log(`[Plugin:${pluginId}] Registered menu item:`, options);
            return { dispose: () => {} };
        },
        registerContextMenuItem(options: ContextMenuItemOptions): Disposable {
            // Placeholder - integrate with context menu system
            console.log(`[Plugin:${pluginId}] Registered context menu item:`, options);
            return { dispose: () => {} };
        },
    };
}

function createSettingsAPI(pluginId: string): SettingsAPI {
    const settingsPrefix = `plugin.${pluginId}`;

    return {
        get<T>(key: string, defaultValue?: T): T {
            const fullKey = `${settingsPrefix}.${key}`;
            // Use localStorage for plugin settings
            const stored = localStorage.getItem(fullKey);
            if (stored !== null) {
                try {
                    return JSON.parse(stored);
                } catch {
                    return stored as T;
                }
            }
            return defaultValue as T;
        },
        async set(key: string, value: any): Promise<void> {
            const fullKey = `${settingsPrefix}.${key}`;
            localStorage.setItem(fullKey, JSON.stringify(value));
            triggerHook(`settings:change:${key}`, value);
        },
        onDidChange(key: string, callback: (value: any) => void): Disposable {
            return addHook(`settings:change:${key}`, callback);
        },
    };
}

function createLanguagesAPI(pluginId: string): LanguagesAPI {
    return {
        registerCompletionProvider(language: string, provider: any): Disposable {
            const monaco = (window as any).monaco;
            if (monaco) {
                const disposable = monaco.languages.registerCompletionItemProvider(language, provider);
                return { dispose: () => disposable.dispose() };
            }
            return { dispose: () => {} };
        },
        registerHoverProvider(language: string, provider: any): Disposable {
            const monaco = (window as any).monaco;
            if (monaco) {
                const disposable = monaco.languages.registerHoverProvider(language, provider);
                return { dispose: () => disposable.dispose() };
            }
            return { dispose: () => {} };
        },
        registerDefinitionProvider(language: string, provider: any): Disposable {
            const monaco = (window as any).monaco;
            if (monaco) {
                const disposable = monaco.languages.registerDefinitionProvider(language, provider);
                return { dispose: () => disposable.dispose() };
            }
            return { dispose: () => {} };
        },
        registerDocumentSymbolProvider(language: string, provider: any): Disposable {
            const monaco = (window as any).monaco;
            if (monaco) {
                const disposable = monaco.languages.registerDocumentSymbolProvider(language, provider);
                return { dispose: () => disposable.dispose() };
            }
            return { dispose: () => {} };
        },
        registerCodeActionProvider(language: string, provider: any): Disposable {
            const monaco = (window as any).monaco;
            if (monaco) {
                const disposable = monaco.languages.registerCodeActionProvider(language, provider);
                return { dispose: () => disposable.dispose() };
            }
            return { dispose: () => {} };
        },
        registerDocumentFormatter(language: string, formatter: DocumentFormatter): Disposable {
            console.log(`[PluginContext] Registering formatter for language: ${language}`);
            formatters.set(language, formatter);
            return {
                dispose: () => {
                    if (formatters.get(language) === formatter) {
                        formatters.delete(language);
                    }
                }
            };
        },
        registerRangeFormatter(language: string, formatter: RangeFormatter): Disposable {
            console.log(`[PluginContext] Registering range formatter for language: ${language}`);
            rangeFormatters.set(language, formatter);
            return {
                dispose: () => {
                    if (rangeFormatters.get(language) === formatter) {
                        rangeFormatters.delete(language);
                    }
                }
            };
        },
        registerLinter(language: string, linter: Linter): Disposable {
            console.log(`[PluginContext] Registering linter for language: ${language}`);
            if (!linters.has(language)) {
                linters.set(language, []);
            }
            linters.get(language)!.push(linter);
            return {
                dispose: () => {
                    const arr = linters.get(language);
                    if (arr) {
                        const index = arr.indexOf(linter);
                        if (index !== -1) {
                            arr.splice(index, 1);
                        }
                    }
                }
            };
        },
    };
}

function createHooksAPI(pluginId: string): HooksAPI {
    return {
        register(event: string, callback: (...args: any[]) => any): Disposable {
            return addHook(event, callback);
        },
        onBeforeSave(callback: (context: SaveContext) => Promise<string | void>): Disposable {
            return addHook('hooks:beforeSave', callback);
        },
        onAfterSave(callback: (context: SaveContext) => void): Disposable {
            return addHook('hooks:afterSave', callback);
        },
        onFileOpen(callback: (context: FileContext) => void): Disposable {
            return addHook('hooks:fileOpen', callback);
        },
        onFilePaste(callback: (context: PasteContext) => Promise<string | void>): Disposable {
            return addHook('hooks:filePaste', callback);
        },
    };
}

function createUtilsAPI(pluginId: string): UtilsAPI {
    return {
        log: {
            info(message: string, ...args: any[]): void {
                console.log(`[Plugin:${pluginId}]`, message, ...args);
            },
            warn(message: string, ...args: any[]): void {
                console.warn(`[Plugin:${pluginId}]`, message, ...args);
            },
            error(message: string, ...args: any[]): void {
                console.error(`[Plugin:${pluginId}]`, message, ...args);
            },
            debug(message: string, ...args: any[]): void {
                console.debug(`[Plugin:${pluginId}]`, message, ...args);
            },
        },
        path: {
            join(...paths: string[]): string {
                return paths.join('/').replace(/\/+/g, '/');
            },
            dirname(path: string): string {
                return path.split('/').slice(0, -1).join('/');
            },
            basename(path: string, ext?: string): string {
                const name = path.split('/').pop() || '';
                if (ext && name.endsWith(ext)) {
                    return name.slice(0, -ext.length);
                }
                return name;
            },
            extname(path: string): string {
                const name = path.split('/').pop() || '';
                const dotIndex = name.lastIndexOf('.');
                return dotIndex > 0 ? name.slice(dotIndex) : '';
            },
        },
    };
}

// Export command execution for internal use
export function executeCommand<T = any>(id: string, ...args: any[]): Promise<T> {
    const handler = commands.get(id);
    if (!handler) {
        return Promise.reject(new Error(`Command not found: ${id}`));
    }
    return Promise.resolve(handler(...args));
}

// Export command registration check
export function hasCommand(id: string): boolean {
    return commands.has(id);
}

// Export formatter access for use by App.ts
export function getFormatter(language: string): DocumentFormatter | undefined {
    return formatters.get(language);
}

export function getRangeFormatter(language: string): RangeFormatter | undefined {
    return rangeFormatters.get(language);
}

// Export linter access for use by App.ts
export function getLinters(language: string): Linter[] {
    return linters.get(language) || [];
}

// Format document using registered formatter
export async function formatDocument(
    content: string,
    language: string,
    options: FormattingOptions
): Promise<{ formatted: string; edits: TextEdit[] } | null> {
    const formatter = formatters.get(language);
    if (!formatter) {
        return null;
    }

    try {
        const edits = await formatter.provideDocumentFormattingEdits(content, options);
        if (edits.length === 0) {
            return { formatted: content, edits: [] };
        }

        // Apply edits to get formatted content
        // Sort edits by position (reverse order to apply from end to start)
        const sortedEdits = [...edits].sort((a, b) => {
            if (a.range.start.line !== b.range.start.line) {
                return b.range.start.line - a.range.start.line;
            }
            return b.range.start.column - a.range.start.column;
        });

        const lines = content.split('\n');
        for (const edit of sortedEdits) {
            const startLine = edit.range.start.line - 1;
            const endLine = edit.range.end.line - 1;
            const startCol = edit.range.start.column - 1;
            const endCol = edit.range.end.column - 1;

            if (startLine === endLine) {
                // Single line edit
                const line = lines[startLine] || '';
                lines[startLine] = line.slice(0, startCol) + edit.newText + line.slice(endCol);
            } else {
                // Multi-line edit
                const startLineText = (lines[startLine] || '').slice(0, startCol);
                const endLineText = (lines[endLine] || '').slice(endCol);
                const newLines = edit.newText.split('\n');

                if (newLines.length === 1) {
                    lines.splice(startLine, endLine - startLine + 1, startLineText + newLines[0] + endLineText);
                } else {
                    newLines[0] = startLineText + newLines[0];
                    newLines[newLines.length - 1] = newLines[newLines.length - 1] + endLineText;
                    lines.splice(startLine, endLine - startLine + 1, ...newLines);
                }
            }
        }

        return { formatted: lines.join('\n'), edits };
    } catch (error) {
        console.error('[PluginContext] Format error:', error);
        return null;
    }
}

// Run linters and return diagnostics
export async function runLinters(
    content: string,
    language: string,
    filePath: string
): Promise<Diagnostic[]> {
    const languageLinters = linters.get(language);
    if (!languageLinters || languageLinters.length === 0) {
        return [];
    }

    const allDiagnostics: Diagnostic[] = [];
    for (const linter of languageLinters) {
        try {
            const diagnostics = await linter.provideDiagnostics(content, filePath);
            allDiagnostics.push(...diagnostics);
        } catch (error) {
            console.error('[PluginContext] Linter error:', error);
        }
    }

    return allDiagnostics;
}
