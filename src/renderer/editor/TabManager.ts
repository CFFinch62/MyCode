/**
 * MyCode - Tab Manager
 * Handles document tabs and multi-file editing
 */

import { EditorManager } from './EditorManager';
import { DocumentTab } from '../../shared/types';
import * as path from 'path';

export class TabManager {
    private tabs: Map<string, DocumentTab> = new Map();
    private activeTabId: string | null = null;
    private editorManager: EditorManager;
    private tabContainer: HTMLElement;
    private untitledCounter = 1;

    constructor(editorManager: EditorManager) {
        this.editorManager = editorManager;
        this.tabContainer = document.getElementById('tabs')!;

        // Listen for content changes to mark tab dirty
        document.addEventListener('editor-content-changed', () => {
            if (this.activeTabId) {
                this.markDirty(this.activeTabId);
            }
        });
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
            cursorPosition: 0,
            language,
        };

        this.tabs.set(id, tab);
        this.renderTab(tab);
        this.activateTab(id);

        return tab;
    }

    activateTab(id: string): void {
        // Save current tab state
        if (this.activeTabId && this.tabs.has(this.activeTabId)) {
            const currentTab = this.tabs.get(this.activeTabId)!;
            currentTab.content = this.editorManager.getContent();
            currentTab.cursorPosition = this.editorManager.getCursorPosition();
        }

        // Update active tab
        this.activeTabId = id;
        const tab = this.tabs.get(id);
        if (tab) {
            this.editorManager.setContent(tab.content, tab.language);
            this.editorManager.setCursorPosition(tab.cursorPosition);
        }

        // Update tab UI
        this.updateTabUI();
    }

    closeTab(id: string): void {
        const tab = this.tabs.get(id);
        if (!tab) return;

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
}
