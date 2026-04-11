# MyCode User Guide

A comprehensive guide to using MyCode, a modern cross-platform code editor.

## Table of Contents

1. [Getting Started](#getting-started)
2. [The Interface](#the-interface)
3. [Working with Files](#working-with-files)
4. [Editing Code](#editing-code)
5. [Search and Replace](#search-and-replace)
6. [Project Sidebar](#project-sidebar)
7. [Integrated Terminal](#integrated-terminal)
8. [Git Integration](#git-integration)
9. [Markdown Preview](#markdown-preview)
10. [Plugins](#plugins)
11. [Preferences](#preferences)
12. [Keyboard Shortcuts](#keyboard-shortcuts)

---

## Getting Started

### Launching MyCode

After installation, launch MyCode from your applications menu or run:

```bash
npm start
```

### Welcome Screen

When you first open MyCode with no files, you'll see the Welcome screen with quick actions:
- **New File** - Create a new untitled file
- **Open File** - Open an existing file
- **Open Folder** - Open a project folder

---

## The Interface

MyCode's interface consists of several key areas:

```
┌─────────────────────────────────────────────────────────────┐
│  Menu Bar                                                    │
├──────────┬──────────────────────────────────────────────────┤
│          │  Tab Bar                                          │
│ Sidebar  ├──────────────────────────────────────────────────┤
│          │                                                   │
│ - Files  │              Editor Area                          │
│ - Plugins│                                                   │
│          │                                                   │
├──────────┴──────────────────────────────────────────────────┤
│  Terminal (toggle with Ctrl+`)                               │
├─────────────────────────────────────────────────────────────┤
│  Status Bar                                                  │
└─────────────────────────────────────────────────────────────┘
```

### Sidebar

The sidebar on the left contains:
- **Files Tab** (📁) - Project folder tree
- **Plugin Tabs** - Additional panels from plugins (Symbol Outline, Diff Viewer, etc.)

Toggle the sidebar with `F9`.

### Tab Bar

Open files appear as tabs at the top of the editor. Features:
- Click a tab to switch to that file
- Click the × to close a tab
- Modified files show a dot (●) indicator
- Diff comparisons appear as special tabs with ⇄ prefix

### Status Bar

The bottom status bar shows:
- Current git branch (if in a git repository)
- Cursor position (line:column)
- File language/type
- Plugin status items

---

## Working with Files

### Opening Files

- **Menu**: File → Open File (`Ctrl+O`)
- **Sidebar**: Click any file in the folder tree
- **Drag & Drop**: Drag files onto the editor window

### Opening Folders

- **Menu**: File → Open Folder (`Ctrl+Shift+O`)
- **Sidebar**: Click "Open Folder" button

You can open multiple folders simultaneously - they appear as separate project roots in the sidebar.

### Creating New Files

- **Menu**: File → New Tab (`Ctrl+N`)
- **Sidebar**: Right-click a folder → New File

### Saving Files

- **Save**: `Ctrl+S` - Save current file
- **Save As**: `Ctrl+Shift+S` - Save with a new name

If **Auto-save** is enabled in preferences, files save automatically after changes.

### Closing Files

- Click the × on the tab
- Press `Ctrl+W`
- Right-click tab for more options

---

## Editing Code

### Syntax Highlighting

MyCode automatically detects the language based on file extension and applies syntax highlighting for 50+ languages including:
- JavaScript, TypeScript, Python, Rust, Go, C/C++, Java
- HTML, CSS, SCSS, JSON, YAML, Markdown
- And many more...

### Smart Editing Features

#### Smart Cut/Copy
When no text is selected:
- `Ctrl+X` cuts the entire current line
- `Ctrl+C` copies the entire current line

#### Line Operations
| Action | Shortcut | Description |
|--------|----------|-------------|
| Duplicate Line | `Ctrl+D` | Duplicate current line or selection |
| Sort Lines | `F5` | Alphabetically sort selected lines |
| Clear Line | `Ctrl+K` | Delete the current line |
| Toggle Comment | `Ctrl+/` | Comment/uncomment current line |

#### Case Transform

| Action | Shortcut |
|--------|----------|
| Lowercase | `Ctrl+L` |
| Uppercase | `Ctrl+U` |

### Navigation Marks

Set marks to quickly jump between locations:

| Action | Shortcut |
|--------|----------|
| Add Mark | `Alt+=` |
| Previous Mark | `Alt+←` |
| Next Mark | `Alt+→` |

### Code Folding

Click the arrows in the gutter (left margin) to fold/unfold code blocks.

### Minimap

Enable the minimap in Preferences to see a zoomed-out view of your code on the right side of the editor.

---

## Search and Replace

### Opening Search

- Press `Ctrl+F` to open the search bar
- Press `Ctrl+R` to open search with replace

### Search Features

The search bar appears at the top of the editor with these options:

| Option | Description |
|--------|-------------|
| **Case Sensitive** | Match exact case (auto-detects if search has uppercase) |
| **Whole Word** | Match complete words only |
| **Regex** | Use regular expression patterns |

### Navigation

- `Ctrl+G` or `Enter` - Find next match
- `Ctrl+Shift+G` or `Shift+Enter` - Find previous match
- Match counter shows "3 of 15" style progress

### Replace

1. Press `Ctrl+R` to show replace field
2. Enter replacement text
3. Click **Replace** to replace current match
4. Click **Replace All** to replace all matches

### Cyclic Search

Enable in Preferences to wrap around when reaching the end of the document.

---

## Project Sidebar

### Folder Tree

The sidebar shows your project folders as expandable trees:
- Click folders to expand/collapse
- Click files to open them
- File icons indicate file types (30+ types supported)

### Multi-Project Support

Open multiple folders to work on several projects simultaneously. Each appears as a separate root in the tree.

### Context Menu

Right-click on files or folders for options:
- **New File** - Create a new file in this location
- **New Folder** - Create a new folder
- **Rename** - Rename the file or folder
- **Delete** - Delete (moves to trash)

### Removing Projects

Click the × button next to a project root to remove it from the sidebar (doesn't delete files).

---

## Integrated Terminal

### Opening the Terminal

- Press `` Ctrl+` `` (backtick) to toggle the terminal
- Or use View → Toggle Terminal

### Features

- Full terminal emulation with color support
- Starts in your project's root directory
- Supports all your shell's features (bash, zsh, etc.)
- Resizable - drag the top edge to resize

### Tips

- The terminal persists between toggles
- Use standard terminal shortcuts (Ctrl+C, Ctrl+D, etc.)
- Multiple terminal sessions are supported

---

## Git Integration

MyCode provides built-in git integration for repositories.

### Status Bar

When in a git repository, the status bar shows:
- Current branch name
- Click to see git options

### Gutter Decorations

The editor gutter shows line-by-line changes:
- **Green bar** - Added lines
- **Blue bar** - Modified lines
- **Red triangle** - Deleted lines

### Commit Dialog

Access via the git menu or status bar:
1. View changed files
2. Stage files for commit
3. Enter commit message
4. Commit changes

### Diff Viewer Plugin

Compare files using the Diff Viewer plugin:
1. Click the ⇄ icon in the sidebar
2. Choose comparison mode:
   - **Compare Any Two Files** - Select two files to compare
   - **Compare with Git HEAD** - Compare current file with last commit

Diffs open as tabs in the editor with side-by-side comparison.

---

## Markdown Preview

### Opening Preview

For `.md` files:
- Press `Ctrl+Shift+P` to toggle preview
- Or use View → Toggle Markdown Preview

### Features

- **Live Preview** - Updates as you type
- **Side-by-Side** - Editor and preview shown together
- **Scroll Sync** - Scrolling syncs between editor and preview
- **Theme Aware** - Preview matches your editor theme

---

## Plugins

MyCode supports plugins for extended functionality.

### Built-in Plugins

| Plugin | Description |
|--------|-------------|
| **Symbol Outline** | Shows document symbols (functions, classes) in sidebar |
| **Diff Viewer** | Compare files or view git changes |
| **JSON Formatter** | Format JSON files with format-on-save |
| **Hello World** | Example plugin for developers |

### Using Plugins

Plugins may add:
- **Sidebar Panels** - Click plugin icons in the sidebar
- **Status Bar Items** - Information in the status bar
- **Commands** - New actions and features
- **Formatters** - Auto-format code on save

### Plugin Manager

Access via View → Plugin Manager:
- View all installed plugins
- Enable or disable plugins
- See plugin descriptions

### Disabling Plugins

- Open Plugin Manager and toggle the switch
- Or right-click a plugin's sidebar tab → Disable Plugin

### Installing Plugins

Place plugins in `~/.config/mycode/plugins/`. Each plugin needs:
- A folder with the plugin name
- A `package.json` manifest
- A `renderer.js` entry point

See the [Plugin Development Guide](./PLUGIN_DEVELOPMENT_GUIDE.md) for creating plugins.

---

## Preferences

Access preferences via Edit → Preferences or `Ctrl+,`.

### Theme Settings

| Setting | Description |
|---------|-------------|
| **Follow System Style** | Automatically switch between light/dark themes based on OS |
| **Editor Theme** | Choose from: VS Light, VS Dark, Monokai, Dracula, GitHub, Nord, One Dark Pro |

### Editor Settings

| Setting | Default | Description |
|---------|---------|-------------|
| **Auto-save** | On | Automatically save files after changes |
| **Smart Cut/Copy** | On | Cut/copy entire line when no selection |
| **Line Wrap** | On | Wrap long lines to fit the editor width |
| **Highlight Matching Brackets** | On | Highlight matching brackets when cursor is nearby |
| **Show Minimap** | Off | Show code overview on right side of editor |
| **Spaces Instead of Tabs** | On | Insert spaces when pressing Tab |
| **Auto Indent** | On | Automatically indent new lines |
| **Indent Width** | 4 | Number of spaces per indentation level |
| **Font** | System | Editor font family |
| **Font Size** | 14 | Editor font size in pixels |
| **Format on Save** | On | Auto-format code when saving (if formatter available) |

### Search Settings

| Setting | Default | Description |
|---------|---------|-------------|
| **Cyclic Search** | Off | Wrap around to start when reaching end |
| **Case Sensitivity** | Mixed | Never, Mixed (auto-detect), or Always |

---

## Keyboard Shortcuts

### File Operations

| Action | Shortcut |
|--------|----------|
| New Tab | `Ctrl+N` |
| Open File | `Ctrl+O` |
| Open Folder | `Ctrl+Shift+O` |
| Save | `Ctrl+S` |
| Save As | `Ctrl+Shift+S` |
| Close Tab | `Ctrl+W` |
| Quit | `Ctrl+Q` |

### Editing

| Action | Shortcut |
|--------|----------|
| Undo | `Ctrl+Z` |
| Redo | `Ctrl+Shift+Z` or `Ctrl+Y` |
| Cut | `Ctrl+X` |
| Copy | `Ctrl+C` |
| Paste | `Ctrl+V` |
| Select All | `Ctrl+A` |
| Duplicate Line | `Ctrl+D` |
| Delete Line | `Ctrl+K` |
| Sort Lines | `F5` |
| Toggle Comment | `Ctrl+/` |
| Lowercase | `Ctrl+L` |
| Uppercase | `Ctrl+U` |

### Navigation

| Action | Shortcut |
|--------|----------|
| Find | `Ctrl+F` |
| Replace | `Ctrl+R` |
| Find Next | `Ctrl+G` or `Enter` |
| Find Previous | `Ctrl+Shift+G` or `Shift+Enter` |
| Go to Line | `Ctrl+Shift+L` |
| Add Mark | `Alt+=` |
| Previous Mark | `Alt+←` |
| Next Mark | `Alt+→` |

### View

| Action | Shortcut |
|--------|----------|
| Toggle Sidebar | `F9` |
| Toggle Terminal | `` Ctrl+` `` |
| Toggle Markdown Preview | `Ctrl+Shift+P` |
| Preferences | `Ctrl+,` |
| Zoom In | `Ctrl+=` |
| Zoom Out | `Ctrl+-` |
| Reset Zoom | `Ctrl+0` |

---

## Getting Help

- **Documentation**: See the `docs/` folder for detailed guides
- **Plugin Development**: See [Plugin Development Guide](./PLUGIN_DEVELOPMENT_GUIDE.md)
- **Source Code**: Available on GitHub

---

*MyCode - A modern, extensible code editor*
