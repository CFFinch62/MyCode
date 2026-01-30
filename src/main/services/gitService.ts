/**
 * Git Service for MyCode
 * Handles Git operations using simple-git library
 */

import * as path from 'path';
import simpleGit, { SimpleGit, StatusResult, DiffResult } from 'simple-git';
import { GitBranchInfo, GitFileStatus, GitStatus, GitLineDiff, GitOperationResult } from '../../shared/types';

export class GitService {
    private gitInstances: Map<string, SimpleGit> = new Map();

    /**
     * Get or create a SimpleGit instance for a repository
     */
    private getGit(repoPath: string): SimpleGit {
        if (!this.gitInstances.has(repoPath)) {
            this.gitInstances.set(repoPath, simpleGit(repoPath));
        }
        return this.gitInstances.get(repoPath)!;
    }

    /**
     * Check if a path is inside a Git repository
     */
    async isGitRepository(filePath: string): Promise<{ isRepo: boolean; repoRoot: string }> {
        try {
            const git = simpleGit(filePath);
            const root = await git.revparse(['--show-toplevel']);
            return { isRepo: true, repoRoot: root.trim() };
        } catch {
            return { isRepo: false, repoRoot: '' };
        }
    }

    /**
     * Get complete Git status for a repository
     */
    async getStatus(repoPath: string): Promise<GitStatus> {
        try {
            const git = this.getGit(repoPath);
            const status: StatusResult = await git.status();
            const branchInfo = await this.getBranchInfo(repoPath);

            const files: GitFileStatus[] = [];
            const staged: GitFileStatus[] = [];
            const modified: GitFileStatus[] = [];
            const untracked: GitFileStatus[] = [];

            // Process created (new staged files)
            for (const file of status.created) {
                const fileStatus: GitFileStatus = { path: file, status: 'added', staged: true };
                files.push(fileStatus);
                staged.push(fileStatus);
            }

            // Process staged modifications
            for (const file of status.staged) {
                const fileStatus: GitFileStatus = { path: file, status: 'modified', staged: true };
                files.push(fileStatus);
                staged.push(fileStatus);
            }

            // Process deleted staged
            for (const file of status.deleted) {
                const fileStatus: GitFileStatus = { path: file, status: 'deleted', staged: true };
                files.push(fileStatus);
                staged.push(fileStatus);
            }

            // Process renamed
            for (const file of status.renamed) {
                const fileStatus: GitFileStatus = {
                    path: file.to,
                    status: 'renamed',
                    staged: true,
                    originalPath: file.from
                };
                files.push(fileStatus);
                staged.push(fileStatus);
            }

            // Process modified (unstaged)
            for (const file of status.modified) {
                // Check if already in staged
                if (!staged.find(f => f.path === file)) {
                    const fileStatus: GitFileStatus = { path: file, status: 'modified', staged: false };
                    files.push(fileStatus);
                    modified.push(fileStatus);
                }
            }

            // Process not added (untracked)
            for (const file of status.not_added) {
                const fileStatus: GitFileStatus = { path: file, status: 'untracked', staged: false };
                files.push(fileStatus);
                untracked.push(fileStatus);
            }

            // Process conflicted
            for (const file of status.conflicted) {
                const fileStatus: GitFileStatus = { path: file, status: 'conflicted', staged: false };
                files.push(fileStatus);
            }

            return {
                isRepo: true,
                repoRoot: repoPath,
                branch: branchInfo,
                files,
                staged,
                modified,
                untracked,
            };
        } catch (error: any) {
            return {
                isRepo: false,
                repoRoot: '',
                branch: { current: '', isDetached: false, ahead: 0, behind: 0 },
                files: [],
                staged: [],
                modified: [],
                untracked: [],
            };
        }
    }

    /**
     * Get current branch information
     */
    async getBranchInfo(repoPath: string): Promise<GitBranchInfo> {
        try {
            const git = this.getGit(repoPath);
            const status = await git.status();

            return {
                current: status.current || 'HEAD',
                isDetached: status.detached,
                ahead: status.ahead,
                behind: status.behind,
                tracking: status.tracking || undefined,
            };
        } catch {
            return {
                current: '',
                isDetached: false,
                ahead: 0,
                behind: 0,
            };
        }
    }

    /**
     * Get line-by-line diff for a specific file (for gutter decorations)
     */
    async getFileDiff(repoPath: string, filePath: string): Promise<GitLineDiff[]> {
        try {
            const git = this.getGit(repoPath);
            const relativePath = path.relative(repoPath, filePath);

            // Get diff with line numbers
            const diffOutput = await git.diff(['--unified=0', '--', relativePath]);

            return this.parseDiffForLines(diffOutput);
        } catch {
            return [];
        }
    }

    /**
     * Parse diff output to extract line change information
     */
    private parseDiffForLines(diffOutput: string): GitLineDiff[] {
        const diffs: GitLineDiff[] = [];
        const lines = diffOutput.split('\n');

        // Match @@ -oldStart,oldCount +newStart,newCount @@
        const hunkPattern = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/;

        for (const line of lines) {
            const match = hunkPattern.exec(line);
            if (match) {
                const oldStart = parseInt(match[1], 10);
                const oldCount = parseInt(match[2] || '1', 10);
                const newStart = parseInt(match[3], 10);
                const newCount = parseInt(match[4] || '1', 10);

                if (oldCount === 0 && newCount > 0) {
                    // Pure addition
                    diffs.push({
                        startLine: newStart,
                        endLine: newStart + newCount - 1,
                        type: 'added',
                    });
                } else if (oldCount > 0 && newCount === 0) {
                    // Pure deletion - show at the line where deletion occurred
                    diffs.push({
                        startLine: newStart > 0 ? newStart : 1,
                        endLine: newStart > 0 ? newStart : 1,
                        type: 'deleted',
                    });
                } else {
                    // Modification
                    diffs.push({
                        startLine: newStart,
                        endLine: newStart + newCount - 1,
                        type: 'modified',
                    });
                }
            }
        }

        return diffs;
    }

    /**
     * Stage a file for commit
     */
    async stageFile(repoPath: string, filePath: string): Promise<GitOperationResult> {
        try {
            const git = this.getGit(repoPath);
            const relativePath = path.relative(repoPath, filePath);
            await git.add(relativePath);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Unstage a file
     */
    async unstageFile(repoPath: string, filePath: string): Promise<GitOperationResult> {
        try {
            const git = this.getGit(repoPath);
            const relativePath = path.relative(repoPath, filePath);
            await git.reset(['HEAD', '--', relativePath]);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Stage all changes
     */
    async stageAll(repoPath: string): Promise<GitOperationResult> {
        try {
            const git = this.getGit(repoPath);
            await git.add('-A');
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Commit staged changes
     */
    async commit(repoPath: string, message: string): Promise<GitOperationResult> {
        try {
            const git = this.getGit(repoPath);
            const result = await git.commit(message);
            return {
                success: true,
                message: `Committed ${result.summary.changes} files, +${result.summary.insertions}/-${result.summary.deletions}`
            };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Push to remote
     */
    async push(repoPath: string): Promise<GitOperationResult> {
        try {
            const git = this.getGit(repoPath);
            await git.push();
            return { success: true, message: 'Push successful' };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Pull from remote
     */
    async pull(repoPath: string): Promise<GitOperationResult> {
        try {
            const git = this.getGit(repoPath);
            const result = await git.pull();
            return {
                success: true,
                message: result.summary.changes > 0
                    ? `Pulled ${result.summary.changes} changes`
                    : 'Already up to date'
            };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Initialize a new Git repository
     */
    async init(folderPath: string): Promise<GitOperationResult> {
        try {
            const git = simpleGit(folderPath);
            await git.init();
            // Clear any cached instance for this path so it gets recreated
            this.gitInstances.delete(folderPath);
            return { success: true, message: 'Git repository initialized' };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    /**
     * List all branches (local and remote)
     */
    async listBranches(repoPath: string): Promise<{ success: boolean; branches?: { name: string; current: boolean; isRemote: boolean }[]; error?: string }> {
        try {
            const git = this.getGit(repoPath);
            const branchSummary = await git.branch(['-a']);

            const branches = Object.entries(branchSummary.branches).map(([name, info]) => ({
                name: name,
                current: info.current,
                isRemote: name.startsWith('remotes/'),
            }));

            return { success: true, branches };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Create a new branch
     */
    async createBranch(repoPath: string, branchName: string, checkout: boolean = true): Promise<GitOperationResult> {
        try {
            const git = this.getGit(repoPath);

            if (checkout) {
                // Create and switch to the new branch
                await git.checkoutLocalBranch(branchName);
                return { success: true, message: `Created and switched to branch '${branchName}'` };
            } else {
                // Just create the branch without switching
                await git.branch([branchName]);
                return { success: true, message: `Created branch '${branchName}'` };
            }
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Checkout (switch to) a branch
     */
    async checkout(repoPath: string, branchName: string): Promise<GitOperationResult> {
        try {
            const git = this.getGit(repoPath);
            await git.checkout(branchName);
            return { success: true, message: `Switched to branch '${branchName}'` };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Clean up git instances
     */
    cleanup(): void {
        this.gitInstances.clear();
    }
}
