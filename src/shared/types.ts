/**
 * Shared TypeScript types for MyCode editor
 */

// Settings types matching Elementary Code schema
export interface Settings {
    // Window state
    windowState: 'Normal' | 'Maximized' | 'Fullscreen';
    windowSize: { width: number; height: number };
    sidebarVisible: boolean;
    sidebarWidth: number;

    // Editor settings
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
    formatOnSave: boolean;

    // Search settings
    cyclicSearch: boolean;
    wholeWordSearch: boolean;
    regexSearch: boolean;
    caseSensitiveSearch: 'never' | 'mixed' | 'always';

    // Project settings
    openedFolders: string[];
    openedFiles: OpenedFile[];
    focusedDocument: string;

    // Theme
    editorTheme: string;  // Theme ID (vs, vs-dark, monokai, dracula, etc.)
    preferDarkStyle: boolean;  // Deprecated, kept for migration
    followSystemStyle: boolean;
    customTheme?: CustomThemeColors;
}

// Custom user-defined theme colors
export interface CustomThemeColors {
    base: 'vs' | 'vs-dark';       // Inherit from light or dark base
    background: string;
    foreground: string;
    comment: string;
    keyword: string;
    string: string;
    number: string;
    type: string;
    function: string;
    variable: string;
    operator: string;
}

export interface OpenedFile {
    uri: string;
    cursorPosition: number;
}

// Default settings
export const DEFAULT_SETTINGS: Settings = {
    windowState: 'Normal',
    windowSize: { width: 1200, height: 800 },
    sidebarVisible: true,
    sidebarWidth: 250,

    autosave: true,
    smartCutCopy: true,
    lineWrap: true,
    showRightMargin: false,
    rightMarginPosition: 80,
    highlightMatchingBrackets: true,
    drawSpaces: 'selection',
    showMiniMap: false,
    spacesInsteadOfTabs: true,
    autoIndent: true,
    indentWidth: 4,
    useSystemFont: true,
    font: 'monospace',
    fontSize: 14,
    formatOnSave: true,

    cyclicSearch: false,
    wholeWordSearch: false,
    regexSearch: false,
    caseSensitiveSearch: 'mixed',

    openedFolders: [],
    openedFiles: [],
    focusedDocument: '',

    editorTheme: 'vs-dark',
    preferDarkStyle: false,
    followSystemStyle: true,
    customTheme: undefined,
};

// Tree node for folder sidebar
export interface TreeNode {
    name: string;
    path: string;
    type: 'file' | 'folder' | 'project';
    children?: TreeNode[];
    isExpanded?: boolean;
}

// Document tab
export interface DocumentTab {
    id: string;
    filePath: string | null; // null for untitled documents
    title: string;
    content: string;
    isDirty: boolean;
    cursorPosition: { line: number; column: number };
    language: string;
    // Diff tab support
    type?: 'normal' | 'diff';
    diffData?: {
        original: string;
        modified: string;
        language: string;
    };
}

// Navigation mark for jumping between code locations
export interface NavigationMark {
    id: string;
    filePath: string;
    lineNumber: number;
    column: number;
    label?: string;
}

// Search options
export interface SearchOptions {
    query: string;
    caseSensitive: boolean;
    wholeWord: boolean;
    regex: boolean;
    cyclic: boolean;
}

// File operation result
export interface FileOperationResult {
    success: boolean;
    path?: string;
    content?: string;
    error?: string;
}

// Git integration types
export interface GitBranchInfo {
    current: string;
    isDetached: boolean;
    ahead: number;
    behind: number;
    tracking?: string;
}

export interface GitFileStatus {
    path: string;
    status: 'modified' | 'added' | 'deleted' | 'renamed' | 'untracked' | 'conflicted';
    staged: boolean;
    originalPath?: string; // For renamed files
}

export interface GitStatus {
    isRepo: boolean;
    repoRoot: string;
    branch: GitBranchInfo;
    files: GitFileStatus[];
    staged: GitFileStatus[];
    modified: GitFileStatus[];
    untracked: GitFileStatus[];
}

export interface GitLineDiff {
    startLine: number;
    endLine: number;
    type: 'added' | 'modified' | 'deleted';
}

export interface GitOperationResult {
    success: boolean;
    error?: string;
    message?: string;
}
