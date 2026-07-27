/**
 * MyCode - Markdown Preview Component
 * Provides side-by-side live preview for markdown files
 */

import { marked } from 'marked';

declare const monaco: typeof import('monaco-editor');

export class MarkdownPreview {
    private container: HTMLElement;
    private previewPanel: HTMLElement | null = null;
    private isVisible = false;
    private debounceTimer: number | null = null;
    private editor: any = null;
    private scrollListener: any = null;

    constructor() {
        this.container = document.getElementById('editor-area')!;

        // Configure marked for safe rendering
        marked.setOptions({
            gfm: true,       // GitHub Flavored Markdown
            breaks: true,    // Convert \n to <br>
        });
    }

    /**
     * Set the Monaco editor reference for scroll synchronization
     */
    setEditor(editor: any): void {
        this.editor = editor;
    }

    toggle(): void {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    show(): void {
        if (this.isVisible) return;

        // Create preview panel if it doesn't exist
        if (!this.previewPanel) {
            this.createPreviewPanel();
        }

        this.previewPanel!.classList.remove('hidden');
        this.container.classList.add('split-view');
        document.getElementById('preview-resizer')?.classList.remove('hidden');
        this.isVisible = true;

        // Setup scroll synchronization
        this.setupScrollSync();

        // Render current content
        this.updatePreview();
    }

    hide(): void {
        if (!this.isVisible) return;

        // Remove scroll listener
        if (this.scrollListener && this.editor) {
            this.scrollListener.dispose();
            this.scrollListener = null;
        }

        this.previewPanel?.classList.add('hidden');
        this.container.classList.remove('split-view');
        document.getElementById('preview-resizer')?.classList.add('hidden');
        this.isVisible = false;
    }

    private createPreviewPanel(): void {
        this.previewPanel = document.createElement('div');
        this.previewPanel.id = 'markdown-preview';
        this.previewPanel.className = 'markdown-preview hidden';
        this.previewPanel.innerHTML = `
            <div class="preview-header">
                <span class="preview-title">Preview</span>
                <button class="preview-close" title="Close preview">✕</button>
            </div>
            <div class="preview-content"></div>
        `;

        // Add close button handler
        this.previewPanel.querySelector('.preview-close')?.addEventListener('click', () => {
            this.hide();
        });

        this.container.appendChild(this.previewPanel);
    }

    private setupScrollSync(): void {
        if (!this.editor) return;

        // Listen to editor scroll events
        this.scrollListener = this.editor.onDidScrollChange((e: any) => {
            if (!this.isVisible || !this.previewPanel) return;

            const contentEl = this.previewPanel.querySelector('.preview-content') as HTMLElement;
            if (!contentEl) return;

            // Calculate scroll percentage based on editor scroll position
            const scrollTop = e.scrollTop;
            const scrollHeight = e.scrollHeight;
            const viewportHeight = this.editor.getLayoutInfo().height;

            // Calculate percentage of scroll (0 to 1)
            const maxScroll = scrollHeight - viewportHeight;
            const scrollPercent = maxScroll > 0 ? scrollTop / maxScroll : 0;

            // Apply to preview
            const previewScrollHeight = contentEl.scrollHeight - contentEl.clientHeight;
            contentEl.scrollTop = previewScrollHeight * scrollPercent;
        });
    }

    updatePreview(content?: string): void {
        if (!this.isVisible || !this.previewPanel) return;

        // Clear any pending debounce
        if (this.debounceTimer !== null) {
            window.clearTimeout(this.debounceTimer);
        }

        // Debounce updates for better performance
        this.debounceTimer = window.setTimeout(() => {
            const contentEl = this.previewPanel?.querySelector('.preview-content');
            if (contentEl && content !== undefined) {
                contentEl.innerHTML = marked.parse(content) as string;
            }
            this.debounceTimer = null;
        }, 150);
    }

    /**
     * Called when editor content changes
     * @param content - Current editor content
     */
    onContentChanged(content: string): void {
        this.updatePreview(content);
    }

    isPreviewVisible(): boolean {
        return this.isVisible;
    }
}
