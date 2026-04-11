/**
 * EZ Language Support Plugin for MyCode
 * Adds syntax highlighting for .ez files
 *
 * EZ - Programming Made EZ
 * A simple, interpreted, statically-typed programming language
 * designed for clarity and ease of use.
 */

(function () {
    const pluginModule = {
        activate(api) {
            console.log('[EZ] Plugin activated!');

            const monaco = window.monaco;

            if (!monaco) {
                console.error('[EZ] Monaco Editor not available');
                return;
            }

            // 1. Register the language
            monaco.languages.register({
                id: 'ez',
                extensions: ['.ez'],
                aliases: ['EZ', 'Ez', 'ez'],
            });

            // 2. Define tokenization rules using Monarch
            monaco.languages.setMonarchTokensProvider('ez', {
                // Declaration keywords
                declarationKeywords: [
                    'do', 'temp', 'const', 'struct', 'enum', 'import', 'using',
                    'module', 'private', 'use', 'new'
                ],

                // Control flow keywords
                controlFlowKeywords: [
                    'if', 'or', 'otherwise', 'for', 'for_each', 'as_long_as',
                    'loop', 'in', 'not_in', 'range', 'break', 'continue',
                    'return', 'when', 'is', 'default', 'ensure'
                ],

                // Types
                types: [
                    'int', 'float', 'string', 'bool', 'char', 'void', 'map', 'error'
                ],

                // Built-in constants
                constants: ['true', 'false', 'nil'],

                // Standard library module names
                stdlibModules: [
                    'std', 'math', 'strings', 'arrays', 'maps', 'time',
                    'io', 'os', 'bytes', 'random', 'json', 'binary',
                    'db', 'uuid', 'encoding', 'crypto', 'http'
                ],

                // Standard library functions (used after module prefix)
                stdlibFunctions: [
                    // @std (builtins)
                    'println', 'print', 'len', 'typeof', 'string', 'int', 'float',
                    'input', 'append', 'copy', 'ref',
                    // @math
                    'abs', 'sqrt', 'pow', 'min', 'max', 'floor', 'ceil', 'round',
                    'random', 'sin', 'cos', 'tan', 'log', 'log2', 'log10', 'exp',
                    // @strings
                    'trim', 'upper', 'lower', 'split', 'join', 'contains',
                    'starts_with', 'ends_with', 'replace', 'index', 'repeat',
                    'slice', 'count',
                    // @arrays
                    'first', 'last', 'reverse', 'pop', 'push',
                    'sort', 'filter', 'map', 'reduce',
                    // @maps
                    'keys', 'values', 'has', 'delete', 'merge',
                    // @time
                    'now', 'year', 'month', 'day', 'hour', 'minute', 'second',
                    'sleep', 'timestamp', 'elapsed',
                    // @io
                    'read_file', 'write_file', 'append_file', 'file_exists',
                    'read_line', 'read_dir', 'mkdir', 'remove', 'rename',
                    // @os
                    'args', 'env', 'exit', 'platform', 'arch', 'exec', 'getwd',
                    // @bytes
                    'create', 'from_string', 'to_string', 'length',
                    // @random
                    'seed', 'number', 'between', 'choice',
                    // @json
                    'encode', 'decode', 'parse', 'stringify',
                    // @binary
                    'read', 'write', 'pack', 'unpack',
                    // @db
                    'open', 'close', 'get', 'set', 'prefix', 'save',
                    // @uuid
                    'generate', 'validate',
                    // @encoding
                    'base64_encode', 'base64_decode', 'hex_encode', 'hex_decode',
                    // @crypto
                    'hash', 'sha256', 'md5', 'hmac',
                    // @http
                    'request', 'post', 'put', 'patch',
                    'json_body', 'encode_url', 'decode_url', 'build_query'
                ],

                // Tokenizer rules
                tokenizer: {
                    root: [
                        // Multi-line comments (/* ... */)
                        [/\/\*/, 'comment', '@comment'],

                        // Single-line comments (// style)
                        [/\/\/.*$/, 'comment'],

                        // Attributes (#suppress, #strict, #flags, #enum)
                        [/#(suppress|strict|flags|enum)\b/, 'annotation'],

                        // Import with @ prefix (import @std, @math, etc.)
                        [/@(std|math|strings|arrays|maps|time|io|os|bytes|random|json|binary|db|uuid|encoding|crypto|http)\b/, 'support.class'],

                        // Function declaration: do funcName(...)
                        [/\bdo\s+([a-zA-Z_][a-zA-Z0-9_]*)/, ['keyword', 'entity.name.function']],

                        // Struct declaration: const Name struct
                        [/\bconst\s+([A-Z][a-zA-Z0-9_]*)\s+(struct|enum)\b/, ['keyword', 'entity.name.type', 'keyword']],

                        // Standard library module.function calls (math.sqrt, strings.trim, etc.)
                        [/\b(std|math|strings|arrays|maps|time|io|os|bytes|random|json|binary|db|uuid|encoding|crypto|http)\.([a-zA-Z_][a-zA-Z0-9_]*)/, 
                            ['support.class', 'support.function']],

                        // Enum member access (e.g., Color.RED, Status.ACTIVE)
                        [/\b([A-Z][a-zA-Z0-9_]*)\.([A-Z][A-Z0-9_]*)/, ['type.identifier', 'constant.language']],

                        // http constants (http.OK, http.CREATED, etc.)
                        [/\b(http)\.(OK|CREATED|NOT_FOUND|BAD_REQUEST|INTERNAL_SERVER_ERROR)\b/,
                            ['support.class', 'constant.language']],

                        // Declaration keywords
                        [/\b(do|temp|const|struct|enum|import|using|module|private|use|new)\b/, 'keyword'],

                        // Control flow keywords
                        [/\b(if|otherwise|for|for_each|as_long_as|loop|in|not_in|range|break|continue|return|when|is|default|ensure)\b/, 'keyword.control'],

                        // 'or' keyword (used as else-if in EZ)
                        [/\b(or)\b/, 'keyword.control'],

                        // Type casting
                        [/\b(cast)\b/, 'keyword'],

                        // Types
                        [/\b(int|float|string|bool|char|void|error)\b/, 'type'],

                        // Map type declaration: map[key_type:value_type]
                        [/\b(map)\b/, 'type'],

                        // Array type declaration: [type]
                        // (handled via brackets)

                        // Boolean, nil constants
                        [/\b(true|false|nil)\b/, 'constant.language'],

                        // Logical operators
                        [/&&|\|\|/, 'keyword.operator'],

                        // Not-in operator
                        [/!in\b/, 'keyword.operator'],

                        // Arrow for return type
                        [/->/, 'keyword.operator'],

                        // Increment / Decrement
                        [/\+\+|--/, 'operator'],

                        // Strings (double-quoted with interpolation)
                        [/"([^"\\]|\\.)*$/, 'string.invalid'],
                        [/"/, 'string', '@string'],

                        // Raw strings (backtick-quoted)
                        [/`/, 'string', '@rawstring'],

                        // Character literals (single-quoted)
                        [/'[^\\']'/, 'string.char'],
                        [/'\\[nrt\\\\'0]'/, 'string.char'],
                        [/'/, 'string.char', '@charliteral'],

                        // Numbers (float before int)
                        [/\d[\d_]*\.\d[\d_]*([eE][+-]?\d[\d_]*)?/, 'number.float'],
                        [/\d[\d_]*[eE][+-]?\d[\d_]*/, 'number.float'],
                        [/0[xX][0-9A-Fa-f][0-9A-Fa-f_]*/, 'number.hex'],
                        [/0[bB][01][01_]*/, 'number.binary'],
                        [/\d[\d_]*/, 'number'],

                        // Compound assignment operators
                        [/[+\-*/%]=/, 'operator'],

                        // Comparison operators
                        [/==|!=|<=|>=/, 'operator'],

                        // Single-char operators
                        [/[+\-*/%<>=!&]/, 'operator'],

                        // Stdlib function when called directly (after dot)
                        [/\.([a-zA-Z_][a-zA-Z0-9_]*)(?=\()/, {
                            cases: {
                                '@stdlibFunctions': ['delimiter', 'support.function'],
                                '@default': ['delimiter', 'entity.name.function']
                            }
                        }],

                        // Function calls (identifier followed by parenthesis)
                        [/[a-zA-Z_][a-zA-Z0-9_]*(?=\()/, 'entity.name.function'],

                        // Struct/Enum/Type names (PascalCase)
                        [/\b[A-Z][a-zA-Z0-9_]*\b/, 'type.identifier'],

                        // Brackets and delimiters
                        [/[[\](){}]/, '@brackets'],
                        [/[,:.@]/, 'delimiter'],

                        // Identifiers
                        [/[a-zA-Z_][a-zA-Z0-9_]*/, 'identifier'],

                        // Whitespace
                        [/\s+/, 'white'],
                    ],

                    // Multi-line comment state
                    comment: [
                        [/[^/*]+/, 'comment'],
                        [/\/\*/, 'comment', '@push'],   // nested comment
                        [/\*\//, 'comment', '@pop'],
                        [/[/*]/, 'comment']
                    ],

                    // String state (handles interpolation ${...})
                    string: [
                        [/\$\{/, { token: 'string.interpolation', next: '@interpolation' }],
                        [/[^\\"$]+/, 'string'],
                        [/\\[nrt\\\\"'0]/, 'string.escape'],
                        [/\\./, 'string.escape.invalid'],
                        [/\$/, 'string'],
                        [/"/, 'string', '@pop']
                    ],

                    // String interpolation state
                    interpolation: [
                        [/\{/, 'string.interpolation', '@push'],
                        [/\}/, 'string.interpolation', '@pop'],
                        // Inside interpolation, we can have expressions
                        [/[a-zA-Z_][a-zA-Z0-9_]*/, 'identifier'],
                        [/\d+/, 'number'],
                        [/[+\-*/%<>=!.]/, 'operator'],
                        [/[\[\]()]/, '@brackets'],
                        [/"([^"\\]|\\.)*"/, 'string'],
                        [/\s+/, 'white'],
                    ],

                    // Raw string state (backtick — no escapes, no interpolation)
                    rawstring: [
                        [/[^`]+/, 'string'],
                        [/`/, 'string', '@pop']
                    ],

                    // Character literal state
                    charliteral: [
                        [/[^\\']/, 'string.char'],
                        [/\\[nrt\\\\'0]/, 'string.char.escape'],
                        [/'/, 'string.char', '@pop']
                    ]
                }
            });

            // 3. Configure language features
            monaco.languages.setLanguageConfiguration('ez', {
                comments: {
                    lineComment: '//',
                    blockComment: ['/*', '*/']
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
                    { open: '"', close: '"', notIn: ['string'] },
                    { open: "'", close: "'", notIn: ['string'] },
                    { open: '`', close: '`', notIn: ['string'] },
                    { open: '/*', close: ' */', notIn: ['string'] }
                ],
                surroundingPairs: [
                    { open: '[', close: ']' },
                    { open: '(', close: ')' },
                    { open: '{', close: '}' },
                    { open: '"', close: '"' },
                    { open: "'", close: "'" },
                    { open: '`', close: '`' }
                ],
                indentationRules: {
                    increaseIndentPattern: /^.*\{\s*$/,
                    decreaseIndentPattern: /^\s*\}/
                },
                onEnterRules: [
                    {
                        beforeText: /^.*\{\s*$/,
                        action: { indentAction: monaco.languages.IndentAction.Indent }
                    },
                    {
                        beforeText: /^\s*\}\s*$/,
                        action: { indentAction: monaco.languages.IndentAction.Outdent }
                    }
                ],
                folding: {
                    markers: {
                        start: /^\s*(do|const\s+\w+\s+(struct|enum)|if|for|for_each|as_long_as|loop|when)\b.*\{\s*$/,
                        end: /^\s*\}/
                    }
                },
                wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g
            });

            // 4. Register hover provider for stdlib functions
            monaco.languages.registerHoverProvider('ez', {
                provideHover: function(model, position) {
                    const word = model.getWordAtPosition(position);
                    if (!word) return null;

                    const stdlibDocs = {
                        // @std (builtins)
                        'println': 'println(s: string) -> void\nPrint string to stdout with newline',
                        'print': 'print(s: string) -> void\nPrint string to stdout without newline',
                        'len': 'len(collection) -> int\nReturn length of string, array, or map',
                        'typeof': 'typeof(value) -> string\nReturn the type name of a value',
                        'input': 'input(prompt: string) -> string\nRead line from stdin with prompt',
                        'ref': 'ref(value) -> reference\nCreate a shared reference to a value',
                        'copy': 'copy(value) -> value\nCreate an explicit copy of a value',
                        'cast': 'cast(value, type) -> value\nConvert value to the specified type',

                        // @math
                        'abs': 'math.abs(x: int) -> int\nAbsolute value',
                        'sqrt': 'math.sqrt(x: float) -> float\nSquare root',
                        'pow': 'math.pow(base: float, exp: float) -> float\nExponentiation',
                        'min': 'math.min(a: int, b: int) -> int\nMinimum of two values',
                        'max': 'math.max(a: int, b: int) -> int\nMaximum of two values',
                        'floor': 'math.floor(x: float) -> int\nRound down to nearest integer',
                        'ceil': 'math.ceil(x: float) -> int\nRound up to nearest integer',
                        'round': 'math.round(x: float) -> int\nRound to nearest integer',
                        'random': 'math.random(max: int) -> int\nRandom integer from 0 to max',

                        // @strings
                        'trim': 'strings.trim(s: string) -> string\nRemove leading/trailing whitespace',
                        'upper': 'strings.upper(s: string) -> string\nConvert to uppercase',
                        'lower': 'strings.lower(s: string) -> string\nConvert to lowercase',
                        'split': 'strings.split(s: string, delim: string) -> [string]\nSplit string by delimiter',
                        'join': 'strings.join(parts: [string], sep: string) -> string\nJoin array elements with separator',
                        'contains': 'strings.contains(s: string, sub: string) -> bool\nCheck if string contains substring',
                        'starts_with': 'strings.starts_with(s: string, prefix: string) -> bool\nCheck if string starts with prefix',
                        'ends_with': 'strings.ends_with(s: string, suffix: string) -> bool\nCheck if string ends with suffix',
                        'replace': 'strings.replace(s: string, old: string, new: string) -> string\nReplace occurrences in string',
                        'index': 'strings.index(s: string, sub: string) -> int\nFind index of substring (-1 if not found)',
                        'repeat': 'strings.repeat(s: string, count: int) -> string\nRepeat string count times',
                        'slice': 'strings.slice(s: string, start: int, end: int) -> string\nExtract substring by index range',

                        // @arrays
                        'first': 'arrays.first(arr: [T]) -> T\nReturn first element of array',
                        'last': 'arrays.last(arr: [T]) -> T\nReturn last element of array',
                        'reverse': 'arrays.reverse(arr: [T]) -> [T]\nReturn array in reverse order',
                        'append': 'arrays.append(arr: [T], value: T) -> void\nAppend element to array',
                        'pop': 'arrays.pop(arr: [T]) -> T\nRemove and return last element',

                        // @maps
                        'keys': 'maps.keys(m: map[K:V]) -> [K]\nReturn all keys in map',
                        'values': 'maps.values(m: map[K:V]) -> [V]\nReturn all values in map',
                        'has': 'maps.has(m: map[K:V], key: K) -> bool\nCheck if key exists in map',

                        // @time
                        'now': 'time.now() -> string\nCurrent date and time as string',
                        'year': 'time.year() -> int\nCurrent year',
                        'month': 'time.month() -> int\nCurrent month (1-12)',
                        'day': 'time.day() -> int\nCurrent day of month',
                        'hour': 'time.hour() -> int\nCurrent hour (0-23)',
                        'minute': 'time.minute() -> int\nCurrent minute (0-59)',
                        'second': 'time.second() -> int\nCurrent second (0-59)',
                        'sleep': 'time.sleep(ms: int) -> void\nSleep for milliseconds',

                        // @io
                        'read_file': 'io.read_file(path: string) -> string\nRead entire file contents',
                        'write_file': 'io.write_file(path: string, content: string) -> void\nWrite content to file',
                        'file_exists': 'io.file_exists(path: string) -> bool\nCheck if file exists',

                        // @os
                        'args': 'os.args() -> [string]\nCommand line arguments',
                        'env': 'os.env(name: string) -> string\nGet environment variable',
                        'exit': 'os.exit(code: int) -> void\nExit with status code',
                        'platform': 'os.platform() -> string\nOperating system name',
                        'arch': 'os.arch() -> string\nCPU architecture',

                        // @json
                        'encode': 'json.encode(value) -> string\nEncode value as JSON string',
                        'decode': 'json.decode(s: string, type) -> value\nDecode JSON string into typed value',

                        // @db
                        'open': 'db.open(path: string) -> (Database, error)\nOpen a database file',
                        'close': 'db.close(store: Database) -> error\nClose the database',
                        'get': 'db.get(store: Database, key: string) -> (string, bool)\nGet value by key',
                        'set': 'db.set(store: Database, key: string, value: string) -> void\nSet key-value pair',
                        'prefix': 'db.prefix(store: Database, prefix: string) -> [string]\nList keys matching prefix',
                        'save': 'db.save(store: Database) -> error\nManually save database to disk',
                        'count': 'db.count(store: Database) -> int\nReturn total number of keys',

                        // @http
                        'request': 'http.request(method: string, url: string, body, headers, timeout) -> (Response, error)\nMake an HTTP request',
                        'post': 'http.post(url: string, body) -> (Response, error)\nMake an HTTP POST request',
                        'json_body': 'http.json_body(data: map) -> string\nEncode map as JSON request body',
                        'encode_url': 'http.encode_url(s: string) -> string\nURL-encode a string',
                        'decode_url': 'http.decode_url(s: string) -> (string, error)\nURL-decode a string',
                        'build_query': 'http.build_query(params: map) -> string\nBuild query string from map',

                        // Keywords documentation
                        'temp': 'temp <name> <type> = <value>\nDeclare a mutable variable',
                        'do': 'do <name>(<params>) -> <type> { ... }\nDeclare a function',
                        'as_long_as': 'as_long_as <condition> { ... }\nLoop while condition is true (like while)',
                        'for_each': 'for_each <item> in <collection> { ... }\nIterate over each element in a collection',
                        'otherwise': 'otherwise { ... }\nDefault branch (like else)',
                        'range': 'range(start: int, end: int) -> range\nGenerate a range of integers [start, end)',
                        'ensure': 'ensure <condition>\nAssert that a condition is true at runtime',
                        'when': 'when <value> { is <pattern> { ... } }\nPattern matching expression',
                        'struct': 'const <Name> struct { <fields> }\nDefine a custom data structure',
                        'enum': 'const <Name> enum { <values> }\nDefine an enumeration type'
                    };

                    const doc = stdlibDocs[word.word];
                    if (doc) {
                        return {
                            contents: [
                                { value: '```ez\n' + doc.split('\n')[0] + '\n```' },
                                { value: doc.split('\n').slice(1).join('\n') }
                            ]
                        };
                    }
                    return null;
                }
            });

            console.log('[EZ] Language registered successfully');
            api.ui.showNotification('EZ language support activated!', 'success', 3000);
        },

        deactivate() {
            console.log('[EZ] Plugin deactivated');
        }
    };

    // Register the plugin globally
    window.__MYCODE_PLUGINS__ = window.__MYCODE_PLUGINS__ || {};
    window.__MYCODE_PLUGINS__['mycode-ez-language'] = pluginModule;

    // Also register via callback if loader is waiting
    const callbackName = '__plugin_mycode_ez_language__';
    if (window[callbackName]) {
        window[callbackName](pluginModule);
    }
})();
