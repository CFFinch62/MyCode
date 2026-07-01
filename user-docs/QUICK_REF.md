# MyCode - Quick Reference

> One-page overview for quick reference during development

## Project Status: Complete ✅

All 9 phases implemented: Core, Editor, Sidebar, Git, Search, Symbol Outline, Terminal, Plugin System, Markdown Preview
Configurable Language Runner with Build Commands (v2.0) for any language via Preferences → Runner.

## Quick Commands
```bash
npm run dev      # Development mode (watch + compile)
npm run build    # Production build
npm start        # Run the compiled app
npm run pack     # Package for current platform
npm run dist     # Build distributable installers
./scripts/setup.sh  # New PC setup
```

## Architecture
```
src/
├── main/              # Electron main process (Node.js)
│   ├── main.ts        # App entry, window creation
│   ├── menu.ts        # Native menus with shortcuts
│   ├── ipc.ts         # IPC handlers
│   ├── preload.ts     # Context bridge
│   ├── plugins/       # Plugin system backend
│   └── services/      # File, settings, git, terminal, runner config
├── renderer/          # Browser/UI (web)
│   ├── App.ts         # Main controller
│   ├── editor/        # Monaco wrapper + tabs
│   ├── sidebar/       # Folder tree
│   ├── search/        # Search bar
│   ├── terminal/      # Integrated terminal
│   ├── git/           # Git UI components
│   ├── preview/       # Markdown preview
│   ├── preferences/   # Settings dialog
│   └── plugins/       # Plugin system + built-in plugins
└── shared/            # Shared types & constants
```

## Key Files to Edit

| Feature            | File(s)                                      |
| ------------------ | -------------------------------------------- |
| Keyboard shortcuts | `src/main/menu.ts`, `src/renderer/editor/`   |
| Editor features    | `src/renderer/editor/EditorManager.ts`       |
| Tab management     | `src/renderer/editor/TabManager.ts`          |
| Sidebar/tree       | `src/renderer/sidebar/Sidebar.ts`            |
| File operations    | `src/main/services/fileService.ts`           |
| Settings           | `src/main/services/settingsService.ts`       |
| Runner Config      | `src/main/services/runnerConfigService.ts`   |
| Git operations     | `src/main/services/gitService.ts`            |
| Terminal           | `src/renderer/terminal/Terminal.ts`          |
| Plugin API         | `src/renderer/plugins/PluginContext.ts`      |
| Styling            | `src/renderer/styles.css`                    |

## Plugin Development

Plugins are located in:
- `~/.config/mycode/plugins/` - User-installed plugins
- `src/renderer/plugins/contrib/` - Built-in plugins

Each plugin needs:
- `package.json` - Manifest with `mycode` field
- `renderer.js` - Plugin code with `activate(api)` function

## Key Shortcuts

| Action           | Shortcut       |
| ---------------- | -------------- |
| New Tab          | `Ctrl+N`       |
| Open File        | `Ctrl+O`       |
| Save             | `Ctrl+S`       |
| Find             | `Ctrl+F`       |
| Replace          | `Ctrl+R`       |
| Toggle Sidebar   | `F9`           |
| Toggle Terminal  | `Ctrl+``       |
| Duplicate Line   | `Ctrl+D`       |
| Toggle Comment   | `Ctrl+/`       |

## Docs
- [USER_GUIDE.md](./USER_GUIDE.md) - Complete user documentation
- [PLUGIN_DEVELOPMENT_GUIDE.md](./PLUGIN_DEVELOPMENT_GUIDE.md) - Plugin developer guide
- [PROGRESS.md](./PROGRESS.md) - Detailed phase checklists
- [DEV_SESSION_LOG.md](./DEV_SESSION_LOG.md) - Session recaps
- [PLUGIN_SYSTEM_PLAN.md](./PLUGIN_SYSTEM_PLAN.md) - Plugin architecture
