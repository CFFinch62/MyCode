/**
 * PLAIN Language Support Plugin for MyCode
 * Adds syntax highlighting for .plain files
 */

(function () {
    const pluginModule = {
        activate(api) {
            console.log('[PLAIN] Plugin activated!');

            // Access Monaco Editor
            const monaco = window.monaco;

            if (!monaco) {
                console.error('[PLAIN] Monaco Editor not available');
                return;
            }

            // 1. Register the language
            monaco.languages.register({
                id: 'plain',
                extensions: ['.plain'],
                aliases: ['PLAIN', 'Plain'],
            });

            // 2. Define tokenization rules using Monarch
            monaco.languages.setMonarchTokensProvider('plain', {
                // Keywords categorized by type
                declarationKeywords: [
                    'task', 'using', 'var', 'fxd', 'as', 'record'
                ],

                controlFlowKeywords: [
                    'if', 'else', 'loop', 'from', 'to', 'step', 'in',
                    'choose', 'choice', 'default'
                ],

                errorHandlingKeywords: [
                    'attempt', 'handle', 'ensure', 'abort'
                ],

                functionKeywords: [
                    'deliver', 'exit', 'continue'
                ],

                types: [
                    'integer', 'float', 'string', 'boolean', 'list', 'table', 'of'
                ],

                typePrefixes: [
                    'int', 'flt', 'str', 'bln', 'lst', 'tbl'
                ],

                constants: ['null', 'true', 'false'],

                operators: [
                    '==', '!=', '<=', '>=', '<', '>',
                    '+', '-', '*', '/', '//', '%', '**',
                    '&', 'and', 'or', 'not',
                    '=', '+=', '-=', '*=', '/=', '%=', '&='
                ],

                // Tokenizer rules
                tokenizer: {
                    root: [
                        // Comments (must come before keywords)
                        [/rem:.*$/, 'comment'],
                        [/note:.*$/, 'comment'],

                        // Task declaration with optional 'using'
                        [/\btask\s+([A-Z][a-zA-Z0-9_]*)/, ['keyword', 'entity.name.function']],

                        // Record declaration
                        [/\brecord\s+([A-Z][a-zA-Z0-9_]*)/, ['keyword', 'entity.name.type']],

                        // Declaration keywords
                        [/\b(var|fxd|as|using|of)\b/, 'keyword'],

                        // Control flow
                        [/\b(if|else|loop|from|to|step|in|choose|choice|default)\b/, 'keyword.control'],

                        // Error handling
                        [/\b(attempt|handle|ensure|abort)\b/, 'keyword.control'],

                        // Function keywords
                        [/\b(deliver|exit|continue)\b/, 'keyword.control'],

                        // Types
                        [/\b(integer|float|string|boolean|list|table)\b/, 'type'],

                        // Constants
                        [/\b(null|true|false)\b/, 'constant.language'],

                        // Interpolated strings (v"...")
                        [/v"/, 'string.interpolated', '@interpolated_string'],

                        // Regular strings
                        [/"([^"\\]|\\.)*$/, 'string.invalid'],
                        [/"/, 'string', '@string'],

                        // Numbers (float before integer to match decimals first)
                        [/\d+\.\d+/, 'number.float'],
                        [/\d+/, 'number'],

                        // Operators (multi-char before single-char)
                        [/==|!=|<=|>=|\*\*|\/\/|\+=|-=|\*=|\/=|%=|&=/, 'operator'],
                        [/[+\-*\/%<>=&]/, 'operator'],
                        [/\b(and|or|not)\b/, 'operator'],

                        // Type-prefixed identifiers (intCount, strName, etc.)
                        [/\b(int|flt|str|bln|lst|tbl)[A-Z][a-zA-Z0-9_]*\b/, 'variable.prefixed'],

                        // Function calls (PascalCase followed by parenthesis)
                        [/\b[A-Z][a-zA-Z0-9_]*(?=\()/, 'entity.name.function'],

                        // Brackets and delimiters
                        [/[\[\](){}]/, '@brackets'],
                        [/[,:.']/, 'delimiter'],

                        // Identifiers
                        [/[a-zA-Z_][a-zA-Z0-9_]*/, 'identifier'],
                    ],

                    string: [
                        [/[^\\"]+/, 'string'],
                        [/\\./, 'string.escape'],
                        [/"/, 'string', '@pop']
                    ],

                    interpolated_string: [
                        [/[^\\"{]+/, 'string.interpolated'],
                        [/\{/, 'delimiter.interpolated', '@interpolated_expr'],
                        [/\\./, 'string.escape'],
                        [/"/, 'string.interpolated', '@pop']
                    ],

                    interpolated_expr: [
                        [/[^}]+/, 'variable'],
                        [/\}/, 'delimiter.interpolated', '@pop']
                    ]
                }
            });

            // 3. Configure language features
            monaco.languages.setLanguageConfiguration('plain', {
                comments: {
                    lineComment: 'rem:',
                },
                brackets: [
                    ['[', ']'],
                    ['(', ')'],
                    ['{', '}']
                ],
                autoClosingPairs: [
                    { open: '[', close: ']' },
                    { open: '(', close: ')' },
                    { open: '{', close: '}' },
                    { open: '"', close: '"', notIn: ['string'] }
                ],
                surroundingPairs: [
                    { open: '[', close: ']' },
                    { open: '(', close: ')' },
                    { open: '{', close: '}' },
                    { open: '"', close: '"' }
                ],
                indentationRules: {
                    increaseIndentPattern: /^.*(task|if|else|loop|choose|choice|default|attempt|handle|ensure|record).*$/,
                    decreaseIndentPattern: /^\s*(else|choice|default|handle|ensure).*$/
                },
                onEnterRules: [
                    {
                        // Auto-indent after task, if, loop, etc.
                        beforeText: /^.*(task|if|else|loop|choose|choice|default|attempt|handle|ensure|record).*$/,
                        action: { indentAction: monaco.languages.IndentAction.Indent }
                    }
                ]
            });

            console.log('[PLAIN] Language registered successfully');
            api.ui.showNotification('PLAIN language support activated!', 'success', 3000);
        },

        deactivate() {
            console.log('[PLAIN] Plugin deactivated');
        }
    };

    // Register the plugin globally
    window.__MYCODE_PLUGINS__ = window.__MYCODE_PLUGINS__ || {};
    window.__MYCODE_PLUGINS__['mycode-plain-language'] = pluginModule;

    // Also register via callback if loader is waiting
    const callbackName = '__plugin_mycode_plain_language__';
    if (window[callbackName]) {
        window[callbackName](pluginModule);
    }
})();
