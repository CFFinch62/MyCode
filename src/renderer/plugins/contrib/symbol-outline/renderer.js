/**
 * Symbol Outline Plugin - Shows document symbols for navigation
 * Uses regex-based parsing to work across all languages
 */

(function() {
    let sidebarPanel = null;
    let currentSymbols = [];
    let debounceTimer = null;

    // Symbol patterns for different languages
    const SYMBOL_PATTERNS = {
        // JavaScript/TypeScript
        javascript: [
            { type: 'class', pattern: /^[ \t]*(?:export\s+)?(?:abstract\s+)?class\s+(\w+)/gm, icon: '🔷' },
            { type: 'function', pattern: /^[ \t]*(?:export\s+)?(?:async\s+)?function\s+(\w+)/gm, icon: '🔹' },
            { type: 'method', pattern: /^[ \t]+(?:async\s+)?(\w+)\s*\([^)]*\)\s*{/gm, icon: '🔸' },
            { type: 'const', pattern: /^[ \t]*(?:export\s+)?const\s+(\w+)\s*=/gm, icon: '📌' },
            { type: 'interface', pattern: /^[ \t]*(?:export\s+)?interface\s+(\w+)/gm, icon: '🔶' },
            { type: 'type', pattern: /^[ \t]*(?:export\s+)?type\s+(\w+)\s*=/gm, icon: '🔶' },
        ],
        typescript: null, // Will use javascript patterns

        // Python
        python: [
            { type: 'class', pattern: /^class\s+(\w+)/gm, icon: '🔷' },
            { type: 'function', pattern: /^def\s+(\w+)/gm, icon: '🔹' },
            { type: 'method', pattern: /^[ \t]+def\s+(\w+)/gm, icon: '🔸' },
            { type: 'variable', pattern: /^(\w+)\s*=\s*(?!.*def|class)/gm, icon: '📌' },
        ],

        // Rust
        rust: [
            { type: 'struct', pattern: /^[ \t]*(?:pub\s+)?struct\s+(\w+)/gm, icon: '🔷' },
            { type: 'enum', pattern: /^[ \t]*(?:pub\s+)?enum\s+(\w+)/gm, icon: '🔷' },
            { type: 'function', pattern: /^[ \t]*(?:pub\s+)?(?:async\s+)?fn\s+(\w+)/gm, icon: '🔹' },
            { type: 'impl', pattern: /^[ \t]*impl(?:<[^>]+>)?\s+(\w+)/gm, icon: '🔶' },
            { type: 'trait', pattern: /^[ \t]*(?:pub\s+)?trait\s+(\w+)/gm, icon: '🔶' },
            { type: 'const', pattern: /^[ \t]*(?:pub\s+)?const\s+(\w+)/gm, icon: '📌' },
        ],

        // Go
        go: [
            { type: 'struct', pattern: /^type\s+(\w+)\s+struct/gm, icon: '🔷' },
            { type: 'interface', pattern: /^type\s+(\w+)\s+interface/gm, icon: '🔶' },
            { type: 'function', pattern: /^func\s+(\w+)/gm, icon: '🔹' },
            { type: 'method', pattern: /^func\s+\([^)]+\)\s+(\w+)/gm, icon: '🔸' },
            { type: 'const', pattern: /^const\s+(\w+)/gm, icon: '📌' },
            { type: 'var', pattern: /^var\s+(\w+)/gm, icon: '📌' },
        ],

        // C/C++
        c: [
            { type: 'function', pattern: /^(?:static\s+)?(?:inline\s+)?(?:\w+\s+)+(\w+)\s*\([^;]*$/gm, icon: '🔹' },
            { type: 'struct', pattern: /^(?:typedef\s+)?struct\s+(\w+)/gm, icon: '🔷' },
            { type: 'enum', pattern: /^(?:typedef\s+)?enum\s+(\w+)/gm, icon: '🔷' },
            { type: 'define', pattern: /^#define\s+(\w+)/gm, icon: '📌' },
        ],
        cpp: null, // Will use c patterns with additions

        // Java
        java: [
            { type: 'class', pattern: /^[ \t]*(?:public\s+|private\s+|protected\s+)?(?:abstract\s+)?(?:final\s+)?class\s+(\w+)/gm, icon: '🔷' },
            { type: 'interface', pattern: /^[ \t]*(?:public\s+)?interface\s+(\w+)/gm, icon: '🔶' },
            { type: 'method', pattern: /^[ \t]+(?:public\s+|private\s+|protected\s+)?(?:static\s+)?(?:\w+\s+)+(\w+)\s*\(/gm, icon: '🔸' },
            { type: 'enum', pattern: /^[ \t]*(?:public\s+)?enum\s+(\w+)/gm, icon: '🔷' },
        ],

        // Ruby
        ruby: [
            { type: 'class', pattern: /^class\s+(\w+)/gm, icon: '🔷' },
            { type: 'module', pattern: /^module\s+(\w+)/gm, icon: '🔶' },
            { type: 'method', pattern: /^[ \t]*def\s+(\w+)/gm, icon: '🔹' },
        ],

        // PHP
        php: [
            { type: 'class', pattern: /^[ \t]*(?:abstract\s+)?class\s+(\w+)/gm, icon: '🔷' },
            { type: 'interface', pattern: /^[ \t]*interface\s+(\w+)/gm, icon: '🔶' },
            { type: 'function', pattern: /^[ \t]*(?:public\s+|private\s+|protected\s+)?(?:static\s+)?function\s+(\w+)/gm, icon: '🔹' },
            { type: 'trait', pattern: /^[ \t]*trait\s+(\w+)/gm, icon: '🔶' },
        ],

        // Shell/Bash
        shellscript: [
            { type: 'function', pattern: /^(\w+)\s*\(\)\s*{/gm, icon: '🔹' },
            { type: 'function', pattern: /^function\s+(\w+)/gm, icon: '🔹' },
        ],

        // CSS/SCSS
        css: [
            { type: 'selector', pattern: /^([.#][\w-]+)\s*{/gm, icon: '🎨' },
            { type: 'media', pattern: /^@media\s+([^{]+)/gm, icon: '📱' },
            { type: 'keyframes', pattern: /^@keyframes\s+(\w+)/gm, icon: '🎬' },
        ],
        scss: null, // Will use css patterns

        // HTML
        html: [
            { type: 'id', pattern: /id=["']([^"']+)["']/gm, icon: '#️⃣' },
            { type: 'section', pattern: /<(header|footer|main|nav|section|article)[^>]*>/gm, icon: '📄' },
        ],

        // Markdown
        markdown: [
            { type: 'h1', pattern: /^#\s+(.+)$/gm, icon: '📑' },
            { type: 'h2', pattern: /^##\s+(.+)$/gm, icon: '📄' },
            { type: 'h3', pattern: /^###\s+(.+)$/gm, icon: '📃' },
            { type: 'h4', pattern: /^####\s+(.+)$/gm, icon: '📋' },
        ],

        // JSON (keys at root level)
        json: [
            { type: 'key', pattern: /^[ \t]*"(\w+)":/gm, icon: '🔑' },
        ],

        // YAML
        yaml: [
            { type: 'key', pattern: /^(\w+):/gm, icon: '🔑' },
        ],

        // SQL
        sql: [
            { type: 'table', pattern: /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/gim, icon: '📊' },
            { type: 'view', pattern: /CREATE\s+VIEW\s+(\w+)/gim, icon: '👁' },
            { type: 'function', pattern: /CREATE\s+FUNCTION\s+(\w+)/gim, icon: '🔹' },
            { type: 'procedure', pattern: /CREATE\s+PROCEDURE\s+(\w+)/gim, icon: '🔹' },
        ],
    };

    // Language aliases
    SYMBOL_PATTERNS.typescript = SYMBOL_PATTERNS.javascript;
    SYMBOL_PATTERNS.cpp = SYMBOL_PATTERNS.c;
    SYMBOL_PATTERNS.scss = SYMBOL_PATTERNS.css;
    SYMBOL_PATTERNS.sass = SYMBOL_PATTERNS.css;
    SYMBOL_PATTERNS.less = SYMBOL_PATTERNS.css;
    SYMBOL_PATTERNS.bash = SYMBOL_PATTERNS.shellscript;
    SYMBOL_PATTERNS.sh = SYMBOL_PATTERNS.shellscript;
    SYMBOL_PATTERNS.zsh = SYMBOL_PATTERNS.shellscript;
    SYMBOL_PATTERNS.yml = SYMBOL_PATTERNS.yaml;

    // Default patterns for unknown languages
    const DEFAULT_PATTERNS = [
        { type: 'function', pattern: /^[ \t]*(?:function|def|fn|func)\s+(\w+)/gm, icon: '🔹' },
        { type: 'class', pattern: /^[ \t]*(?:class|struct|type)\s+(\w+)/gm, icon: '🔷' },
    ];

    /**
     * Parse document content and extract symbols
     */
    function parseSymbols(content, language) {
        const patterns = SYMBOL_PATTERNS[language] || DEFAULT_PATTERNS;
        const symbols = [];
        const lines = content.split('\n');

        for (const patternDef of patterns) {
            // Reset regex lastIndex
            patternDef.pattern.lastIndex = 0;

            let match;
            while ((match = patternDef.pattern.exec(content)) !== null) {
                const name = match[1];
                // Calculate line number
                const beforeMatch = content.substring(0, match.index);
                const lineNumber = beforeMatch.split('\n').length;

                symbols.push({
                    name,
                    type: patternDef.type,
                    icon: patternDef.icon,
                    line: lineNumber,
                });
            }
        }

        // Sort by line number
        symbols.sort((a, b) => a.line - b.line);
        return symbols;
    }

    /**
     * Render the symbol list in the sidebar panel
     */
    function renderSymbols(symbols, container, api) {
        if (symbols.length === 0) {
            container.innerHTML = `
                <div class="symbol-empty">
                    <span style="font-size: 24px; opacity: 0.5;">📋</span>
                    <p>No symbols found</p>
                </div>
            `;
            return;
        }

        const list = document.createElement('div');
        list.className = 'symbol-list';

        for (const symbol of symbols) {
            const item = document.createElement('div');
            item.className = 'symbol-item';
            item.innerHTML = `
                <span class="symbol-icon">${symbol.icon}</span>
                <span class="symbol-name">${symbol.name}</span>
                <span class="symbol-line">:${symbol.line}</span>
            `;
            item.title = `${symbol.type}: ${symbol.name} (line ${symbol.line})`;
            item.onclick = () => {
                api.editor.setCursorPosition({ line: symbol.line, column: 1 });
                api.editor.revealLine(symbol.line);
                api.editor.focus();
            };
            list.appendChild(item);
        }

        container.innerHTML = '';
        container.appendChild(list);
    }

    /**
     * Update the symbol outline
     */
    function updateOutline(api, container) {
        const content = api.editor.getContent();
        const language = api.editor.getLanguage();

        currentSymbols = parseSymbols(content, language);
        renderSymbols(currentSymbols, container, api);
    }

    /**
     * Debounced update for performance
     */
    function debouncedUpdate(api, container) {
        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }
        debounceTimer = setTimeout(() => {
            updateOutline(api, container);
        }, 300);
    }

    const pluginModule = {
        activate(api) {
            console.log('[SymbolOutline] Plugin activated!');

            // Create sidebar panel
            sidebarPanel = api.ui.registerSidebarPanel({
                id: 'symbol-outline',
                title: 'Outline',
                icon: '📋'
            });

            // Add styles
            const style = document.createElement('style');
            style.textContent = `
                .symbol-outline-container {
                    height: 100%;
                    overflow-y: auto;
                    padding: 4px;
                }
                .symbol-empty {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100px;
                    color: var(--text-secondary);
                    font-size: 12px;
                }
                .symbol-list {
                    display: flex;
                    flex-direction: column;
                }
                .symbol-item {
                    display: flex;
                    align-items: center;
                    padding: 4px 8px;
                    cursor: pointer;
                    border-radius: 4px;
                    font-size: 12px;
                    gap: 6px;
                }
                .symbol-item:hover {
                    background: var(--hover-bg);
                }
                .symbol-icon {
                    font-size: 12px;
                    flex-shrink: 0;
                }
                .symbol-name {
                    flex: 1;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .symbol-line {
                    color: var(--text-secondary);
                    font-size: 10px;
                    flex-shrink: 0;
                }
                .symbol-refresh-btn {
                    padding: 4px 8px;
                    margin: 4px;
                    cursor: pointer;
                    background: var(--button-bg);
                    border: 1px solid var(--border-color);
                    border-radius: 4px;
                    color: var(--text-primary);
                    font-size: 11px;
                }
                .symbol-refresh-btn:hover {
                    background: var(--button-hover-bg);
                }
            `;
            document.head.appendChild(style);

            // Setup panel content
            const container = document.createElement('div');
            container.className = 'symbol-outline-container';
            container.innerHTML = `
                <div class="symbol-empty">
                    <span style="font-size: 24px; opacity: 0.5;">📋</span>
                    <p>Open a file to see symbols</p>
                </div>
            `;
            sidebarPanel.element.appendChild(container);

            // Register refresh command
            api.commands.register('symbol-outline.refresh', () => {
                updateOutline(api, container);
            });

            // Listen for content changes
            api.hooks.register('editor:contentChange', () => {
                debouncedUpdate(api, container);
            });

            // Listen for file open
            api.hooks.register('workspace:fileOpen', () => {
                updateOutline(api, container);
            });

            // Initial update if there's content
            if (api.editor.getContent()) {
                updateOutline(api, container);
            }

            console.log('[SymbolOutline] Activation complete');
        },

        deactivate() {
            console.log('[SymbolOutline] Plugin deactivated');
            if (sidebarPanel) sidebarPanel.dispose();
            if (debounceTimer) clearTimeout(debounceTimer);
        }
    };

    // Register the plugin globally
    window.__MYCODE_PLUGINS__ = window.__MYCODE_PLUGINS__ || {};
    window.__MYCODE_PLUGINS__['mycode-symbol-outline'] = pluginModule;

    const callbackName = '__plugin_mycode_symbol_outline__';
    if (window[callbackName]) {
        window[callbackName](pluginModule);
    }
})();

