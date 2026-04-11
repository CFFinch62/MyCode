/**
 * FORGE Language Support Plugin for MyCode
 * Adds syntax highlighting for .fg files
 * 
 * FORGE - Fast, Reliable, Organized, General-purpose, Event-driven
 */

(function () {
    const pluginModule = {
        activate(api) {
            console.log('[FORGE] Plugin activated!');

            const monaco = window.monaco;

            if (!monaco) {
                console.error('[FORGE] Monaco Editor not available');
                return;
            }

            // 1. Register the language
            monaco.languages.register({
                id: 'forge',
                extensions: ['.fg'],
                aliases: ['FORGE', 'Forge', 'forge'],
            });

            // 2. Define tokenization rules using Monarch
            monaco.languages.setMonarchTokensProvider('forge', {
                // Declaration keywords
                declarationKeywords: [
                    'proc', 'var', 'const', 'record', 'import', 'export', 'type'
                ],

                // Control flow keywords
                controlFlowKeywords: [
                    'if', 'elif', 'else', 'for', 'while', 'loop', 'in', 'range',
                    'break', 'continue', 'return', 'with'
                ],

                // Types
                types: [
                    'int', 'int8', 'int16', 'int32',
                    'uint', 'uint8', 'uint16', 'uint32',
                    'float', 'float32',
                    'str', 'bool', 'byte', 'void', 'map'
                ],

                // Built-in constants
                constants: ['true', 'false', 'none', 'some'],

                // Math constants (uppercase)
                mathConstants: ['PI', 'E', 'TAU'],

                // Standard library function names (used after module prefix)
                stdlibFunctions: [
                    // forge.io
                    'print', 'print_raw', 'eprint', 'read_line', 'read_line_prompt',
                    'read_file', 'write_file', 'append_file', 'file_exists',
                    // forge.str
                    'len', 'find', 'count', 'contains', 'starts_with', 'ends_with',
                    'split', 'upper', 'lower', 'trim', 'trim_left', 'trim_right',
                    'replace', 'substr', 'char_at', 'concat', 'repeat', 'reverse',
                    'join', 'to_int', 'to_float',
                    // forge.math
                    'abs', 'abs_int', 'min', 'max', 'min_int', 'max_int', 'clamp',
                    'pow', 'sqrt', 'cbrt', 'floor', 'ceil', 'round', 'trunc',
                    'sin', 'cos', 'tan', 'atan2', 'log', 'log2', 'log10', 'exp',
                    'random_int', 'random_float', 'seed_random',
                    // forge.sys
                    'args', 'env', 'exit', 'halt', 'platform', 'arch',
                    // forge.time
                    'now', 'sleep', 'timestamp', 'elapsed_ms', 'start_clock', 'lap',
                    // forge.buf
                    'create', 'free_buf', 'length', 'capacity', 'position', 'remaining',
                    'write_byte', 'write_bytes', 'write_str', 'write_int16_le',
                    'write_int32_le', 'write_float32_le', 'read_byte', 'read_bytes',
                    'read_int16_le', 'read_int32_le', 'seek', 'rewind', 'to_str', 'to_hex',
                    // forge.serial
                    'open', 'close', 'bytes_available', 'set_timeout', 'flush',
                    'is_open', 'get_baud',
                    // forge.nmea
                    'validate', 'checksum', 'sentence_type', 'get_talker',
                    'field_count', 'get_field', 'latitude', 'longitude'
                ],

                // Tokenizer rules
                tokenizer: {
                    root: [
                        // Comments (# style)
                        [/#.*$/, 'comment'],

                        // Procedure declaration
                        [/\bproc\s+([a-zA-Z_][a-zA-Z0-9_]*)/, ['keyword', 'entity.name.function']],

                        // Record declaration
                        [/\brecord\s+([A-Z][a-zA-Z0-9_]*)/, ['keyword', 'entity.name.type']],

                        // Import statement
                        [/\bimport\b/, 'keyword'],

                        // Standard library module + function calls (forge.io.print, etc.)
                        [/\bforge\.(io|str|math|sys|time|buf|serial|nmea)\.([a-zA-Z_][a-zA-Z0-9_]*)/, 
                            ['support.class', 'support.class', 'support.function']],

                        // Standard library module references (forge.io, forge.str, etc.)
                        [/\bforge\.(io|str|math|sys|time|buf|serial|nmea)\b/, 'support.class'],

                        // Math constants (must come before general identifiers)
                        [/\b(PI|E|TAU)\b/, 'constant.numeric'],

                        // Declaration keywords
                        [/\b(proc|var|const|record|export|type)\b/, 'keyword'],

                        // Control flow
                        [/\b(if|elif|else|for|while|loop|in|range|break|continue|return|with)\b/, 'keyword.control'],

                        // Memory/reference keywords
                        [/\b(ref|free|as)\b/, 'keyword'],

                        // Event/channel keywords
                        [/\b(channel|emit|on)\b/, 'keyword.channel'],

                        // Error handling
                        [/\b(panic|or_else)\b/, 'keyword.control'],

                        // Types
                        [/\b(int|int8|int16|int32|uint|uint8|uint16|uint32|float|float32|str|bool|byte|void|map)\b/, 'type'],

                        // Boolean and none constants
                        [/\b(true|false|none|some)\b/, 'constant.language'],

                        // Word operators
                        [/\b(and|or|not|is)\b/, 'keyword.operator'],

                        // Arrow for return type
                        [/->/, 'keyword.operator'],

                        // Strings
                        [/"([^"\\]|\\.)*$/, 'string.invalid'],
                        [/"/, 'string', '@string'],

                        // Numbers (float before int)
                        [/\d+\.\d+/, 'number.float'],
                        [/0x[0-9A-Fa-f]+/, 'number.hex'],
                        [/0b[01]+/, 'number.binary'],
                        [/\d+/, 'number'],

                        // Multi-char operators
                        [/==|!=|<=|>=|<<|>>/, 'operator'],
                        [/\+=|-=|\*=|\/=|%=|&=|\|=|\^=/, 'operator'],

                        // Single-char operators
                        [/[+\-*/%<>=&|^~]/, 'operator'],

                        // Stdlib function when called directly (after dot)
                        [/\.([a-zA-Z_][a-zA-Z0-9_]*)(?=\()/, {
                            cases: {
                                '@stdlibFunctions': ['delimiter', 'support.function'],
                                '@default': ['delimiter', 'entity.name.function']
                            }
                        }],

                        // Function calls (identifier followed by parenthesis)
                        [/[a-zA-Z_][a-zA-Z0-9_]*(?=\()/, 'entity.name.function'],

                        // Record/type names (PascalCase)
                        [/\b[A-Z][a-zA-Z0-9_]*\b/, 'type.identifier'],

                        // Brackets and delimiters
                        [/[\[\](){}]/, '@brackets'],
                        [/[,:.']/, 'delimiter'],

                        // Identifiers
                        [/[a-zA-Z_][a-zA-Z0-9_]*/, 'identifier'],

                        // Whitespace
                        [/\s+/, 'white'],
                    ],

                    string: [
                        [/[^\\"]+/, 'string'],
                        [/\\[nrtfb\\"']/, 'string.escape'],
                        [/\\x[0-9A-Fa-f]{2}/, 'string.escape'],
                        [/\\./, 'string.escape.invalid'],
                        [/"/, 'string', '@pop']
                    ]
                }
            });

            // 3. Configure language features
            monaco.languages.setLanguageConfiguration('forge', {
                comments: {
                    lineComment: '#',
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
                    increaseIndentPattern: /^.*:\s*$/,
                    decreaseIndentPattern: /^\s*(elif|else)\b.*$/
                },
                onEnterRules: [
                    {
                        beforeText: /^.*:\s*$/,
                        action: { indentAction: monaco.languages.IndentAction.Indent }
                    }
                ],
                folding: {
                    offSide: true,
                    markers: {
                        start: /^\s*(proc|record|if|elif|else|for|while|loop)\b.*:\s*$/,
                        end: /^\s*$/
                    }
                },
                wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g
            });

            // 4. Register hover provider for stdlib functions
            monaco.languages.registerHoverProvider('forge', {
                provideHover: function(model, position) {
                    const word = model.getWordAtPosition(position);
                    if (!word) return null;

                    const stdlibDocs = {
                        // forge.io
                        'print': 'forge.io.print(s: str) -> void\nPrint string to stdout with newline',
                        'print_raw': 'forge.io.print_raw(s: str) -> void\nPrint string to stdout without newline',
                        'eprint': 'forge.io.eprint(s: str) -> void\nPrint string to stderr',
                        'read_line': 'forge.io.read_line() -> str\nRead line from stdin',
                        'read_file': 'forge.io.read_file(path: str) -> str\nRead entire file contents',
                        'write_file': 'forge.io.write_file(path: str, content: str) -> bool\nWrite content to file',
                        
                        // forge.str
                        'len': 'forge.str.len(s: str) -> int\nReturn string length',
                        'find': 'forge.str.find(s: str, needle: str) -> int\nFind substring, returns -1 if not found',
                        'contains': 'forge.str.contains(s: str, needle: str) -> bool\nCheck if string contains substring',
                        'upper': 'forge.str.upper(s: str) -> str\nConvert to uppercase',
                        'lower': 'forge.str.lower(s: str) -> str\nConvert to lowercase',
                        'trim': 'forge.str.trim(s: str) -> str\nRemove leading/trailing whitespace',
                        'split': 'forge.str.split(s: str, delim: str) -> []str\nSplit string by delimiter',
                        'substr': 'forge.str.substr(s: str, start: int, len: int) -> str\nExtract substring',

                        // forge.math
                        'abs': 'forge.math.abs(x: float) -> float\nAbsolute value (float)',
                        'abs_int': 'forge.math.abs_int(x: int) -> int\nAbsolute value (int)',
                        'sqrt': 'forge.math.sqrt(x: float) -> float\nSquare root',
                        'pow': 'forge.math.pow(base: float, exp: float) -> float\nExponentiation',
                        'sin': 'forge.math.sin(x: float) -> float\nSine (radians)',
                        'cos': 'forge.math.cos(x: float) -> float\nCosine (radians)',
                        'floor': 'forge.math.floor(x: float) -> float\nRound down',
                        'ceil': 'forge.math.ceil(x: float) -> float\nRound up',
                        'random_int': 'forge.math.random_int(min: int, max: int) -> int\nRandom integer in range',
                        'random_float': 'forge.math.random_float() -> float\nRandom float [0, 1)',

                        // forge.sys
                        'args': 'forge.sys.args() -> []str\nCommand line arguments',
                        'env': 'forge.sys.env(name: str) -> str\nGet environment variable',
                        'exit': 'forge.sys.exit(code: int) -> void\nExit with code',
                        'platform': 'forge.sys.platform() -> str\nOS name (linux, darwin, windows)',
                        'arch': 'forge.sys.arch() -> str\nCPU architecture',

                        // forge.time
                        'now': 'forge.time.now() -> int\nCurrent time in milliseconds',
                        'sleep': 'forge.time.sleep(ms: int) -> void\nSleep for milliseconds',
                        'timestamp': 'forge.time.timestamp() -> str\nISO 8601 timestamp',

                        // forge.serial
                        'open': 'forge.serial.open(path: str, baud: int) -> int\nOpen serial port, returns handle (-1 on error)',
                        'close': 'forge.serial.close(handle: int) -> void\nClose serial port',
                        'read_byte': 'forge.serial.read_byte(handle: int) -> int\nRead byte (-1 if none)',
                        'read_line': 'forge.serial.read_line(handle: int) -> str\nRead line (blocking)',
                        'write_str': 'forge.serial.write_str(handle: int, s: str) -> void\nWrite string',
                        'flush': 'forge.serial.flush(handle: int) -> void\nFlush output buffer',

                        // forge.nmea
                        'validate': 'forge.nmea.validate(sentence: str) -> int\nValidate NMEA checksum (1=valid, 0=invalid)',
                        'checksum': 'forge.nmea.checksum(sentence: str) -> str\nCalculate checksum (2 hex chars)',
                        'latitude': 'forge.nmea.latitude(sentence: str) -> float\nParse latitude in decimal degrees',
                        'longitude': 'forge.nmea.longitude(sentence: str) -> float\nParse longitude in decimal degrees',
                        'get_field': 'forge.nmea.get_field(sentence: str, index: int) -> str\nGet field by index (0-based)',

                        // Constants
                        'PI': 'forge.math.PI = 3.14159265358979323846\nRatio of circumference to diameter',
                        'E': 'forge.math.E = 2.71828182845904523536\nEuler\'s number',
                        'TAU': 'forge.math.TAU = 6.28318530717958647692\n2 * PI (full circle in radians)'
                    };

                    const doc = stdlibDocs[word.word];
                    if (doc) {
                        return {
                            contents: [
                                { value: '```forge\n' + doc.split('\n')[0] + '\n```' },
                                { value: doc.split('\n').slice(1).join('\n') }
                            ]
                        };
                    }
                    return null;
                }
            });

            console.log('[FORGE] Language registered successfully');
            api.ui.showNotification('FORGE language support activated!', 'success', 3000);
        },

        deactivate() {
            console.log('[FORGE] Plugin deactivated');
        }
    };

    // Register the plugin globally
    window.__MYCODE_PLUGINS__ = window.__MYCODE_PLUGINS__ || {};
    window.__MYCODE_PLUGINS__['mycode-forge-language'] = pluginModule;

    // Also register via callback if loader is waiting
    const callbackName = '__plugin_mycode_forge_language__';
    if (window[callbackName]) {
        window[callbackName](pluginModule);
    }
})();
