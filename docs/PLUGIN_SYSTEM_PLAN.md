# MyCode Plugin System - Implementation Plan

## Overview

The plugin system is a **hybrid architecture** combining:
1. **Simple Hooks** - For common tasks like formatting, linting, pre/post-save actions
2. **Full Plugin API** - For advanced extensions with UI, commands, and deep integration

### Design Goals

- **Powerful**: Full access to Monaco Editor, UI extensions, file system
- **Simple**: Easy to write basic plugins (formatters, linters)
- **Safe**: Controlled access, no arbitrary Node.js in renderer
- **Familiar**: Similar patterns to VS Code extensions

### Use Cases

- Code formatting (Prettier, Black, etc.)
- Linting (ESLint, Pylint, etc.)
- Symbol outline sidebar
- AI agent integration
- Diff viewing and merging
- Custom language support
- Snippets and templates

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Main Process                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │  PluginManager  │──│  PluginLoader   │──│ MainPluginHost  │     │
│  └────────┬────────┘  └─────────────────┘  └─────────────────┘     │
│           │                                                          │
│           │ IPC                                                      │
├───────────┼─────────────────────────────────────────────────────────┤
│           │                    Renderer Process                      │
│           ▼                                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │  PluginContext  │──│  PluginLoader   │──│ PluginRegistry  │     │
│  └────────┬────────┘  └─────────────────┘  └─────────────────┘     │
│           │                                                          │
│           ▼                                                          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                        Plugin API                            │   │
│  │  ┌─────────┐ ┌───────────┐ ┌──────┐ ┌──────────┐ ┌───────┐ │   │
│  │  │ Editor  │ │ Workspace │ │  UI  │ │ Commands │ │ Hooks │ │   │
│  │  └─────────┘ └───────────┘ └──────┘ └──────────┘ └───────┘ │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘

Plugin Sources:
  ~/.config/mycode/plugins/     (User-installed plugins)
  src/renderer/plugins/contrib/ (Built-in plugins)
```

---

## File Structure

```
src/
├── main/
│   └── plugins/
│       ├── PluginManager.ts       # Main orchestrator
│       ├── PluginLoader.ts        # Loads plugin manifests and code
│       ├── MainPluginHost.ts      # Executes main-process plugin code
│       └── PluginIPC.ts           # IPC bridge for plugin communication
│
├── renderer/
│   └── plugins/
│       ├── PluginContext.ts       # The API object passed to plugins
│       ├── PluginLoader.ts        # Loads renderer-side plugin code
│       ├── PluginRegistry.ts      # Tracks active plugins
│       ├── api/                   # Plugin API modules
│       │   ├── EditorAPI.ts       # Editor access (Monaco wrapper)
│       │   ├── WorkspaceAPI.ts    # File/folder operations
│       │   ├── UIAPI.ts           # UI extensions
│       │   ├── CommandsAPI.ts     # Command registration
│       │   ├── MenuAPI.ts         # Menu contributions
│       │   ├── LanguagesAPI.ts    # Monaco language features
│       │   ├── HooksAPI.ts        # Simple event hooks
│       │   └── SettingsAPI.ts     # Plugin settings
│       └── contrib/               # Built-in plugins
│           ├── symbol-outline/
│           └── diff-viewer/
│
└── shared/
    └── plugin-types.ts            # Shared plugin type definitions

~/.config/mycode/
└── plugins/                       # User-installed plugins
    ├── mycode-prettier/
    │   ├── package.json
    │   └── index.js
    └── mycode-eslint/
        ├── package.json
        └── index.js
```

---

## Plugin Manifest

Plugins are defined by extending `package.json` with a `mycode` field:

```json
{
  "name": "mycode-example-plugin",
  "version": "1.0.0",
  "description": "An example plugin for MyCode",
  "author": "Your Name",

  "mycode": {
    "displayName": "Example Plugin",
    "activationEvents": ["onStartup"],
    "renderer": "./index.js",
    "main": "./main.js",

    "contributes": {
      "commands": [
        {
          "id": "example.hello",
          "title": "Say Hello",
          "keybinding": "Ctrl+Shift+H"
        }
      ],
      "menus": [
        {
          "command": "example.hello",
          "group": "tools"
        }
      ],
      "sidebarPanels": [
        {
          "id": "example-panel",
          "title": "Example",
          "icon": "star"
        }
      ],
      "settings": [
        {
          "id": "example.greeting",
          "type": "string",
          "default": "Hello",
          "title": "Greeting Message"
        }
      ],
      "formatters": [
        {
          "languages": ["javascript", "typescript"],
          "command": "example.format"
        }
      ]
    }
  }
}
```

### Activation Events

| Event | Description |
|-------|-------------|
| `onStartup` | Activate when editor starts |
| `onLanguage:javascript` | Activate when a JS file opens |
| `onFileOpen:*.md` | Activate on glob pattern match |
| `onCommand:example.hello` | Activate when command is invoked |
| `onView:example-panel` | Activate when panel is shown |

---

## Plugin API Reference

The Plugin API is the object passed to your plugin's `activate` function:

```javascript
module.exports = {
  activate(api) {
    // Use the api object here
  },
  deactivate() {
    // Cleanup
  }
};
```

### Editor API

```typescript
api.editor: {
  // Content
  getContent(): string;
  setContent(content: string): void;

  // Selection
  getSelection(): Selection;
  setSelection(selection: Selection): void;
  getSelectedText(): string;
  replaceSelection(text: string): void;

  // Cursor
  getCursorPosition(): Position;
  setCursorPosition(position: Position): void;

  // Language
  getLanguage(): string;
  setLanguage(language: string): void;

  // Decorations (for highlighting, linting markers, etc.)
  addDecoration(options: DecorationOptions): Disposable;

  // Events
  onDidChangeContent(callback: (e) => void): Disposable;
  onDidChangeCursorPosition(callback: (e) => void): Disposable;
  onDidChangeLanguage(callback: (e) => void): Disposable;

  // Monaco access (advanced)
  getMonacoEditor(): monaco.editor.IStandaloneCodeEditor;
  getMonaco(): typeof monaco;
}
```

### Workspace API

```typescript
api.workspace: {
  // Current file
  getActiveFilePath(): string | null;
  getOpenFiles(): string[];

  // File operations
  openFile(path: string): Promise<void>;
  saveFile(path: string): Promise<void>;
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;

  // Folder operations
  getOpenFolders(): string[];

  // Events
  onDidOpenFile(callback: (e: FileEvent) => void): Disposable;
  onDidSaveFile(callback: (e: FileEvent) => void): Disposable;
  onDidCloseFile(callback: (e: FileEvent) => void): Disposable;
  onWillSaveFile(callback: (e: WillSaveEvent) => void): Disposable;
}
```

### UI API

```typescript
api.ui: {
  // Notifications
  showNotification(message: string, type?: 'info' | 'warning' | 'error'): void;

  // Dialogs
  showQuickPick(items: QuickPickItem[]): Promise<QuickPickItem | undefined>;
  showInputBox(options: InputBoxOptions): Promise<string | undefined>;

  // Status bar
  createStatusBarItem(options: StatusBarItemOptions): StatusBarItem;

  // Panels
  registerSidebarPanel(options: SidebarPanelOptions): SidebarPanel;
  registerBottomPanel(options: BottomPanelOptions): BottomPanel;

  // Diff viewer
  showDiff(original: string, modified: string, options?: DiffOptions): void;
}
```

### Commands API

```typescript
api.commands: {
  register(id: string, handler: (...args: any[]) => any): Disposable;
  execute(id: string, ...args: any[]): Promise<any>;
  getCommands(): string[];
}
```

### Hooks API

Simple hooks for common automation tasks:

```typescript
api.hooks: {
  // Called before file is saved - can modify content
  onBeforeSave(callback: (context: SaveContext) => Promise<string | void>): Disposable;

  // Called after file is saved
  onAfterSave(callback: (context: SaveContext) => void): Disposable;

  // Called when file is opened
  onFileOpen(callback: (context: FileContext) => void): Disposable;

  // Called when content is pasted - can modify pasted content
  onFilePaste(callback: (context: PasteContext) => Promise<string | void>): Disposable;
}
```

### Settings API

```typescript
api.settings: {
  get<T>(key: string): T;
  set(key: string, value: any): Promise<void>;
  onDidChange(key: string, callback: (value: any) => void): Disposable;
}
```

### Languages API

For registering Monaco language features:

```typescript
api.languages: {
  registerCompletionProvider(language: string, provider: CompletionProvider): Disposable;
  registerHoverProvider(language: string, provider: HoverProvider): Disposable;
  registerDefinitionProvider(language: string, provider: DefinitionProvider): Disposable;
  registerDocumentSymbolProvider(language: string, provider: DocumentSymbolProvider): Disposable;
  registerCodeActionProvider(language: string, provider: CodeActionProvider): Disposable;
  registerDocumentFormatter(language: string, formatter: DocumentFormatter): Disposable;
}
```

### Menus API

```typescript
api.menus: {
  registerMenuItem(options: MenuItemOptions): Disposable;
  registerContextMenuItem(options: ContextMenuItemOptions): Disposable;
}
```


---

## Type Definitions

These types are defined in `src/shared/plugin-types.ts`:

```typescript
// Disposable pattern for cleanup
interface Disposable {
  dispose(): void;
}

// Position and Selection
interface Position {
  line: number;
  column: number;
}

interface Selection {
  start: Position;
  end: Position;
}

// UI Types
interface QuickPickItem {
  label: string;
  description?: string;
  detail?: string;
  value?: any;
}

interface InputBoxOptions {
  prompt?: string;
  placeholder?: string;
  value?: string;
  validateInput?: (value: string) => string | null;
}

interface StatusBarItem {
  text: string;
  tooltip?: string;
  command?: string;
  show(): void;
  hide(): void;
  dispose(): void;
}

interface StatusBarItemOptions {
  id: string;
  text: string;
  tooltip?: string;
  command?: string;
  alignment?: 'left' | 'right';
  priority?: number;
}

interface SidebarPanel {
  id: string;
  element: HTMLElement;
  show(): void;
  hide(): void;
  dispose(): void;
}

interface SidebarPanelOptions {
  id: string;
  title: string;
  icon?: string;
  position?: 'top' | 'bottom';
}

// Event contexts
interface SaveContext {
  filePath: string;
  content: string;
  language: string;
}

interface FileContext {
  filePath: string;
  language: string;
}

interface PasteContext {
  content: string;
  filePath: string;
  language: string;
}

// Contribution types
interface CommandContribution {
  id: string;
  title: string;
  keybinding?: string;
  when?: string;
}

interface MenuContribution {
  command: string;
  group: 'file' | 'edit' | 'view' | 'tools' | 'context';
  when?: string;
}

interface SettingContribution {
  id: string;
  type: 'boolean' | 'string' | 'number' | 'select';
  default: any;
  title: string;
  description?: string;
  options?: { value: any; label: string }[];
}

interface FormatterContribution {
  languages: string[];
  command: string;
}

interface LinterContribution {
  languages: string[];
  command: string;
}
```

---

## Example Plugins

### Formatter Plugin (Prettier)

```javascript
// ~/.config/mycode/plugins/mycode-prettier/package.json
{
  "name": "mycode-prettier",
  "version": "1.0.0",
  "mycode": {
    "displayName": "Prettier Formatter",
    "activationEvents": ["onStartup"],
    "renderer": "./index.js",
    "contributes": {
      "commands": [{
        "id": "prettier.format",
        "title": "Format Document with Prettier",
        "keybinding": "Ctrl+Shift+F"
      }],
      "formatters": [{
        "languages": ["javascript", "typescript", "json", "css", "html"],
        "command": "prettier.format"
      }],
      "settings": [
        { "id": "prettier.tabWidth", "type": "number", "default": 2, "title": "Tab Width" },
        { "id": "prettier.useTabs", "type": "boolean", "default": false, "title": "Use Tabs" }
      ]
    }
  }
}
```

```javascript
// ~/.config/mycode/plugins/mycode-prettier/index.js
const prettier = require('prettier');

module.exports = {
  activate(api) {
    // Register format command
    api.commands.register('prettier.format', async () => {
      const content = api.editor.getContent();
      const language = api.editor.getLanguage();

      try {
        const formatted = await prettier.format(content, {
          parser: getParser(language),
          tabWidth: api.settings.get('prettier.tabWidth'),
          useTabs: api.settings.get('prettier.useTabs'),
        });
        api.editor.setContent(formatted);
        api.ui.showNotification('Document formatted', 'info');
      } catch (err) {
        api.ui.showNotification(`Format error: ${err.message}`, 'error');
      }
    });

    // Format on save hook
    api.hooks.onBeforeSave(async (context) => {
      const language = api.editor.getLanguage();
      if (['javascript', 'typescript'].includes(language)) {
        try {
          return await prettier.format(context.content, {
            parser: getParser(language),
          });
        } catch (e) {
          return context.content; // Don't block save on error
        }
      }
    });
  },

  deactivate() {}
};

function getParser(language) {
  const parsers = {
    javascript: 'babel',
    typescript: 'typescript',
    json: 'json',
    css: 'css',
    html: 'html',
  };
  return parsers[language] || 'babel';
}
```



### Symbol Outline Plugin (Built-in)

```typescript
// src/renderer/plugins/contrib/symbol-outline/index.ts
import { PluginAPI, Disposable, SidebarPanel } from '../../../../shared/plugin-types';

export function activate(api: PluginAPI): void {
  const disposables: Disposable[] = [];

  // Register sidebar panel
  const panel = api.ui.registerSidebarPanel({
    id: 'symbol-outline',
    title: 'Outline',
    icon: 'list',
    position: 'top',
  });

  // Update symbols when content changes
  const updateSymbols = async () => {
    const monaco = api.editor.getMonaco();
    const model = api.editor.getMonacoEditor().getModel();
    if (!model) return;

    const symbols = await monaco.languages.getDocumentSymbols(model);
    renderSymbols(panel.element, symbols, api);
  };

  disposables.push(
    api.editor.onDidChangeContent(() => setTimeout(updateSymbols, 500))
  );
  disposables.push(
    api.workspace.onDidOpenFile(() => updateSymbols())
  );

  updateSymbols();
}

function renderSymbols(container: HTMLElement, symbols: any[], api: PluginAPI): void {
  container.innerHTML = '';
  if (!symbols?.length) {
    container.innerHTML = '<div class="empty">No symbols found</div>';
    return;
  }

  const list = document.createElement('ul');
  list.className = 'symbol-list';

  for (const symbol of symbols) {
    const item = document.createElement('li');
    item.className = `symbol-item symbol-${symbol.kind.toLowerCase()}`;
    item.textContent = symbol.name;
    item.onclick = () => {
      api.editor.setCursorPosition({
        line: symbol.range.startLineNumber,
        column: symbol.range.startColumn,
      });
    };
    list.appendChild(item);
  }

  container.appendChild(list);
}

export function deactivate(): void {}
```

### AI Assistant Plugin

```javascript
// ~/.config/mycode/plugins/mycode-ai/package.json
{
  "name": "mycode-ai",
  "version": "1.0.0",
  "mycode": {
    "displayName": "AI Assistant",
    "activationEvents": ["onStartup"],
    "renderer": "./index.js",
    "main": "./main.js",
    "contributes": {
      "commands": [
        { "id": "ai.explain", "title": "AI: Explain Selection", "keybinding": "Ctrl+Shift+E" },
        { "id": "ai.refactor", "title": "AI: Refactor Selection" },
        { "id": "ai.chat", "title": "AI: Open Chat Panel" }
      ],
      "sidebarPanels": [
        { "id": "ai-chat", "title": "AI Chat", "icon": "robot" }
      ],
      "settings": [
        {
          "id": "ai.provider",
          "type": "select",
          "default": "openai",
          "title": "AI Provider",
          "options": [
            { "value": "openai", "label": "OpenAI" },
            { "value": "anthropic", "label": "Anthropic" },
            { "value": "local", "label": "Local (Ollama)" }
          ]
        },
        { "id": "ai.apiKey", "type": "string", "default": "", "title": "API Key" }
      ]
    }
  }
}
```

```javascript
// ~/.config/mycode/plugins/mycode-ai/index.js
module.exports = {
  activate(api) {
    // Register chat panel
    const chatPanel = api.ui.registerSidebarPanel({
      id: 'ai-chat',
      title: 'AI Chat',
      icon: 'robot',
    });

    chatPanel.element.innerHTML = `
      <div class="ai-chat">
        <div class="ai-messages"></div>
        <div class="ai-input">
          <textarea placeholder="Ask AI..."></textarea>
          <button>Send</button>
        </div>
      </div>
    `;

    // Explain selection command
    api.commands.register('ai.explain', async () => {
      const selection = api.editor.getSelectedText();
      if (!selection) {
        api.ui.showNotification('Please select some code first', 'warning');
        return;
      }

      const response = await api.commands.execute('ai.internal.query', {
        prompt: `Explain this code:\n\n${selection}`,
      });

      appendMessage(chatPanel.element, 'assistant', response);
    });
  },

  deactivate() {}
};
```

### Diff Viewer Plugin (Built-in)

```typescript
// src/renderer/plugins/contrib/diff-viewer/index.ts
import { PluginAPI } from '../../../../shared/plugin-types';

export function activate(api: PluginAPI): void {
  // Register diff command
  api.commands.register('diff.show', (original: string, modified: string, title?: string) => {
    api.ui.showDiff(original, modified, { title });
  });

  // Context menu for git diffs
  api.menus.registerContextMenuItem({
    label: 'Show Git Diff',
    command: 'diff.showGitDiff',
    when: 'fileHasGitChanges',
  });

  api.commands.register('diff.showGitDiff', async () => {
    const filePath = api.workspace.getActiveFilePath();
    if (!filePath) return;

    const diff = await api.commands.execute('git.getFileDiff', filePath);
    if (diff) {
      api.ui.showDiff(diff.original, diff.modified, {
        title: `Diff: ${filePath}`,
      });
    }
  });
}

export function deactivate(): void {}
```


---

## Security Considerations

### Sandboxing Levels

| Level | Description | Trade-offs |
|-------|-------------|------------|
| **None** | Full access (like VS Code) | Most powerful, least secure |
| **Node Restriction** | Renderer plugins can't access Node.js directly | Good balance |
| **Iframe Sandbox** | Plugins run in sandboxed iframes | Very secure, limited power |

**Recommendation**: Start with **Node Restriction** level:
- Renderer plugins only get the Plugin API (no direct `require()`)
- Main process plugins (optional) can access Node.js but require explicit permission
- Add a "trusted plugins" list in settings

### Future: Permission System

```typescript
interface PluginPermissions {
  fileSystem?: 'read' | 'write' | 'full';
  network?: boolean;
  shell?: boolean;
  clipboard?: boolean;
}
```

---

## Integration with Existing Code

### Files to Modify

| File | Changes |
|------|---------|
| `src/main/main.ts` | Initialize PluginManager |
| `src/main/ipc.ts` | Add plugin IPC channels |
| `src/main/preload.ts` | Expose plugin bridge |
| `src/shared/ipc-channels.ts` | Add plugin channels |
| `src/renderer/App.ts` | Initialize PluginContext, load plugins |
| `src/renderer/index.html` | Add plugin panel containers |
| `src/renderer/styles.css` | Add plugin UI styles |
| `src/renderer/preferences/` | Add Plugins settings tab |

### New IPC Channels

```typescript
// Add to src/shared/ipc-channels.ts
PLUGIN_LIST: 'plugin:list',
PLUGIN_LOAD: 'plugin:load',
PLUGIN_UNLOAD: 'plugin:unload',
PLUGIN_ENABLE: 'plugin:enable',
PLUGIN_DISABLE: 'plugin:disable',
PLUGIN_GET_SETTINGS: 'plugin:get-settings',
PLUGIN_SET_SETTINGS: 'plugin:set-settings',
PLUGIN_INVOKE_MAIN: 'plugin:invoke-main',
PLUGIN_INVOKE_RENDERER: 'plugin:invoke-renderer',
```

---

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1)

- [ ] Define plugin types (`src/shared/plugin-types.ts`)
- [ ] Plugin discovery and loading (main process)
- [ ] Plugin manifest parsing and validation
- [ ] Plugin IPC bridge
- [ ] Plugin context skeleton (renderer)
- [ ] Basic plugin loader (renderer)

### Phase 2: Core APIs (Week 1-2)

- [ ] Editor API (Monaco wrapper)
- [ ] Workspace API (file operations)
- [ ] Commands API (register/execute)
- [ ] Hooks API (onBeforeSave, onAfterSave, etc.)
- [ ] Settings API (plugin settings)

### Phase 3: UI APIs (Week 2)

- [ ] Notifications (toast messages)
- [ ] Status bar items
- [ ] Sidebar panels
- [ ] Quick pick / input dialogs
- [ ] Diff viewer integration

### Phase 4: Language APIs (Week 2)

- [ ] Monaco language feature registration
- [ ] Formatter integration
- [ ] Linter integration (diagnostic display)

### Phase 5: Built-in Plugins (Week 3)

- [ ] Symbol Outline sidebar
- [ ] Diff Viewer panel

### Phase 6: Plugin Management UI (Week 3)

- [ ] Plugin list in preferences
- [ ] Enable/disable plugins
- [ ] Plugin settings UI

---

## Effort Estimates

| Component | Estimated Time |
|-----------|----------------|
| Core Infrastructure | 3-4 days |
| Editor API | 1-2 days |
| Workspace API | 1 day |
| Commands/Hooks API | 1 day |
| UI API | 2-3 days |
| Languages API | 1-2 days |
| Built-in Plugins | 2-3 days |
| Plugin Management UI | 1-2 days |
| Testing & Polish | 2-3 days |
| **Total** | **~2-3 weeks** |

---

## Next Steps

1. Create `src/shared/plugin-types.ts` with all type definitions
2. Create `src/main/plugins/PluginManager.ts` for plugin discovery
3. Create `src/renderer/plugins/PluginContext.ts` for the API
4. Implement Editor API first (most commonly used)
5. Add a simple test plugin to validate the system