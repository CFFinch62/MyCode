/**
 * MyCode - Custom Monaco Editor Themes
 * Provides additional theme options beyond the built-in vs/vs-dark/hc-black
 */

declare const monaco: typeof import('monaco-editor');

// Theme metadata for UI
export interface ThemeInfo {
    id: string;
    name: string;
    type: 'light' | 'dark';
}

export const THEMES: ThemeInfo[] = [
    // Light themes
    { id: 'vs', name: 'VS Light', type: 'light' },
    { id: 'github-light', name: 'GitHub Light', type: 'light' },
    { id: 'solarized-light', name: 'Solarized Light', type: 'light' },
    // Dark themes
    { id: 'vs-dark', name: 'VS Dark', type: 'dark' },
    { id: 'monokai', name: 'Monokai', type: 'dark' },
    { id: 'dracula', name: 'Dracula', type: 'dark' },
    { id: 'one-dark', name: 'One Dark', type: 'dark' },
    { id: 'solarized-dark', name: 'Solarized Dark', type: 'dark' },
    // High contrast
    { id: 'hc-black', name: 'High Contrast', type: 'dark' },
];

export function registerCustomThemes(): void {
    // GitHub Light Theme
    monaco.editor.defineTheme('github-light', {
        base: 'vs',
        inherit: true,
        rules: [
            { token: 'comment', foreground: '6a737d', fontStyle: 'italic' },
            { token: 'keyword', foreground: 'd73a49' },
            { token: 'string', foreground: '032f62' },
            { token: 'number', foreground: '005cc5' },
            { token: 'type', foreground: '6f42c1' },
            { token: 'function', foreground: '6f42c1' },
            { token: 'variable', foreground: 'e36209' },
            { token: 'constant', foreground: '005cc5' },
        ],
        colors: {
            'editor.background': '#ffffff',
            'editor.foreground': '#24292e',
            'editor.lineHighlightBackground': '#f6f8fa',
            'editor.selectionBackground': '#0366d625',
            'editorCursor.foreground': '#044289',
            'editorLineNumber.foreground': '#1b1f234d',
        }
    });

    // Solarized Light Theme
    monaco.editor.defineTheme('solarized-light', {
        base: 'vs',
        inherit: true,
        rules: [
            { token: 'comment', foreground: '93a1a1', fontStyle: 'italic' },
            { token: 'keyword', foreground: '859900' },
            { token: 'string', foreground: '2aa198' },
            { token: 'number', foreground: 'd33682' },
            { token: 'type', foreground: 'b58900' },
            { token: 'function', foreground: '268bd2' },
            { token: 'variable', foreground: 'cb4b16' },
        ],
        colors: {
            'editor.background': '#fdf6e3',
            'editor.foreground': '#657b83',
            'editor.lineHighlightBackground': '#eee8d5',
            'editor.selectionBackground': '#073642',
            'editorCursor.foreground': '#657b83',
            'editorLineNumber.foreground': '#93a1a1',
        }
    });

    // Monokai Theme
    monaco.editor.defineTheme('monokai', {
        base: 'vs-dark',
        inherit: true,
        rules: [
            { token: 'comment', foreground: '75715e', fontStyle: 'italic' },
            { token: 'keyword', foreground: 'f92672' },
            { token: 'string', foreground: 'e6db74' },
            { token: 'number', foreground: 'ae81ff' },
            { token: 'type', foreground: '66d9ef', fontStyle: 'italic' },
            { token: 'function', foreground: 'a6e22e' },
            { token: 'variable', foreground: 'f8f8f2' },
            { token: 'constant', foreground: 'ae81ff' },
            { token: 'operator', foreground: 'f92672' },
        ],
        colors: {
            'editor.background': '#272822',
            'editor.foreground': '#f8f8f2',
            'editor.lineHighlightBackground': '#3e3d32',
            'editor.selectionBackground': '#49483e',
            'editorCursor.foreground': '#f8f8f0',
            'editorLineNumber.foreground': '#90908a',
        }
    });

    // Dracula Theme
    monaco.editor.defineTheme('dracula', {
        base: 'vs-dark',
        inherit: true,
        rules: [
            { token: 'comment', foreground: '6272a4', fontStyle: 'italic' },
            { token: 'keyword', foreground: 'ff79c6' },
            { token: 'string', foreground: 'f1fa8c' },
            { token: 'number', foreground: 'bd93f9' },
            { token: 'type', foreground: '8be9fd', fontStyle: 'italic' },
            { token: 'function', foreground: '50fa7b' },
            { token: 'variable', foreground: 'f8f8f2' },
            { token: 'constant', foreground: 'bd93f9' },
            { token: 'operator', foreground: 'ff79c6' },
        ],
        colors: {
            'editor.background': '#282a36',
            'editor.foreground': '#f8f8f2',
            'editor.lineHighlightBackground': '#44475a',
            'editor.selectionBackground': '#44475a',
            'editorCursor.foreground': '#f8f8f0',
            'editorLineNumber.foreground': '#6272a4',
        }
    });

    // One Dark Theme
    monaco.editor.defineTheme('one-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
            { token: 'comment', foreground: '5c6370', fontStyle: 'italic' },
            { token: 'keyword', foreground: 'c678dd' },
            { token: 'string', foreground: '98c379' },
            { token: 'number', foreground: 'd19a66' },
            { token: 'type', foreground: 'e5c07b' },
            { token: 'function', foreground: '61afef' },
            { token: 'variable', foreground: 'e06c75' },
            { token: 'constant', foreground: 'd19a66' },
            { token: 'operator', foreground: '56b6c2' },
        ],
        colors: {
            'editor.background': '#282c34',
            'editor.foreground': '#abb2bf',
            'editor.lineHighlightBackground': '#2c313c',
            'editor.selectionBackground': '#3e4451',
            'editorCursor.foreground': '#528bff',
            'editorLineNumber.foreground': '#495162',
        }
    });

    // Solarized Dark Theme
    monaco.editor.defineTheme('solarized-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
            { token: 'comment', foreground: '586e75', fontStyle: 'italic' },
            { token: 'keyword', foreground: '859900' },
            { token: 'string', foreground: '2aa198' },
            { token: 'number', foreground: 'd33682' },
            { token: 'type', foreground: 'b58900' },
            { token: 'function', foreground: '268bd2' },
            { token: 'variable', foreground: 'cb4b16' },
        ],
        colors: {
            'editor.background': '#002b36',
            'editor.foreground': '#839496',
            'editor.lineHighlightBackground': '#073642',
            'editor.selectionBackground': '#073642',
            'editorCursor.foreground': '#839496',
            'editorLineNumber.foreground': '#586e75',
        }
    });
}

// Common monospace fonts for the font picker
export const MONOSPACE_FONTS = [
    { value: 'monospace', label: 'System Default' },
    { value: 'JetBrains Mono', label: 'JetBrains Mono' },
    { value: 'Fira Code', label: 'Fira Code' },
    { value: 'Source Code Pro', label: 'Source Code Pro' },
    { value: 'Cascadia Code', label: 'Cascadia Code' },
    { value: 'Consolas', label: 'Consolas' },
    { value: 'Monaco', label: 'Monaco' },
    { value: 'Menlo', label: 'Menlo' },
    { value: 'Ubuntu Mono', label: 'Ubuntu Mono' },
    { value: 'DejaVu Sans Mono', label: 'DejaVu Sans Mono' },
    { value: 'Inconsolata', label: 'Inconsolata' },
    { value: 'Roboto Mono', label: 'Roboto Mono' },
    { value: 'IBM Plex Mono', label: 'IBM Plex Mono' },
    { value: 'Hack', label: 'Hack' },
    { value: 'Courier New', label: 'Courier New' },
];

// Helper to get theme type (for CSS styling)
export function getThemeType(themeId: string): 'light' | 'dark' {
    const theme = THEMES.find(t => t.id === themeId);
    return theme?.type ?? 'light';
}
