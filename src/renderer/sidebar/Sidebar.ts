/**
 * MyCode - Sidebar Component
 * Displays project folder tree and handles file navigation
 */

import { TreeNode, GitFileStatus } from '../../shared/types';

/** Git status for a file in the tree */
type FileGitStatus = 'modified' | 'added' | 'untracked' | 'deleted' | 'renamed' | 'conflicted' | null;

export class Sidebar {
    private container: HTMLElement;
    private contextMenu: HTMLElement;
    private onFileSelect: (node: TreeNode) => void;
    private onFolderSelect: (node: TreeNode) => void;
    private onFolderRemove: (path: string) => void;
    private onFileCreated: (filePath: string) => void;
    private onOpenFolder: (() => void) | null = null;
    private folders: Map<string, TreeNode> = new Map();
    private contextTarget: TreeNode | null = null;

    // Git status tracking
    private gitRepoRoot: string = '';
    private gitFileStatuses: Map<string, FileGitStatus> = new Map();
    private gitFoldersWithChanges: Set<string> = new Set();

    constructor(
        onFileSelect: (node: TreeNode) => void,
        onFolderSelect: (node: TreeNode) => void,
        onFolderRemove: (path: string) => void,
        onFileCreated?: (filePath: string) => void
    ) {
        this.container = document.getElementById('folder-tree')!;
        this.contextMenu = document.getElementById('context-menu')!;
        this.onFileSelect = onFileSelect;
        this.onFolderSelect = onFolderSelect;
        this.onFolderRemove = onFolderRemove;
        this.onFileCreated = onFileCreated || (() => { });

        this.setupContextMenu();
    }

    /**
     * Set callback for when user clicks "Open Folder" button in empty state
     */
    setOnOpenFolder(callback: () => void): void {
        this.onOpenFolder = callback;
    }

    private setupContextMenu(): void {
        // Hide context menu when clicking elsewhere
        document.addEventListener('click', () => this.hideContextMenu());
        document.addEventListener('contextmenu', (e) => {
            // Only handle context menu on sidebar
            if (!this.container.contains(e.target as Node)) {
                this.hideContextMenu();
            }
        });

        // Handle context menu actions
        this.contextMenu.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.dataset.action;
                this.handleContextAction(action || '');
                this.hideContextMenu();
            });
        });
    }

    private showContextMenu(x: number, y: number, node: TreeNode): void {
        this.contextTarget = node;
        this.contextMenu.style.left = `${x}px`;
        this.contextMenu.style.top = `${y}px`;
        this.contextMenu.classList.remove('hidden');

        // Adjust position if menu would go off screen
        const rect = this.contextMenu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            this.contextMenu.style.left = `${x - rect.width}px`;
        }
        if (rect.bottom > window.innerHeight) {
            this.contextMenu.style.top = `${y - rect.height}px`;
        }
    }

    private hideContextMenu(): void {
        this.contextMenu.classList.add('hidden');
        this.contextTarget = null;
    }

    private async handleContextAction(action: string): Promise<void> {
        if (!this.contextTarget) return;

        const targetPath = this.contextTarget.path;
        const isFolder = this.contextTarget.type !== 'file';
        const basePath = isFolder ? targetPath : targetPath.substring(0, targetPath.lastIndexOf('/'));

        switch (action) {
            case 'new-file': {
                const name = prompt('Enter file name:');
                if (name) {
                    const filePath = `${basePath}/${name}`;
                    const result = await window.mycode.folder.createFile(filePath);
                    if (result.success) {
                        await this.refreshFolder(basePath);
                        this.onFileCreated(filePath);
                    } else {
                        alert(`Failed to create file: ${result.error}`);
                    }
                }
                break;
            }
            case 'new-folder': {
                const name = prompt('Enter folder name:');
                if (name) {
                    const folderPath = `${basePath}/${name}`;
                    const result = await window.mycode.folder.createFolder(folderPath);
                    if (result.success) {
                        await this.refreshFolder(basePath);
                    } else {
                        alert(`Failed to create folder: ${result.error}`);
                    }
                }
                break;
            }
            case 'rename': {
                const oldName = this.contextTarget.name;
                const newName = prompt('Enter new name:', oldName);
                if (newName && newName !== oldName) {
                    const parentPath = targetPath.substring(0, targetPath.lastIndexOf('/'));
                    const newPath = `${parentPath}/${newName}`;
                    const result = await window.mycode.folder.rename(targetPath, newPath);
                    if (result.success) {
                        await this.refreshFolder(parentPath);
                    } else {
                        alert(`Failed to rename: ${result.error}`);
                    }
                }
                break;
            }
            case 'delete': {
                const confirmed = confirm(`Are you sure you want to delete "${this.contextTarget.name}"?`);
                if (confirmed) {
                    const result = await window.mycode.folder.delete(targetPath);
                    if (result.success) {
                        const parentPath = targetPath.substring(0, targetPath.lastIndexOf('/'));
                        await this.refreshFolder(parentPath);
                    } else {
                        alert(`Failed to delete: ${result.error}`);
                    }
                }
                break;
            }
        }
    }

    private async refreshFolder(folderPath: string): Promise<void> {
        // Find the root folder this path belongs to
        for (const [rootPath, tree] of this.folders) {
            if (folderPath.startsWith(rootPath)) {
                // Re-read the root and update
                const newTree = await window.mycode.folder.read(rootPath);
                newTree.isExpanded = tree.isExpanded;
                this.preserveExpandedState(tree, newTree);
                this.folders.set(rootPath, newTree);
                this.render();
                return;
            }
        }
    }

    private preserveExpandedState(oldNode: TreeNode, newNode: TreeNode): void {
        if (oldNode.children && newNode.children) {
            for (const newChild of newNode.children) {
                const oldChild = oldNode.children.find(c => c.path === newChild.path);
                if (oldChild) {
                    newChild.isExpanded = oldChild.isExpanded;
                    this.preserveExpandedState(oldChild, newChild);
                }
            }
        }
    }

    addFolder(tree: TreeNode): void {
        this.folders.set(tree.path, tree);
        this.render();
    }

    removeFolder(path: string): void {
        this.folders.delete(path);
        this.onFolderRemove(path);
        this.render();
    }

    /**
     * Update Git status for files in the tree
     * @param repoRoot The root path of the git repository
     * @param files Array of files with git status
     */
    updateGitStatus(repoRoot: string, files: GitFileStatus[]): void {
        this.gitRepoRoot = repoRoot;
        this.gitFileStatuses.clear();
        this.gitFoldersWithChanges.clear();

        // Build a map of file paths to their git status
        for (const file of files) {
            // Convert relative path to absolute path
            const absolutePath = repoRoot + '/' + file.path;
            this.gitFileStatuses.set(absolutePath, file.status);

            // Mark all parent folders as having changes
            let parentPath = absolutePath.substring(0, absolutePath.lastIndexOf('/'));
            while (parentPath.length >= repoRoot.length) {
                this.gitFoldersWithChanges.add(parentPath);
                const nextSlash = parentPath.lastIndexOf('/');
                if (nextSlash < 0) break;
                parentPath = parentPath.substring(0, nextSlash);
            }
        }

        this.render();
    }

    /**
     * Clear Git status (e.g., when folder is not a git repo)
     */
    clearGitStatus(): void {
        this.gitRepoRoot = '';
        this.gitFileStatuses.clear();
        this.gitFoldersWithChanges.clear();
        this.render();
    }

    /**
     * Get the git status for a specific file path
     */
    private getFileGitStatus(filePath: string): FileGitStatus {
        return this.gitFileStatuses.get(filePath) || null;
    }

    /**
     * Check if a folder contains any files with git changes
     */
    private folderHasGitChanges(folderPath: string): boolean {
        return this.gitFoldersWithChanges.has(folderPath);
    }

    async toggleFolder(node: TreeNode): Promise<void> {
        if (node.isExpanded) {
            // Collapsing - just toggle
            node.isExpanded = false;
            this.render();
        } else {
            // Expanding - use expandFolder for lazy loading
            await this.expandFolder(node);
        }
    }

    private render(): void {
        if (this.folders.size === 0) {
            this.container.innerHTML = `
        <div class="empty-state">
          <p>No folders open</p>
          <button id="btn-open-folder">Open Folder</button>
        </div>
      `;
            // Attach event listener to the dynamically created button
            const openFolderBtn = this.container.querySelector('#btn-open-folder');
            if (openFolderBtn && this.onOpenFolder) {
                openFolderBtn.addEventListener('click', () => this.onOpenFolder?.());
            }
            return;
        }

        this.container.innerHTML = '';
        for (const tree of this.folders.values()) {
            const element = this.renderNode(tree, 0);
            this.container.appendChild(element);
        }
    }

    private renderNode(node: TreeNode, depth: number): HTMLElement {
        const element = document.createElement('div');
        element.className = `tree-node ${node.type}`;
        element.style.paddingLeft = `${depth * 16 + 8}px`;

        const icon = this.getIcon(node);
        const expandIcon = node.type !== 'file'
            ? (node.isExpanded ? '▼' : '▶')
            : '';

        // Get git status for this node
        const gitStatus = node.type === 'file'
            ? this.getFileGitStatus(node.path)
            : null;
        const folderHasChanges = node.type !== 'file'
            ? this.folderHasGitChanges(node.path)
            : false;

        // Build git indicator HTML
        const gitIndicator = this.getGitIndicatorHtml(gitStatus, folderHasChanges);
        const gitClass = gitStatus ? `git-${gitStatus}` : (folderHasChanges ? 'git-folder-changed' : '');

        if (gitClass) {
            element.classList.add(gitClass);
        }

        element.innerHTML = `
      <span class="tree-expand">${expandIcon}</span>
      <span class="tree-icon">${icon}</span>
      <span class="tree-name">${node.name}</span>
      ${gitIndicator}
    `;

        if (node.type === 'project') {
            element.classList.add('project-root');

            // Add close button for project folders
            const closeBtn = document.createElement('button');
            closeBtn.className = 'tree-close';
            closeBtn.innerHTML = '×';
            closeBtn.title = 'Close folder';
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeFolder(node.path);
            });
            element.appendChild(closeBtn);
        }

        // Context menu (right-click)
        element.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.showContextMenu(e.clientX, e.clientY, node);
        });

        element.addEventListener('click', (e) => {
            e.stopPropagation();
            if (node.type === 'file') {
                this.onFileSelect(node);
            } else {
                this.onFolderSelect(node);
            }
        });

        // Double-click to expand/collapse folders
        if (node.type !== 'file') {
            element.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                this.toggleFolder(node);
            });
        }

        // Render children if expanded
        if (node.isExpanded && node.children && node.children.length > 0) {
            const childContainer = document.createElement('div');
            childContainer.className = 'tree-children';

            for (const child of node.children) {
                const childElement = this.renderNode(child, depth + 1);
                childContainer.appendChild(childElement);
            }

            const wrapper = document.createElement('div');
            wrapper.appendChild(element);
            wrapper.appendChild(childContainer);
            return wrapper;
        }

        return element;
    }

    private getIcon(node: TreeNode): string {
        if (node.type === 'project') {
            return '📁';
        }
        if (node.type === 'folder') {
            return node.isExpanded ? '📂' : '📁';
        }

        // File icons based on extension
        const ext = node.name.split('.').pop()?.toLowerCase() || '';
        const iconMap: Record<string, string> = {
            // Code files
            'js': '📜',
            'jsx': '⚛️',
            'ts': '📘',
            'tsx': '⚛️',
            'py': '🐍',
            'rb': '💎',
            'java': '☕',
            'c': '🔧',
            'cpp': '🔧',
            'h': '🔧',
            'cs': '🎯',
            'go': '🐹',
            'rs': '🦀',
            'php': '🐘',
            'swift': '🐦',
            'kt': '🎯',
            'vala': '🧬',

            // Web files
            'html': '🌐',
            'css': '🎨',
            'scss': '🎨',
            'less': '🎨',

            // Data files
            'json': '📋',
            'xml': '📋',
            'yaml': '📋',
            'yml': '📋',
            'toml': '📋',

            // Doc files
            'md': '📝',
            'txt': '📄',
            'pdf': '📕',
            'doc': '📄',
            'docx': '📄',

            // Config files
            'gitignore': '🔒',
            'env': '🔐',
            'lock': '🔒',

            // Image files
            'png': '🖼️',
            'jpg': '🖼️',
            'jpeg': '🖼️',
            'gif': '🖼️',
            'svg': '🖼️',
            'ico': '🖼️',

            // Shell
            'sh': '💻',
            'bash': '💻',
            'zsh': '💻',
            'fish': '💻',
            'ps1': '💻',
        };

        return iconMap[ext] || '📄';
    }

    /**
     * Get HTML for git status indicator
     */
    private getGitIndicatorHtml(status: FileGitStatus, folderHasChanges: boolean): string {
        if (status) {
            const indicators: Record<string, { symbol: string; title: string }> = {
                'modified': { symbol: 'M', title: 'Modified' },
                'added': { symbol: 'A', title: 'Added (staged)' },
                'untracked': { symbol: 'U', title: 'Untracked (new file)' },
                'deleted': { symbol: 'D', title: 'Deleted' },
                'renamed': { symbol: 'R', title: 'Renamed' },
                'conflicted': { symbol: '!', title: 'Conflict' },
            };
            const indicator = indicators[status];
            if (indicator) {
                return `<span class="git-indicator git-indicator-${status}" title="${indicator.title}">${indicator.symbol}</span>`;
            }
        }

        if (folderHasChanges) {
            return `<span class="git-indicator git-indicator-folder" title="Contains changes">●</span>`;
        }

        return '';
    }

    async expandFolder(node: TreeNode): Promise<void> {
        if (node.type === 'file') return;

        // Lazy load children if not already loaded
        if (node.children && node.children.length === 0) {
            try {
                const fullTree = await window.mycode.folder.read(node.path);
                node.children = fullTree.children;
            } catch (e) {
                console.error('Failed to load folder:', e);
            }
        }

        node.isExpanded = true;
        this.render();
    }
}
