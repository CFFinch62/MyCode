/**
 * BEAM Language Support Plugin for MyCode
 *
 * Provides:
 *   - Syntax highlighting for .bas / .yab files (Monaco Monarch tokenizer)
 *   - Hover documentation for all beam_* commands
 *   - Language configuration (comments, brackets, indentation rules)
 *
 * Running BEAM programs is handled by the mycode-runner plugin.
 *
 * Fragillidae Software — BEAM v2.0.0
 */

(function () {

    // -----------------------------------------------------------------------
    // BEAM command hover documentation
    // -----------------------------------------------------------------------
    const BEAM_DOCS = {
        'beam_open':        'beam_open(w, h, title$) → num\nOpen a window. Returns an integer handle.\nMust be called before any widget commands.',
        'beam_close':       'beam_close(win)\nClose window and free all resources.',
        'beam_title':       'beam_title(win, title$)\nUpdate the window title bar text at runtime.',
        'beam_size':        'beam_size(win, w, h)\nResize the window programmatically.',
        'beam_running':     'beam_running(win) → num\nReturns 1 if window is open, 0 if closed.\nUse as the condition of the main while loop.',
        'beam_begin':       'beam_begin(win)\nBegin a new GUI frame. Call once per loop iteration\nbefore any widget or layout commands.',
        'beam_end':         'beam_end(win)\nEnd the frame, render all widgets, and present.\nCall once per loop iteration after all widgets.',
        'beam_button':      'beam_button(label$, w, h) → num\nRender a button. Returns 1 if clicked this frame.',
        'beam_label':       'beam_label(text$)\nRender a static text label.',
        'beam_text':        'beam_text(text$, w, h)\nRender a multi-line word-wrapped text block.',
        'beam_input':       'beam_input(buf$, maxlen, w) → num\nSingle-line text input field.\nReturns 1 if the content changed this frame.',
        'beam_checkbox':    'beam_checkbox(label$, checked) → num\nRender a checkbox. Returns 1 if checked, 0 if not.',
        'beam_combo':       'beam_combo(items$, count, sel, w, h) → num\nDropdown combo box. items$ is newline-delimited.\nReturns the selected index.',
        'beam_slider':      'beam_slider(val, min, max, step, w) → num\nHorizontal slider. Returns the current value.',
        'beam_progress':    'beam_progress(val, max, w, h)\nRender a progress bar. No return value.',
        'beam_separator':   'beam_separator()\nDraw a horizontal dividing line.',
        'beam_spacing':     'beam_spacing(px)\nAdd vertical whitespace of px pixels.',
        'beam_image':       'beam_image(path$, w, h)\nDisplay a BMP image from file path.',
        'beam_row':         'beam_row(h, cols)\nBegin a row layout: h = height in pixels,\ncols = number of columns side by side.',
        'beam_row_end':     'beam_row_end()\nEnd the current row layout, return to vertical flow.',
        'beam_group_begin': 'beam_group_begin(title$)\nBegin a named group box (bordered panel with title).',
        'beam_group_end':   'beam_group_end()\nEnd the current group box.',
        'beam_panel_begin': 'beam_panel_begin(title$, w, h)\nBegin a scrollable panel.',
        'beam_panel_end':   'beam_panel_end()\nEnd the current scrollable panel.',
        'beam_msgbox':      'beam_msgbox(title$, msg$) → num\nShow a modal message box. Returns 1 when dismissed.',
        'beam_confirm':     'beam_confirm(title$, msg$) → num\nShow a Yes/No dialog. Returns 1 = Yes, 0 = No.',
        'beam_open_file':   'beam_open_file(filter$) → str\nShow a file-open dialog. Returns selected path or "".',
        'beam_save_file':   'beam_save_file(filter$) → str\nShow a file-save dialog. Returns chosen path or "".',
        'beam_set_color':   'beam_set_color(r, g, b)\nSet foreground accent colour (0–255 each channel).',
        'beam_set_style':   'beam_set_style(name$)\nSwitch Nuklear theme. name$ = "dark" | "white" | "amber".',
        'beam_time':        'beam_time() → num\nReturns elapsed milliseconds since program start.',
        'beam_sleep':       'beam_sleep(ms)\nPause execution for ms milliseconds.',
    };

    // -----------------------------------------------------------------------
    // Main plugin module
    // -----------------------------------------------------------------------
    const pluginModule = {

        async activate(api) {
            console.log('[BEAM] Plugin activating...');

            const monaco = window.monaco;
            if (!monaco) {
                console.error('[BEAM] Monaco not available');
                return;
            }

            // -----------------------------------------------------------
            // 1. Register language
            // -----------------------------------------------------------
            monaco.languages.register({
                id: 'beam',
                extensions: ['.yab'],
                aliases: ['BEAM', 'Beam', 'yabasic'],
            });

            // -----------------------------------------------------------
            // 2. Monarch tokenizer
            // -----------------------------------------------------------
            monaco.languages.setMonarchTokensProvider('beam', {

                // BASIC core keywords
                basicKeywords: [
                    'if', 'then', 'else', 'endif', 'end',
                    'while', 'wend',
                    'for', 'to', 'step', 'next',
                    'do', 'loop', 'until',
                    'goto', 'gosub', 'return',
                    'sub', 'endsub',
                    'print', 'input',
                    'let', 'dim',
                    'data', 'read', 'restore',
                    'import', 'export',
                    'local', 'global',
                    'break', 'continue',
                    'switch', 'case', 'default',
                    'on', 'error',
                    'open', 'close', 'write',
                ],

                // BEAM GUI commands — all from Section 3
                beamCommands: [
                    'beam_open', 'beam_close', 'beam_title', 'beam_size',
                    'beam_running', 'beam_begin', 'beam_end',
                    'beam_button', 'beam_label', 'beam_text', 'beam_input',
                    'beam_checkbox', 'beam_combo', 'beam_slider',
                    'beam_progress', 'beam_separator', 'beam_spacing', 'beam_image',
                    'beam_row', 'beam_row_end',
                    'beam_group_begin', 'beam_group_end',
                    'beam_panel_begin', 'beam_panel_end',
                    'beam_msgbox', 'beam_confirm',
                    'beam_open_file', 'beam_save_file',
                    'beam_set_color', 'beam_set_style',
                    'beam_time', 'beam_sleep',
                ],

                // Built-in BASIC/yabasic functions
                builtins: [
                    'str', 'val', 'chr', 'asc', 'len', 'mid', 'left', 'right',
                    'instr', 'upper', 'lower', 'trim', 'ltrim', 'rtrim',
                    'space', 'string', 'abs', 'int', 'sqr', 'sin', 'cos',
                    'tan', 'atn', 'exp', 'log', 'rnd', 'max', 'min',
                    'peek', 'poke', 'system',
                ],

                tokenizer: {
                    root: [
                        // Single-quote comment to end of line
                        [/'[^\n]*/, 'comment'],

                        // rem comment
                        [/\brem\b[^\n]*/, 'comment'],

                        // BEAM commands (must come before plain identifier rule)
                        [/\bbeam_[a-z_]+\b/, {
                            cases: {
                                '@beamCommands': 'keyword.beam',
                                '@default':      'identifier'
                            }
                        }],

                        // BASIC keywords (multi-word handled via two passes)
                        [/\bend\s+if\b/i,  'keyword.control'],
                        [/\bend\s+sub\b/i, 'keyword'],
                        [/\b(if|then|else|end|while|wend|for|to|step|next|do|loop|until|goto|gosub|return|sub|print|input|let|dim|data|read|restore|import|export|local|global|break|continue|switch|case|default|on|error|open|close|write)\b/i, 'keyword.control'],

                        // Logical operators as keywords
                        [/\b(and|or|not)\b/i, 'keyword.operator'],

                        // Built-in functions (with optional $ suffix)
                        [/\b(str|val|chr|asc|len|mid|left|right|instr|upper|lower|trim|ltrim|rtrim|space|string|abs|int|sqr|sin|cos|tan|atn|exp|log|rnd|max|min|peek|poke|system)\$?\b/,
                            'support.function'],

                        // Strings
                        [/"([^"\\]|\\.)*"/, 'string'],
                        [/"[^"]*$/,         'string.invalid'],

                        // Numbers: float before integer
                        [/\d+\.\d+([eE][+-]?\d+)?/, 'number.float'],
                        [/\d+([eE][+-]?\d+)?/,       'number'],

                        // Hex literals
                        [/0x[0-9a-fA-F]+/, 'number.hex'],

                        // String variable names (identifier ending with $)
                        [/[a-zA-Z_][a-zA-Z0-9_]*\$/, 'variable.string'],

                        // Regular identifiers
                        [/[a-zA-Z_][a-zA-Z0-9_]*/, 'identifier'],

                        // Operators
                        [/[<>]=?|<>|[+\-*\/^=]/, 'operator'],

                        // Brackets and delimiters
                        [/[()[\]]/, '@brackets'],
                        [/[,;]/, 'delimiter'],

                        // Whitespace
                        [/\s+/, 'white'],
                    ]
                }
            });

            // -----------------------------------------------------------
            // 3. Language configuration
            // -----------------------------------------------------------
            monaco.languages.setLanguageConfiguration('beam', {
                comments: {
                    lineComment: "'",
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
                indentationRules: {
                    increaseIndentPattern: /^\s*(if\b.*then\s*$|while\b|for\b|do\b|sub\b)/i,
                    decreaseIndentPattern: /^\s*(else\b|end\s*if\b|wend\b|next\b|loop\b|end\s*sub\b)/i,
                },
            });

            // -----------------------------------------------------------
            // 4. Hover documentation for beam_* commands
            // -----------------------------------------------------------
            monaco.languages.registerHoverProvider('beam', {
                provideHover(model, position) {
                    const word = model.getWordAtPosition(position);
                    if (!word) return null;

                    const lineContent = model.getLineContent(position.lineNumber);
                    const start = word.startColumn - 1;
                    const tokenMatch = lineContent.slice(Math.max(0, start - 10))
                        .match(/beam_[a-z_]+/);
                    const token = tokenMatch ? tokenMatch[0] : word.word;

                    const doc = BEAM_DOCS[token];
                    if (!doc) return null;

                    const lines = doc.split('\n');
                    const sig   = lines[0];
                    const rest  = lines.slice(1).join('\n');

                    return {
                        contents: [
                            { value: '```beam\n' + sig + '\n```' },
                            rest ? { value: rest } : null,
                        ].filter(Boolean),
                    };
                }
            });

            console.log('[BEAM] Plugin activated — syntax highlighting ready');
            api.ui.showNotification('BEAM language support activated', 'success', 3000);
        },

        deactivate() {
            console.log('[BEAM] Plugin deactivated');
        }
    };

    // -----------------------------------------------------------------------
    // Register with MyCode plugin loader
    // -----------------------------------------------------------------------
    window.__MYCODE_PLUGINS__ = window.__MYCODE_PLUGINS__ || {};
    window.__MYCODE_PLUGINS__['mycode-beam-language'] = pluginModule;

    const callbackName = '__plugin_mycode_beam_language__';
    if (window[callbackName]) {
        window[callbackName](pluginModule);
    }

})();
