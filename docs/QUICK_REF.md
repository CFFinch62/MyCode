# MyCode - Quick Reference

> One-page overview for quick reference during development

## Project Status: MVP In Progress (Phase 1-3)

## Quick Commands
```bash
npm run dev      # Development mode (hot reload)
npm run build    # Production build
npm start        # Run app
./scripts/setup.sh  # New PC setup
```

## Architecture
```
src/
├── main/           # Electron main process (Node.js)
│   ├── main.ts     # App entry, window creation
│   ├── menu.ts     # Native menus
│   ├── ipc.ts      # IPC handlers
│   ├── preload.ts  # Context bridge
│   └── services/   # File, settings services
├── renderer/       # Browser/UI (web)
│   ├── App.ts      # Main controller
│   ├── editor/     # Monaco wrapper
│   ├── sidebar/    # Folder tree
│   └── search/     # Search bar
└── shared/         # Shared types & constants
```

## Key Files to Edit

| Feature            | File(s)                                    |
| ------------------ | ------------------------------------------ |
| Keyboard shortcuts | `src/main/menu.ts`, `src/renderer/editor/` |
| Editor features    | `src/renderer/editor/EditorComponent.ts`   |
| Sidebar/tree       | `src/renderer/sidebar/`                    |
| File operations    | `src/main/services/fileService.ts`         |
| Settings           | `src/main/services/settingsService.ts`     |
| Styling            | `src/renderer/styles.css`                  |

## Current Focus

| Priority | Task               | File                        |
| -------- | ------------------ | --------------------------- |
| 1        | Smart cut/copy     | `editor/EditorComponent.ts` |
| 2        | Custom keybindings | `editor/`, `menu.ts`        |
| 3        | Folder tree        | `sidebar/FolderTree.ts`     |
| 4        | Search bar         | `search/SearchBar.ts`       |

## Docs
- [PROGRESS.md](./PROGRESS.md) - Detailed phase checklists
- [DEV_SESSION_LOG.md](./DEV_SESSION_LOG.md) - Session recaps
- [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) - Full technical plan
