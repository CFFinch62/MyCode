/**
 * MyCode - Main Application Class
 * Coordinates all UI components and handles application state
 */

import { EditorManager } from './editor/EditorManager';
import { Sidebar } from './sidebar/Sidebar';
import { SearchBar } from './search/SearchBar';
import { TabManager } from './editor/TabManager';
import { PreferencesDialog } from './preferences/PreferencesDialog';
import { MarkdownPreview } from './preview/MarkdownPreview';
import { Terminal } from './terminal/Terminal';
import { GitStatusBar } from './git/GitStatusBar';
import { GutterDecorations } from './git/GutterDecorations';
import { CommitDialog } from './git/CommitDialog';
import { Settings, DocumentTab, TreeNode } from '../shared/types';
import { PluginLoader, PluginRegistry, triggerHook, triggerAsyncHook, formatDocument, runLinters } from './plugins';
import { PluginManagerDialog } from './plugins/PluginManagerDialog';

declare const monaco: typeof import('monaco-editor');

export class App {
    private editorManager!: EditorManager;
    private sidebar!: Sidebar;
    private searchBar!: SearchBar;
    private tabManager!: TabManager;
    private preferencesDialog!: PreferencesDialog;
    private markdownPreview!: MarkdownPreview;
    private terminal!: Terminal;
    private gitStatusBar!: GitStatusBar;
    private gutterDecorations!: GutterDecorations;
    private commitDialog!: CommitDialog;
    private settings!: Settings;
    private sidebarVisible = true;

    // Plugin system
    private pluginRegistry!: PluginRegistry;
    private pluginLoader!: PluginLoader;
    private pluginManagerDialog!: PluginManagerDialog;

    async init(): Promise<void> {
        // Load settings
        this.settings = await window.mycode.settings.getAll();
        this.sidebarVisible = this.settings.sidebarVisible;

        // Initialize components
        this.editorManager = new EditorManager(this.settings);
        this.tabManager = new TabManager(this.editorManager);
        this.sidebar = new Sidebar(
            this.onFileSelect.bind(this),
            this.onFolderSelect.bind(this),
            this.onFolderRemove.bind(this)
        );
        this.sidebar.setOnOpenFolder(() => this.openFolder());
        this.searchBar = new SearchBar(this.editorManager);
        this.preferencesDialog = new PreferencesDialog(this.applySettings.bind(this));
        this.markdownPreview = new MarkdownPreview();
        this.markdownPreview.setEditor(this.editorManager.getEditor());
        this.terminal = new Terminal();
        this.gitStatusBar = new GitStatusBar();
        this.gutterDecorations = new GutterDecorations();
        this.commitDialog = new CommitDialog();

        // Setup Git callbacks
        this.gitStatusBar.onCommit = () => this.showCommitDialog();
        this.commitDialog.onCommitSuccess = () => this.gitStatusBar.refresh();
        this.gitStatusBar.onStatusChange = (status, repoPath) => {
            if (status && repoPath) {
                this.sidebar.updateGitStatus(repoPath, status.files);
            } else {
                this.sidebar.clearGitStatus();
            }
        };
        this.gutterDecorations.setEditor(this.editorManager.getEditor());

        // Initialize plugin system
        this.pluginRegistry = new PluginRegistry();
        this.pluginLoader = new PluginLoader(this.pluginRegistry);
        this.pluginLoader.initialize(this.editorManager, this.tabManager);
        this.pluginManagerDialog = new PluginManagerDialog((pluginId, enabled) => {
            this.handlePluginStateChange(pluginId, enabled);
        });

        // Apply initial theme
        this.applyTheme();

        // Setup menu event listeners
        this.setupMenuListeners();

        // Setup UI event listeners
        this.setupUIListeners();

        // Apply initial state
        this.updateSidebarVisibility();

        // Register languages from plugin manifests before restoring session
        try {
            const plugins = await window.mycode.plugins.list();
            for (const plugin of plugins) {
                if (plugin.enabled && plugin.manifest.mycode.contributes?.languages) {
                    for (const lang of plugin.manifest.mycode.contributes.languages) {
                        if (typeof monaco !== 'undefined' && monaco.languages) {
                            try {
                                monaco.languages.register({
                                    id: lang.id,
                                    extensions: lang.extensions,
                                    aliases: lang.aliases
                                });
                            } catch (e) {
                                // Might already be registered
                            }
                        }
                    }
                }
            }
        } catch (e) {
            console.error('Failed to register plugin languages during init:', e);
        }

        // Restore previous session
        await this.restoreSession();

        // Load startup plugins
        await this.pluginLoader.loadStartupPlugins();

        console.log('MyCode initialized');
    }

    private setupMenuListeners(): void {
        window.mycode.onMenuEvent.newTab(() => this.newTab());
        window.mycode.onMenuEvent.openFile(() => this.openFile());
        window.mycode.onMenuEvent.openFolder(() => this.openFolder());
        window.mycode.onMenuEvent.newProjectFolder(() => this.createProjectFolder());
        window.mycode.onMenuEvent.save(() => this.save());
        window.mycode.onMenuEvent.saveAs(() => this.saveAs());
        window.mycode.onMenuEvent.closeTab(() => this.closeCurrentTab());
        window.mycode.onMenuEvent.find(() => this.searchBar.show(false));
        window.mycode.onMenuEvent.replace(() => this.searchBar.show(true));
        window.mycode.onMenuEvent.selectAll(() => this.selectAll());
        window.mycode.onMenuEvent.toggleSidebar(() => this.toggleSidebar());
        window.mycode.onMenuEvent.togglePreview(() => this.togglePreview());
        window.mycode.onMenuEvent.toggleTerminal(() => this.toggleTerminal());
        window.mycode.onMenuEvent.preferences(() => this.showPreferences());
        window.mycode.onMenuEvent.gitCommit(() => this.showCommitDialog());
        window.mycode.onMenuEvent.gitPush(() => this.gitPush());
        window.mycode.onMenuEvent.gitPull(() => this.gitPull());
        window.mycode.onMenuEvent.pluginManager(() => this.showPluginManager());
    }

    private showCommitDialog(): void {
        const repoPath = this.gitStatusBar.getRepoPath();
        if (repoPath) {
            this.commitDialog.show(repoPath);
        }
    }

    private async gitPush(): Promise<void> {
        const repoPath = this.gitStatusBar.getRepoPath();
        if (repoPath) {
            const result = await window.mycode.git.push(repoPath);
            if (result.success) {
                this.gitStatusBar.refresh();
            } else {
                alert(`Push failed: ${result.error}`);
            }
        }
    }

    private async gitPull(): Promise<void> {
        const repoPath = this.gitStatusBar.getRepoPath();
        if (repoPath) {
            const result = await window.mycode.git.pull(repoPath);
            if (result.success) {
                this.gitStatusBar.refresh();
            } else {
                alert(`Pull failed: ${result.error}`);
            }
        }
    }

    private toggleTerminal(): void {
        // Get the current working directory based on the current file or project
        const cwd = this.getTerminalWorkingDirectory();
        this.terminal.toggle(cwd);
    }

    /**
     * Get the working directory for the terminal
     * Priority: current file's directory > first opened folder > undefined (home)
     */
    private getTerminalWorkingDirectory(): string | undefined {
        // First, try to get the directory of the currently open file
        const currentTab = this.tabManager.getCurrentTab();
        if (currentTab?.filePath) {
            // Get the directory containing the current file
            const lastSlash = currentTab.filePath.lastIndexOf('/');
            if (lastSlash > 0) {
                return currentTab.filePath.substring(0, lastSlash);
            }
        }

        // Fall back to the first opened folder in the sidebar
        if (this.settings.openedFolders.length > 0) {
            return this.settings.openedFolders[0];
        }

        // Return undefined to use the default (home directory)
        return undefined;
    }

    private togglePreview(): void {
        this.markdownPreview.toggle();
        // Update preview with current content if now visible
        if (this.markdownPreview.isPreviewVisible()) {
            this.markdownPreview.onContentChanged(this.editorManager.getContent());
        }
    }

    private selectAll(): void {
        const editor = this.editorManager.getEditor();
        const model = editor.getModel();
        if (model) {
            editor.setSelection(model.getFullModelRange());
            editor.focus();
        }
    }

    private showPreferences(): void {
        this.preferencesDialog.show();
    }

    private showPluginManager(): void {
        this.pluginManagerDialog.show();
    }

    private async handlePluginStateChange(pluginId: string, enabled: boolean): Promise<void> {
        if (!enabled) {
            // Unregister the plugin from the registry (removes UI contributions)
            this.pluginRegistry.unregister(pluginId);

            // Remove sidebar tab for this plugin if exists
            const sidebarTab = document.querySelector(`.sidebar-tab-btn[data-plugin="${pluginId}"]`);
            if (sidebarTab) {
                sidebarTab.remove();
            }
            const sidebarPanel = document.querySelector(`.sidebar-panel[data-plugin="${pluginId}"]`);
            if (sidebarPanel) {
                sidebarPanel.remove();
            }

            // Remove status bar items for this plugin
            document.querySelectorAll(`.status-bar-item[data-plugin="${pluginId}"]`).forEach(item => {
                item.remove();
            });

            // Switch back to files panel
            this.switchToFilesPanel();
        } else {
            // Plugin was enabled - activate it immediately
            try {
                const plugins = await window.mycode.plugins.list();
                const plugin = plugins.find(p => p.id === pluginId);
                if (plugin && plugin.enabled && !this.pluginRegistry.isActive(pluginId)) {
                    await this.pluginLoader.loadPlugin(plugin);
                }
            } catch (error) {
                console.error(`[App] Failed to activate plugin ${pluginId}:`, error);
            }
        }
    }

    private switchToFilesPanel(): void {
        // Switch to files panel in sidebar
        document.querySelectorAll('.sidebar-tab-btn').forEach(btn => {
            const isFilesTab = (btn as HTMLElement).dataset.panel === 'files';
            btn.classList.toggle('active', isFilesTab);
        });
        document.querySelectorAll('.sidebar-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === 'sidebar-panel-files');
        });
    }

    private applySettings(newSettings: Partial<Settings>): void {
        // Update local settings
        this.settings = { ...this.settings, ...newSettings };

        // Apply editor settings
        this.editorManager.updateSettings(newSettings);

        // Apply search settings
        if (newSettings.cyclicSearch !== undefined) {
            this.searchBar.setCyclicSearch(newSettings.cyclicSearch);
        }
    }

    private applyTheme(): void {
        const root = document.documentElement;
        if (this.settings.followSystemStyle) {
            root.removeAttribute('data-theme');
        } else if (this.settings.preferDarkStyle) {
            root.setAttribute('data-theme', 'dark');
        } else {
            root.setAttribute('data-theme', 'light');
        }
    }

    private setupUIListeners(): void {
        // Welcome view buttons
        document.getElementById('welcome-new-file')?.addEventListener('click', () => this.newTab());
        document.getElementById('welcome-open-file')?.addEventListener('click', () => this.openFile());
        document.getElementById('welcome-open-folder')?.addEventListener('click', () => this.openFolder());
        document.getElementById('btn-open-folder')?.addEventListener('click', () => this.openFolder());
        document.getElementById('btn-add-folder')?.addEventListener('click', () => this.openFolder());
        document.getElementById('btn-new-tab')?.addEventListener('click', () => this.newTab());

        // Sidebar tab switching
        this.setupSidebarTabs();

        // Sidebar resizer
        const resizer = document.getElementById('sidebar-resizer');
        if (resizer) {
            let isResizing = false;
            resizer.addEventListener('mousedown', (e) => {
                isResizing = true;
                document.body.style.cursor = 'col-resize';
            });
            document.addEventListener('mousemove', (e) => {
                if (!isResizing) return;
                const sidebar = document.getElementById('sidebar');
                if (sidebar) {
                    sidebar.style.width = `${e.clientX}px`;
                }
            });
            document.addEventListener('mouseup', () => {
                isResizing = false;
                document.body.style.cursor = '';
            });
        }

        // Bottom panel close button
        const bottomPanelArea = document.getElementById('bottom-panel-area');
        document.getElementById('bottom-panel-close')?.addEventListener('click', () => {
            bottomPanelArea?.classList.add('hidden');
        });

        // Bottom panel resizer (drag the top edge to resize height)
        const bottomResizer = document.getElementById('bottom-panel-resizer');
        if (bottomResizer && bottomPanelArea) {
            let isResizingBottom = false;
            let startY = 0;
            let startHeight = 0;
            bottomResizer.addEventListener('mousedown', (e) => {
                isResizingBottom = true;
                startY = e.clientY;
                startHeight = bottomPanelArea.offsetHeight;
                document.body.style.cursor = 'ns-resize';
                e.preventDefault();
            });
            document.addEventListener('mousemove', (e) => {
                if (!isResizingBottom) return;
                const diff = startY - e.clientY; // drag up → taller
                const newHeight = Math.max(80, Math.min(startHeight + diff, window.innerHeight * 0.7));
                bottomPanelArea.style.height = `${newHeight}px`;
            });
            document.addEventListener('mouseup', () => {
                if (isResizingBottom) {
                    isResizingBottom = false;
                    document.body.style.cursor = '';
                }
            });
        }

        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));

        // Listen for folder changes from file system watcher
        window.mycode.folder.onChanged((data) => {
            // Refresh the sidebar when files/folders are added, removed, or changed externally
            this.sidebar.refreshFolder(data.folderPath);
        });

        // Update markdown preview and trigger plugin hooks on editor content change
        document.addEventListener('editor-content-changed', () => {
            if (this.markdownPreview.isPreviewVisible()) {
                this.markdownPreview.onContentChanged(this.editorManager.getContent());
            }

            // Trigger content change hook for plugins
            const currentTab = this.tabManager.getCurrentTab();
            if (currentTab) {
                triggerHook('editor:contentChange', {
                    path: currentTab.filePath,
                    language: this.editorManager.getLanguage()
                });
            }
        });

        // Handle all tabs closed (from TabManager)
        document.addEventListener('all-tabs-closed', () => {
            if (this.markdownPreview.isPreviewVisible()) {
                this.markdownPreview.hide();
            }
            this.showWelcomeView();
        });
    }

    private setupSidebarTabs(): void {
        // Setup click handlers for all sidebar tabs (including the built-in Files tab)
        const sidebarTabs = document.querySelector('.sidebar-tabs');
        if (!sidebarTabs) return;

        sidebarTabs.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (!target.classList.contains('sidebar-tab-btn')) return;

            const panelId = target.dataset.panel;
            if (!panelId) return;

            // Deactivate all tabs and panels
            document.querySelectorAll('.sidebar-tab-btn').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.sidebar-panel').forEach(p => p.classList.remove('active'));

            // Activate clicked tab and corresponding panel
            target.classList.add('active');
            const panel = document.getElementById(`sidebar-panel-${panelId}`);
            if (panel) {
                panel.classList.add('active');
            }
        });

        // Add context menu for plugin tabs
        this.setupPluginContextMenu();
    }

    private setupPluginContextMenu(): void {
        const contextMenu = document.getElementById('plugin-context-menu');
        if (!contextMenu) return;

        let currentPluginId: string | null = null;

        // Handle right-click on sidebar tabs
        document.querySelector('.sidebar-tabs')?.addEventListener('contextmenu', (e) => {
            const target = (e.target as HTMLElement).closest('.sidebar-tab-btn') as HTMLElement;
            if (!target) return;

            // Only show context menu for plugin tabs (those with data-plugin attribute)
            const pluginId = target.dataset.plugin;
            if (!pluginId) return;

            e.preventDefault();
            currentPluginId = pluginId;

            // Position and show context menu
            contextMenu.style.left = `${(e as MouseEvent).clientX}px`;
            contextMenu.style.top = `${(e as MouseEvent).clientY}px`;
            contextMenu.classList.remove('hidden');
        });

        // Hide context menu on click elsewhere (but not on the menu itself)
        document.addEventListener('click', (e) => {
            // Don't hide if clicking inside the context menu
            if (contextMenu.contains(e.target as Node)) {
                return;
            }
            contextMenu.classList.add('hidden');
            currentPluginId = null;
        });

        // Handle context menu action
        contextMenu.querySelector('[data-action="disable-plugin"]')?.addEventListener('click', async (e) => {
            e.stopPropagation(); // Prevent document click handler from running
            const pluginIdToDisable = currentPluginId; // Capture before clearing
            contextMenu.classList.add('hidden');
            currentPluginId = null;

            if (pluginIdToDisable) {
                await window.mycode.plugins.disable(pluginIdToDisable);
                await this.handlePluginStateChange(pluginIdToDisable, false);
            }
        });
    }

    private handleKeyDown(e: KeyboardEvent): void {
        const ctrl = e.ctrlKey || e.metaKey;
        const shift = e.shiftKey;

        // Ctrl+N - New tab
        if (ctrl && !shift && e.key === 'n') {
            e.preventDefault();
            this.newTab();
        }
        // Ctrl+O - Open file
        else if (ctrl && !shift && e.key === 'o') {
            e.preventDefault();
            this.openFile();
        }
        // Ctrl+Shift+O - Open folder
        else if (ctrl && shift && e.key === 'O') {
            e.preventDefault();
            this.openFolder();
        }
        // Ctrl+S - Save
        else if (ctrl && !shift && e.key === 's') {
            e.preventDefault();
            this.save();
        }
        // Ctrl+Shift+S - Save as
        else if (ctrl && shift && e.key === 'S') {
            e.preventDefault();
            this.saveAs();
        }
        // Ctrl+W - Close tab
        else if (ctrl && !shift && e.key === 'w') {
            e.preventDefault();
            this.closeCurrentTab();
        }
        // Ctrl+F - Find
        else if (ctrl && !shift && e.key === 'f') {
            e.preventDefault();
            this.searchBar.show(false);
        }
        // Ctrl+R - Replace
        else if (ctrl && !shift && e.key === 'r') {
            e.preventDefault();
            this.searchBar.show(true);
        }
        // F9 - Toggle sidebar
        else if (e.key === 'F9') {
            e.preventDefault();
            this.toggleSidebar();
        }
        // Escape - Close search bar
        else if (e.key === 'Escape') {
            this.searchBar.hide();
        }
        // Ctrl+Q - Quit
        else if (ctrl && e.key === 'q') {
            e.preventDefault();
            window.mycode.app.quit();
        }
    }

    private async newTab(): Promise<void> {
        this.hideWelcomeView();
        this.tabManager.createTab();
        this.editorManager.focus();
    }

    private async openFile(): Promise<void> {
        const filePaths = await window.mycode.file.openDialog();
        if (filePaths && filePaths.length > 0) {
            for (const filePath of filePaths) {
                await this.openFileByPath(filePath);
            }
        }
    }

    private async openFileByPath(filePath: string): Promise<void> {
        this.hideWelcomeView();

        // Check if file is already open
        const existingTab = this.tabManager.findTabByPath(filePath);
        if (existingTab) {
            this.tabManager.activateTab(existingTab.id);
            return;
        }

        // Read file content
        const result = await window.mycode.file.read(filePath);
        if (result.success && result.content !== undefined) {
            this.tabManager.createTab(filePath, result.content);
            this.editorManager.focus();

            // Trigger plugin hooks
            triggerHook('workspace:fileOpen', {
                path: filePath,
                language: this.editorManager.getLanguage()
            });

            // Load plugins that activate on this file type
            const language = this.editorManager.getLanguage();
            this.pluginLoader.loadPluginsForEvent(`onLanguage:${language}`);
            this.pluginLoader.loadPluginsForEvent(`onFileOpen:*`);
        } else {
            console.error('Failed to open file:', result.error);
        }
    }

    private async openFolder(): Promise<void> {
        const folderPath = await window.mycode.folder.openDialog();
        if (folderPath) {
            const tree = await window.mycode.folder.read(folderPath);
            this.sidebar.addFolder(tree);

            // Save to settings
            this.settings.openedFolders.push(folderPath);
            await window.mycode.settings.set('openedFolders', this.settings.openedFolders);

            // Watch for changes
            await window.mycode.folder.watch(folderPath);

            // Initialize Git integration for this folder
            await this.initGitForFolder(folderPath);
        }
    }

    private async createProjectFolder(): Promise<void> {
        const folderPath = await window.mycode.folder.createProjectDialog();
        if (folderPath) {
            const tree = await window.mycode.folder.read(folderPath);
            this.sidebar.addFolder(tree);

            // Save to settings
            this.settings.openedFolders.push(folderPath);
            await window.mycode.settings.set('openedFolders', this.settings.openedFolders);

            // Watch for changes
            await window.mycode.folder.watch(folderPath);

            // Initialize Git integration for this folder
            await this.initGitForFolder(folderPath);
        }
    }

    private async initGitForFolder(folderPath: string): Promise<void> {
        const result = await window.mycode.git.isRepo(folderPath);
        if (result.isRepo) {
            this.gitStatusBar.setRepository(result.repoRoot);
            this.gutterDecorations.setRepoPath(result.repoRoot);
            this.gitStatusBar.startAutoRefresh(10000); // Refresh every 10 seconds
        }
    }

    private async save(): Promise<void> {
        const currentTab = this.tabManager.getCurrentTab();
        if (!currentTab) return;

        if (currentTab.filePath) {
            let content = this.editorManager.getContent();
            const language = this.editorManager.getLanguage();

            // Format on save if enabled
            if (this.settings.formatOnSave) {
                const formattingOptions = {
                    tabSize: this.settings.indentWidth,
                    insertSpaces: this.settings.spacesInsteadOfTabs
                };
                const formatResult = await formatDocument(content, language, formattingOptions);
                if (formatResult && formatResult.edits.length > 0) {
                    content = formatResult.formatted;
                    // Update editor content with formatted version
                    this.editorManager.setContent(content);
                }
            }

            // Trigger willSave hook - allows plugins to transform content
            content = await triggerAsyncHook('workspace:willSave', content, {
                path: currentTab.filePath,
                language: language
            });

            const result = await window.mycode.file.save(currentTab.filePath, content);
            if (result.success) {
                this.tabManager.markSaved(currentTab.id);

                // Trigger didSave hook
                triggerHook('workspace:didSave', {
                    path: currentTab.filePath,
                    language: language
                });

                // Run linters after save
                this.runLinterOnCurrentFile();
            }
        } else {
            await this.saveAs();
        }
    }

    private async runLinterOnCurrentFile(): Promise<void> {
        const currentTab = this.tabManager.getCurrentTab();
        if (!currentTab || !currentTab.filePath) return;

        const language = this.editorManager.getLanguage();
        const content = this.editorManager.getContent();
        const diagnostics = await runLinters(content, language, currentTab.filePath);

        // Convert diagnostics to Monaco markers
        const monaco = (window as any).monaco;
        if (!monaco) return;

        const model = this.editorManager.getMonacoEditor()?.getModel();
        if (!model) return;

        const markers = diagnostics.map(d => ({
            severity: this.toMonacoSeverity(d.severity),
            startLineNumber: d.range.startLine,
            startColumn: d.range.startColumn,
            endLineNumber: d.range.endLine,
            endColumn: d.range.endColumn,
            message: d.message,
            source: d.source || 'plugin'
        }));

        monaco.editor.setModelMarkers(model, 'linter', markers);
    }

    private toMonacoSeverity(severity: number): number {
        // DiagnosticSeverity: Error=1, Warning=2, Info=3, Hint=4
        // Monaco MarkerSeverity: Hint=1, Info=2, Warning=4, Error=8
        const monaco = (window as any).monaco;
        if (!monaco) return 4; // Warning as default
        switch (severity) {
            case 1: return monaco.MarkerSeverity.Error;
            case 2: return monaco.MarkerSeverity.Warning;
            case 3: return monaco.MarkerSeverity.Info;
            case 4: return monaco.MarkerSeverity.Hint;
            default: return monaco.MarkerSeverity.Warning;
        }
    }

    private async saveAs(): Promise<void> {
        let content = this.editorManager.getContent();
        const currentTab = this.tabManager.getCurrentTab();
        const language = this.editorManager.getLanguage();

        const filePath = await window.mycode.file.saveAs(content, currentTab?.filePath || undefined);
        if (filePath) {
            // Format on save if enabled
            if (this.settings.formatOnSave) {
                const formattingOptions = {
                    tabSize: this.settings.indentWidth,
                    insertSpaces: this.settings.spacesInsteadOfTabs
                };
                const formatResult = await formatDocument(content, language, formattingOptions);
                if (formatResult && formatResult.edits.length > 0) {
                    content = formatResult.formatted;
                    this.editorManager.setContent(content);
                }
            }

            // Trigger willSave hook for new file
            content = await triggerAsyncHook('workspace:willSave', content, {
                path: filePath,
                language: language
            });

            // Re-save with potentially transformed content
            await window.mycode.file.save(filePath, content);

            this.tabManager.updateTabPath(currentTab!.id, filePath);
            this.tabManager.markSaved(currentTab!.id);

            // Trigger didSave hook
            triggerHook('workspace:didSave', {
                path: filePath,
                language: language
            });

            // Run linters after save
            this.runLinterOnCurrentFile();
        }
    }

    private closeCurrentTab(): void {
        const currentTab = this.tabManager.getCurrentTab();
        if (currentTab) {
            // Trigger fileClose hook before closing
            if (currentTab.filePath) {
                triggerHook('workspace:fileClose', {
                    path: currentTab.filePath,
                    language: currentTab.language
                });
            }

            this.tabManager.closeTab(currentTab.id);
            if (this.tabManager.getTabCount() === 0) {
                // Close markdown preview when no tabs open
                if (this.markdownPreview.isPreviewVisible()) {
                    this.markdownPreview.hide();
                }
                this.showWelcomeView();
            }
        }
    }

    private toggleSidebar(): void {
        this.sidebarVisible = !this.sidebarVisible;
        this.updateSidebarVisibility();
        window.mycode.settings.set('sidebarVisible', this.sidebarVisible);
    }

    private updateSidebarVisibility(): void {
        const sidebar = document.getElementById('sidebar');
        const resizer = document.getElementById('sidebar-resizer');
        if (sidebar) {
            sidebar.style.display = this.sidebarVisible ? 'flex' : 'none';
        }
        if (resizer) {
            resizer.style.display = this.sidebarVisible ? 'block' : 'none';
        }
    }

    private onFileSelect(node: TreeNode): void {
        if (node.type === 'file') {
            this.openFileByPath(node.path);
        }
    }

    private onFolderSelect(node: TreeNode): void {
        // Toggle folder expansion
        this.sidebar.toggleFolder(node);
    }

    private async onFolderRemove(path: string): Promise<void> {
        // Remove from settings and save
        this.settings.openedFolders = this.settings.openedFolders.filter(f => f !== path);
        await window.mycode.settings.set('openedFolders', this.settings.openedFolders);
        await window.mycode.folder.unwatch(path);
    }

    private showWelcomeView(): void {
        const welcomeView = document.getElementById('welcome-view');
        const editorArea = document.getElementById('editor-area');
        if (welcomeView) welcomeView.style.display = 'flex';
        if (editorArea) editorArea.style.display = 'none';
    }

    private hideWelcomeView(): void {
        const welcomeView = document.getElementById('welcome-view');
        const editorArea = document.getElementById('editor-area');
        if (welcomeView) welcomeView.style.display = 'none';
        if (editorArea) editorArea.style.display = 'flex';
    }

    private async restoreSession(): Promise<void> {
        // Restore folders
        for (const folderPath of this.settings.openedFolders) {
            try {
                const tree = await window.mycode.folder.read(folderPath);
                this.sidebar.addFolder(tree);
                await window.mycode.folder.watch(folderPath);
                // Initialize Git integration for this folder
                await this.initGitForFolder(folderPath);
            } catch (e) {
                console.warn('Failed to restore folder:', folderPath);
            }
        }

        // Restore files
        for (const file of this.settings.openedFiles) {
            try {
                await this.openFileByPath(file.uri);
            } catch (e) {
                console.warn('Failed to restore file:', file.uri);
            }
        }

        // Focus last document
        if (this.settings.focusedDocument) {
            const tab = this.tabManager.findTabByPath(this.settings.focusedDocument);
            if (tab) {
                this.tabManager.activateTab(tab.id);
            }
        }

        // Show welcome if no files open
        if (this.tabManager.getTabCount() === 0) {
            this.showWelcomeView();
        }
    }
}
