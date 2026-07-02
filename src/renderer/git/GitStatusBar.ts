/**
 * Git Status Bar Component
 * Displays branch info, changes count, and push/pull buttons
 */

import { GitStatus, GitBranchInfo } from '../../shared/types';
import { showInputDialog } from '../dialogs/InputDialog';

export class GitStatusBar {
    private container: HTMLElement;
    private branchElement: HTMLElement | null = null;
    private changesElement: HTMLElement | null = null;
    private syncElement: HTMLElement | null = null;
    private initElement: HTMLElement | null = null;
    private branchDropdown: HTMLElement | null = null;
    private currentRepoPath: string = '';
    private currentFolderPath: string = '';
    private status: GitStatus | null = null;
    private refreshInterval: number | null = null;
    private dropdownVisible: boolean = false;

    // Callbacks
    public onCommit: (() => void) | null = null;
    public onPush: (() => void) | null = null;
    public onPull: (() => void) | null = null;
    public onStatusChange: ((status: GitStatus | null, repoPath: string) => void) | null = null;
    public onInit: (() => void) | null = null;
    public onBranchChange: (() => void) | null = null;

    constructor() {
        this.container = document.getElementById('git-status-bar') || this.createContainer();
        this.render();
    }

    private createContainer(): HTMLElement {
        const container = document.createElement('div');
        container.id = 'git-status-bar';
        container.className = 'git-status-bar';

        // Find status bar or create one at the bottom of main-content
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.appendChild(container);
        }

        return container;
    }

    private render(): void {
        this.container.innerHTML = `
            <div class="git-branch">
                <span class="git-icon">⎇</span>
                <span class="branch-name clickable" title="Click to switch branches">Not a Git repo</span>
                <span class="branch-dropdown-arrow hidden">▼</span>
                <div class="branch-dropdown hidden">
                    <div class="branch-dropdown-header">Branches</div>
                    <div class="branch-list"></div>
                    <div class="branch-dropdown-divider"></div>
                    <div class="branch-create-new">+ Create New Branch...</div>
                </div>
            </div>
            <div class="git-init hidden">
                <button class="git-btn git-init-btn" title="Initialize Git Repository">Initialize Repository</button>
            </div>
            <div class="git-changes hidden">
                <span class="changes-count">0</span>
                <span class="changes-label">changes</span>
            </div>
            <div class="git-sync hidden">
                <button class="git-btn git-pull-btn" title="Pull">↓</button>
                <span class="sync-status"></span>
                <button class="git-btn git-push-btn" title="Push">↑</button>
            </div>
            <button class="git-btn git-commit-btn hidden" title="Commit (Ctrl+Shift+K)">✓ Commit</button>
        `;

        this.branchElement = this.container.querySelector('.branch-name');
        this.changesElement = this.container.querySelector('.git-changes');
        this.syncElement = this.container.querySelector('.git-sync');
        this.initElement = this.container.querySelector('.git-init');
        this.branchDropdown = this.container.querySelector('.branch-dropdown');

        // Setup event listeners
        const commitBtn = this.container.querySelector('.git-commit-btn');
        const pushBtn = this.container.querySelector('.git-push-btn');
        const pullBtn = this.container.querySelector('.git-pull-btn');
        const initBtn = this.container.querySelector('.git-init-btn');
        const branchContainer = this.container.querySelector('.git-branch');
        const createNewBtn = this.container.querySelector('.branch-create-new');

        commitBtn?.addEventListener('click', () => this.onCommit?.());
        pushBtn?.addEventListener('click', () => this.handlePush());
        pullBtn?.addEventListener('click', () => this.handlePull());
        initBtn?.addEventListener('click', () => this.handleInit());

        // Branch dropdown toggle
        this.branchElement?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.status?.isRepo) {
                this.toggleBranchDropdown();
            }
        });

        // Create new branch
        createNewBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleCreateBranch();
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (this.dropdownVisible && !branchContainer?.contains(e.target as Node)) {
                this.hideBranchDropdown();
            }
        });
    }

    /**
     * Set the current repository/folder path and refresh status
     */
    async setRepository(folderPath: string): Promise<void> {
        this.currentFolderPath = folderPath;
        this.currentRepoPath = folderPath;
        await this.refresh();
    }

    /**
     * Refresh git status from the backend
     */
    async refresh(): Promise<void> {
        if (!this.currentRepoPath) {
            this.showNotRepo();
            return;
        }

        try {
            const result = await window.mycode.git.isRepo(this.currentRepoPath);
            if (!result.isRepo) {
                this.showNotRepo();
                return;
            }

            this.status = await window.mycode.git.getStatus(result.repoRoot);
            this.updateUI();
        } catch (error) {
            console.error('Failed to refresh git status:', error);
            this.showNotRepo();
        }
    }

    private showNotRepo(): void {
        this.status = null;
        if (this.branchElement) {
            this.branchElement.textContent = 'Not a Git repo';
            this.branchElement.classList.remove('clickable');
        }
        this.changesElement?.classList.add('hidden');
        this.syncElement?.classList.add('hidden');
        this.container.querySelector('.git-commit-btn')?.classList.add('hidden');

        // Hide branch dropdown elements
        this.container.querySelector('.branch-dropdown-arrow')?.classList.add('hidden');
        this.hideBranchDropdown();

        // Show init button if we have a folder path
        if (this.currentFolderPath) {
            this.initElement?.classList.remove('hidden');
        } else {
            this.initElement?.classList.add('hidden');
        }

        // Notify listeners that there's no git status
        this.onStatusChange?.(null, '');
    }

    private updateUI(): void {
        if (!this.status) return;

        // Hide init button since we have a repo
        this.initElement?.classList.add('hidden');

        // Show branch dropdown arrow since we have a repo
        this.container.querySelector('.branch-dropdown-arrow')?.classList.remove('hidden');

        // Update branch name
        if (this.branchElement) {
            const branch = this.status.branch;
            this.branchElement.textContent = branch.isDetached
                ? `HEAD detached`
                : branch.current || 'Unknown';
            this.branchElement.classList.add('clickable');
        }

        // Update changes count
        const totalChanges = this.status.staged.length + this.status.modified.length + this.status.untracked.length;
        if (totalChanges > 0) {
            this.changesElement?.classList.remove('hidden');
            const countEl = this.changesElement?.querySelector('.changes-count');
            if (countEl) {
                countEl.textContent = totalChanges.toString();
            }
            this.container.querySelector('.git-commit-btn')?.classList.remove('hidden');
        } else {
            this.changesElement?.classList.add('hidden');
            this.container.querySelector('.git-commit-btn')?.classList.add('hidden');
        }

        // Update sync status
        const branch = this.status.branch;
        if (branch.tracking) {
            this.syncElement?.classList.remove('hidden');
            const syncStatus = this.syncElement?.querySelector('.sync-status');
            if (syncStatus) {
                if (branch.ahead > 0 && branch.behind > 0) {
                    syncStatus.textContent = `↑${branch.ahead} ↓${branch.behind}`;
                } else if (branch.ahead > 0) {
                    syncStatus.textContent = `↑${branch.ahead}`;
                } else if (branch.behind > 0) {
                    syncStatus.textContent = `↓${branch.behind}`;
                } else {
                    syncStatus.textContent = '✓';
                }
            }
        } else {
            this.syncElement?.classList.add('hidden');
        }

        // Notify listeners of status change
        this.onStatusChange?.(this.status, this.currentRepoPath);
    }

    private async handlePush(): Promise<void> {
        if (!this.currentRepoPath) return;

        const pushBtn = this.container.querySelector('.git-push-btn') as HTMLButtonElement;
        if (pushBtn) {
            pushBtn.disabled = true;
            pushBtn.textContent = '...';
        }

        try {
            const result = await window.mycode.git.push(this.currentRepoPath);
            if (result.success) {
                await this.refresh();
            } else {
                console.error('Push failed:', result.error);
                alert(`Push failed: ${result.error}`);
            }
        } finally {
            if (pushBtn) {
                pushBtn.disabled = false;
                pushBtn.textContent = '↑';
            }
        }
    }

    private async handlePull(): Promise<void> {
        if (!this.currentRepoPath) return;

        const pullBtn = this.container.querySelector('.git-pull-btn') as HTMLButtonElement;
        if (pullBtn) {
            pullBtn.disabled = true;
            pullBtn.textContent = '...';
        }

        try {
            const result = await window.mycode.git.pull(this.currentRepoPath);
            if (result.success) {
                await this.refresh();
            } else {
                console.error('Pull failed:', result.error);
                alert(`Pull failed: ${result.error}`);
            }
        } finally {
            if (pullBtn) {
                pullBtn.disabled = false;
                pullBtn.textContent = '↓';
            }
        }
    }

    private async handleInit(): Promise<void> {
        if (!this.currentFolderPath) return;

        const initBtn = this.container.querySelector('.git-init-btn') as HTMLButtonElement;
        if (initBtn) {
            initBtn.disabled = true;
            initBtn.textContent = 'Initializing...';
        }

        try {
            const result = await window.mycode.git.init(this.currentFolderPath);
            if (result.success) {
                // Refresh to show the new repo status
                await this.refresh();
                // Notify via callback if set
                this.onInit?.();
            } else {
                console.error('Git init failed:', result.error);
                alert(`Failed to initialize repository: ${result.error}`);
            }
        } finally {
            if (initBtn) {
                initBtn.disabled = false;
                initBtn.textContent = 'Initialize Repository';
            }
        }
    }

    private toggleBranchDropdown(): void {
        if (this.dropdownVisible) {
            this.hideBranchDropdown();
        } else {
            this.showBranchDropdown();
        }
    }

    private async showBranchDropdown(): Promise<void> {
        if (!this.branchDropdown || !this.currentRepoPath) return;

        // Load branches
        const result = await window.mycode.git.listBranches(this.currentRepoPath);
        if (!result.success || !result.branches) {
            console.error('Failed to list branches:', result.error);
            return;
        }

        // Populate branch list
        const branchList = this.branchDropdown.querySelector('.branch-list');
        if (branchList) {
            branchList.innerHTML = result.branches
                .filter(b => !b.isRemote) // Only show local branches
                .map(b => `
                    <div class="branch-item ${b.current ? 'current' : ''}" data-branch="${b.name}">
                        ${b.current ? '✓ ' : ''}${b.name}
                    </div>
                `).join('');

            // Add click handlers to branch items
            branchList.querySelectorAll('.branch-item').forEach(item => {
                item.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const branchName = (item as HTMLElement).dataset.branch;
                    if (branchName && !item.classList.contains('current')) {
                        await this.handleCheckout(branchName);
                    }
                    this.hideBranchDropdown();
                });
            });
        }

        this.branchDropdown.classList.remove('hidden');
        this.container.querySelector('.branch-dropdown-arrow')?.classList.remove('hidden');
        this.dropdownVisible = true;
    }

    private hideBranchDropdown(): void {
        this.branchDropdown?.classList.add('hidden');
        this.dropdownVisible = false;
    }

    private async handleCheckout(branchName: string): Promise<void> {
        if (!this.currentRepoPath) return;

        try {
            const result = await window.mycode.git.checkout(this.currentRepoPath, branchName);
            if (result.success) {
                await this.refresh();
                this.onBranchChange?.();
            } else {
                console.error('Checkout failed:', result.error);
                alert(`Failed to switch branch: ${result.error}`);
            }
        } catch (error) {
            console.error('Checkout error:', error);
            alert(`Error switching branch: ${error}`);
        }
    }

    private async handleCreateBranch(): Promise<void> {
        if (!this.currentRepoPath) return;

        this.hideBranchDropdown();

        const branchName = await showInputDialog({ title: 'New Branch', label: 'Enter new branch name:', confirmText: 'Create' });
        if (!branchName || !branchName.trim()) return;

        const cleanName = branchName.trim().replace(/\s+/g, '-');

        try {
            const result = await window.mycode.git.createBranch(this.currentRepoPath, cleanName, true);
            if (result.success) {
                await this.refresh();
                this.onBranchChange?.();
            } else {
                console.error('Create branch failed:', result.error);
                alert(`Failed to create branch: ${result.error}`);
            }
        } catch (error) {
            console.error('Create branch error:', error);
            alert(`Error creating branch: ${error}`);
        }
    }

    /**
     * Start auto-refresh interval
     */
    startAutoRefresh(intervalMs: number = 5000): void {
        this.stopAutoRefresh();
        this.refreshInterval = window.setInterval(() => this.refresh(), intervalMs);
    }

    /**
     * Stop auto-refresh interval
     */
    stopAutoRefresh(): void {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    /**
     * Get current git status
     */
    getStatus(): GitStatus | null {
        return this.status;
    }

    /**
     * Get current repo path
     */
    getRepoPath(): string {
        return this.currentRepoPath;
    }

    /**
     * Show/hide the status bar
     */
    setVisible(visible: boolean): void {
        this.container.classList.toggle('hidden', !visible);
    }

    /**
     * Cleanup
     */
    dispose(): void {
        this.stopAutoRefresh();
    }
}
