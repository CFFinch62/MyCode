/**
 * Global type declarations for the renderer process
 * These types come from the preload script's contextBridge
 */

import { Settings, TreeNode, FileOperationResult, GitStatus, GitLineDiff, GitOperationResult } from './types';

declare global {
    interface Window {
        mycode: {
            file: {
                read: (filePath: string) => Promise<FileOperationResult & { content?: string }>;
                save: (filePath: string, content: string) => Promise<FileOperationResult>;
                saveAs: (content: string, defaultPath?: string) => Promise<string | null>;
                exists: (filePath: string) => Promise<boolean>;
                openDialog: () => Promise<string[] | null>;
            };
            folder: {
                openDialog: () => Promise<string | null>;
                read: (folderPath: string) => Promise<TreeNode>;
                watch: (folderPath: string) => Promise<boolean>;
                unwatch: (folderPath: string) => Promise<boolean>;
                onChanged: (callback: (data: { event: string; path: string; folderPath: string }) => void) => void;
                createFile: (filePath: string) => Promise<FileOperationResult>;
                createFolder: (folderPath: string) => Promise<FileOperationResult>;
                rename: (oldPath: string, newPath: string) => Promise<FileOperationResult>;
                delete: (targetPath: string) => Promise<FileOperationResult>;
            };
            settings: {
                getAll: () => Promise<Settings>;
                get: <K extends keyof Settings>(key: K) => Promise<Settings[K]>;
                set: <K extends keyof Settings>(key: K, value: Settings[K]) => Promise<boolean>;
            };
            window: {
                minimize: () => void;
                maximize: () => void;
                close: () => void;
                fullscreen: () => void;
            };
            app: {
                quit: () => void;
            };
            onMenuEvent: {
                newTab: (callback: () => void) => void;
                openFile: (callback: () => void) => void;
                openFolder: (callback: () => void) => void;
                save: (callback: () => void) => void;
                saveAs: (callback: () => void) => void;
                closeTab: (callback: () => void) => void;
                find: (callback: () => void) => void;
                replace: (callback: () => void) => void;
                selectAll: (callback: () => void) => void;
                toggleSidebar: (callback: () => void) => void;
                togglePreview: (callback: () => void) => void;
                toggleTerminal: (callback: () => void) => void;
                preferences: (callback: () => void) => void;
                gitCommit: (callback: () => void) => void;
                gitPush: (callback: () => void) => void;
                gitPull: (callback: () => void) => void;
            };
            terminal: {
                create: (cwd?: string, cols?: number, rows?: number) => Promise<string>;
                write: (id: string, data: string) => void;
                resize: (id: string, cols: number, rows: number) => void;
                destroy: (id: string) => Promise<void>;
                onData: (callback: (id: string, data: string) => void) => void;
                onExit: (callback: (id: string, exitCode: number) => void) => void;
            };
            git: {
                isRepo: (filePath: string) => Promise<{ isRepo: boolean; repoRoot: string }>;
                getStatus: (repoPath: string) => Promise<GitStatus>;
                getFileDiff: (repoPath: string, filePath: string) => Promise<GitLineDiff[]>;
                stageFile: (repoPath: string, filePath: string) => Promise<GitOperationResult>;
                unstageFile: (repoPath: string, filePath: string) => Promise<GitOperationResult>;
                stageAll: (repoPath: string) => Promise<GitOperationResult>;
                commit: (repoPath: string, message: string) => Promise<GitOperationResult>;
                push: (repoPath: string) => Promise<GitOperationResult>;
                pull: (repoPath: string) => Promise<GitOperationResult>;
            };
        };
    }
}

export { };

