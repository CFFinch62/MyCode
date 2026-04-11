# MyCode Plugin Development Guide

This guide explains how to create plugins for MyCode, extending its functionality with custom features.

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Plugin Structure](#plugin-structure)
4. [Plugin Manifest](#plugin-manifest)
5. [The Plugin API](#the-plugin-api)
6. [UI Components](#ui-components)
7. [Languages API](#languages-api)
8. [Hooks](#hooks)
9. [Best Practices](#best-practices)
10. [Example Plugins](#example-plugins)

---

## Overview

MyCode plugins are JavaScript modules that extend the editor's functionality. Plugins can:

- Add sidebar panels for custom views
- Add status bar items
- Register commands and keyboard shortcuts
- Implement code formatters and linters
- React to editor events (file open, save, content changes)
- Create diff comparisons
- Show notifications and dialogs

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Plugin Sources                           │
│  ~/.config/mycode/plugins/     (User-installed plugins)     │
│  src/renderer/plugins/contrib/ (Built-in plugins)           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Plugin Loader                           │
│  - Discovers plugins                                         │
│  - Loads manifests (package.json)                           │
│  - Activates plugins based on activation events             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Plugin API                            │
│  ┌─────────┐ ┌───────────┐ ┌────┐ ┌──────────┐ ┌─────────┐ │
│  │ Editor  │ │ Workspace │ │ UI │ │ Commands │ │Languages│ │
│  └─────────┘ └───────────┘ └────┘ └──────────┘ └─────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### 1. Create Plugin Directory

Create a folder for your plugin in `~/.config/mycode/plugins/`:

```bash
mkdir -p ~/.config/mycode/plugins/my-plugin
cd ~/.config/mycode/plugins/my-plugin
```

### 2. Create package.json

```json
{
    "name": "mycode-my-plugin",
    "version": "1.0.0",
    "displayName": "My Plugin",
    "description": "A simple example plugin",
    "author": "Your Name",
    "mycode": {
        "activationEvents": ["onStartup"],
        "renderer": "renderer.js",
        "contributes": {
            "commands": [
                {
                    "id": "my-plugin.hello",
                    "title": "Say Hello",
                    "category": "My Plugin"
                }
            ]
        }
    }
}
```

### 3. Create renderer.js

```javascript
/**
 * My Plugin - Example plugin for MyCode
 */

async function activate(context) {
    const { commands, ui, utils } = context;

    utils.log.info('My Plugin activated!');

    // Register a command
    commands.register('my-plugin.hello', () => {
        ui.showNotification('Hello from My Plugin!', 'success');
    });

    // Show activation notification
    ui.showNotification('My Plugin loaded!', 'info', 3000);

    // Return disposables for cleanup
    return {
        dispose() {
            utils.log.info('My Plugin deactivated');
        }
    };
}

// Export for the plugin loader
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { activate };
}
```

### 4. Restart MyCode

Restart the editor. Your plugin will be loaded automatically!

---

## Plugin Structure

A minimal plugin requires:

```
my-plugin/
├── package.json    # Plugin manifest
└── renderer.js     # Plugin code
```

### The activate Function

Every plugin must export an `activate` function that receives the Plugin API context:

```javascript
async function activate(context) {
    // context provides access to all APIs:
    // - context.editor     : Editor operations
    // - context.workspace  : File operations
    // - context.ui         : UI components
    // - context.commands   : Command registration
    // - context.languages  : Formatters/linters
    // - context.hooks      : Event hooks
    // - context.utils      : Utility functions

    // Return a dispose function for cleanup
    return {
        dispose() {
            // Cleanup code here
        }
    };
}
```

---

## The Plugin API

The Plugin API provides access to all MyCode functionality.

### Editor API

Access and manipulate the current editor content:

```javascript
async function activate(context) {
    const { editor } = context;

    // Get content
    const content = editor.getContent();
    const language = editor.getLanguage();
    const cursor = editor.getCursorPosition();  // { line, column }
    const selection = editor.getSelection();     // { start, end }
    const selectedText = editor.getSelectedText();

    // Set content
    editor.setContent('new content');
    editor.replaceSelection('replacement text');
    editor.setCursorPosition({ line: 10, column: 1 });

    // Access Monaco directly (advanced)
    const monacoEditor = editor.getMonacoEditor();
    const monaco = editor.getMonaco();
}
```

### Workspace API

Work with files and folders:

```javascript
async function activate(context) {
    const { workspace } = context;

    // Current file info
    const filePath = workspace.getActiveFilePath();
    const openFiles = workspace.getOpenFiles();
    const openFolders = workspace.getOpenFolders();

    // File operations
    await workspace.openFile('/path/to/file.js');
    const content = await workspace.readFile('/path/to/file.js');
    await workspace.writeFile('/path/to/file.js', 'content');
    await workspace.saveFile();  // Save current file
}
```

### Commands API

Register and execute commands:

```javascript
async function activate(context) {
    const { commands, ui } = context;

    // Register a command
    const disposable = commands.register('my-plugin.doSomething', async () => {
        ui.showNotification('Command executed!', 'success');
    });

    // Execute a command
    await commands.execute('my-plugin.doSomething');

    // Get all registered commands
    const allCommands = commands.getCommands();

    // Remember to dispose when plugin deactivates
    return {
        dispose() {
            disposable.dispose();
        }
    };
}
```

### Utils API

Utility functions for common tasks:

```javascript
async function activate(context) {
    const { utils } = context;

    // Logging (appears in DevTools console)
    utils.log.info('Information message');
    utils.log.warn('Warning message');
    utils.log.error('Error message');
    utils.log.debug('Debug message');
}
```

---

## UI Components

### Notifications

Show temporary messages to the user:

```javascript
// Types: 'info', 'success', 'warning', 'error'
// Duration in milliseconds (optional, default: 5000)
ui.showNotification('File saved successfully!', 'success', 3000);
ui.showNotification('Something went wrong', 'error');
ui.showNotification('Check your settings', 'warning', 10000);
```

### Status Bar Items

Add items to the status bar:

```javascript
const statusItem = ui.createStatusBarItem({
    id: 'my-status',
    text: '📊 Ready',
    tooltip: 'Click for details',
    command: 'my-plugin.showStatus',  // Command to run on click
    priority: 100  // Higher = more to the left
});

statusItem.show();

// Update the item later
statusItem.update({ text: '📊 Processing...' });

// Hide or remove
statusItem.hide();
statusItem.dispose();  // Remove permanently
```

### Sidebar Panels

Create custom sidebar panels:

```javascript
const panel = ui.registerSidebarPanel({
    id: 'my-panel',
    title: 'My Panel',
    icon: '📋'  // Emoji or single character
});

// The panel provides an HTML element you can populate
panel.element.innerHTML = `
    <div style="padding: 8px;">
        <h3>My Custom Panel</h3>
        <ul id="my-list"></ul>
        <button id="my-btn">Refresh</button>
    </div>
`;

// Add interactivity
setTimeout(() => {
    document.getElementById('my-btn')?.addEventListener('click', () => {
        // Handle click
    });
}, 100);

// Show/hide programmatically
panel.show();
panel.hide();
```

### Input Dialog

Prompt user for input:

```javascript
const result = await ui.showInputBox({
    title: 'Enter Name',
    prompt: 'What is your name?',
    placeHolder: 'Type here...',
    value: 'Default value',
    validateInput: (value) => {
        if (!value.trim()) {
            return 'Name cannot be empty';
        }
        return undefined;  // Valid
    }
});

if (result) {
    ui.showNotification(`Hello, ${result}!`, 'success');
}
```

### Quick Pick Menu

Show a selection menu:

```javascript
const items = [
    { label: 'Option 1', description: 'First option', value: 1 },
    { label: 'Option 2', description: 'Second option', value: 2 },
    { label: 'Option 3', description: 'Third option', value: 3 }
];

const selected = await ui.showQuickPick(items, {
    title: 'Select an Option',
    placeholder: 'Type to filter...'
});

if (selected) {
    ui.showNotification(`You selected: ${selected.label}`, 'info');
}
```

### Diff Viewer

Show side-by-side file comparison:

```javascript
// Compare two strings
ui.showDiff(originalContent, modifiedContent, {
    title: 'File Comparison',
    language: 'javascript',
    readOnly: true
});

// For in-editor diff tabs, use showDiffInEditor
ui.showDiffInEditor(originalContent, modifiedContent, {
    title: 'my-file.js ↔ their-file.js',
    language: 'javascript'
});
```

---

## Languages API

Implement code formatters and linters for specific languages.

### Document Formatter

Register a formatter that runs on save (when "Format on Save" is enabled):

```javascript
const disposable = languages.registerDocumentFormatter('json', {
    async provideDocumentFormattingEdits(content, options) {
        try {
            // options contains: insertSpaces, tabSize
            const parsed = JSON.parse(content);
            const indent = options.insertSpaces ? ' '.repeat(options.tabSize) : '\t';
            const formatted = JSON.stringify(parsed, null, indent);

            // Return edits (or empty array if no changes needed)
            const lines = content.split('\n');
            return [{
                range: {
                    start: { line: 1, column: 1 },
                    end: { line: lines.length, column: lines[lines.length - 1].length + 1 }
                },
                newText: formatted
            }];
        } catch (error) {
            return [];  // Return empty if formatting fails
        }
    }
});
```

### Linter

Register a linter to show diagnostics (errors/warnings):

```javascript
const disposable = languages.registerLinter('json', {
    async provideDiagnostics(content, filePath) {
        const diagnostics = [];

        try {
            JSON.parse(content);
        } catch (error) {
            diagnostics.push({
                range: {
                    start: { line: 1, column: 1 },
                    end: { line: 1, column: 10 }
                },
                message: error.message,
                severity: 1,  // 1=Error, 2=Warning, 3=Info, 4=Hint
                source: 'my-linter'
            });
        }

        return diagnostics;
    }
});
```

---

## Hooks

Hooks let you react to editor events.

### Available Hooks

```javascript
// File save hook - react to file saves
hooks.register('workspace:didSave', (data) => {
    console.log('File saved:', data.path);
});

// Content change hook - react to editor changes
hooks.register('editor:contentChange', (data) => {
    console.log('Content changed in:', data.path);
});

// File open hook
hooks.register('file:didOpen', (data) => {
    console.log('File opened:', data.path);
});

// File close hook
hooks.register('file:didClose', (data) => {
    console.log('File closed:', data.path);
});
```

### Example: Update Status on Save

```javascript
api.hooks.register('workspace:didSave', (data) => {
    statusBarItem.update({ text: '✓ Saved' });
    setTimeout(() => {
        statusBarItem.update({ text: '📝 Ready' });
    }, 2000);
});
```

---

## Best Practices

### 1. Always Dispose Resources

Return a `dispose` function from `activate` to clean up:

```javascript
async function activate(context) {
    const statusItem = context.ui.createStatusBarItem({ ... });
    const panel = context.ui.registerSidebarPanel({ ... });
    const commandDisposable = context.commands.register('...', () => { ... });

    return {
        dispose() {
            statusItem.dispose();
            panel.dispose();
            commandDisposable.dispose();
        }
    };
}
```

### 2. Use Unique IDs

Prefix all IDs with your plugin name to avoid conflicts:

```javascript
// Good
commands.register('my-plugin.doSomething', ...);
ui.createStatusBarItem({ id: 'my-plugin.status', ... });

// Bad - may conflict with other plugins
commands.register('doSomething', ...);
```

### 3. Handle Errors Gracefully

Always catch errors and show user-friendly messages:

```javascript
try {
    await riskyOperation();
} catch (error) {
    ui.showNotification(`Operation failed: ${error.message}`, 'error');
    utils.log.error('Operation failed:', error);
}
```

### 4. Use Logging

Use `utils.log` for debugging - messages appear in DevTools (F12):

```javascript
utils.log.info('Plugin loaded');
utils.log.debug('Processing file:', filePath);
utils.log.warn('Deprecated feature used');
utils.log.error('Failed to process:', error);
```

### 5. Debounce Frequent Operations

For operations triggered by content changes, use debouncing:

```javascript
let debounceTimer = null;

function updateSymbols() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        // Expensive operation here
    }, 300);  // Wait 300ms after last change
}
```

---

## Example Plugins

MyCode includes several example plugins you can study:

### Hello World (`src/renderer/plugins/contrib/hello-world/`)

Demonstrates:
- Status bar items
- Sidebar panels
- Commands
- Notifications
- Input dialogs
- Diff viewer
- Event hooks

### JSON Formatter (`src/renderer/plugins/contrib/json-formatter/`)

Demonstrates:
- Document formatter registration
- Linter registration
- Format-on-save integration
- Error diagnostics

### Symbol Outline (`src/renderer/plugins/contrib/symbol-outline/`)

Demonstrates:
- Complex sidebar panel with list UI
- Regex-based code parsing
- Content change reaction with debouncing
- Navigation to specific lines

### Diff Viewer (`src/renderer/plugins/contrib/diff-viewer/`)

Demonstrates:
- File selection dialogs
- Reading files from disk
- Git integration (comparing with HEAD)
- In-editor diff tabs

---

## Debugging Plugins

### Using DevTools

1. Press `Ctrl+Shift+I` or `F12` to open DevTools
2. Check the Console tab for plugin logs
3. Use `utils.log.debug()` for detailed logging

### Common Issues

| Problem | Solution |
|---------|----------|
| Plugin not loading | Check package.json syntax and `mycode` field |
| Commands not working | Verify command ID matches between manifest and registration |
| UI not updating | Ensure you're using `setTimeout` for DOM operations after innerHTML |
| Memory leaks | Make sure to dispose all resources in the dispose function |

---

## Distribution

To share your plugin:

1. **Package your plugin** - Create a zip/folder with `package.json` and `renderer.js`

2. **Installation for users** - Users copy the folder to `~/.config/mycode/plugins/`

3. **Documentation** - Include a README explaining what your plugin does

---

*For more details on the plugin architecture, see [PLUGIN_SYSTEM_PLAN.md](./PLUGIN_SYSTEM_PLAN.md)*
