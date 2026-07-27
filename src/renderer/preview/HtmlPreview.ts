/**
 * MyCode - HTML Preview Component
 * Provides side-by-side live preview for HTML files using a sandboxed iframe.
 *
 * Relative asset references (CSS, images) are resolved via a <base> tag
 * pointing to the directory of the file being previewed.
 */

declare const monaco: typeof import('monaco-editor');

export class HtmlPreview {
    private container: HTMLElement;
    private previewPanel: HTMLElement | null = null;
    private iframe: HTMLIFrameElement | null = null;
    private isVisible = false;
    private debounceTimer: number | null = null;
    private editor: any = null;
    private scrollListener: any = null;
    private currentFilePath: string | null = null;

    constructor() {
        this.container = document.getElementById('editor-area')!;
    }

    /**
     * Set the Monaco editor reference for scroll synchronization.
     */
    setEditor(editor: any): void {
        this.editor = editor;
    }

    toggle(filePath: string | null): void {
        if (this.isVisible) {
            this.hide();
        } else if (filePath) {
            this.show(filePath);
        }
    }

    show(filePath: string): void {
        if (this.isVisible) return;

        this.currentFilePath = filePath;

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
        this.currentFilePath = null;
    }

    private createPreviewPanel(): void {
        this.previewPanel = document.createElement('div');
        this.previewPanel.id = 'html-preview';
        this.previewPanel.className = 'html-preview hidden';
        this.previewPanel.innerHTML = `
            <div class="preview-header">
                <span class="preview-title">HTML Preview</span>
                <button class="preview-close" title="Close preview">✕</button>
            </div>
            <div class="preview-content html-preview-content"></div>
        `;

        // Add close button handler
        this.previewPanel.querySelector('.preview-close')?.addEventListener('click', () => {
            this.hide();
        });

        // Create the sandboxed iframe
        this.iframe = document.createElement('iframe');
        this.iframe.className = 'html-preview-iframe';
        this.iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
        this.iframe.setAttribute('title', 'HTML Preview');

        const contentArea = this.previewPanel.querySelector('.html-preview-content');
        if (contentArea) {
            contentArea.appendChild(this.iframe);
        }

        this.container.appendChild(this.previewPanel);
    }

    private setupScrollSync(): void {
        if (!this.editor) return;

        // Listen to editor scroll events
        this.scrollListener = this.editor.onDidScrollChange((e: any) => {
            if (!this.isVisible || !this.iframe) return;

            try {
                const doc = this.iframe.contentDocument;
                if (!doc || !doc.documentElement) return;

                // Calculate scroll percentage based on editor scroll position
                const scrollTop = e.scrollTop;
                const scrollHeight = e.scrollHeight;
                const viewportHeight = this.editor.getLayoutInfo().height;

                const maxScroll = scrollHeight - viewportHeight;
                const scrollPercent = maxScroll > 0 ? scrollTop / maxScroll : 0;

                // Apply to iframe document
                const iframeMaxScroll = doc.documentElement.scrollHeight - doc.documentElement.clientHeight;
                doc.documentElement.scrollTop = iframeMaxScroll * scrollPercent;
            } catch (_) {
                // Iframe may not be accessible due to sandbox restrictions
            }
        });
    }

    /**
     * Get the base URL for resolving relative paths in the HTML file.
     * Converts a local file path to a file:// URL for the directory.
     */
    private getBaseUrl(filePath: string): string {
        const dir = filePath.replace(/[/\\][^/\\]*$/, '') || '.';
        return 'file://' + dir + '/';
    }

    /**
     * Update the preview with new HTML content.
     */
    updatePreview(content: string, filePath?: string): void {
        if (!this.isVisible || !this.iframe) return;

        if (filePath) {
            this.currentFilePath = filePath;
        }

        // Clear any pending debounce
        if (this.debounceTimer !== null) {
            window.clearTimeout(this.debounceTimer);
        }

        // Debounce updates for better performance
        this.debounceTimer = window.setTimeout(() => {
            if (!this.iframe) return;

            // Inject a <base> tag so relative paths (CSS, images) resolve correctly
            let html = content;
            if (this.currentFilePath) {
                const baseUrl = this.getBaseUrl(this.currentFilePath);
                // If the HTML already has a <base> tag, don't add another
                if (!/<base\s/i.test(html)) {
                    // Insert <base> after <head> if present, or at the start
                    if (/<head[^>]*>/i.test(html)) {
                        html = html.replace(
                            /(<head[^>]*>)/i,
                            `$1\n<base href="${baseUrl}">`
                        );
                    } else {
                        html = `<base href="${baseUrl}">\n` + html;
                    }
                }
            }

            this.iframe.srcdoc = html;
            this.debounceTimer = null;
        }, 150);
    }

    /**
     * Called when editor content changes.
     */
    onContentChanged(content: string, filePath?: string): void {
        this.updatePreview(content, filePath);
    }

    isPreviewVisible(): boolean {
        return this.isVisible;
    }
}
