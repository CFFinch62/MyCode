/**
 * MyCode - CSV Preview Component
 * Provides side-by-side colorized grid preview for CSV/TSV files.
 * Each column is assigned a rotating color (rainbow-csv style) so that
 * a value's column stays visually identifiable across long rows.
 */

declare const monaco: typeof import('monaco-editor');

const MAX_PREVIEW_ROWS = 2000;
const COLUMN_COLOR_COUNT = 10;

export class CsvPreview {
    private container: HTMLElement;
    private previewPanel: HTMLElement | null = null;
    private isVisible = false;
    private debounceTimer: number | null = null;
    private editor: any = null;
    private scrollListener: any = null;

    constructor() {
        this.container = document.getElementById('editor-area')!;
    }

    /**
     * Set the Monaco editor reference for scroll synchronization.
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

        if (!this.previewPanel) {
            this.createPreviewPanel();
        }

        this.previewPanel!.classList.remove('hidden');
        this.container.classList.add('split-view');
        document.getElementById('preview-resizer')?.classList.remove('hidden');
        this.isVisible = true;

        this.setupScrollSync();
        this.updatePreview();
    }

    hide(): void {
        if (!this.isVisible) return;

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
        this.previewPanel.id = 'csv-preview';
        this.previewPanel.className = 'csv-preview hidden';
        this.previewPanel.innerHTML = `
            <div class="preview-header">
                <span class="preview-title">CSV Preview</span>
                <button class="preview-close" title="Close preview">✕</button>
            </div>
            <div class="preview-content csv-preview-content"></div>
        `;

        this.previewPanel.querySelector('.preview-close')?.addEventListener('click', () => {
            this.hide();
        });

        this.container.appendChild(this.previewPanel);
    }

    private setupScrollSync(): void {
        if (!this.editor) return;

        this.scrollListener = this.editor.onDidScrollChange((e: any) => {
            if (!this.isVisible || !this.previewPanel) return;

            const contentEl = this.previewPanel.querySelector('.csv-preview-content') as HTMLElement;
            if (!contentEl) return;

            const scrollTop = e.scrollTop;
            const scrollHeight = e.scrollHeight;
            const viewportHeight = this.editor.getLayoutInfo().height;

            const maxScroll = scrollHeight - viewportHeight;
            const scrollPercent = maxScroll > 0 ? scrollTop / maxScroll : 0;

            const previewScrollHeight = contentEl.scrollHeight - contentEl.clientHeight;
            contentEl.scrollTop = previewScrollHeight * scrollPercent;
        });
    }

    /**
     * Detect the field delimiter by counting candidate delimiters in the
     * first non-empty line and picking whichever appears most often.
     */
    private detectDelimiter(content: string): string {
        const firstLine = content.split(/\r\n|\r|\n/).find(line => line.length > 0) || '';
        const candidates = [',', '\t', ';', '|'];
        let best = ',';
        let bestCount = 0;

        for (const candidate of candidates) {
            const count = firstLine.split(candidate).length - 1;
            if (count > bestCount) {
                bestCount = count;
                best = candidate;
            }
        }

        return best;
    }

    /**
     * Parse delimited text into rows of fields, honoring RFC 4180 quoting
     * (quoted fields may contain the delimiter, newlines, and "" escapes).
     */
    private parseDelimited(content: string, delimiter: string): string[][] {
        const rows: string[][] = [];
        let row: string[] = [];
        let field = '';
        let inQuotes = false;

        for (let i = 0; i < content.length; i++) {
            const char = content[i];

            if (inQuotes) {
                if (char === '"') {
                    if (content[i + 1] === '"') {
                        field += '"';
                        i++;
                    } else {
                        inQuotes = false;
                    }
                } else {
                    field += char;
                }
                continue;
            }

            if (char === '"') {
                inQuotes = true;
            } else if (char === delimiter) {
                row.push(field);
                field = '';
            } else if (char === '\r') {
                // Skip; \n (or end of input) terminates the row.
            } else if (char === '\n') {
                row.push(field);
                rows.push(row);
                row = [];
                field = '';
            } else {
                field += char;
            }
        }

        // Flush trailing field/row (files may not end with a newline).
        if (field.length > 0 || row.length > 0) {
            row.push(field);
            rows.push(row);
        }

        // Drop a single trailing all-empty row caused by a final newline.
        if (rows.length > 0 && rows[rows.length - 1].length === 1 && rows[rows.length - 1][0] === '') {
            rows.pop();
        }

        return rows;
    }

    private escapeHtml(value: string): string {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    private renderTable(rows: string[][]): string {
        if (rows.length === 0) {
            return '<div class="csv-preview-empty">No rows to display</div>';
        }

        const truncated = rows.length > MAX_PREVIEW_ROWS;
        const visibleRows = truncated ? rows.slice(0, MAX_PREVIEW_ROWS) : rows;
        const [header, ...body] = visibleRows;

        const headerHtml = header
            .map((cell, col) => `<th class="csv-col-${col % COLUMN_COLOR_COUNT}">${this.escapeHtml(cell)}</th>`)
            .join('');

        const bodyHtml = body
            .map(cells => {
                const tds = cells
                    .map((cell, col) => `<td class="csv-col-${col % COLUMN_COLOR_COUNT}">${this.escapeHtml(cell)}</td>`)
                    .join('');
                return `<tr>${tds}</tr>`;
            })
            .join('');

        const footer = truncated
            ? `<div class="csv-preview-footer">Showing first ${MAX_PREVIEW_ROWS.toLocaleString()} of ${rows.length.toLocaleString()} rows</div>`
            : '';

        return `<table class="csv-grid"><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table>${footer}`;
    }

    updatePreview(content?: string): void {
        if (!this.isVisible || !this.previewPanel) return;

        if (this.debounceTimer !== null) {
            window.clearTimeout(this.debounceTimer);
        }

        this.debounceTimer = window.setTimeout(() => {
            const contentEl = this.previewPanel?.querySelector('.csv-preview-content');
            if (contentEl && content !== undefined) {
                try {
                    const delimiter = this.detectDelimiter(content);
                    const rows = this.parseDelimited(content, delimiter);
                    contentEl.innerHTML = this.renderTable(rows);
                } catch (_) {
                    contentEl.innerHTML = '<div class="csv-preview-empty">Unable to parse CSV content</div>';
                }
            }
            this.debounceTimer = null;
        }, 150);
    }

    /**
     * Called when editor content changes.
     */
    onContentChanged(content: string): void {
        this.updatePreview(content);
    }

    isPreviewVisible(): boolean {
        return this.isVisible;
    }
}
