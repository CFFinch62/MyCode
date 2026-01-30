/**
 * Commit Dialog Component
 * Modal dialog for staging files and committing changes
 */

import { GitStatus, GitFileStatus } from '../../shared/types';

export class CommitDialog {
    private overlay: HTMLElement;
    private dialog: HTMLElement;
    private messageInput: HTMLTextAreaElement | null = null;
    private filesList: HTMLElement | null = null;
    private repoPath: string = '';
    private status: GitStatus | null = null;

    // Callbacks
    public onCommitSuccess: (() => void) | null = null;

    constructor() {
        this.overlay = document.getElementById('commit-overlay') || this.createDialog();
        this.dialog = this.overlay.querySelector('.commit-dialog') as HTMLElement;
        this.messageInput = this.overlay.querySelector('#commit-message') as HTMLTextAreaElement;
        this.filesList = this.overlay.querySelector('.commit-files-list') as HTMLElement;

        this.setupEventListeners();
    }

    private createDialog(): HTMLElement {
        const overlay = document.createElement('div');
        overlay.id = 'commit-overlay';
        overlay.className = 'modal-overlay hidden';
        overlay.innerHTML = `
            <div class="modal-dialog commit-dialog">
                <div class="modal-header">
                    <h2>Commit Changes</h2>
                    <button class="icon-btn commit-close">×</button>
                </div>
                <div class="modal-content">
                    <div class="commit-message-section">
                        <label for="commit-message">Commit Message</label>
                        <textarea id="commit-message" placeholder="Enter commit message..." rows="3"></textarea>
                    </div>
                    <div class="commit-files-section">
                        <div class="commit-files-header">
                            <span>Changes</span>
                            <button class="text-btn commit-stage-all">Stage All</button>
                        </div>
                        <div class="commit-files-list"></div>
                    </div>
                </div>
                <div class="modal-footer">
                    <span class="commit-status"></span>
                    <button class="text-btn commit-cancel">Cancel</button>
                    <button class="text-btn primary commit-submit" disabled>Commit</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        return overlay;
    }

    private setupEventListeners(): void {
        // Close button
        this.overlay.querySelector('.commit-close')?.addEventListener('click', () => this.hide());
        this.overlay.querySelector('.commit-cancel')?.addEventListener('click', () => this.hide());

        // Click outside to close
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.hide();
        });

        // Stage all button
        this.overlay.querySelector('.commit-stage-all')?.addEventListener('click', () => this.stageAll());

        // Commit button
        this.overlay.querySelector('.commit-submit')?.addEventListener('click', () => this.commit());

        // Enable/disable commit button based on message
        this.messageInput?.addEventListener('input', () => this.updateCommitButton());

        // Handle Escape key
        this.overlay.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.hide();
            if (e.key === 'Enter' && e.ctrlKey) this.commit();
        });
    }

    /**
     * Show the commit dialog
     */
    async show(repoPath: string): Promise<void> {
        this.repoPath = repoPath;

        try {
            this.status = await window.mycode.git.getStatus(repoPath);
            this.renderFilesList();
            this.overlay.classList.remove('hidden');
            this.messageInput?.focus();
            this.updateCommitButton();
        } catch (error) {
            console.error('Failed to load git status:', error);
        }
    }

    /**
     * Hide the dialog
     */
    hide(): void {
        this.overlay.classList.add('hidden');
        if (this.messageInput) {
            this.messageInput.value = '';
        }
    }

    /**
     * Render the files list
     */
    private renderFilesList(): void {
        if (!this.filesList || !this.status) return;

        const allFiles = [...this.status.staged, ...this.status.modified, ...this.status.untracked];

        if (allFiles.length === 0) {
            this.filesList.innerHTML = '<div class="empty-state">No changes to commit</div>';
            return;
        }

        this.filesList.innerHTML = allFiles.map(file => `
            <div class="commit-file-item ${file.staged ? 'staged' : ''}" data-path="${file.path}">
                <input type="checkbox" ${file.staged ? 'checked' : ''} />
                <span class="file-status ${file.status}">${this.getStatusIcon(file.status)}</span>
                <span class="file-path" title="${file.path}">${this.getFileName(file.path)}</span>
            </div>
        `).join('');

        // Add click handlers for checkboxes
        this.filesList.querySelectorAll('.commit-file-item').forEach(item => {
            const checkbox = item.querySelector('input[type="checkbox"]') as HTMLInputElement;
            const path = item.getAttribute('data-path');

            checkbox?.addEventListener('change', () => this.toggleFileStaging(path!, checkbox.checked));
        });
    }

    private getStatusIcon(status: string): string {
        switch (status) {
            case 'added': return '+';
            case 'modified': return '~';
            case 'deleted': return '-';
            case 'renamed': return '→';
            case 'untracked': return '?';
            default: return '•';
        }
    }

    private getFileName(filePath: string): string {
        return filePath.split('/').pop() || filePath;
    }

    /**
     * Toggle staging for a single file
     */
    private async toggleFileStaging(filePath: string, stage: boolean): Promise<void> {
        try {
            const fullPath = `${this.repoPath}/${filePath}`;
            if (stage) {
                await window.mycode.git.stageFile(this.repoPath, fullPath);
            } else {
                await window.mycode.git.unstageFile(this.repoPath, fullPath);
            }
            // Refresh status
            this.status = await window.mycode.git.getStatus(this.repoPath);
            this.updateCommitButton();
        } catch (error) {
            console.error('Failed to toggle file staging:', error);
        }
    }

    /**
     * Stage all files
     */
    private async stageAll(): Promise<void> {
        try {
            await window.mycode.git.stageAll(this.repoPath);
            this.status = await window.mycode.git.getStatus(this.repoPath);
            this.renderFilesList();
            this.updateCommitButton();
        } catch (error) {
            console.error('Failed to stage all files:', error);
        }
    }

    /**
     * Update commit button state
     */
    private updateCommitButton(): void {
        const submitBtn = this.overlay.querySelector('.commit-submit') as HTMLButtonElement;
        if (!submitBtn || !this.messageInput) return;

        const hasMessage = this.messageInput.value.trim().length > 0;
        const hasStagedFiles = this.status?.staged && this.status.staged.length > 0;

        submitBtn.disabled = !hasMessage || !hasStagedFiles;
    }

    /**
     * Perform the commit
     */
    private async commit(): Promise<void> {
        if (!this.messageInput || !this.repoPath) return;

        const message = this.messageInput.value.trim();
        if (!message) return;

        const submitBtn = this.overlay.querySelector('.commit-submit') as HTMLButtonElement;
        const statusEl = this.overlay.querySelector('.commit-status') as HTMLElement;

        try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Committing...';
            if (statusEl) statusEl.textContent = '';

            const result = await window.mycode.git.commit(this.repoPath, message);

            if (result.success) {
                this.hide();
                this.onCommitSuccess?.();
            } else {
                if (statusEl) statusEl.textContent = `Error: ${result.error}`;
            }
        } catch (error: any) {
            if (statusEl) statusEl.textContent = `Error: ${error.message}`;
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Commit';
        }
    }

    /**
     * Check if dialog is visible
     */
    isVisible(): boolean {
        return !this.overlay.classList.contains('hidden');
    }
}
