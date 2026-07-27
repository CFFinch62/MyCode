/**
 * BARE Language Support Plugin for MyCode
 *
 * Provides:
 *   - Syntax highlighting for .bare files (Monaco Monarch tokenizer)
 *   - Hover documentation for builtin functions
 *   - Language configuration (comments, brackets, indentation rules)
 *
 * BARE is a minimal 11-keyword teaching language:
 *   print input if else end while sub return and or not
 * Literal keywords (true/false/null) are values, not keywords.
 * Blocks (if/while/sub) all close with a single "end" — no braces.
 */

(function () {

    // -----------------------------------------------------------------------
    // BARE builtin function hover documentation (spec §8)
    // -----------------------------------------------------------------------
    const BARE_DOCS = {
        'len':    'len(x) → num\nLength of a string or list.',
        'append': 'append(list, v) → list\nAppends value, returns the modified list.',
        'str':    'str(x) → str\nConverts any value to its string form.',
        'num':    'num(x) → num\nConverts a string to a number.',
        'random': 'random(min, max) → num\nRandom integer in [min, max] inclusive.',
        'round':  'round(x, decimals) → num\nRounds x to the given number of decimal places (half-up).',
        'time':   'time() → num\nSeconds elapsed since an arbitrary fixed point.\nOnly meaningful as a difference between two calls.',
        'input':  'input(prompt) → str\nPrints prompt, reads a line, returns it as a string.',
    };

    const pluginModule = {

        async activate(api) {
            console.log('[BARE] Plugin activating...');

            const monaco = window.monaco;
            if (!monaco) {
                console.error('[BARE] Monaco not available');
                return;
            }

            // -----------------------------------------------------------
            // 1. Register language
            // -----------------------------------------------------------
            monaco.languages.register({
                id: 'bare',
                extensions: ['.bare'],
                aliases: ['BARE', 'Bare'],
            });

            // -----------------------------------------------------------
            // 2. Monarch tokenizer
            // -----------------------------------------------------------
            monaco.languages.setMonarchTokensProvider('bare', {
                tokenizer: {
                    root: [
                        // Comments (# to end of line)
                        [/#.*$/, 'comment'],

                        // Sub declaration — capture the name as a function entity
                        [/\bsub\s+([a-zA-Z_][a-zA-Z0-9_]*)/, ['keyword.control', 'entity.name.function']],

                        // Reserved words (11 total)
                        [/\b(print|input|if|else|end|while|sub|return)\b/, 'keyword.control'],
                        [/\b(and|or|not)\b/, 'keyword.operator'],

                        // Literal-value keywords
                        [/\b(true|false|null)\b/, 'constant.language'],

                        // Builtin functions (spec §8)
                        [/\b(len|append|str|num|random|round|time)\b/, 'support.function'],

                        // Strings
                        [/"([^"\\]|\\.)*$/, 'string.invalid'],
                        [/"/, 'string', '@string'],

                        // Numbers: decimal before integer
                        [/\d+\.\d+/, 'number.float'],
                        [/\d+/, 'number'],

                        // Two-character operators before single-character
                        [/==|!=|<=|>=/, 'operator'],
                        [/[+\-*/%^<>=]/, 'operator'],

                        // Brackets (BARE has no braces — only parens and square brackets)
                        [/[()[\]]/, '@brackets'],
                        [/,/, 'delimiter'],

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
            monaco.languages.setLanguageConfiguration('bare', {
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
                indentationRules: {
                    increaseIndentPattern: /^\s*(if|while|sub|else)\b/,
                    decreaseIndentPattern: /^\s*(else|end)\b/,
                },
            });

            // -----------------------------------------------------------
            // 4. Hover documentation for builtins
            // -----------------------------------------------------------
            monaco.languages.registerHoverProvider('bare', {
                provideHover(model, position) {
                    const word = model.getWordAtPosition(position);
                    if (!word) return null;

                    const doc = BARE_DOCS[word.word];
                    if (!doc) return null;

                    const lines = doc.split('\n');
                    const sig = lines[0];
                    const rest = lines.slice(1).join('\n');

                    return {
                        contents: [
                            { value: '```bare\n' + sig + '\n```' },
                            rest ? { value: rest } : null,
                        ].filter(Boolean),
                    };
                }
            });

            console.log('[BARE] Plugin activated — syntax highlighting ready');
            api.ui.showNotification('BARE language support activated', 'success', 3000);
        },

        deactivate() {
            console.log('[BARE] Plugin deactivated');
        }
    };

    // -----------------------------------------------------------------------
    // Register with MyCode plugin loader
    // -----------------------------------------------------------------------
    window.__MYCODE_PLUGINS__ = window.__MYCODE_PLUGINS__ || {};
    window.__MYCODE_PLUGINS__['mycode-bare-language'] = pluginModule;

    const callbackName = '__plugin_mycode_bare_language__';
    if (window[callbackName]) {
        window[callbackName](pluginModule);
    }

})();
