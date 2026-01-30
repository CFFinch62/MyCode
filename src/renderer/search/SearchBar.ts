/**
 * MyCode - Search Bar Component
 * Implements find and replace functionality matching Elementary Code
 */

import { EditorManager } from '../editor/EditorManager';

declare const monaco: typeof import('monaco-editor');

export class SearchBar {
    private container: HTMLElement;
    private searchInput: HTMLInputElement;
    private replaceInput: HTMLInputElement;
    private replaceRow: HTMLElement;
    private searchCount: HTMLElement;
    private editorManager: EditorManager;

    private optCaseSensitive: HTMLInputElement;
    private optWholeWord: HTMLInputElement;
    private optRegex: HTMLInputElement;

    private matches: any[] = [];
    private currentMatchIndex = -1;
    private decorations: string[] = [];
    private cyclicSearch = true; // Default to true, will be loaded from settings

    constructor(editorManager: EditorManager) {
        this.editorManager = editorManager;
        this.container = document.getElementById('search-bar')!;
        this.searchInput = document.getElementById('search-input') as HTMLInputElement;
        this.replaceInput = document.getElementById('replace-input') as HTMLInputElement;
        this.replaceRow = document.getElementById('replace-row')!;
        this.searchCount = document.getElementById('search-count')!;

        this.optCaseSensitive = document.getElementById('opt-case-sensitive') as HTMLInputElement;
        this.optWholeWord = document.getElementById('opt-whole-word') as HTMLInputElement;
        this.optRegex = document.getElementById('opt-regex') as HTMLInputElement;

        this.setupEventListeners();
        this.loadSettings();
    }

    private async loadSettings(): Promise<void> {
        try {
            this.cyclicSearch = await window.mycode.settings.get('cyclicSearch') ?? true;
        } catch (e) {
            console.error('Failed to load search settings:', e);
        }
    }

    setCyclicSearch(value: boolean): void {
        this.cyclicSearch = value;
    }

    private setupEventListeners(): void {
        // Search input
        this.searchInput.addEventListener('input', () => this.performSearch());
        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                if (e.shiftKey) {
                    this.findPrevious();
                } else {
                    this.findNext();
                }
            } else if (e.key === 'Escape') {
                this.hide();
            }
        });

        // Replace input
        this.replaceInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.replace();
            } else if (e.key === 'Escape') {
                this.hide();
            }
        });

        // Navigation buttons
        document.getElementById('btn-search-prev')?.addEventListener('click', () => this.findPrevious());
        document.getElementById('btn-search-next')?.addEventListener('click', () => this.findNext());
        document.getElementById('btn-search-close')?.addEventListener('click', () => this.hide());

        // Replace buttons
        document.getElementById('btn-replace')?.addEventListener('click', () => this.replace());
        document.getElementById('btn-replace-all')?.addEventListener('click', () => this.replaceAll());

        // Options
        this.optCaseSensitive.addEventListener('change', () => this.performSearch());
        this.optWholeWord.addEventListener('change', () => this.performSearch());
        this.optRegex.addEventListener('change', () => this.performSearch());
    }

    show(showReplace: boolean): void {
        this.container.classList.remove('hidden');
        this.replaceRow.classList.toggle('hidden', !showReplace);
        this.searchInput.focus();

        // If there's selected text, use it as search term
        const editor = this.editorManager.getEditor();
        const selection = editor.getSelection();
        const model = editor.getModel();
        if (selection && !selection.isEmpty()) {
            const selectedText = model.getValueInRange(selection);
            if (!selectedText.includes('\n')) {
                this.searchInput.value = selectedText;
                this.performSearch();
            }
        }

        this.searchInput.select();
    }

    hide(): void {
        this.container.classList.add('hidden');
        this.clearHighlights();
        this.editorManager.focus();
    }

    private performSearch(): void {
        const query = this.searchInput.value;
        if (!query) {
            this.matches = [];
            this.currentMatchIndex = -1;
            this.updateSearchCount();
            this.clearHighlights();
            return;
        }

        const editor = this.editorManager.getEditor();
        const model = editor.getModel();
        if (!model) return;

        // Build search options
        const caseSensitive = this.optCaseSensitive.checked || this.hasMixedCase(query);
        const wholeWord = this.optWholeWord.checked;
        const isRegex = this.optRegex.checked;

        // Find all matches
        this.matches = model.findMatches(
            query,
            true, // search only visible range? No, search all
            isRegex,
            caseSensitive,
            wholeWord ? '\\b' : null, // word separator
            true // capture groups
        );

        this.currentMatchIndex = this.matches.length > 0 ? 0 : -1;
        this.updateSearchCount();
        this.highlightMatches();

        if (this.matches.length > 0) {
            this.goToMatch(0);
        }
    }

    private hasMixedCase(str: string): boolean {
        return str !== str.toLowerCase() && str !== str.toUpperCase();
    }

    private findNext(): void {
        if (this.matches.length === 0) return;

        this.currentMatchIndex++;
        if (this.currentMatchIndex >= this.matches.length) {
            if (this.cyclicSearch) {
                this.currentMatchIndex = 0;
            } else {
                this.currentMatchIndex = this.matches.length - 1;
                // Flash the search count to indicate we're at the end
                this.searchCount.textContent = 'End of document';
                setTimeout(() => this.updateSearchCount(), 1000);
                return;
            }
        }

        this.goToMatch(this.currentMatchIndex);
        this.updateSearchCount();
    }

    private findPrevious(): void {
        if (this.matches.length === 0) return;

        this.currentMatchIndex--;
        if (this.currentMatchIndex < 0) {
            if (this.cyclicSearch) {
                this.currentMatchIndex = this.matches.length - 1;
            } else {
                this.currentMatchIndex = 0;
                // Flash the search count to indicate we're at the start
                this.searchCount.textContent = 'Start of document';
                setTimeout(() => this.updateSearchCount(), 1000);
                return;
            }
        }

        this.goToMatch(this.currentMatchIndex);
        this.updateSearchCount();
    }

    private goToMatch(index: number): void {
        if (index < 0 || index >= this.matches.length) return;

        const match = this.matches[index];
        const editor = this.editorManager.getEditor();

        editor.setSelection(match.range);
        editor.revealRangeInCenter(match.range);
        this.highlightMatches(); // Update current match highlight
    }

    private replace(): void {
        if (this.currentMatchIndex < 0 || this.currentMatchIndex >= this.matches.length) {
            this.findNext();
            return;
        }

        const editor = this.editorManager.getEditor();
        const match = this.matches[this.currentMatchIndex];
        const replaceText = this.replaceInput.value;

        editor.executeEdits('search-replace', [{
            range: match.range,
            text: replaceText,
        }]);

        // Re-search to update matches
        this.performSearch();
    }

    private replaceAll(): void {
        if (this.matches.length === 0) return;

        const editor = this.editorManager.getEditor();
        const replaceText = this.replaceInput.value;

        // Apply all replacements in reverse order to maintain positions
        const edits = this.matches.map(match => ({
            range: match.range,
            text: replaceText,
        })).reverse();

        editor.executeEdits('search-replace-all', edits);

        // Re-search
        this.performSearch();
    }

    private highlightMatches(): void {
        const editor = this.editorManager.getEditor();

        const decorations = this.matches.map((match, index) => ({
            range: match.range,
            options: {
                className: index === this.currentMatchIndex
                    ? 'search-highlight-current'
                    : 'search-highlight',
                stickiness: 1,
            },
        }));

        this.decorations = editor.deltaDecorations(this.decorations, decorations);
    }

    private clearHighlights(): void {
        const editor = this.editorManager.getEditor();
        this.decorations = editor.deltaDecorations(this.decorations, []);
    }

    private updateSearchCount(): void {
        if (this.matches.length === 0) {
            this.searchCount.textContent = 'No results';
            this.searchCount.classList.add('no-results');
        } else {
            this.searchCount.textContent = `${this.currentMatchIndex + 1} of ${this.matches.length}`;
            this.searchCount.classList.remove('no-results');
        }
    }
}
