# MyCode - Cross-Platform Code Editor

A modern, cross-platform code editor inspired by Elementary Code, built with Electron and Monaco Editor.

## Features (MVP Scope)

### Phase 1: Core Application
- Electron-based window management
- File open/save/manage operations
- Settings persistence
- Native menus

### Phase 2: Editor Core
- Monaco Editor with syntax highlighting for 50+ languages
- Elementary Code-style keyboard shortcuts
- Smart cut/copy (copies entire line when no selection)
- Line duplication (`Ctrl+D`)
- Line sorting (`F5`)
- Comment toggling (`Ctrl+/`)
- Navigation marks

### Phase 3: Project Sidebar
- Folder tree view
- Multi-project support
- File monitoring for external changes
- Context menu actions

### Phase 5: Search & Replace
- In-document search with highlighting
- Find & replace functionality
- Regex support
- Case sensitivity options
- Whole word matching

## Tech Stack

- **Framework**: Electron
- **Editor**: Monaco Editor
- **Language**: TypeScript
- **UI**: React (optional) or vanilla DOM
- **Build**: electron-builder

## Getting Started

### Quick Setup (Recommended)

Run the setup script to automatically detect and configure your environment:

```bash
./scripts/setup.sh
```

### Option 1: Nix Flakes (Best for Multi-PC Development)

If you move between multiple dev machines, **Nix** provides a completely reproducible environment with all dependencies (Node.js, npm, and Electron system libraries).

```bash
# Install Nix (one-time setup per machine)
curl --proto '=https' --tlsv1.2 -sSf -L https://install.determinate.systems/nix | sh -s -- install

# Enter the dev environment
nix develop

# Install npm packages and start developing
npm install
npm run dev
```

**Tip:** Install [direnv](https://direnv.net/) for automatic shell activation:
```bash
# After installing direnv, run once:
direnv allow
# Now the Nix shell activates automatically when you cd into the project!
```

### Option 2: System Node.js

If you prefer using your system's Node.js:

```bash
# Ubuntu/Debian
sudo apt install nodejs npm

# Fedora
sudo dnf install nodejs npm

# Arch Linux
sudo pacman -S nodejs npm

# macOS (Homebrew)
brew install node

# Then install dependencies and run
npm install
npm run dev
```

### Option 3: nvm (Node Version Manager)

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Install and use Node.js 20
nvm install 20
nvm use 20

# Install dependencies and run
npm install
npm run dev
```

### Development Commands

```bash
npm run dev      # Start development mode (watch + compile)
npm run build    # Build for production
npm start        # Run the compiled app
npm run pack     # Package for current platform (unpacked)
npm run dist     # Build distributable installers
```

## Keyboard Shortcuts

| Action         | Shortcut       |
| -------------- | -------------- |
| New Tab        | `Ctrl+N`       |
| Open File      | `Ctrl+O`       |
| Open Folder    | `Ctrl+Shift+O` |
| Save           | `Ctrl+S`       |
| Save As        | `Ctrl+Shift+S` |
| Find           | `Ctrl+F`       |
| Find Next      | `Ctrl+G`       |
| Find Previous  | `Ctrl+Shift+G` |
| Replace        | `Ctrl+R`       |
| Duplicate Line | `Ctrl+D`       |
| Toggle Comment | `Ctrl+/`       |
| Sort Lines     | `F5`           |
| Clear Line     | `Ctrl+K`       |
| Toggle Sidebar | `F9`           |
| Close Tab      | `Ctrl+W`       |
| Quit           | `Ctrl+Q`       |

## Project Structure

```
MyCode/
├── package.json
├── tsconfig.json
├── electron-builder.yml
├── src/
│   ├── main/              # Electron main process
│   │   ├── main.ts
│   │   ├── menu.ts
│   │   ├── ipc.ts
│   │   └── services/
│   │       ├── fileService.ts
│   │       └── settingsService.ts
│   ├── renderer/          # Browser/UI code
│   │   ├── index.html
│   │   ├── index.ts
│   │   ├── App.ts
│   │   ├── editor/
│   │   ├── sidebar/
│   │   └── search/
│   └── shared/            # Shared types
│       ├── types.ts
│       └── ipc-channels.ts
├── resources/             # Icons and assets
└── docs/                  # Documentation
```

## License

GPL-3.0 (matching Elementary Code license)
