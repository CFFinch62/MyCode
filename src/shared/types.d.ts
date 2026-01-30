/**
 * Shared TypeScript types for MyCode editor
 */
export interface Settings {
    windowState: 'Normal' | 'Maximized' | 'Fullscreen';
    windowSize: {
        width: number;
        height: number;
    };
    sidebarVisible: boolean;
    sidebarWidth: number;
    autosave: boolean;
    smartCutCopy: boolean;
    lineWrap: boolean;
    showRightMargin: boolean;
    rightMarginPosition: number;
    highlightMatchingBrackets: boolean;
    drawSpaces: 'never' | 'selection' | 'always' | 'current';
    showMiniMap: boolean;
    spacesInsteadOfTabs: boolean;
    autoIndent: boolean;
    indentWidth: number;
    useSystemFont: boolean;
    font: string;
    fontSize: number;
    cyclicSearch: boolean;
    wholeWordSearch: boolean;
    regexSearch: boolean;
    caseSensitiveSearch: 'never' | 'mixed' | 'always';
    openedFolders: string[];
    openedFiles: OpenedFile[];
    focusedDocument: string;
    preferDarkStyle: boolean;
    followSystemStyle: boolean;
}
export interface OpenedFile {
    uri: string;
    cursorPosition: number;
}
export declare const DEFAULT_SETTINGS: Settings;
export interface TreeNode {
    name: string;
    path: string;
    type: 'file' | 'folder' | 'project';
    children?: TreeNode[];
    isExpanded?: boolean;
}
export interface DocumentTab {
    id: string;
    filePath: string | null;
    title: string;
    content: string;
    isDirty: boolean;
    cursorPosition: number;
    language: string;
}
export interface NavigationMark {
    id: string;
    filePath: string;
    lineNumber: number;
    column: number;
    label?: string;
}
export interface SearchOptions {
    query: string;
    caseSensitive: boolean;
    wholeWord: boolean;
    regex: boolean;
    cyclic: boolean;
}
export interface FileOperationResult {
    success: boolean;
    path?: string;
    content?: string;
    error?: string;
}
//# sourceMappingURL=types.d.ts.map