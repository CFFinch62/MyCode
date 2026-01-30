/**
 * JSON Formatter Plugin
 * Demonstrates the Languages API with formatting and linting
 */

async function activate(context) {
    const { editor, commands, languages, ui, utils } = context;
    
    utils.log.info('JSON Formatter plugin activated');

    // Register document formatter for JSON
    const formatterDisposable = languages.registerDocumentFormatter('json', {
        async provideDocumentFormattingEdits(content, options) {
            try {
                // Parse and re-stringify with proper indentation
                const parsed = JSON.parse(content);
                const indent = options.insertSpaces ? ' '.repeat(options.tabSize) : '\t';
                const formatted = JSON.stringify(parsed, null, indent);
                
                // If content is already formatted the same way, return empty edits
                if (content.trim() === formatted.trim()) {
                    return [];
                }
                
                // Count lines in original content
                const lines = content.split('\n');
                const lineCount = lines.length;
                const lastLineLength = lines[lineCount - 1].length;
                
                // Return a single edit that replaces the entire document
                return [{
                    range: {
                        start: { line: 1, column: 1 },
                        end: { line: lineCount, column: lastLineLength + 1 }
                    },
                    newText: formatted
                }];
            } catch (error) {
                // If JSON is invalid, don't format
                utils.log.warn('Cannot format invalid JSON:', error.message);
                return [];
            }
        }
    });

    // Register linter for JSON
    const linterDisposable = languages.registerLinter('json', {
        async provideDiagnostics(content, filePath) {
            const diagnostics = [];
            
            try {
                JSON.parse(content);
            } catch (error) {
                // Parse the error message to find the position
                const match = error.message.match(/at position (\d+)/);
                let line = 1;
                let column = 1;
                
                if (match) {
                    const position = parseInt(match[1], 10);
                    // Convert position to line/column
                    let pos = 0;
                    const lines = content.split('\n');
                    for (let i = 0; i < lines.length && pos < position; i++) {
                        if (pos + lines[i].length + 1 > position) {
                            line = i + 1;
                            column = position - pos + 1;
                            break;
                        }
                        pos += lines[i].length + 1; // +1 for newline
                        line = i + 2;
                        column = 1;
                    }
                }
                
                diagnostics.push({
                    range: {
                        start: { line, column },
                        end: { line, column: column + 1 }
                    },
                    message: error.message,
                    severity: 1, // Error
                    source: 'json-formatter'
                });
            }
            
            return diagnostics;
        }
    });

    // Register format command
    commands.register('json-formatter.format', async () => {
        const content = editor.getContent();
        const lang = editor.getLanguage();
        
        if (lang !== 'json') {
            ui.showNotification('Format JSON is only available for JSON files', 'warning');
            return;
        }
        
        try {
            const parsed = JSON.parse(content);
            const formatted = JSON.stringify(parsed, null, 4);
            editor.setContent(formatted);
            ui.showNotification('JSON formatted successfully', 'info');
        } catch (error) {
            ui.showNotification(`Invalid JSON: ${error.message}`, 'error');
        }
    });

    // Register validate command
    commands.register('json-formatter.validate', async () => {
        const content = editor.getContent();
        const lang = editor.getLanguage();
        
        if (lang !== 'json') {
            ui.showNotification('Validate JSON is only available for JSON files', 'warning');
            return;
        }
        
        try {
            JSON.parse(content);
            ui.showNotification('JSON is valid ✓', 'info');
        } catch (error) {
            ui.showNotification(`Invalid JSON: ${error.message}`, 'error');
        }
    });

    // Return disposables for cleanup
    return {
        dispose() {
            formatterDisposable.dispose();
            linterDisposable.dispose();
            utils.log.info('JSON Formatter plugin deactivated');
        }
    };
}

// Export for the plugin loader
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { activate };
}

