# MyCode Implementation Plan

## Overview

This document provides the complete implementation details for building MyCode, a cross-platform code editor inspired by Elementary Code.

## Original Reference: Elementary Code Features

Based on analysis of the Elementary Code codebase (Vala/GTK), here are the features being replicated:

### Core Editor Features
| Feature             | Original File                            | Description                          |
| ------------------- | ---------------------------------------- | ------------------------------------ |
| Syntax Highlighting | `src/Widgets/SourceView.vala`            | GtkSourceView-based, 100+ languages  |
| Smart Cut/Copy      | `src/Widgets/SourceView.vala:153-190`    | Copies entire line when no selection |
| Line Duplication    | `src/Widgets/SourceView.vala:352-393`    | Duplicates line or selection         |
| Line Sorting        | `src/Widgets/SourceView.vala:395-450`    | Alphabetically sorts selected lines  |
| Comment Toggle      | `src/Services/CommentToggler.vala`       | Language-aware comment toggling      |
| Navigation Marks    | `src/Widgets/NavMarkGutterRenderer.vala` | Mark and jump between locations      |

### Search & Replace
| Feature              | Original File                        | Description                                |
| -------------------- | ------------------------------------ | ------------------------------------------ |
| Search Bar           | `src/Widgets/SearchBar.vala`         | Real-time highlighting, occurrence counter |
| Regex/Case/WholeWord | `src/Widgets/SearchBar.vala:146-174` | Search option toggles                      |
| Replace All          | `src/Widgets/SearchBar.vala:293-315` | Batch replacement                          |

### Project Management
| Feature         | Original File                              | Description               |
| --------------- | ------------------------------------------ | ------------------------- |
| Folder View     | `src/FolderManager/FileView.vala`          | Tree view of folders      |
| Project Items   | `src/FolderManager/ProjectFolderItem.vala` | Multi-project support     |
| File Monitoring | Built into FolderManager                   | External change detection |

### User Interface
| Feature        | Original File                        | Description               |
| -------------- | ------------------------------------ | ------------------------- |
| Tab Management | `src/Widgets/DocumentView.vala`      | Tabbed document interface |
| Welcome View   | `src/Widgets/WelcomeView.vala`       | New user landing page     |
| Preferences    | `src/Dialogs/PreferencesDialog.vala` | Settings UI               |

---

## MVP Implementation (Phases 1-3, 5)

### Phase 1: Core Application

**Goal**: Working Electron app with file operations

**Files to create**:
1. `src/main/main.ts` - App lifecycle, window creation
2. `src/main/menu.ts` - Native menu with shortcuts
3. `src/main/ipc.ts` - IPC channel handlers
4. `src/main/services/fileService.ts` - File read/write/watch
5. `src/main/services/settingsService.ts` - JSON-based settings

**Settings Schema** (matching Elementary Code):
```typescript
interface Settings {
  // Window state
  windowState: 'Normal' | 'Maximized' | 'Fullscreen';
  windowSize: { width: number; height: number };
  sidebarVisible: boolean;
  
  // Editor settings
  autosave: boolean;
  smartCutCopy: boolean;
  lineWrap: boolean;
  showMiniMap: boolean;
  spacesInsteadOfTabs: boolean;
  autoIndent: boolean;
  indentWidth: number;
  useSystemFont: boolean;
  font: string;
  
  // Search settings
  cyclicSearch: boolean;
  wholeWordSearch: boolean;
  regexSearch: boolean;
  caseSensitiveSearch: 'never' | 'mixed' | 'always';
  
  // Project settings
  openedFolders: string[];
  openedFiles: Array<{ uri: string; cursorPosition: number }>;
  focusedDocument: string;
  
  // Theme
  preferDarkStyle: boolean;
  followSystemStyle: boolean;
}
```

---

### Phase 2: Editor Core

**Goal**: Monaco Editor with Elementary Code keybindings

**Files to create**:
1. `src/renderer/editor/EditorComponent.ts` - Monaco wrapper
2. `src/renderer/editor/EditorActions.ts` - Custom actions
3. `src/renderer/editor/features/smartCutCopy.ts`
4. `src/renderer/editor/features/lineDuplication.ts`
5. `src/renderer/editor/features/lineSorting.ts`
6. `src/renderer/editor/features/navigationMarks.ts`

**Keyboard Shortcuts to Implement**:
```typescript
const shortcuts = {
  'ctrl+n': 'editor.action.newTab',
  'ctrl+o': 'editor.action.openFile',
  'ctrl+shift+o': 'editor.action.openFolder',
  'ctrl+s': 'editor.action.save',
  'ctrl+shift+s': 'editor.action.saveAs',
  'ctrl+w': 'editor.action.closeTab',
  'ctrl+f': 'actions.find',
  'ctrl+g': 'editor.action.nextMatchFindAction',
  'ctrl+shift+g': 'editor.action.previousMatchFindAction',
  'ctrl+r': 'editor.action.startFindReplaceAction',
  'ctrl+d': 'editor.action.duplicateLine',      // Custom
  'ctrl+/': 'editor.action.commentLine',
  'ctrl+m': 'editor.action.commentLine',
  'f5': 'editor.action.sortLines',              // Custom
  'ctrl+l': 'editor.action.transformToLowercase',
  'ctrl+u': 'editor.action.transformToUppercase',
  'ctrl+k': 'editor.action.clearLines',         // Custom
  'ctrl+z': 'undo',
  'ctrl+shift+z': 'redo',
  'f9': 'editor.action.toggleSidebar',          // Custom
  'ctrl+tab': 'editor.action.nextTab',          // Custom
  'ctrl+shift+tab': 'editor.action.previousTab', // Custom
  'alt+=': 'editor.action.addMark',             // Custom
  'alt+left': 'editor.action.previousMark',     // Custom
  'alt+right': 'editor.action.nextMark',        // Custom
  'f11': 'editor.action.toggleFullScreen',
  'ctrl+q': 'editor.action.quit',
};
```

**Smart Cut/Copy Implementation** (from Elementary Code):
```typescript
// When no text selected, cut/copy operates on entire line
editor.addAction({
  id: 'smart-cut',
  keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyX],
  run: (ed) => {
    const selection = ed.getSelection();
    if (selection.isEmpty()) {
      // Get entire current line
      const line = ed.getModel().getLineContent(selection.startLineNumber);
      const fullLine = line + '\n';
      navigator.clipboard.writeText(fullLine);
      // Delete the line
      ed.executeEdits('', [{
        range: new monaco.Range(
          selection.startLineNumber, 1,
          selection.startLineNumber + 1, 1
        ),
        text: ''
      }]);
    } else {
      ed.trigger('', 'editor.action.clipboardCutAction', null);
    }
  }
});
```

---

### Phase 3: Project Sidebar

**Goal**: Folder tree with multi-project support

**Files to create**:
1. `src/renderer/sidebar/Sidebar.ts` - Container component
2. `src/renderer/sidebar/FolderTree.ts` - Tree view rendering
3. `src/renderer/sidebar/ProjectManager.ts` - Project state management
4. `src/main/services/folderService.ts` - Directory reading & watching

**Tree Node Structure**:
```typescript
interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder' | 'project';
  children?: TreeNode[];
  isExpanded?: boolean;
  icon?: string;
}
```

**File Watching**:
- Use `chokidar` for cross-platform file system watching
- Detect external file changes and prompt for reload
- Update tree view when files are added/removed

---

### Phase 5: Search & Replace

**Goal**: Full in-document search with replace

**Files to create**:
1. `src/renderer/search/SearchBar.ts` - Search UI component
2. `src/renderer/search/SearchState.ts` - Search state management

**Search Features**:
- Real-time match highlighting as you type
- Match occurrence counter (e.g., "3 of 15")
- Next/Previous navigation buttons
- Case sensitivity toggle (smart: auto-case when search has uppercase)
- Whole word matching toggle
- Regular expression toggle
- Cyclic search (wrap around document end)
- Replace and Replace All

**Search Settings** (from Elementary Code schema):
```typescript
interface SearchSettings {
  cyclicSearch: boolean;        // Wrap search at end of document
  wholeWordSearch: boolean;     // Match whole words only
  regexSearch: boolean;         // Use regex patterns
  caseSensitiveSearch: 'never' | 'mixed' | 'always';
  // 'mixed' = case-sensitive only when search term has uppercase
}
```

---

## Complete Keyboard Shortcut Reference

| Action         | Shortcut         | Monaco Built-in? | Implementation    |
| -------------- | ---------------- | ---------------- | ----------------- |
| New Tab        | `Ctrl+N`         | No               | Custom action     |
| Open File      | `Ctrl+O`         | No               | IPC to main       |
| Open Folder    | `Ctrl+Shift+O`   | No               | IPC to main       |
| Save           | `Ctrl+S`         | No               | IPC to main       |
| Save As        | `Ctrl+Shift+S`   | No               | IPC to main       |
| Find           | `Ctrl+F`         | Yes              | Built-in          |
| Find Next      | `Ctrl+G`         | Yes              | Built-in          |
| Find Previous  | `Ctrl+Shift+G`   | Yes              | Built-in          |
| Replace        | `Ctrl+R`         | Almost           | Remap from Ctrl+H |
| Go to Line     | `Ctrl+I`         | Almost           | Remap from Ctrl+G |
| Sort Lines     | `F5`             | No               | Custom action     |
| Duplicate Line | `Ctrl+D`         | Yes              | Built-in          |
| Undo           | `Ctrl+Z`         | Yes              | Built-in          |
| Redo           | `Ctrl+Shift+Z`   | Yes              | Built-in          |
| Lowercase      | `Ctrl+L`         | Yes              | Built-in          |
| Uppercase      | `Ctrl+U`         | Yes              | Built-in          |
| Toggle Comment | `Ctrl+/`         | Yes              | Built-in          |
| Toggle Sidebar | `F9`             | No               | Custom action     |
| Fullscreen     | `F11`            | No               | Electron API      |
| Zoom In        | `Ctrl++`         | No               | Font size change  |
| Zoom Out       | `Ctrl+-`         | No               | Font size change  |
| Reset Zoom     | `Ctrl+0`         | No               | Font size reset   |
| Next Tab       | `Ctrl+Tab`       | No               | Custom action     |
| Previous Tab   | `Ctrl+Shift+Tab` | No               | Custom action     |
| Close Tab      | `Ctrl+W`         | No               | Custom action     |
| Clear Line     | `Ctrl+K`         | No               | Custom action     |
| Add Mark       | `Alt+=`          | No               | Custom action     |
| Previous Mark  | `Alt+Left`       | No               | Custom action     |
| Next Mark      | `Alt+Right`      | No               | Custom action     |
| Quit           | `Ctrl+Q`         | No               | Electron API      |

---

## Dependencies

```json
{
  "dependencies": {
    "monaco-editor": "^0.44.0",
    "chokidar": "^3.5.3"
  },
  "devDependencies": {
    "electron": "^28.0.0",
    "electron-builder": "^24.9.0",
    "typescript": "^5.3.0",
    "esbuild": "^0.19.0"
  }
}
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     MyCode Application                       │
├─────────────────────────────────────────────────────────────┤
│  Main Process (Node.js)                                      │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│  │ FileService  │ │ Settings     │ │ FolderService│         │
│  │ - read/write │ │ - load/save  │ │ - tree/watch │         │
│  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘         │
│         │                │                │                  │
│         └────────────────┴────────────────┘                  │
│                          │ IPC                               │
├──────────────────────────┼──────────────────────────────────┤
│  Renderer Process        │                                   │
│  ┌───────────────────────┴───────────────────────────────┐  │
│  │                    Main Window                         │  │
│  │  ┌─────────────┐  ┌───────────────────────────────┐   │  │
│  │  │  Sidebar    │  │        Editor Area             │   │  │
│  │  │             │  │  ┌─────────────────────────┐   │   │  │
│  │  │ - Projects  │  │  │      Tab Bar            │   │   │  │
│  │  │ - Tree View │  │  ├─────────────────────────┤   │   │  │
│  │  │             │  │  │      Search Bar         │   │   │  │
│  │  │             │  │  ├─────────────────────────┤   │   │  │
│  │  │             │  │  │                         │   │   │  │
│  │  │             │  │  │     Monaco Editor       │   │   │  │
│  │  │             │  │  │                         │   │   │  │
│  │  │             │  │  │                         │   │   │  │
│  │  └─────────────┘  │  └─────────────────────────┘   │   │  │
│  │                   └───────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Future Phases (Post-MVP)

### Phase 9: Markdown Preview
- Side-by-side live preview for `.md` files
- Manual toggle via View menu
- Sync scroll between editor and preview
- Style preview to match editor theme

### Phase 4: Git Integration
- Branch display in sidebar
- Gutter diff indicators
- Commit/push/pull functionality
- Branch creation/switching

### Phase 6: Symbol Outline
- Parse symbols using Monaco API
- Collapsible tree view in right sidebar
- Click to navigate
- Filter by type

### Phase 7: Integrated Terminal
- xterm.js for terminal emulation
- node-pty for shell process
- Per-project working directory

### Phase 8: Plugin System
- Plugin discovery and loading
- Plugin API definition
- Built-in plugins (brackets, indent detection, etc.)

