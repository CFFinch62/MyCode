/**
 * Steps Language Support Plugin for MyCode
 * Adds syntax highlighting for .building, .floor, and .step files
 */

(function () {
    const pluginModule = {
        activate(api) {
            console.log('[Steps] Plugin activated!');

            // Access Monaco Editor
            const monaco = window.monaco;

            if (!monaco) {
                console.error('[Steps] Monaco Editor not available');
                return;
            }

            // 1. Register the language
            monaco.languages.register({
                id: 'steps',
                extensions: ['.building', '.floor', '.step'],
                aliases: ['Steps', 'STEPS'],
            });

            // 2. Define tokenization rules using Monarch
            monaco.languages.setMonarchTokensProvider('steps', {
                // Keywords categorized by type
                structureKeywords: [
                    'building', 'floor', 'step', 'riser',
                    'belongs to', 'expects', 'returns', 'declare', 'do', 'exit'
                ],

                variableKeywords: [
                    'as', 'fixed', 'set', 'to'
                ],

                invocationKeywords: [
                    'call', 'with', 'storing result in', 'return', 'display', 'input'
                ],

                controlFlowKeywords: [
                    'if', 'otherwise if', 'otherwise',
                    'repeat', 'times', 'for each', 'in', 'while'
                ],

                errorHandlingKeywords: [
                    'attempt', 'if unsuccessful', 'then continue', 'problem_message'
                ],

                types: [
                    'number', 'text', 'boolean', 'list', 'table'
                ],

                operators: [
                    'is equal to', 'equals', 'is not equal to',
                    'is less than', 'is greater than',
                    'is less than or equal to', 'is greater than or equal to',
                    'and', 'or', 'not',
                    'added to', 'split by', 'character at', 'length of',
                    'contains', 'starts with', 'ends with',
                    'add', 'to', 'remove', 'from', 'is in'
                ],

                constants: ['nothing', 'true', 'false'],

                // Tokenizer rules
                tokenizer: {
                    root: [
                        // Comments
                        [/note block:/, 'comment', '@comment_block'],
                        [/note:.*$/, 'comment'],

                        // Structure keywords (building:, floor:, step:, etc.)
                        [/\b(building|floor|step|riser)\s*:/, 'keyword.structure'],
                        [/\b(belongs to|expects|returns|declare|do|exit)\s*:?/, 'keyword.structure'],

                        // Control flow
                        [/\b(if|otherwise if|otherwise|repeat|times|for each|in|while)\b/, 'keyword.control'],

                        // Error handling
                        [/\b(attempt|if unsuccessful|then continue)\s*:?/, 'keyword.control'],
                        [/\bproblem_message\b/, 'variable.predefined'],

                        // Invocation keywords
                        [/\b(call|with|storing result in|return|display|input)\b/, 'keyword'],

                        // Variable keywords
                        [/\b(as|fixed|set|to)\b/, 'keyword'],

                        // Types
                        [/\b(number|text|boolean|list|table)\b/, 'type'],

                        // Constants
                        [/\b(nothing|true|false)\b/, 'constant.language'],

                        // Multi-word operators (must come before single words)
                        [/\b(is equal to|is not equal to|is less than or equal to|is greater than or equal to|is less than|is greater than)\b/, 'operator'],
                        [/\b(added to|split by|character at|length of|starts with|ends with|is in)\b/, 'operator'],
                        [/\b(add|remove|from|contains)\b/, 'operator'],
                        [/\b(and|or|not|equals)\b/, 'operator'],

                        // Strings
                        [/"([^"\\]|\\.)*$/, 'string.invalid'],
                        [/"/, 'string', '@string'],

                        // Numbers
                        [/\d+\.\d+/, 'number.float'],
                        [/\d+/, 'number'],

                        // Math operators
                        [/[+\-*/]/, 'operator'],

                        // Brackets and delimiters
                        [/[\[\]()]/, '@brackets'],
                        [/[,:]/, 'delimiter'],

                        // Identifiers
                        [/[a-zA-Z_][a-zA-Z0-9_]*/, 'identifier'],
                    ],

                    string: [
                        [/[^\\"]+/, 'string'],
                        [/\\./, 'string.escape'],
                        [/"/, 'string', '@pop']
                    ],

                    comment_block: [
                        [/end note/, 'comment', '@pop'],
                        [/.*/, 'comment']
                    ]
                }
            });

            // 3. Configure language features
            monaco.languages.setLanguageConfiguration('steps', {
                comments: {
                    lineComment: 'note:',
                    blockComment: ['note block:', 'end note']
                },
                brackets: [
                    ['[', ']'],
                    ['(', ')']
                ],
                autoClosingPairs: [
                    { open: '[', close: ']' },
                    { open: '(', close: ')' },
                    { open: '"', close: '"', notIn: ['string'] }
                ],
                surroundingPairs: [
                    { open: '[', close: ']' },
                    { open: '(', close: ')' },
                    { open: '"', close: '"' }
                ],
                indentationRules: {
                    increaseIndentPattern: /^.*:\s*$/,
                    decreaseIndentPattern: /^\s*(otherwise|if unsuccessful|then continue|end note).*$/
                }
            });

            console.log('[Steps] Language registered successfully');
            api.ui.showNotification('Steps language support activated!', 'success', 3000);
        },

        deactivate() {
            console.log('[Steps] Plugin deactivated');
        }
    };

    // Register the plugin globally
    window.__MYCODE_PLUGINS__ = window.__MYCODE_PLUGINS__ || {};
    window.__MYCODE_PLUGINS__['mycode-steps-language'] = pluginModule;

    // Also register via callback if loader is waiting
    const callbackName = '__plugin_mycode_steps_language__';
    if (window[callbackName]) {
        window[callbackName](pluginModule);
    }
})();
