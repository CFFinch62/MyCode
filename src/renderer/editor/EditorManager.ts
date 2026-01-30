/**
 * MyCode - Editor Manager
 * Wraps Monaco Editor with Elementary Code features
 */

import { Settings } from '../../shared/types';
import { registerCustomThemes, getThemeType } from './themes';

declare const monaco: typeof import('monaco-editor');

export class EditorManager {
    private editor: any; // monaco.editor.IStandaloneCodeEditor
    private container: HTMLElement;
    private settings: Settings;
    private navigationMarks: Array<{ lineNumber: number; column: number }> = [];
    private currentMarkIndex = -1;

    constructor(settings: Settings) {
        this.settings = settings;
        this.container = document.getElementById('editor-container')!;
        this.initEditor();
    }

    private initEditor(): void {
        // Register custom themes
        registerCustomThemes();

        // Determine which theme to use
        let theme: string;
        if (this.settings.followSystemStyle) {
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            theme = isDark ? 'vs-dark' : 'vs';
        } else {
            theme = this.settings.editorTheme || 'vs-dark';
        }

        this.editor = monaco.editor.create(this.container, {
            value: '',
            language: 'plaintext',
            theme: theme,
            automaticLayout: true,
            fontSize: this.settings.fontSize,
            fontFamily: this.settings.useSystemFont ? 'monospace' : this.settings.font,
            lineNumbers: 'on',
            minimap: { enabled: this.settings.showMiniMap },
            wordWrap: this.settings.lineWrap ? 'on' : 'off',
            tabSize: this.settings.indentWidth,
            insertSpaces: this.settings.spacesInsteadOfTabs,
            autoIndent: this.settings.autoIndent ? 'full' : 'none',
            matchBrackets: this.settings.highlightMatchingBrackets ? 'always' : 'never',
            renderWhitespace: this.getWhitespaceMode(),
            rulers: this.settings.showRightMargin ? [this.settings.rightMarginPosition] : [],
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
        });

        // Register custom actions
        this.registerCustomActions();

        // Track content changes
        this.editor.onDidChangeModelContent(() => {
            this.onContentChanged();
        });
    }

    private getWhitespaceMode(): 'none' | 'boundary' | 'selection' | 'all' {
        switch (this.settings.drawSpaces) {
            case 'never': return 'none';
            case 'selection': return 'selection';
            case 'always': return 'all';
            case 'current': return 'selection';
            default: return 'selection';
        }
    }

    private registerCustomActions(): void {
        // Duplicate Line (Ctrl+D) - Elementary Code style
        this.editor.addAction({
            id: 'mycode.duplicateLine',
            label: 'Duplicate Line',
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyD],
            run: (ed: any) => this.duplicateLine(ed),
        });

        // Sort Lines (F5)
        this.editor.addAction({
            id: 'mycode.sortLines',
            label: 'Sort Selected Lines',
            keybindings: [monaco.KeyCode.F5],
            run: (ed: any) => this.sortLines(ed),
        });

        // Clear Line (Ctrl+K)
        this.editor.addAction({
            id: 'mycode.clearLine',
            label: 'Clear Line',
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK],
            run: (ed: any) => this.clearLine(ed),
        });

        // Smart Cut (override default) - Ctrl+X cuts line when no selection
        this.editor.addAction({
            id: 'mycode.smartCut',
            label: 'Smart Cut',
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyX],
            run: (ed: any) => this.smartCut(ed),
        });

        // Smart Copy - Ctrl+C copies line when no selection
        this.editor.addAction({
            id: 'mycode.smartCopy',
            label: 'Smart Copy',
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyC],
            run: (ed: any) => this.smartCopy(ed),
        });

        // Add Navigation Mark (Alt+=)
        this.editor.addAction({
            id: 'mycode.addMark',
            label: 'Add Navigation Mark',
            keybindings: [monaco.KeyMod.Alt | monaco.KeyCode.Equal],
            run: (ed: any) => this.addNavigationMark(ed),
        });

        // Go to Previous Mark (Alt+Left)
        this.editor.addAction({
            id: 'mycode.previousMark',
            label: 'Go to Previous Mark',
            keybindings: [monaco.KeyMod.Alt | monaco.KeyCode.LeftArrow],
            run: () => this.goToPreviousMark(),
        });

        // Go to Next Mark (Alt+Right)
        this.editor.addAction({
            id: 'mycode.nextMark',
            label: 'Go to Next Mark',
            keybindings: [monaco.KeyMod.Alt | monaco.KeyCode.RightArrow],
            run: () => this.goToNextMark(),
        });

        // Lowercase (Ctrl+L)
        this.editor.addAction({
            id: 'mycode.lowercase',
            label: 'Transform to Lowercase',
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyL],
            run: (ed: any) => this.transformCase(ed, 'lower'),
        });

        // Uppercase (Ctrl+U)
        this.editor.addAction({
            id: 'mycode.uppercase',
            label: 'Transform to Uppercase',
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyU],
            run: (ed: any) => this.transformCase(ed, 'upper'),
        });
    }

    // ===== Custom Editor Actions (Elementary Code Features) =====

    private duplicateLine(ed: any): void {
        const selection = ed.getSelection();
        const model = ed.getModel();

        if (selection.isEmpty()) {
            // Duplicate current line
            const lineNumber = selection.startLineNumber;
            const lineContent = model.getLineContent(lineNumber);
            const range = new monaco.Range(lineNumber, model.getLineMaxColumn(lineNumber), lineNumber, model.getLineMaxColumn(lineNumber));
            ed.executeEdits('', [{ range, text: '\n' + lineContent }]);
        } else {
            // Duplicate selection
            const text = model.getValueInRange(selection);
            const endColumn = selection.endColumn;
            const endLine = selection.endLineNumber;
            ed.executeEdits('', [{
                range: new monaco.Range(endLine, endColumn, endLine, endColumn),
                text: text
            }]);
        }
    }

    private sortLines(ed: any): void {
        const selection = ed.getSelection();
        const model = ed.getModel();

        if (selection.isEmpty()) return;

        const startLine = selection.startLineNumber;
        const endLine = selection.endLineNumber;

        const lines: string[] = [];
        for (let i = startLine; i <= endLine; i++) {
            lines.push(model.getLineContent(i));
        }

        lines.sort((a, b) => a.localeCompare(b));

        const range = new monaco.Range(
            startLine, 1,
            endLine, model.getLineMaxColumn(endLine)
        );

        ed.executeEdits('', [{ range, text: lines.join('\n') }]);
    }

    private clearLine(ed: any): void {
        const selection = ed.getSelection();
        const model = ed.getModel();
        const lineNumber = selection.startLineNumber;

        // Delete entire line
        const range = new monaco.Range(
            lineNumber, 1,
            lineNumber + 1, 1
        );

        ed.executeEdits('', [{ range, text: '' }]);
    }

    private smartCut(ed: any): void {
        if (!this.settings.smartCutCopy) {
            ed.trigger('', 'editor.action.clipboardCutAction', null);
            return;
        }

        const selection = ed.getSelection();
        const model = ed.getModel();

        if (selection.isEmpty()) {
            // Cut entire line
            const lineNumber = selection.startLineNumber;
            const lineContent = model.getLineContent(lineNumber) + '\n';

            navigator.clipboard.writeText(lineContent);

            const range = new monaco.Range(lineNumber, 1, lineNumber + 1, 1);
            ed.executeEdits('', [{ range, text: '' }]);
        } else {
            ed.trigger('', 'editor.action.clipboardCutAction', null);
        }
    }

    private smartCopy(ed: any): void {
        if (!this.settings.smartCutCopy) {
            ed.trigger('', 'editor.action.clipboardCopyAction', null);
            return;
        }

        const selection = ed.getSelection();
        const model = ed.getModel();

        if (selection.isEmpty()) {
            // Copy entire line
            const lineNumber = selection.startLineNumber;
            const lineContent = model.getLineContent(lineNumber) + '\n';
            navigator.clipboard.writeText(lineContent);
        } else {
            ed.trigger('', 'editor.action.clipboardCopyAction', null);
        }
    }

    private addNavigationMark(ed: any): void {
        const position = ed.getPosition();
        this.navigationMarks.push({
            lineNumber: position.lineNumber,
            column: position.column,
        });
        this.currentMarkIndex = this.navigationMarks.length - 1;
        console.log('Navigation mark added at line', position.lineNumber);
    }

    private goToPreviousMark(): void {
        if (this.navigationMarks.length === 0) return;

        this.currentMarkIndex--;
        if (this.currentMarkIndex < 0) {
            this.currentMarkIndex = this.navigationMarks.length - 1;
        }

        const mark = this.navigationMarks[this.currentMarkIndex];
        this.editor.setPosition({ lineNumber: mark.lineNumber, column: mark.column });
        this.editor.revealLineInCenter(mark.lineNumber);
    }

    private goToNextMark(): void {
        if (this.navigationMarks.length === 0) return;

        this.currentMarkIndex++;
        if (this.currentMarkIndex >= this.navigationMarks.length) {
            this.currentMarkIndex = 0;
        }

        const mark = this.navigationMarks[this.currentMarkIndex];
        this.editor.setPosition({ lineNumber: mark.lineNumber, column: mark.column });
        this.editor.revealLineInCenter(mark.lineNumber);
    }

    private transformCase(ed: any, direction: 'upper' | 'lower'): void {
        const selection = ed.getSelection();
        const model = ed.getModel();

        if (selection.isEmpty()) return;

        const text = model.getValueInRange(selection);
        const transformed = direction === 'upper' ? text.toUpperCase() : text.toLowerCase();

        ed.executeEdits('', [{ range: selection, text: transformed }]);
        ed.setSelection(selection);
    }

    private onContentChanged(): void {
        // Emit change event for tab dirty state
        const event = new CustomEvent('editor-content-changed');
        document.dispatchEvent(event);
    }

    // ===== Public API =====

    setContent(content: string, language?: string): void {
        const model = monaco.editor.createModel(content, language || 'plaintext');
        this.editor.setModel(model);
        this.navigationMarks = [];
        this.currentMarkIndex = -1;
    }

    getContent(): string {
        return this.editor.getValue();
    }

    setLanguage(language: string): void {
        const model = this.editor.getModel();
        if (model) {
            monaco.editor.setModelLanguage(model, language);
        }
    }

    focus(): void {
        this.editor.focus();
    }

    getCursorPosition(): number {
        return this.editor.getModel()?.getOffsetAt(this.editor.getPosition()) || 0;
    }

    setCursorPosition(offset: number): void {
        const model = this.editor.getModel();
        if (model) {
            const position = model.getPositionAt(offset);
            this.editor.setPosition(position);
            this.editor.revealPositionInCenter(position);
        }
    }

    getEditor(): any {
        return this.editor;
    }

    updateSettings(settings: Partial<Settings>): void {
        Object.assign(this.settings, settings);

        // Update Monaco theme if theme settings changed
        if (settings.editorTheme !== undefined || settings.followSystemStyle !== undefined) {
            let theme: string;
            if (this.settings.followSystemStyle) {
                const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                theme = isDark ? 'vs-dark' : 'vs';
            } else {
                theme = this.settings.editorTheme || 'vs-dark';
            }
            monaco.editor.setTheme(theme);
        }

        this.editor.updateOptions({
            fontSize: this.settings.fontSize,
            fontFamily: this.settings.useSystemFont ? 'monospace' : this.settings.font,
            minimap: { enabled: this.settings.showMiniMap },
            wordWrap: this.settings.lineWrap ? 'on' : 'off',
            tabSize: this.settings.indentWidth,
            insertSpaces: this.settings.spacesInsteadOfTabs,
            autoIndent: this.settings.autoIndent ? 'full' : 'none',
            matchBrackets: this.settings.highlightMatchingBrackets ? 'always' : 'never',
            renderWhitespace: this.getWhitespaceMode(),
            rulers: this.settings.showRightMargin ? [this.settings.rightMarginPosition] : [],
        });
    }
}
