/**
 * FragBASIC Language Support Plugin for MyCode
 *
 * Provides:
 *   - Syntax highlighting for .bas files (Monaco Monarch tokenizer)
 *   - Hover documentation for builtin functions
 *   - Language configuration (comments, brackets, indentation rules)
 *
 * FragBASIC is a QBasic-compatible educational BASIC dialect. It is
 * case-insensitive throughout (source lexer normalizes keywords via
 * `.upper()`), supports classic BASIC line-leading `'` comments and
 * REM statements, and DIM/TYPE/SELECT CASE style QBasic syntax.
 *
 * Note: FragBASIC also uses the ".bas" extension, same as the
 * mycode-beam-language plugin's yabasic dialect used to. Since MyCode
 * resolves a file extension to whichever language Monaco saw first,
 * beam-language was updated to claim only ".yab" so FragBASIC can
 * own ".bas" without ambiguity.
 */

(function () {

    // -----------------------------------------------------------------------
    // FragBASIC builtin function hover documentation
    // (signatures verified against interpreter_functions.py)
    // -----------------------------------------------------------------------
    const FRAGBASIC_DOCS = {
        'ABS':     'ABS(n)\nAbsolute value of n.',
        'SQR':     'SQR(n)\nSquare root of n.',
        'SIN':     'SIN(n)\nSine of n (radians).',
        'COS':     'COS(n)\nCosine of n (radians).',
        'TAN':     'TAN(n)\nTangent of n (radians).',
        'ATN':     'ATN(n)\nArctangent of n (radians).',
        'EXP':     'EXP(n)\ne raised to the power n.',
        'LOG':     'LOG(n)\nNatural logarithm of n.',
        'INT':     'INT(n)\nRounds down to the nearest integer (floor).',
        'FIX':     'FIX(n)\nTruncates toward zero (drops the fractional part).',
        'SGN':     'SGN(n)\nSign of n: -1, 0, or 1.',
        'RND':     'RND\nRandom value in [0, 1). Called without parentheses.',
        'LEN':     'LEN(s$)\nLength of a string.',
        'LEFT$':   'LEFT$(s$, n)\nLeftmost n characters of s$.',
        'RIGHT$':  'RIGHT$(s$, n)\nRightmost n characters of s$.',
        'MID$':    'MID$(s$, start [, len])\nSubstring of s$ starting at the 1-based start position.',
        'CHR$':    'CHR$(n)\nCharacter for ASCII code n.',
        'ASC':     'ASC(s$)\nASCII code of the first character of s$.',
        'STR$':    'STR$(n)\nString form of a number (leading space if non-negative).',
        'VAL':     'VAL(s$)\nParses a number from the start of a string.',
        'SPACE$':  'SPACE$(n)\nA string of n spaces.',
        'STRING$': 'STRING$(n, c)\nn repetitions of character c.',
        'INSTR':   'INSTR([start,] s$, sub$)\n1-based position of sub$ within s$ (0 if not found).',
        'UCASE$':  'UCASE$(s$)\nConverts to uppercase.',
        'LCASE$':  'LCASE$(s$)\nConverts to lowercase.',
        'LTRIM$':  'LTRIM$(s$)\nRemoves leading spaces.',
        'RTRIM$':  'RTRIM$(s$)\nRemoves trailing spaces.',
        'CINT':    'CINT(n)\nConverts to integer, rounding to the nearest whole number.',
        'CLNG':    'CLNG(n)\nConverts to a long integer, truncating.',
        'CSNG':    'CSNG(n)\nConverts to single precision.',
        'CDBL':    'CDBL(n)\nConverts to double precision.',
        'DATE$':   'DATE$\nCurrent date as MM-DD-YYYY. Called without parentheses.',
        'TIME$':   'TIME$\nCurrent time as HH:MM:SS. Called without parentheses.',
        'TIMER':   'TIMER\nSeconds elapsed since midnight. Called without parentheses.',
        'INKEY$':  'INKEY$\nReads one pending key, or "" if none available. Called without parentheses.',
    };

    const pluginModule = {

        async activate(api) {
            console.log('[FragBASIC] Plugin activating...');

            const monaco = window.monaco;
            if (!monaco) {
                console.error('[FragBASIC] Monaco not available');
                return;
            }

            // -----------------------------------------------------------
            // 1. Register language
            // -----------------------------------------------------------
            monaco.languages.register({
                id: 'fragbasic',
                extensions: ['.bas'],
                aliases: ['FragBASIC', 'Fragbasic', 'QBasic'],
            });

            // -----------------------------------------------------------
            // 2. Monarch tokenizer
            // -----------------------------------------------------------
            monaco.languages.setMonarchTokensProvider('fragbasic', {
                ignoreCase: true,

                tokenizer: {
                    root: [
                        // Comments: a leading-apostrophe line, or REM anywhere on the line
                        [/^\s*'.*$/, 'comment'],
                        [/\bREM\b.*$/i, 'comment'],

                        // Strings — double-quoted (standard) and single-quoted (QB64
                        // extension; only a comment when the ' is the first token on
                        // the line, handled by the rule above)
                        [/"[^"\n]*"/, 'string'],
                        [/"[^"\n]*$/, 'string.invalid'],
                        [/'[^'\n]*'/, 'string'],

                        // Numbers: float before integer, with type suffixes ! # %
                        [/\d+\.\d+[!#%]?/, 'number.float'],
                        [/\d+[!#%]?/, 'number'],

                        // Builtin functions (spec'd in interpreter_functions.py) —
                        // must come before the plain identifier rule, and before the
                        // bare "STRING" type-name rule so "STRING$" matches whole.
                        [/\b(ABS|SQR|SIN|COS|TAN|ATN|EXP|LOG|INT|FIX|SGN|RND|LEN|LEFT\$|RIGHT\$|MID\$|CHR\$|ASC|STR\$|VAL|SPACE\$|STRING\$|INSTR|UCASE\$|LCASE\$|LTRIM\$|RTRIM\$|CINT|CLNG|CSNG|CDBL|DATE\$|TIME\$|TIMER|INKEY\$)\b/i, 'support.function'],

                        // Control flow
                        [/\b(IF|THEN|ELSEIF|ELSE|END|WHILE|WEND|DO|LOOP|UNTIL|FOR|TO|STEP|NEXT|GOSUB|RETURN|EXIT|SELECT|CASE)\b/i, 'keyword.control'],

                        // Declarations
                        [/\b(DIM|LET|DATA|READ|RESTORE|SUB|FUNCTION|SHARED|STATIC|CONST|TYPE|OPTION|BASE|DEFINT|DEFLNG|DEFSNG|DEFDBL|DEFSTR|AS|CALL|RANDOMIZE|SLEEP)\b/i, 'keyword'],

                        // Statement keywords
                        [/\b(PRINT|INPUT)\b/i, 'keyword'],

                        // Type names
                        [/\b(INTEGER|LONG|SINGLE|DOUBLE|STRING)\b/i, 'type'],

                        // Word-form logical/arithmetic operators
                        [/\b(AND|OR|NOT|XOR|EQV|IMP|MOD)\b/i, 'keyword.operator'],

                        // Two-character operators before single-character
                        [/<=|>=|<>/, 'operator'],
                        [/[+\-*/\\^=<>]/, 'operator'],

                        // Brackets (square brackets are lexed but unused by the
                        // grammar today — kept for bracket-matching convenience)
                        [/[()[\]]/, '@brackets'],

                        // Delimiters — colon is the BASIC statement separator
                        [/[,;:]/, 'delimiter'],

                        // Identifiers, with optional trailing type sigil $ ! # %
                        [/[a-zA-Z_][a-zA-Z0-9_]*[$!#%]?/, 'identifier'],

                        // Whitespace
                        [/\s+/, 'white'],
                    ],
                }
            });

            // -----------------------------------------------------------
            // 3. Language configuration
            // -----------------------------------------------------------
            monaco.languages.setLanguageConfiguration('fragbasic', {
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
                    increaseIndentPattern: /^\s*(if\b.*then\s*$|while\b|for\b|do\b|sub\b|function\b|select\b|type\b)/i,
                    decreaseIndentPattern: /^\s*(else\b|elseif\b|end\s*if\b|wend\b|next\b|loop\b|end\s*sub\b|end\s*function\b|end\s*select\b|end\s*type\b|case\b)/i,
                },
                // Include trailing type sigils ($ ! # %) so double-click and hover
                // select e.g. "LEFT$" or "total!" as a single word, not split.
                wordPattern: /[a-zA-Z_][a-zA-Z0-9_]*[$!#%]?/,
            });

            // -----------------------------------------------------------
            // 4. Hover documentation for builtins
            // -----------------------------------------------------------
            monaco.languages.registerHoverProvider('fragbasic', {
                provideHover(model, position) {
                    const word = model.getWordAtPosition(position);
                    if (!word) return null;

                    const doc = FRAGBASIC_DOCS[word.word.toUpperCase()];
                    if (!doc) return null;

                    const lines = doc.split('\n');
                    const sig = lines[0];
                    const rest = lines.slice(1).join('\n');

                    return {
                        contents: [
                            { value: '```fragbasic\n' + sig + '\n```' },
                            rest ? { value: rest } : null,
                        ].filter(Boolean),
                    };
                }
            });

            console.log('[FragBASIC] Plugin activated — syntax highlighting ready');
            api.ui.showNotification('FragBASIC language support activated', 'success', 3000);
        },

        deactivate() {
            console.log('[FragBASIC] Plugin deactivated');
        }
    };

    // -----------------------------------------------------------------------
    // Register with MyCode plugin loader
    // -----------------------------------------------------------------------
    window.__MYCODE_PLUGINS__ = window.__MYCODE_PLUGINS__ || {};
    window.__MYCODE_PLUGINS__['mycode-fragbasic-language'] = pluginModule;

    const callbackName = '__plugin_mycode_fragbasic_language__';
    if (window[callbackName]) {
        window[callbackName](pluginModule);
    }

})();
