/**
 * File Service for MyCode
 * Handles file read/write operations and directory watching
 */

import * as fs from 'fs';
import * as path from 'path';
import { FSWatcher, watch } from 'chokidar';
import { TreeNode, FileOperationResult } from '../../shared/types';

export class FileService {
    private watchers: Map<string, FSWatcher> = new Map();

    /**
     * Read file contents
     */
    async readFile(filePath: string): Promise<FileOperationResult> {
        try {
            const content = await fs.promises.readFile(filePath, 'utf-8');
            return { success: true, path: filePath, content };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Write content to file
     */
    async writeFile(filePath: string, content: string): Promise<FileOperationResult> {
        try {
            await fs.promises.writeFile(filePath, content, 'utf-8');
            return { success: true, path: filePath };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Check if file exists
     */
    async fileExists(filePath: string): Promise<boolean> {
        try {
            await fs.promises.access(filePath, fs.constants.F_OK);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Read directory contents and build tree structure
     */
    async readDirectory(dirPath: string): Promise<TreeNode> {
        const stats = await fs.promises.stat(dirPath);
        const name = path.basename(dirPath);

        if (!stats.isDirectory()) {
            return {
                name,
                path: dirPath,
                type: 'file',
            };
        }

        const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
        const children: TreeNode[] = [];

        // Sort entries: folders first, then files, both alphabetically
        const sortedEntries = entries.sort((a, b) => {
            if (a.isDirectory() && !b.isDirectory()) return -1;
            if (!a.isDirectory() && b.isDirectory()) return 1;
            return a.name.localeCompare(b.name);
        });

        for (const entry of sortedEntries) {
            // Skip hidden files and common ignored directories
            if (entry.name.startsWith('.') ||
                entry.name === 'node_modules' ||
                entry.name === '__pycache__' ||
                entry.name === 'dist' ||
                entry.name === 'build') {
                continue;
            }

            const childPath = path.join(dirPath, entry.name);

            if (entry.isDirectory()) {
                // Recursively read subdirectories (limited depth for performance)
                const child = await this.readDirectoryShallow(childPath);
                children.push(child);
            } else {
                children.push({
                    name: entry.name,
                    path: childPath,
                    type: 'file',
                });
            }
        }

        return {
            name,
            path: dirPath,
            type: 'project',
            children,
            isExpanded: true,
        };
    }

    /**
     * Read directory without recursion (for lazy loading)
     */
    private async readDirectoryShallow(dirPath: string): Promise<TreeNode> {
        const name = path.basename(dirPath);

        try {
            const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
            const hasChildren = entries.some(e =>
                !e.name.startsWith('.') &&
                e.name !== 'node_modules'
            );

            return {
                name,
                path: dirPath,
                type: 'folder',
                children: hasChildren ? [] : undefined, // Empty array signals lazy-loadable
                isExpanded: false,
            };
        } catch {
            return {
                name,
                path: dirPath,
                type: 'folder',
            };
        }
    }

    /**
     * Watch a folder for changes
     */
    watchFolder(
        folderPath: string,
        callback: (event: string, path: string) => void
    ): void {
        if (this.watchers.has(folderPath)) {
            return; // Already watching
        }

        const watcher = watch(folderPath, {
            ignored: /(^|[\/\\])\.|node_modules/,
            persistent: true,
            ignoreInitial: true,
            depth: 10,
        });

        watcher
            .on('add', (path) => callback('add', path))
            .on('change', (path) => callback('change', path))
            .on('unlink', (path) => callback('unlink', path))
            .on('addDir', (path) => callback('addDir', path))
            .on('unlinkDir', (path) => callback('unlinkDir', path));

        this.watchers.set(folderPath, watcher);
    }

    /**
     * Stop watching a folder
     */
    unwatchFolder(folderPath: string): void {
        const watcher = this.watchers.get(folderPath);
        if (watcher) {
            watcher.close();
            this.watchers.delete(folderPath);
        }
    }

    /**
     * Stop all watchers
     */
    unwatchAll(): void {
        for (const watcher of this.watchers.values()) {
            watcher.close();
        }
        this.watchers.clear();
    }
}
