/**
 * MyCode - Custom Monaco Editor Themes
 * Provides additional theme options beyond the built-in vs/vs-dark/hc-black
 */

declare const monaco: typeof import('monaco-editor');

import type { CustomThemeColors } from '../../shared/types';

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
    { id: 'ayu-light', name: 'Ayu Light', type: 'light' },
    { id: 'catppuccin-latte', name: 'Catppuccin Latte', type: 'light' },
    { id: 'quiet-light', name: 'Quiet Light', type: 'light' },
    // Dark themes
    { id: 'vs-dark', name: 'VS Dark', type: 'dark' },
    { id: 'monokai', name: 'Monokai', type: 'dark' },
    { id: 'dracula', name: 'Dracula', type: 'dark' },
    { id: 'one-dark', name: 'One Dark', type: 'dark' },
    { id: 'solarized-dark', name: 'Solarized Dark', type: 'dark' },
    { id: 'nord', name: 'Nord', type: 'dark' },
    { id: 'gruvbox-dark', name: 'Gruvbox Dark', type: 'dark' },
    { id: 'tokyo-night', name: 'Tokyo Night', type: 'dark' },
    { id: 'night-owl', name: 'Night Owl', type: 'dark' },
    { id: 'catppuccin-mocha', name: 'Catppuccin Mocha', type: 'dark' },
    { id: 'ayu-dark', name: 'Ayu Dark', type: 'dark' },
    { id: 'material-dark', name: 'Material Dark', type: 'dark' },
    { id: 'cobalt2', name: 'Cobalt 2', type: 'dark' },
    { id: 'synthwave84', name: 'Synthwave \'84', type: 'dark' },
    { id: 'tomorrow-night', name: 'Tomorrow Night', type: 'dark' },
    { id: 'palenight', name: 'Palenight', type: 'dark' },
    { id: 'rose-pine', name: 'Rosé Pine', type: 'dark' },
    { id: 'everforest-dark', name: 'Everforest Dark', type: 'dark' },
    // Custom
    { id: 'custom-user', name: 'Custom', type: 'dark' },
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

    // Ayu Light Theme
    monaco.editor.defineTheme('ayu-light', {
        base: 'vs',
        inherit: true,
        rules: [
            { token: 'comment', foreground: 'ABB0B6', fontStyle: 'italic' },
            { token: 'keyword', foreground: 'FA8D3E' },
            { token: 'string', foreground: '86B300' },
            { token: 'number', foreground: 'A37ACC' },
            { token: 'type', foreground: '399EE6' },
            { token: 'function', foreground: 'F2AE49' },
            { token: 'variable', foreground: '5C6166' },
            { token: 'constant', foreground: 'A37ACC' },
            { token: 'operator', foreground: 'ED9366' },
        ],
        colors: {
            'editor.background': '#FAFAFA',
            'editor.foreground': '#5C6166',
            'editor.lineHighlightBackground': '#EFF0F1',
            'editor.selectionBackground': '#035BD626',
            'editorCursor.foreground': '#FF6A00',
            'editorLineNumber.foreground': '#8A9199',
        }
    });

    // Catppuccin Latte Theme
    monaco.editor.defineTheme('catppuccin-latte', {
        base: 'vs',
        inherit: true,
        rules: [
            { token: 'comment', foreground: '9CA0B0', fontStyle: 'italic' },
            { token: 'keyword', foreground: '8839EF' },
            { token: 'string', foreground: '40A02B' },
            { token: 'number', foreground: 'FE640B' },
            { token: 'type', foreground: 'DF8E1D' },
            { token: 'function', foreground: '1E66F5' },
            { token: 'variable', foreground: '4C4F69' },
            { token: 'constant', foreground: 'FE640B' },
            { token: 'operator', foreground: '04A5E5' },
        ],
        colors: {
            'editor.background': '#EFF1F5',
            'editor.foreground': '#4C4F69',
            'editor.lineHighlightBackground': '#E6E9EF',
            'editor.selectionBackground': '#ACB0BE80',
            'editorCursor.foreground': '#DC8A78',
            'editorLineNumber.foreground': '#8C8FA1',
        }
    });

    // Quiet Light Theme
    monaco.editor.defineTheme('quiet-light', {
        base: 'vs',
        inherit: true,
        rules: [
            { token: 'comment', foreground: 'AAAAAA', fontStyle: 'italic' },
            { token: 'keyword', foreground: '4B69C6' },
            { token: 'string', foreground: '448C27' },
            { token: 'number', foreground: 'AB6526' },
            { token: 'type', foreground: '7A3E9D' },
            { token: 'function', foreground: 'AA3731' },
            { token: 'variable', foreground: '7A3E9D' },
            { token: 'constant', foreground: 'AB6526' },
        ],
        colors: {
            'editor.background': '#F5F5F5',
            'editor.foreground': '#333333',
            'editor.lineHighlightBackground': '#E4F6D4',
            'editor.selectionBackground': '#C9D0D9',
            'editorCursor.foreground': '#54494B',
            'editorLineNumber.foreground': '#AAAAAA',
        }
    });

    // Nord Theme
    monaco.editor.defineTheme('nord', {
        base: 'vs-dark',
        inherit: true,
        rules: [
            { token: 'comment', foreground: '616E88', fontStyle: 'italic' },
            { token: 'keyword', foreground: '81A1C1' },
            { token: 'string', foreground: 'A3BE8C' },
            { token: 'number', foreground: 'B48EAD' },
            { token: 'type', foreground: '8FBCBB' },
            { token: 'function', foreground: '88C0D0' },
            { token: 'variable', foreground: 'D8DEE9' },
            { token: 'constant', foreground: 'B48EAD' },
            { token: 'operator', foreground: '81A1C1' },
        ],
        colors: {
            'editor.background': '#2E3440',
            'editor.foreground': '#D8DEE9',
            'editor.lineHighlightBackground': '#3B4252',
            'editor.selectionBackground': '#434C5E',
            'editorCursor.foreground': '#D8DEE9',
            'editorLineNumber.foreground': '#4C566A',
        }
    });

    // Gruvbox Dark Theme
    monaco.editor.defineTheme('gruvbox-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
            { token: 'comment', foreground: '928374', fontStyle: 'italic' },
            { token: 'keyword', foreground: 'FB4934' },
            { token: 'string', foreground: 'B8BB26' },
            { token: 'number', foreground: 'D3869B' },
            { token: 'type', foreground: 'FABD2F' },
            { token: 'function', foreground: '83A598' },
            { token: 'variable', foreground: 'EBDBB2' },
            { token: 'constant', foreground: 'D3869B' },
            { token: 'operator', foreground: 'FE8019' },
        ],
        colors: {
            'editor.background': '#282828',
            'editor.foreground': '#EBDBB2',
            'editor.lineHighlightBackground': '#3C3836',
            'editor.selectionBackground': '#504945',
            'editorCursor.foreground': '#EBDBB2',
            'editorLineNumber.foreground': '#665C54',
        }
    });

    // Tokyo Night Theme
    monaco.editor.defineTheme('tokyo-night', {
        base: 'vs-dark',
        inherit: true,
        rules: [
            { token: 'comment', foreground: '565F89', fontStyle: 'italic' },
            { token: 'keyword', foreground: '9D7CD8' },
            { token: 'string', foreground: '9ECE6A' },
            { token: 'number', foreground: 'FF9E64' },
            { token: 'type', foreground: '2AC3DE' },
            { token: 'function', foreground: '7AA2F7' },
            { token: 'variable', foreground: 'C0CAF5' },
            { token: 'constant', foreground: 'FF9E64' },
            { token: 'operator', foreground: '89DDFF' },
        ],
        colors: {
            'editor.background': '#1A1B26',
            'editor.foreground': '#A9B1D6',
            'editor.lineHighlightBackground': '#292E42',
            'editor.selectionBackground': '#33467C',
            'editorCursor.foreground': '#C0CAF5',
            'editorLineNumber.foreground': '#3B4261',
        }
    });

    // Night Owl Theme
    monaco.editor.defineTheme('night-owl', {
        base: 'vs-dark',
        inherit: true,
        rules: [
            { token: 'comment', foreground: '637777', fontStyle: 'italic' },
            { token: 'keyword', foreground: 'C792EA' },
            { token: 'string', foreground: 'ECC48D' },
            { token: 'number', foreground: 'F78C6C' },
            { token: 'type', foreground: 'FFCB8B' },
            { token: 'function', foreground: '82AAFF' },
            { token: 'variable', foreground: 'D6DEEB' },
            { token: 'constant', foreground: 'F78C6C' },
            { token: 'operator', foreground: '7FDBCA' },
        ],
        colors: {
            'editor.background': '#011627',
            'editor.foreground': '#D6DEEB',
            'editor.lineHighlightBackground': '#010E17',
            'editor.selectionBackground': '#1D3B53',
            'editorCursor.foreground': '#80A4C2',
            'editorLineNumber.foreground': '#4B6479',
        }
    });

    // Catppuccin Mocha Theme
    monaco.editor.defineTheme('catppuccin-mocha', {
        base: 'vs-dark',
        inherit: true,
        rules: [
            { token: 'comment', foreground: '6C7086', fontStyle: 'italic' },
            { token: 'keyword', foreground: 'CBA6F7' },
            { token: 'string', foreground: 'A6E3A1' },
            { token: 'number', foreground: 'FAB387' },
            { token: 'type', foreground: 'F9E2AF' },
            { token: 'function', foreground: '89B4FA' },
            { token: 'variable', foreground: 'CDD6F4' },
            { token: 'constant', foreground: 'FAB387' },
            { token: 'operator', foreground: '89DCEB' },
        ],
        colors: {
            'editor.background': '#1E1E2E',
            'editor.foreground': '#CDD6F4',
            'editor.lineHighlightBackground': '#313244',
            'editor.selectionBackground': '#45475A',
            'editorCursor.foreground': '#F5E0DC',
            'editorLineNumber.foreground': '#585B70',
        }
    });

    // Ayu Dark Theme
    monaco.editor.defineTheme('ayu-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
            { token: 'comment', foreground: '5C6773', fontStyle: 'italic' },
            { token: 'keyword', foreground: 'FF8F40' },
            { token: 'string', foreground: 'AAD94C' },
            { token: 'number', foreground: 'D2A6FF' },
            { token: 'type', foreground: '59C2FF' },
            { token: 'function', foreground: 'FFB454' },
            { token: 'variable', foreground: 'BFBDB6' },
            { token: 'constant', foreground: 'D2A6FF' },
            { token: 'operator', foreground: 'F29668' },
        ],
        colors: {
            'editor.background': '#0B0E14',
            'editor.foreground': '#BFBDB6',
            'editor.lineHighlightBackground': '#131721',
            'editor.selectionBackground': '#273747',
            'editorCursor.foreground': '#E6B450',
            'editorLineNumber.foreground': '#454B54',
        }
    });

    // Material Dark Theme
    monaco.editor.defineTheme('material-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
            { token: 'comment', foreground: '546E7A', fontStyle: 'italic' },
            { token: 'keyword', foreground: 'C792EA' },
            { token: 'string', foreground: 'C3E88D' },
            { token: 'number', foreground: 'F78C6C' },
            { token: 'type', foreground: 'FFCB6B' },
            { token: 'function', foreground: '82AAFF' },
            { token: 'variable', foreground: 'EEFFFF' },
            { token: 'constant', foreground: 'F78C6C' },
            { token: 'operator', foreground: '89DDFF' },
        ],
        colors: {
            'editor.background': '#212121',
            'editor.foreground': '#EEFFFF',
            'editor.lineHighlightBackground': '#00000050',
            'editor.selectionBackground': '#61616150',
            'editorCursor.foreground': '#FFCC00',
            'editorLineNumber.foreground': '#424242',
        }
    });

    // Cobalt 2 Theme
    monaco.editor.defineTheme('cobalt2', {
        base: 'vs-dark',
        inherit: true,
        rules: [
            { token: 'comment', foreground: '0088FF', fontStyle: 'italic' },
            { token: 'keyword', foreground: 'FFC600' },
            { token: 'string', foreground: 'A5FF90' },
            { token: 'number', foreground: 'FF628C' },
            { token: 'type', foreground: '80FFBB' },
            { token: 'function', foreground: 'FFC600' },
            { token: 'variable', foreground: 'CCCCCC' },
            { token: 'constant', foreground: 'FF628C' },
            { token: 'operator', foreground: 'FF9D00' },
        ],
        colors: {
            'editor.background': '#193549',
            'editor.foreground': '#FFFFFF',
            'editor.lineHighlightBackground': '#0D3A58',
            'editor.selectionBackground': '#0050A4',
            'editorCursor.foreground': '#FFC600',
            'editorLineNumber.foreground': '#2B6C8F',
        }
    });

    // Synthwave '84 Theme
    monaco.editor.defineTheme('synthwave84', {
        base: 'vs-dark',
        inherit: true,
        rules: [
            { token: 'comment', foreground: '848BBD', fontStyle: 'italic' },
            { token: 'keyword', foreground: 'FEDE5D' },
            { token: 'string', foreground: 'FF8B39' },
            { token: 'number', foreground: 'F97E72' },
            { token: 'type', foreground: 'FF7EDB' },
            { token: 'function', foreground: '36F9F6' },
            { token: 'variable', foreground: 'FF7EDB' },
            { token: 'constant', foreground: 'F97E72' },
            { token: 'operator', foreground: 'FEDE5D' },
        ],
        colors: {
            'editor.background': '#262335',
            'editor.foreground': '#FFFFFF',
            'editor.lineHighlightBackground': '#34294F',
            'editor.selectionBackground': '#463465',
            'editorCursor.foreground': '#FB00A3',
            'editorLineNumber.foreground': '#495495',
        }
    });

    // Tomorrow Night Theme
    monaco.editor.defineTheme('tomorrow-night', {
        base: 'vs-dark',
        inherit: true,
        rules: [
            { token: 'comment', foreground: '969896', fontStyle: 'italic' },
            { token: 'keyword', foreground: 'B294BB' },
            { token: 'string', foreground: 'B5BD68' },
            { token: 'number', foreground: 'DE935F' },
            { token: 'type', foreground: 'F0C674' },
            { token: 'function', foreground: '81A2BE' },
            { token: 'variable', foreground: 'CC6666' },
            { token: 'constant', foreground: 'DE935F' },
            { token: 'operator', foreground: '8ABEB7' },
        ],
        colors: {
            'editor.background': '#1D1F21',
            'editor.foreground': '#C5C8C6',
            'editor.lineHighlightBackground': '#282A2E',
            'editor.selectionBackground': '#373B41',
            'editorCursor.foreground': '#AEAFAD',
            'editorLineNumber.foreground': '#4B4E55',
        }
    });

    // Palenight Theme
    monaco.editor.defineTheme('palenight', {
        base: 'vs-dark',
        inherit: true,
        rules: [
            { token: 'comment', foreground: '676E95', fontStyle: 'italic' },
            { token: 'keyword', foreground: 'C792EA' },
            { token: 'string', foreground: 'C3E88D' },
            { token: 'number', foreground: 'F78C6C' },
            { token: 'type', foreground: 'FFCB6B' },
            { token: 'function', foreground: '82AAFF' },
            { token: 'variable', foreground: 'A6ACCD' },
            { token: 'constant', foreground: 'F78C6C' },
            { token: 'operator', foreground: '89DDFF' },
        ],
        colors: {
            'editor.background': '#292D3E',
            'editor.foreground': '#A6ACCD',
            'editor.lineHighlightBackground': '#32374D',
            'editor.selectionBackground': '#3C435E',
            'editorCursor.foreground': '#FFCC00',
            'editorLineNumber.foreground': '#3A3F58',
        }
    });

    // Rosé Pine Theme
    monaco.editor.defineTheme('rose-pine', {
        base: 'vs-dark',
        inherit: true,
        rules: [
            { token: 'comment', foreground: '6E6A86', fontStyle: 'italic' },
            { token: 'keyword', foreground: '3E8FB0' },
            { token: 'string', foreground: 'F6C177' },
            { token: 'number', foreground: 'EA9A97' },
            { token: 'type', foreground: '9CCFD8' },
            { token: 'function', foreground: 'EB6F92' },
            { token: 'variable', foreground: 'E0DEF4' },
            { token: 'constant', foreground: 'EA9A97' },
            { token: 'operator', foreground: '31748F' },
        ],
        colors: {
            'editor.background': '#191724',
            'editor.foreground': '#E0DEF4',
            'editor.lineHighlightBackground': '#21202E',
            'editor.selectionBackground': '#2A283E',
            'editorCursor.foreground': '#56526E',
            'editorLineNumber.foreground': '#3E3A53',
        }
    });

    // Everforest Dark Theme
    monaco.editor.defineTheme('everforest-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
            { token: 'comment', foreground: '859289', fontStyle: 'italic' },
            { token: 'keyword', foreground: 'E67E80' },
            { token: 'string', foreground: 'A7C080' },
            { token: 'number', foreground: 'D699B6' },
            { token: 'type', foreground: 'DBBC7F' },
            { token: 'function', foreground: '7FBBB3' },
            { token: 'variable', foreground: 'D3C6AA' },
            { token: 'constant', foreground: 'D699B6' },
            { token: 'operator', foreground: 'E69875' },
        ],
        colors: {
            'editor.background': '#2D353B',
            'editor.foreground': '#D3C6AA',
            'editor.lineHighlightBackground': '#343F44',
            'editor.selectionBackground': '#425047',
            'editorCursor.foreground': '#D3C6AA',
            'editorLineNumber.foreground': '#546A5B',
        }
    });
}

// Default custom theme colors (dark base)
export const DEFAULT_CUSTOM_THEME: CustomThemeColors = {
    base: 'vs-dark',
    background: '#1e1e2e',
    foreground: '#cdd6f4',
    comment: '#6c7086',
    keyword: '#cba6f7',
    string: '#a6e3a1',
    number: '#fab387',
    type: '#f9e2af',
    function: '#89b4fa',
    variable: '#cdd6f4',
    operator: '#89dceb',
};

// Register or update the custom user theme with Monaco
export function registerCustomUserTheme(colors: CustomThemeColors): void {
    // Compute line highlight and selection based on background brightness
    const bg = colors.background;
    const isLight = colors.base === 'vs';

    // Derive UI colors from the background
    const lineHighlight = isLight ? darkenHex(bg, 0.04) : lightenHex(bg, 0.06);
    const selection = isLight ? darkenHex(bg, 0.10) : lightenHex(bg, 0.12);
    const lineNumber = isLight ? darkenHex(bg, 0.30) : lightenHex(bg, 0.20);

    monaco.editor.defineTheme('custom-user', {
        base: colors.base,
        inherit: true,
        rules: [
            { token: 'comment', foreground: stripHash(colors.comment), fontStyle: 'italic' },
            { token: 'keyword', foreground: stripHash(colors.keyword) },
            { token: 'string', foreground: stripHash(colors.string) },
            { token: 'number', foreground: stripHash(colors.number) },
            { token: 'type', foreground: stripHash(colors.type) },
            { token: 'function', foreground: stripHash(colors.function) },
            { token: 'variable', foreground: stripHash(colors.variable) },
            { token: 'constant', foreground: stripHash(colors.number) },
            { token: 'operator', foreground: stripHash(colors.operator) },
        ],
        colors: {
            'editor.background': bg,
            'editor.foreground': colors.foreground,
            'editor.lineHighlightBackground': lineHighlight,
            'editor.selectionBackground': selection,
            'editorCursor.foreground': colors.foreground,
            'editorLineNumber.foreground': lineNumber,
        }
    });

    // Update the THEMES entry type based on the base
    const entry = THEMES.find(t => t.id === 'custom-user');
    if (entry) entry.type = isLight ? 'light' : 'dark';
}

// Helper: strip leading '#' for Monaco token foreground values
function stripHash(hex: string): string {
    return hex.startsWith('#') ? hex.slice(1) : hex;
}

// Helper: lighten a hex color by a fraction (0-1)
function lightenHex(hex: string, amount: number): string {
    const [r, g, b] = parseHex(hex);
    const nr = Math.min(255, Math.round(r + (255 - r) * amount));
    const ng = Math.min(255, Math.round(g + (255 - g) * amount));
    const nb = Math.min(255, Math.round(b + (255 - b) * amount));
    return `#${toHex(nr)}${toHex(ng)}${toHex(nb)}`;
}

// Helper: darken a hex color by a fraction (0-1)
function darkenHex(hex: string, amount: number): string {
    const [r, g, b] = parseHex(hex);
    const nr = Math.max(0, Math.round(r * (1 - amount)));
    const ng = Math.max(0, Math.round(g * (1 - amount)));
    const nb = Math.max(0, Math.round(b * (1 - amount)));
    return `#${toHex(nr)}${toHex(ng)}${toHex(nb)}`;
}

function parseHex(hex: string): [number, number, number] {
    const h = hex.replace('#', '');
    return [
        parseInt(h.substring(0, 2), 16),
        parseInt(h.substring(2, 4), 16),
        parseInt(h.substring(4, 6), 16),
    ];
}

function toHex(n: number): string {
    return n.toString(16).padStart(2, '0');
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
