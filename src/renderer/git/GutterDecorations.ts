/**
 * Gutter Decorations for Git Diff
 * Shows added/modified/deleted line indicators in Monaco editor gutter
 */

import { GitLineDiff } from '../../shared/types';

declare const monaco: typeof import('monaco-editor');

export class GutterDecorations {
    private decorations: Map<string, string[]> = new Map(); // tabId -> decorationIds
    private currentEditor: any = null; // Monaco editor instance
    private repoPath: string = '';

    constructor() { }

    /**
     * Set the repository path for diff operations
     */
    setRepoPath(repoPath: string): void {
        this.repoPath = repoPath;
    }

    /**
     * Set the current Monaco editor instance
     */
    setEditor(editor: any): void {
        this.currentEditor = editor;
    }

    /**
     * Update decorations for the current file
     */
    async updateDecorations(filePath: string, tabId: string): Promise<void> {
        if (!this.currentEditor || !this.repoPath || !filePath) {
            this.clearDecorations(tabId);
            return;
        }

        try {
            const diffs = await window.mycode.git.getFileDiff(this.repoPath, filePath);
            this.applyDecorations(diffs, tabId);
        } catch (error) {
            console.error('Failed to get file diff:', error);
            this.clearDecorations(tabId);
        }
    }

    /**
     * Apply decorations to the editor based on diff data
     */
    private applyDecorations(diffs: GitLineDiff[], tabId: string): void {
        if (!this.currentEditor) return;

        // Clear existing decorations for this tab
        this.clearDecorations(tabId);

        const newDecorations: any[] = [];

        for (const diff of diffs) {
            const decoration = this.createDecoration(diff);
            if (decoration) {
                newDecorations.push(decoration);
            }
        }

        // Apply new decorations
        if (newDecorations.length > 0) {
            const decorationIds = this.currentEditor.deltaDecorations([], newDecorations);
            this.decorations.set(tabId, decorationIds);
        }
    }

    /**
     * Create a Monaco decoration from a diff
     */
    private createDecoration(diff: GitLineDiff): any {
        let className: string;
        let glyphClassName: string;

        switch (diff.type) {
            case 'added':
                className = 'git-gutter-added';
                glyphClassName = 'git-gutter-glyph-added';
                break;
            case 'modified':
                className = 'git-gutter-modified';
                glyphClassName = 'git-gutter-glyph-modified';
                break;
            case 'deleted':
                className = 'git-gutter-deleted';
                glyphClassName = 'git-gutter-glyph-deleted';
                break;
            default:
                return null;
        }

        return {
            range: new monaco.Range(diff.startLine, 1, diff.endLine, 1),
            options: {
                isWholeLine: true,
                linesDecorationsClassName: glyphClassName,
                overviewRuler: {
                    color: this.getOverviewRulerColor(diff.type),
                    position: monaco.editor.OverviewRulerLane.Left,
                },
            },
        };
    }

    /**
     * Get the overview ruler color for a diff type
     */
    private getOverviewRulerColor(type: string): string {
        switch (type) {
            case 'added':
                return 'rgba(40, 167, 69, 0.8)';  // Green
            case 'modified':
                return 'rgba(255, 193, 7, 0.8)';  // Yellow
            case 'deleted':
                return 'rgba(220, 53, 69, 0.8)';  // Red
            default:
                return 'rgba(128, 128, 128, 0.8)';
        }
    }

    /**
     * Clear decorations for a specific tab
     */
    clearDecorations(tabId: string): void {
        if (!this.currentEditor) return;

        const existingDecorations = this.decorations.get(tabId);
        if (existingDecorations && existingDecorations.length > 0) {
            this.currentEditor.deltaDecorations(existingDecorations, []);
            this.decorations.delete(tabId);
        }
    }

    /**
     * Clear all decorations
     */
    clearAllDecorations(): void {
        if (!this.currentEditor) return;

        for (const [tabId, decorationIds] of this.decorations.entries()) {
            if (decorationIds.length > 0) {
                this.currentEditor.deltaDecorations(decorationIds, []);
            }
        }
        this.decorations.clear();
    }

    /**
     * Cleanup
     */
    dispose(): void {
        this.clearAllDecorations();
        this.currentEditor = null;
    }
}
