/**
 * MyCode - Tab Manager
 * Handles document tabs and multi-file editing
 */

import { EditorManager } from './EditorManager';
import { DocumentTab } from '../../shared/types';
import * as path from 'path';

declare const monaco: typeof import('monaco-editor');

export class TabManager {
    private tabs: Map<string, DocumentTab> = new Map();
    private activeTabId: string | null = null;
    private editorManager: EditorManager;
    private tabContainer: HTMLElement;
    private untitledCounter = 1;
    // Diff editor support
    private diffEditor: any = null;
    private diffContainer: HTMLElement | null = null;
    private diffModels: Map<string, { original: any; modified: any }> = new Map();

    constructor(editorManager: EditorManager) {
        this.editorManager = editorManager;
        this.tabContainer = document.getElementById('tabs')!;

        // Listen for content changes to mark tab dirty
        document.addEventListener('editor-content-changed', () => {
            if (this.activeTabId) {
                const tab = this.tabs.get(this.activeTabId);
                // Only mark dirty for normal tabs
                if (tab && tab.type !== 'diff') {
                    this.markDirty(this.activeTabId);
                }
            }
        });

        // Initialize diff editor container
        this.initDiffEditor();
    }

    private initDiffEditor(): void {
        const editorArea = document.getElementById('editor-area');
        if (!editorArea) return;

        // Create diff container (hidden by default)
        this.diffContainer = document.createElement('div');
        this.diffContainer.id = 'diff-editor-container';
        this.diffContainer.className = 'editor-container';
        this.diffContainer.style.display = 'none';
        editorArea.appendChild(this.diffContainer);

        // Create the diff editor
        if (typeof monaco !== 'undefined') {
            this.diffEditor = monaco.editor.createDiffEditor(this.diffContainer, {
                automaticLayout: true,
                readOnly: true,
                renderSideBySide: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
            });
        }
    }

    createTab(filePath?: string, content: string = ''): DocumentTab {
        const id = this.generateId();
        const title = filePath ? this.getFileName(filePath) : `Untitled ${this.untitledCounter++}`;
        const language = filePath ? this.detectLanguage(filePath) : 'plaintext';

        const tab: DocumentTab = {
            id,
            filePath: filePath || null,
            title,
            content,
            isDirty: false,
            cursorPosition: { line: 1, column: 1 },
            language,
            type: 'normal',
        };

        this.tabs.set(id, tab);
        this.renderTab(tab);
        this.activateTab(id);

        return tab;
    }

    /**
     * Create a diff tab to compare two pieces of content
     */
    createDiffTab(original: string, modified: string, options: { title: string; language?: string }): DocumentTab {
        const id = this.generateId();

        const tab: DocumentTab = {
            id,
            filePath: null,
            title: `⇄ ${options.title}`,
            content: '',
            isDirty: false,
            cursorPosition: { line: 1, column: 1 },
            language: options.language || 'plaintext',
            type: 'diff',
            diffData: {
                original,
                modified,
                language: options.language || 'plaintext',
            },
        };

        // Hide welcome view and show editor area (in case no tabs were open)
        const welcomeView = document.getElementById('welcome-view');
        const editorArea = document.getElementById('editor-area');
        if (welcomeView) welcomeView.style.display = 'none';
        if (editorArea) editorArea.style.display = 'flex';

        this.tabs.set(id, tab);
        this.renderTab(tab);
        this.activateTab(id);

        return tab;
    }

    activateTab(id: string): void {
        const editorContainer = document.getElementById('editor-container');

        // Save current tab state (only for normal tabs)
        if (this.activeTabId && this.tabs.has(this.activeTabId)) {
            const currentTab = this.tabs.get(this.activeTabId)!;
            if (currentTab.type !== 'diff') {
                currentTab.content = this.editorManager.getContent();
                currentTab.cursorPosition = this.editorManager.getCursorPosition();
            }
        }

        // Update active tab
        this.activeTabId = id;
        const tab = this.tabs.get(id);

        if (tab) {
            if (tab.type === 'diff' && tab.diffData) {
                // Show diff editor, hide normal editor
                if (editorContainer) editorContainer.style.display = 'none';
                if (this.diffContainer) this.diffContainer.style.display = 'block';

                // Set diff models
                if (this.diffEditor && tab.diffData) {
                    // Get or create models for this diff tab
                    let models = this.diffModels.get(id);
                    if (!models) {
                        models = {
                            original: monaco.editor.createModel(tab.diffData.original, tab.diffData.language),
                            modified: monaco.editor.createModel(tab.diffData.modified, tab.diffData.language)
                        };
                        this.diffModels.set(id, models);
                    }
                    this.diffEditor.setModel({
                        original: models.original,
                        modified: models.modified
                    });

                    // Force layout refresh after container becomes visible
                    // Use requestAnimationFrame to ensure DOM has updated
                    requestAnimationFrame(() => {
                        if (this.diffEditor) {
                            this.diffEditor.layout();
                        }
                    });
                }
            } else {
                // Show normal editor, hide diff editor
                if (editorContainer) editorContainer.style.display = 'block';
                if (this.diffContainer) this.diffContainer.style.display = 'none';

                this.editorManager.setContent(tab.content, tab.language);
                this.editorManager.setCursorPosition(tab.cursorPosition);
            }
        }

        // Update tab UI
        this.updateTabUI();
    }

    closeTab(id: string): void {
        const tab = this.tabs.get(id);
        if (!tab) return;

        // Clean up diff models if this is a diff tab
        if (tab.type === 'diff') {
            const models = this.diffModels.get(id);
            if (models) {
                models.original.dispose();
                models.modified.dispose();
                this.diffModels.delete(id);
            }
        }

        // TODO: Check for unsaved changes and prompt

        this.tabs.delete(id);
        this.removeTabElement(id);

        // Activate another tab if this was the active one
        if (this.activeTabId === id) {
            const remainingTabs = Array.from(this.tabs.keys());
            if (remainingTabs.length > 0) {
                this.activateTab(remainingTabs[remainingTabs.length - 1]);
            } else {
                this.activeTabId = null;
                // Hide diff editor, show normal editor
                const editorContainer = document.getElementById('editor-container');
                if (editorContainer) editorContainer.style.display = 'block';
                if (this.diffContainer) this.diffContainer.style.display = 'none';
                this.editorManager.setContent('');
                // Dispatch event so App can handle showing welcome view and closing preview
                document.dispatchEvent(new CustomEvent('all-tabs-closed'));
            }
        }
    }

    getCurrentTab(): DocumentTab | null {
        if (!this.activeTabId) return null;
        return this.tabs.get(this.activeTabId) || null;
    }

    findTabByPath(filePath: string): DocumentTab | null {
        for (const tab of this.tabs.values()) {
            if (tab.filePath === filePath) {
                return tab;
            }
        }
        return null;
    }

    getTabCount(): number {
        return this.tabs.size;
    }

    markDirty(id: string): void {
        const tab = this.tabs.get(id);
        if (tab && !tab.isDirty) {
            tab.isDirty = true;
            this.updateTabElement(id);
        }
    }

    markSaved(id: string): void {
        const tab = this.tabs.get(id);
        if (tab) {
            tab.isDirty = false;
            tab.content = this.editorManager.getContent();
            this.updateTabElement(id);
        }
    }

    updateTabPath(id: string, filePath: string): void {
        const tab = this.tabs.get(id);
        if (tab) {
            tab.filePath = filePath;
            tab.title = this.getFileName(filePath);
            tab.language = this.detectLanguage(filePath);
            this.editorManager.setLanguage(tab.language);
            this.updateTabElement(id);
        }
    }

    private renderTab(tab: DocumentTab): void {
        const tabElement = document.createElement('div');
        tabElement.className = 'tab';
        tabElement.dataset.tabId = tab.id;
        tabElement.innerHTML = `
      <span class="tab-title">${tab.title}</span>
      <span class="tab-dirty" style="display: none;">●</span>
      <button class="tab-close" title="Close">×</button>
    `;

        tabElement.addEventListener('click', (e) => {
            if (!(e.target as HTMLElement).classList.contains('tab-close')) {
                this.activateTab(tab.id);
            }
        });

        tabElement.querySelector('.tab-close')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeTab(tab.id);
        });

        this.tabContainer.appendChild(tabElement);
    }

    private updateTabElement(id: string): void {
        const tab = this.tabs.get(id);
        if (!tab) return;

        const tabElement = this.tabContainer.querySelector(`[data-tab-id="${id}"]`);
        if (!tabElement) return;

        const titleElement = tabElement.querySelector('.tab-title');
        const dirtyElement = tabElement.querySelector('.tab-dirty') as HTMLElement;

        if (titleElement) {
            titleElement.textContent = tab.title;
        }
        if (dirtyElement) {
            dirtyElement.style.display = tab.isDirty ? 'inline' : 'none';
        }
    }

    private updateTabUI(): void {
        const tabElements = this.tabContainer.querySelectorAll('.tab');
        tabElements.forEach((el) => {
            const id = (el as HTMLElement).dataset.tabId;
            if (id === this.activeTabId) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }
        });
    }

    private removeTabElement(id: string): void {
        const tabElement = this.tabContainer.querySelector(`[data-tab-id="${id}"]`);
        tabElement?.remove();
    }

    private generateId(): string {
        return 'tab-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    private getFileName(filePath: string): string {
        return filePath.split(/[/\\]/).pop() || 'Untitled';
    }

    private detectLanguage(filePath: string): string {
        const ext = filePath.split('.').pop()?.toLowerCase() || '';
        const languageMap: Record<string, string> = {
            'js': 'javascript',
            'jsx': 'javascript',
            'ts': 'typescript',
            'tsx': 'typescript',
            'py': 'python',
            'rb': 'ruby',
            'java': 'java',
            'c': 'c',
            'cpp': 'cpp',
            'cc': 'cpp',
            'h': 'c',
            'hpp': 'cpp',
            'cs': 'csharp',
            'go': 'go',
            'rs': 'rust',
            'php': 'php',
            'html': 'html',
            'htm': 'html',
            'css': 'css',
            'scss': 'scss',
            'less': 'less',
            'json': 'json',
            'xml': 'xml',
            'yaml': 'yaml',
            'yml': 'yaml',
            'md': 'markdown',
            'markdown': 'markdown',
            'sql': 'sql',
            'sh': 'shell',
            'bash': 'shell',
            'zsh': 'shell',
            'fish': 'shell',
            'ps1': 'powershell',
            'swift': 'swift',
            'kt': 'kotlin',
            'lua': 'lua',
            'r': 'r',
            'vala': 'vala',
        };

        return languageMap[ext] || 'plaintext';
    }

    // ===== Plugin API Methods =====

    /**
     * Get the file path of the active tab
     */
    getActiveFilePath(): string | null {
        const tab = this.getCurrentTab();
        return tab?.filePath || null;
    }

    /**
     * Get list of all open file paths
     */
    getOpenFiles(): string[] {
        const files: string[] = [];
        for (const tab of this.tabs.values()) {
            if (tab.filePath) {
                files.push(tab.filePath);
            }
        }
        return files;
    }

    /**
     * Get all open tabs with their info
     */
    getAllTabs(): Array<{ id: string; filePath: string | null; title: string; isDirty: boolean; language: string }> {
        return Array.from(this.tabs.values()).map(tab => ({
            id: tab.id,
            filePath: tab.filePath,
            title: tab.title,
            isDirty: tab.isDirty,
            language: tab.language
        }));
    }

    /**
     * Get the active tab ID
     */
    getActiveTabId(): string | null {
        return this.activeTabId;
    }

    /**
     * Open a file in a new or existing tab (returns the tab)
     * Note: This doesn't load the file content - that's handled by App.ts
     * This is a synchronous method that returns an existing tab if found
     */
    openFile(filePath: string): DocumentTab | null {
        // Check if already open
        const existingTab = this.findTabByPath(filePath);
        if (existingTab) {
            this.activateTab(existingTab.id);
            return existingTab;
        }
        return null; // App.ts handles loading new files
    }

    /**
     * Check if a file is already open
     */
    isFileOpen(filePath: string): boolean {
        return this.findTabByPath(filePath) !== null;
    }

    /**
     * Get current content and sync it with the active tab
     */
    syncActiveTabContent(): void {
        if (this.activeTabId && this.tabs.has(this.activeTabId)) {
            const currentTab = this.tabs.get(this.activeTabId)!;
            currentTab.content = this.editorManager.getContent();
        }
    }
}
