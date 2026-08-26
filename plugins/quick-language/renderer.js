/**
 * Quick Language Support Plugin for MyCode
 *
 * Provides:
 *   - Syntax highlighting for .qk files (Monaco Monarch tokenizer)
 *   - Hover documentation for built-in stdlib functions
 *   - Language configuration (comments, brackets, indentation rules)
 *
 * Quick is a fast, BASIC-vocabulary, indentation-structured, static-ish
 * language. Blocks use colon + Python-style indentation (no `end if` /
 * `wend` / braces at all), `rem` is the only comment form (a keyword, not
 * a symbol), `[ ]` is used for both array literals and indexing while
 * `( )` is reserved for calls only, and `&` is the dedicated string
 * concatenation operator (`+` is numeric-only). The language is
 * case-sensitive: keywords are lowercase, functions are PascalCase,
 * variables/constants are camelCase.
 */

(function () {

    // -----------------------------------------------------------------------
    // Built-in stdlib function hover documentation (LANGUAGE_REFERENCE.md)
    // -----------------------------------------------------------------------
    const QUICK_BUILTIN_DOCS = {
        // Core
        'print':       'print(value)\nWrites value followed by a newline.',
        'str':         'str(n) → string\nConverts a number to its string representation.',
        'reverse':     'reverse(s) → string\nReturns s reversed.',
        'abs':         'abs(n) → integer | float\nAbsolute value, same type in and out.',
        'array_fill':  'array_fill(count, value) → array\nA new count-length array with every slot set to value.',

        // Math
        'sqrt':        'sqrt(n) → float\nSquare root. Halts on a negative argument.',
        'isqrt':       'isqrt(n) → integer\nExact integer square root (floor(sqrt(n))), correct for the entire non-negative 64-bit range.',
        'floor':       'floor(n) → integer\nRounds toward negative infinity.',
        'ceil':        'ceil(n) → integer\nRounds toward positive infinity.',
        'round':       'round(n) → integer\nRounds to the nearest integer, half away from zero.',
        'log':         'log(n) → float\nNatural log. Halts on a non-positive argument.',
        'min':         'min(a, b) → T\nSmaller of two numbers (usual promotion) or two strings (lexicographic).',
        'max':         'max(a, b) → T\nLarger of two numbers (usual promotion) or two strings (lexicographic).',

        // Introspection / conversion
        'len':         'len(x) → integer\nByte length of a string, element count of an array, or key count of a dict.',
        'ord':         'ord(s) → integer\nByte value of a 1-character string. Halts if s isn\'t exactly one character.',
        'chr':         'chr(n) → string\nThe 1-character string for byte value n (0..255).',
        'parse_int':   'parse_int(s) → integer\nParses a base-10 integer. Halts on anything but an optional sign plus digits.',
        'parse_float': 'parse_float(s) → float\nParses a float. Halts on invalid or trailing text.',

        // Bitwise
        'bitand':      'bitand(a, b) → integer\nBitwise AND.',
        'bitor':       'bitor(a, b) → integer\nBitwise OR.',
        'bitxor':      'bitxor(a, b) → integer\nBitwise XOR.',
        'bitnot':      'bitnot(a) → integer\nBitwise complement (~a).',
        'shl':         'shl(a, n) → integer\nLeft shift. Halts if n isn\'t in 0..63.',
        'shr':         'shr(a, n) → integer\nArithmetic right shift. Halts if n isn\'t in 0..63.',

        // String / array / file
        'substring':   'substring(s, start, length) → string\nThe length-byte slice of s starting at start. Halts if out of bounds.',
        'sort':        'sort(arr)\nSorts arr in place, ascending. Every element must be the same comparable kind.',
        'read_file':   'read_file(path) → string\nReads a whole file into a string. Halts if it can\'t be opened.',
        'write_file':  'write_file(path, content)\nWrites content to path, creating or overwriting it.',

        // Dynamic array growth
        'push':        'push(arr, value)\nAppends value to the end, growing the array if needed.',
        'pop':         'pop(arr) → T\nRemoves and returns the last element. Halts if arr is empty.',
        'insert_at':   'insert_at(arr, index, value)\nInserts value at index, shifting later elements right.',
        'remove_at':   'remove_at(arr, index) → T\nRemoves and returns the element at index, shifting later elements left.',

        // Dicts
        'dict_new':    'dict_new() → dict\nA new, empty dict.',
        'dict_set':    'dict_set(d, key, value)\nSets key to value, inserting or overwriting.',
        'dict_get':    'dict_get(d, key) → T\nThe value stored at key. Halts if absent.',
        'dict_has':    'dict_has(d, key) → boolean\nWhether key is present.',
        'dict_remove': 'dict_remove(d, key)\nRemoves key if present; a no-op otherwise.',
        'dict_keys':   'dict_keys(d) → array\nEvery key, as an array (unspecified order).',
    };

    const pluginModule = {

        async activate(api) {
            console.log('[Quick] Plugin activating...');

            const monaco = window.monaco;
            if (!monaco) {
                console.error('[Quick] Monaco not available');
                return;
            }

            // -----------------------------------------------------------
            // 1. Register language
            // -----------------------------------------------------------
            monaco.languages.register({
                id: 'quick',
                extensions: ['.qk'],
                aliases: ['Quick'],
            });

            // -----------------------------------------------------------
            // 2. Monarch tokenizer
            // -----------------------------------------------------------
            monaco.languages.setMonarchTokensProvider('quick', {
                tokenizer: {
                    root: [
                        // Comments — `rem` is a keyword, not a symbol; runs to EOL
                        // and may appear whole-line or trailing.
                        [/\brem\b.*$/, 'comment'],

                        // Function declaration — capture the name as a function entity
                        [/\bfunction\s+([a-zA-Z_][a-zA-Z0-9_]*)/, ['keyword.control', 'entity.name.function']],

                        // Control-flow keywords
                        [/\b(if|elseif|else|while|for|to|step|each|in|break|continue|return|halt|function)\b/, 'keyword.control'],

                        // Declaration keywords
                        [/\b(dim|const|as|of)\b/, 'keyword'],

                        // Type keywords
                        [/\b(integer|float|string|boolean|array|dict)\b/, 'type'],

                        // Word-form logical operators
                        [/\b(and|or|not)\b/, 'keyword.operator'],

                        // Literal-value keywords
                        [/\b(true|false)\b/, 'constant.language'],

                        // Built-in stdlib functions
                        [/\b(print|str|reverse|abs|array_fill|sqrt|isqrt|floor|ceil|round|log|min|max|len|ord|chr|parse_int|parse_float|bitand|bitor|bitxor|bitnot|shl|shr|substring|sort|read_file|write_file|push|pop|insert_at|remove_at|dict_new|dict_set|dict_get|dict_has|dict_remove|dict_keys)\b/, 'support.function'],

                        // Strings — \n \t \" \\ are the only recognized escapes
                        [/"([^"\\]|\\.)*$/, 'string.invalid'],
                        [/"/, 'string', '@string'],

                        // Numbers: float before integer
                        [/\d+\.\d+/, 'number.float'],
                        [/\d+/, 'number'],

                        // Two/three-character operators before single-character
                        [/\/\/|==|<>|<=|>=/, 'operator'],
                        [/[+\-*/%^&=<>]/, 'operator'],

                        // Brackets — ( ) for calls only, [ ] for arrays/indexing
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
            monaco.languages.setLanguageConfiguration('quick', {
                comments: {
                    lineComment: 'rem ',
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
                // Quick has no end/wend/braces — a trailing ':' opens a block
                // and dedenting closes it, Python-style.
                indentationRules: {
                    increaseIndentPattern: /:\s*(rem\b.*)?$/,
                    decreaseIndentPattern: /^\s*(elseif|else)\b/,
                },
            });

            // -----------------------------------------------------------
            // 4. Hover documentation for built-in stdlib functions
            // -----------------------------------------------------------
            monaco.languages.registerHoverProvider('quick', {
                provideHover(model, position) {
                    const word = model.getWordAtPosition(position);
                    if (!word) return null;

                    const doc = QUICK_BUILTIN_DOCS[word.word];
                    if (!doc) return null;

                    const lines = doc.split('\n');
                    const sig = lines[0];
                    const rest = lines.slice(1).join('\n');

                    return {
                        contents: [
                            { value: '```quick\n' + sig + '\n```' },
                            rest ? { value: rest } : null,
                        ].filter(Boolean),
                    };
                }
            });

            console.log('[Quick] Plugin activated — syntax highlighting ready');
            api.ui.showNotification('Quick language support activated', 'success', 3000);
        },

        deactivate() {
            console.log('[Quick] Plugin deactivated');
        }
    };

    // -----------------------------------------------------------------------
    // Register with MyCode plugin loader
    // -----------------------------------------------------------------------
    window.__MYCODE_PLUGINS__ = window.__MYCODE_PLUGINS__ || {};
    window.__MYCODE_PLUGINS__['mycode-quick-language'] = pluginModule;

    const callbackName = '__plugin_mycode_quick_language__';
    if (window[callbackName]) {
        window[callbackName](pluginModule);
    }

})();
