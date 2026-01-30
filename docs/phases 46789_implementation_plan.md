# Post-MVP Implementation Plan

## Overview

This plan covers phases 4, 6, 7, 8, and 9 (Markdown Preview). Each phase is scoped with complexity estimates.

---

## Recommended Implementation Order

| Priority | Phase | Feature | Complexity | Dependencies |
|----------|-------|---------|------------|--------------|
| 1 | **9** | Markdown Preview | Low | None |
| 2 | **7** | Integrated Terminal | Medium | xterm.js, node-pty |
| 3 | **6** | Symbol Outline | Medium | Monaco symbols API |
| 4 | **4** | Git Integration | High | simple-git |
| 5 | **8** | Plugin System | High | Architecture design |

> [!NOTE]
> Starting with Markdown Preview as it's the most straightforward and provides immediate value. Plugin System is last as it requires the most design work.

---

## Phase 9: Markdown Preview (NEW)

**Complexity:** Low | **Estimated Time:** 2-3 hours

### Features
- Side-by-side live preview for [.md](file:///home/chuck/.gemini/antigravity/brain/3b0b8d73-8d20-4301-81a3-6914d577a2e0/task.md) files
- Sync scroll between editor and preview
- Toggle preview on/off via menu/button
- Style preview to match editor theme

### Files to Create/Modify
- `src/renderer/preview/MarkdownPreview.ts` - Preview component
- [src/renderer/styles.css](file:///home/chuck/Dropbox/Programming/Languages_and_Code/Programming_Projects/Programming_Tools/MyCode/src/renderer/styles.css) - Preview panel styling
- [src/renderer/App.ts](file:///home/chuck/Dropbox/Programming/Languages_and_Code/Programming_Projects/Programming_Tools/MyCode/src/renderer/App.ts) - Toggle preview logic
- [src/main/menu.ts](file:///home/chuck/Dropbox/Programming/Languages_and_Code/Programming_Projects/Programming_Tools/MyCode/src/main/menu.ts) - View → Toggle Markdown Preview

### Implementation
1. Use `marked` or `markdown-it` library to render HTML
2. Create split-pane layout when preview is active
3. Listen to editor changes, debounce, re-render

---

## Phase 7: Integrated Terminal

**Complexity:** Medium | **Estimated Time:** 4-6 hours

### Features
- Terminal panel at bottom of editor
- Multiple terminal tabs
- Per-project working directory
- Toggle visibility

### Dependencies
```bash
npm install xterm xterm-addon-fit node-pty
```

### Files to Create
- `src/renderer/terminal/Terminal.ts` - xterm.js wrapper
- `src/main/services/ptyService.ts` - node-pty management
- Add IPC channels for PTY communication

---

## Phase 6: Symbol Outline

**Complexity:** Medium | **Estimated Time:** 4-5 hours

### Features
- Right sidebar with symbol tree
- Functions, classes, variables
- Click to navigate to symbol
- Collapse/expand sections

### Implementation
- Use Monaco's `getModel().getDocumentSymbols()` API
- Or integrate `@vscode/vscode-languageserver-protocol`
- Render as collapsible tree in right panel

### Files to Create
- `src/renderer/outline/SymbolOutline.ts`
- Update [src/renderer/index.html](file:///home/chuck/Dropbox/Programming/Languages_and_Code/Programming_Projects/Programming_Tools/MyCode/src/renderer/index.html) with outline panel

---

## Phase 4: Git Integration

**Complexity:** High | **Estimated Time:** 8-12 hours

### Features
- Branch indicator in statusbar
- Gutter diff indicators (added/modified/deleted lines)
- Uncommitted changes count
- Branch creation/switching (future)

### Dependencies
```bash
npm install simple-git
```

### Files to Create
- `src/main/services/gitService.ts` - Git operations
- `src/renderer/git/GitStatusBar.ts` - Branch display
- `src/renderer/git/GutterDecorations.ts` - Diff markers

### Implementation Notes
- Use `simple-git` for Node.js Git operations
- Monaco decorations API for gutter markers
- IPC for all git operations (security)

---

## Phase 8: Plugin System

**Complexity:** High | **Estimated Time:** 12-16 hours

### Features
- Plugin discovery from `~/.config/mycode/plugins/`
- Plugin manifest format (`plugin.json`)
- Plugin API (editor access, commands, UI panels)
- Built-in plugins: bracket colorization, indent guides

### Architecture
```
plugins/
  my-plugin/
    plugin.json     # Manifest
    main.js         # Entry point
    styles.css      # Optional styles
```

### Plugin API (Draft)
```typescript
interface MyCodePluginAPI {
  editor: {
    getContent(): string;
    setContent(text: string): void;
    onContentChanged(callback): void;
  };
  commands: {
    register(id: string, handler): void;
  };
  ui: {
    addStatusBarItem(config): void;
    addPanel(config): void;
  };
}
```

---

## Questions for User Review

1. **Markdown Preview**: Should the preview open automatically for [.md](file:///home/chuck/.gemini/antigravity/brain/3b0b8d73-8d20-4301-81a3-6914d577a2e0/task.md) files, or only when explicitly toggled?

2. **Terminal**: Should we support multiple terminal instances (tabs) in phase 1, or start with a single terminal?

3. **Symbol Outline**: Which panel location is preferred - right sidebar or integrated with existing left sidebar?

4. **Git**: Should we include commit/push functionality, or just read-only status display initially?

5. **Plugin order priority**: Is the given order (Markdown → Terminal → Outline → Git → Plugins) acceptable?
