/**
 * Leopard Language Support Plugin for MyCode
 *
 * Provides:
 *   - Syntax highlighting for .lep files (Monaco Monarch tokenizer)
 *   - Hover documentation for turtle-graphics commands and builtin actions
 *   - Language configuration (comments, brackets, indentation rules)
 *
 * Leopard is an event-driven GUI/turtle-graphics BASIC dialect. Blocks use
 * Python-style colon + indentation (no `end if`/`wend`/braces at all), a
 * program opens with `window` / `text window` / `graphics window` (or no
 * header for a plain console script), and controls/events/properties
 * replace the original 2013 Liberty BASIC's fixed onclick-action keywords.
 * String concatenation is the dedicated `&` operator — `+` is numeric-only.
 */

(function () {

    // -----------------------------------------------------------------------
    // Turtle-graphics command hover documentation (spec §10)
    // -----------------------------------------------------------------------
    const LEOPARD_TURTLE_DOCS = {
        'up':             'up\nRaises the pen — go/goto stop drawing lines.',
        'down':           'down\nLowers the pen — go/goto draw lines.',
        'home':           'home\nResets position (canvas center) and heading (north) to 0.',
        'go':             'go n\nMoves n pixels in the current heading, drawing if the pen is down.',
        'goto':           'goto x, y\nMoves to absolute coordinates, drawing if the pen is down.',
        'place':          'place x, y\nJumps to absolute coordinates without ever drawing.',
        'turn':           'turn n\nIncreases heading by n degrees, clockwise.',
        'north':          'north\nResets heading to 0 (facing north) without moving.',
        'fill':           'fill "color"\nSets the fill color used by boxfilled/circlefilled/ellipsefilled.',
        'pen':            'pen "color"\nSets the line/pen color.',
        'size':           'size n\nSets the pen width in pixels.',
        'font':           'font "family" / font "family", size\nSets the font used by text.',
        'text':           'text "string"\nDraws a string at the current position.',
        'backcolor':      'backcolor "color"\nSets the canvas background color.',
        'box':            'box w, h\nDraws a rectangle, current position as the top-left corner.',
        'boxfilled':      'boxfilled w, h\nDraws a filled rectangle, current position as the top-left corner.',
        'circle':         'circle r\nDraws a circle of radius r, centered at the current position.',
        'circlefilled':   'circlefilled r\nDraws a filled circle of radius r, centered at the current position.',
        'ellipse':        'ellipse w, h\nDraws an ellipse w by h pixels, centered at the current position.',
        'ellipsefilled':  'ellipsefilled w, h\nDraws a filled ellipse, centered at the current position.',
        'drawbmp':        'drawbmp "file.bmp", x, y\nDraws an image at absolute coordinates x, y.',
    };

    // -----------------------------------------------------------------------
    // Builtin action hover documentation (spec §12)
    // -----------------------------------------------------------------------
    const LEOPARD_BUILTIN_DOCS = {
        'str':               'str(value) → string\nConverts a value to its string form.',
        'num':               'num(text) → number\nParses a number from a string.',
        'print':             'print value\nWrites a number, string, or true/false to the console, followed by a newline.',
        'notice':            'notice "text"\nShows an informational message dialog.',
        'confirm':           'confirm("text") → boolean\nShows a yes/no dialog, returns the choice.',
        'ask':               'ask("prompt") → string\nShows an input dialog, returns the entered text.',
        'beep':              'beep()\nPlays the system alert sound.',
        'date':              'date() → string\nReturns the current date.',
        'time':              'time() → string\nReturns the current time.',
        'write_file':        'write_file(path, text)\nWrites text to a file, overwriting it.',
        'append_file':       'append_file(path, text)\nAppends text to a file.',
        'read_file':         'read_file(path) → string\nReads a file\'s contents.',
        'delete_file':       'delete_file(path)\nDeletes a file.',
        'make_dir':          'make_dir(path)\nCreates a directory.',
        'remove_dir':        'remove_dir(path)\nRemoves a directory.',
        'file_exists':       'file_exists(path) → boolean\nChecks whether a file exists.',
        'open_file_dialog':  'open_file_dialog() → string\nShows an "open file" dialog, returns the chosen path.',
        'save_file_dialog':  'save_file_dialog() → string\nShows a "save file" dialog, returns the chosen path.',
        'color_dialog':      'color_dialog() → string\nShows a color-picker dialog, returns the chosen color.',
        'font_dialog':       'font_dialog() → string\nShows a font-picker dialog, returns the chosen font.',
        'open_url':          'open_url(url)\nOpens a URL in the default browser.',
        'open_email':        'open_email(address)\nOpens the default mail client addressed to address.',
        'run_program':       'run_program(cmd)\nRuns an external program.',
        'ascii':             'ascii(char) → number\nReturns the ASCII code of a character.',
        'set_cursor':        'set_cursor(style)\nSets the mouse cursor style.',
        'close_window':      'close_window()\nCloses the current window.',
        'maximize_window':   'maximize_window()\nMaximizes the current window.',
        'minimize_window':   'minimize_window()\nMinimizes the current window.',
        'play_sound':        'play_sound(path)\nPlays a sound file (e.g. .wav).',
        'stop_sound':        'stop_sound()\nStops any playing sound.',
        'play_music':        'play_music(path)\nPlays a music file (e.g. .mp3).',
        'stop_music':        'stop_music()\nStops any playing music.',
        'pause_music':       'pause_music()\nPauses the currently playing music.',
        'download_file':     'download_file(url, path)\nDownloads a URL to a local file.',
    };

    const pluginModule = {

        async activate(api) {
            console.log('[Leopard] Plugin activating...');

            const monaco = window.monaco;
            if (!monaco) {
                console.error('[Leopard] Monaco not available');
                return;
            }

            // -----------------------------------------------------------
            // 1. Register language
            // -----------------------------------------------------------
            monaco.languages.register({
                id: 'leopard',
                extensions: ['.lep'],
                aliases: ['Leopard'],
            });

            // -----------------------------------------------------------
            // 2. Monarch tokenizer
            // -----------------------------------------------------------
            monaco.languages.setMonarchTokensProvider('leopard', {
                tokenizer: {
                    root: [
                        // Comments (# to end of line)
                        [/#.*$/, 'comment'],

                        // Function declaration — capture the name as a function entity
                        [/\bfunction\s+([a-zA-Z_][a-zA-Z0-9_]*)/, ['keyword.control', 'entity.name.function']],

                        // Control-flow / block keywords
                        [/\b(if|elseif|else|while|for|to|step|break|continue|function|return)\b/, 'keyword.control'],

                        // Window / event / menu structure keywords
                        [/\b(window|text|graphics|menu|item|checkitem|submenu|separator|on|click|change|select|close|page|as|at)\b/, 'keyword'],

                        // Control declaration keywords
                        [/\b(textbox|textedit|label|button|bmpbutton|listbox|combobox|radiobutton|checkbox|groupbox)\b/, 'keyword'],

                        // Word-form logical/comparison operators
                        [/\b(and|or|not|eq)\b/, 'keyword.operator'],

                        // Literal-value keywords
                        [/\b(true|false)\b/, 'constant.language'],

                        // Turtle-graphics commands
                        [/\b(up|down|home|go|goto|place|turn|north|fill|pen|size|font|backcolor|box|boxfilled|circle|circlefilled|ellipse|ellipsefilled|drawbmp)\b/, 'support.function'],

                        // Builtin actions
                        [/\b(str|num|print|notice|confirm|ask|beep|date|time|write_file|append_file|read_file|delete_file|make_dir|remove_dir|file_exists|open_file_dialog|save_file_dialog|color_dialog|font_dialog|open_url|open_email|run_program|ascii|set_cursor|close_window|maximize_window|minimize_window|play_sound|stop_sound|play_music|stop_music|pause_music|download_file)\b/, 'support.function'],

                        // Strings
                        [/"([^"\\]|\\.)*$/, 'string.invalid'],
                        [/"/, 'string', '@string'],

                        // Numbers: decimal before integer
                        [/\d+\.\d+/, 'number.float'],
                        [/\d+/, 'number'],

                        // Property/member access (e.g. nameBox.text)
                        [/\.[a-zA-Z_][a-zA-Z0-9_]*/, 'attribute.name'],

                        // Two-character operators before single-character
                        [/<=|>=|<>/, 'operator'],
                        [/[+\-*/%^&=<>]/, 'operator'],

                        // Brackets (Leopard has no braces — only parens and square brackets)
                        [/[()[\]]/, '@brackets'],
                        [/[,:]/, 'delimiter'],

                        // Function calls (identifier followed directly by a paren)
                        [/[a-zA-Z_][a-zA-Z0-9_]*(?=\()/, 'entity.name.function'],

                        // Identifiers
                        [/[a-zA-Z_][a-zA-Z0-9_]*/, 'identifier'],

                        // Whitespace
                        [/\s+/, 'white'],
                    ],

                    string: [
                        [/[^\\"]+/, 'string'],
                        [/\\./, 'string.escape'],
                        [/"/, 'string', '@pop'],
                    ],
                }
            });

            // -----------------------------------------------------------
            // 3. Language configuration
            // -----------------------------------------------------------
            monaco.languages.setLanguageConfiguration('leopard', {
                comments: {
                    lineComment: '#',
                },
                brackets: [
                    ['(', ')'],
                    ['[', ']'],
                ],
                autoClosingPairs: [
                    { open: '(', close: ')' },
                    { open: '[', close: ']' },
                    { open: '"', close: '"', notIn: ['string'] },
                ],
                surroundingPairs: [
                    { open: '(', close: ')' },
                    { open: '[', close: ']' },
                    { open: '"', close: '"' },
                ],
                // Leopard has no end/wend/braces — a trailing ':' opens a block
                // and dedenting closes it, Python-style.
                indentationRules: {
                    increaseIndentPattern: /:\s*(#.*)?$/,
                    decreaseIndentPattern: /^\s*(elseif|else)\b/,
                },
            });

            // -----------------------------------------------------------
            // 4. Hover documentation for turtle commands and builtins
            // -----------------------------------------------------------
            const ALL_DOCS = Object.assign({}, LEOPARD_TURTLE_DOCS, LEOPARD_BUILTIN_DOCS);

            monaco.languages.registerHoverProvider('leopard', {
                provideHover(model, position) {
                    const word = model.getWordAtPosition(position);
                    if (!word) return null;

                    const doc = ALL_DOCS[word.word];
                    if (!doc) return null;

                    const lines = doc.split('\n');
                    const sig = lines[0];
                    const rest = lines.slice(1).join('\n');

                    return {
                        contents: [
                            { value: '```leopard\n' + sig + '\n```' },
                            rest ? { value: rest } : null,
                        ].filter(Boolean),
                    };
                }
            });

            console.log('[Leopard] Plugin activated — syntax highlighting ready');
            api.ui.showNotification('Leopard language support activated', 'success', 3000);
        },

        deactivate() {
            console.log('[Leopard] Plugin deactivated');
        }
    };

    // -----------------------------------------------------------------------
    // Register with MyCode plugin loader
    // -----------------------------------------------------------------------
    window.__MYCODE_PLUGINS__ = window.__MYCODE_PLUGINS__ || {};
    window.__MYCODE_PLUGINS__['mycode-leopard-language'] = pluginModule;

    const callbackName = '__plugin_mycode_leopard_language__';
    if (window[callbackName]) {
        window[callbackName](pluginModule);
    }

})();
