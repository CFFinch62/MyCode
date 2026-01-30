/**
 * Preload script for MyCode
 * Exposes safe IPC methods to the renderer process
 */

import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../shared/ipc-channels';

// Expose protected methods that allow the renderer process to use ipcRenderer
contextBridge.exposeInMainWorld('mycode', {
    // File operations
    file: {
        read: (filePath: string) => ipcRenderer.invoke(IPC_CHANNELS.FILE_READ, filePath),
        save: (filePath: string, content: string) => ipcRenderer.invoke(IPC_CHANNELS.FILE_SAVE, filePath, content),
        saveAs: (content: string, defaultPath?: string) => ipcRenderer.invoke(IPC_CHANNELS.FILE_SAVE_AS, content, defaultPath),
        exists: (filePath: string) => ipcRenderer.invoke(IPC_CHANNELS.FILE_EXISTS, filePath),
        openDialog: () => ipcRenderer.invoke(IPC_CHANNELS.FILE_OPEN_DIALOG),
    },

    // Folder operations
    folder: {
        openDialog: () => ipcRenderer.invoke(IPC_CHANNELS.FOLDER_OPEN_DIALOG),
        createProjectDialog: () => ipcRenderer.invoke(IPC_CHANNELS.FOLDER_CREATE_PROJECT_DIALOG),
        read: (folderPath: string) => ipcRenderer.invoke(IPC_CHANNELS.FOLDER_READ, folderPath),
        watch: (folderPath: string) => ipcRenderer.invoke(IPC_CHANNELS.FOLDER_WATCH, folderPath),
        unwatch: (folderPath: string) => ipcRenderer.invoke(IPC_CHANNELS.FOLDER_UNWATCH, folderPath),
        onChanged: (callback: (data: { event: string; path: string; folderPath: string }) => void) => {
            ipcRenderer.on(IPC_CHANNELS.FOLDER_CHANGED, (_event, data) => callback(data));
        },
        createFile: (filePath: string) => ipcRenderer.invoke(IPC_CHANNELS.FOLDER_CREATE_FILE, filePath),
        createFolder: (folderPath: string) => ipcRenderer.invoke(IPC_CHANNELS.FOLDER_CREATE_FOLDER, folderPath),
        rename: (oldPath: string, newPath: string) => ipcRenderer.invoke(IPC_CHANNELS.FOLDER_RENAME, oldPath, newPath),
        delete: (targetPath: string) => ipcRenderer.invoke(IPC_CHANNELS.FOLDER_DELETE, targetPath),
    },

    // Settings
    settings: {
        getAll: () => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET_ALL),
        get: (key: string) => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET, key),
        set: (key: string, value: any) => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_SET, key, value),
    },

    // Window operations
    window: {
        minimize: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_MINIMIZE),
        maximize: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_MAXIMIZE),
        close: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_CLOSE),
        fullscreen: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_FULLSCREEN),
    },

    // App
    app: {
        quit: () => ipcRenderer.send(IPC_CHANNELS.APP_QUIT),
    },

    // Menu event listeners
    onMenuEvent: {
        newTab: (callback: () => void) => ipcRenderer.on(IPC_CHANNELS.MENU_NEW_TAB, callback),
        openFile: (callback: () => void) => ipcRenderer.on(IPC_CHANNELS.MENU_OPEN_FILE, callback),
        openFolder: (callback: () => void) => ipcRenderer.on(IPC_CHANNELS.MENU_OPEN_FOLDER, callback),
        newProjectFolder: (callback: () => void) => ipcRenderer.on(IPC_CHANNELS.MENU_NEW_PROJECT_FOLDER, callback),
        save: (callback: () => void) => ipcRenderer.on(IPC_CHANNELS.MENU_SAVE, callback),
        saveAs: (callback: () => void) => ipcRenderer.on(IPC_CHANNELS.MENU_SAVE_AS, callback),
        closeTab: (callback: () => void) => ipcRenderer.on(IPC_CHANNELS.MENU_CLOSE_TAB, callback),
        find: (callback: () => void) => ipcRenderer.on(IPC_CHANNELS.MENU_FIND, callback),
        replace: (callback: () => void) => ipcRenderer.on(IPC_CHANNELS.MENU_REPLACE, callback),
        selectAll: (callback: () => void) => ipcRenderer.on(IPC_CHANNELS.MENU_SELECT_ALL, callback),
        toggleSidebar: (callback: () => void) => ipcRenderer.on(IPC_CHANNELS.MENU_TOGGLE_SIDEBAR, callback),
        togglePreview: (callback: () => void) => ipcRenderer.on(IPC_CHANNELS.MENU_TOGGLE_PREVIEW, callback),
        toggleTerminal: (callback: () => void) => ipcRenderer.on(IPC_CHANNELS.MENU_TOGGLE_TERMINAL, callback),
        preferences: (callback: () => void) => ipcRenderer.on(IPC_CHANNELS.MENU_PREFERENCES, callback),
        gitCommit: (callback: () => void) => ipcRenderer.on(IPC_CHANNELS.MENU_GIT_COMMIT, callback),
        gitPush: (callback: () => void) => ipcRenderer.on(IPC_CHANNELS.MENU_GIT_PUSH, callback),
        gitPull: (callback: () => void) => ipcRenderer.on(IPC_CHANNELS.MENU_GIT_PULL, callback),
        pluginManager: (callback: () => void) => ipcRenderer.on(IPC_CHANNELS.MENU_PLUGIN_MANAGER, callback),
    },

    // Terminal operations
    terminal: {
        create: (cwd?: string, cols?: number, rows?: number) => ipcRenderer.invoke(IPC_CHANNELS.TERMINAL_CREATE, { cwd, cols, rows }),
        write: (id: string, data: string) => ipcRenderer.send(IPC_CHANNELS.TERMINAL_DATA, { id, data }),
        resize: (id: string, cols: number, rows: number) => ipcRenderer.send(IPC_CHANNELS.TERMINAL_RESIZE, { id, cols, rows }),
        destroy: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.TERMINAL_DESTROY, id),
        onData: (callback: (id: string, data: string) => void) => {
            ipcRenderer.on(IPC_CHANNELS.TERMINAL_DATA_FROM_PTY, (_event, { id, data }) => callback(id, data));
        },
        onExit: (callback: (id: string, exitCode: number) => void) => {
            ipcRenderer.on(IPC_CHANNELS.TERMINAL_EXIT, (_event, { id, exitCode }) => callback(id, exitCode));
        },
    },

    // Git operations
    git: {
        isRepo: (filePath: string) => ipcRenderer.invoke(IPC_CHANNELS.GIT_IS_REPO, filePath),
        init: (folderPath: string) => ipcRenderer.invoke(IPC_CHANNELS.GIT_INIT, folderPath),
        getStatus: (repoPath: string) => ipcRenderer.invoke(IPC_CHANNELS.GIT_GET_STATUS, repoPath),
        getFileDiff: (repoPath: string, filePath: string) => ipcRenderer.invoke(IPC_CHANNELS.GIT_GET_FILE_DIFF, repoPath, filePath),
        getFileFromHead: (repoPath: string, filePath: string) => ipcRenderer.invoke(IPC_CHANNELS.GIT_GET_FILE_FROM_HEAD, repoPath, filePath),
        stageFile: (repoPath: string, filePath: string) => ipcRenderer.invoke(IPC_CHANNELS.GIT_STAGE_FILE, repoPath, filePath),
        unstageFile: (repoPath: string, filePath: string) => ipcRenderer.invoke(IPC_CHANNELS.GIT_UNSTAGE_FILE, repoPath, filePath),
        stageAll: (repoPath: string) => ipcRenderer.invoke(IPC_CHANNELS.GIT_STAGE_ALL, repoPath),
        commit: (repoPath: string, message: string) => ipcRenderer.invoke(IPC_CHANNELS.GIT_COMMIT, repoPath, message),
        push: (repoPath: string) => ipcRenderer.invoke(IPC_CHANNELS.GIT_PUSH, repoPath),
        pull: (repoPath: string) => ipcRenderer.invoke(IPC_CHANNELS.GIT_PULL, repoPath),
        listBranches: (repoPath: string) => ipcRenderer.invoke(IPC_CHANNELS.GIT_LIST_BRANCHES, repoPath),
        createBranch: (repoPath: string, branchName: string, checkout?: boolean) => ipcRenderer.invoke(IPC_CHANNELS.GIT_CREATE_BRANCH, repoPath, branchName, checkout),
        checkout: (repoPath: string, branchName: string) => ipcRenderer.invoke(IPC_CHANNELS.GIT_CHECKOUT, repoPath, branchName),
    },

    // Plugin operations
    plugins: {
        list: () => ipcRenderer.invoke(IPC_CHANNELS.PLUGIN_LIST),
        getInfo: (pluginId: string) => ipcRenderer.invoke(IPC_CHANNELS.PLUGIN_GET_INFO, pluginId),
        load: (pluginId: string) => ipcRenderer.invoke(IPC_CHANNELS.PLUGIN_LOAD, pluginId),
        unload: (pluginId: string) => ipcRenderer.invoke(IPC_CHANNELS.PLUGIN_UNLOAD, pluginId),
        enable: (pluginId: string) => ipcRenderer.invoke(IPC_CHANNELS.PLUGIN_ENABLE, pluginId),
        disable: (pluginId: string) => ipcRenderer.invoke(IPC_CHANNELS.PLUGIN_DISABLE, pluginId),
        reload: (pluginId: string) => ipcRenderer.invoke(IPC_CHANNELS.PLUGIN_RELOAD, pluginId),
        invokeMain: (pluginId: string, method: string, args: any[]) =>
            ipcRenderer.invoke(IPC_CHANNELS.PLUGIN_INVOKE_MAIN, pluginId, method, args),
        reportReady: (pluginId: string) => ipcRenderer.send(IPC_CHANNELS.PLUGIN_READY, pluginId),
        reportError: (pluginId: string, error: string) => ipcRenderer.send(IPC_CHANNELS.PLUGIN_ERROR, pluginId, error),
        onEvent: (callback: (pluginId: string, event: string, data: any) => void) => {
            ipcRenderer.on(IPC_CHANNELS.PLUGIN_EVENT, (_event, pluginId, eventName, data) => callback(pluginId, eventName, data));
        },
    },
});

// Type definitions for the exposed API
declare global {
    interface Window {
        mycode: {
            file: {
                read: (filePath: string) => Promise<{ success: boolean; content?: string; error?: string }>;
                save: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>;
                saveAs: (content: string, defaultPath?: string) => Promise<string | null>;
                exists: (filePath: string) => Promise<boolean>;
                openDialog: () => Promise<string[] | null>;
            };
            folder: {
                openDialog: () => Promise<string | null>;
                createProjectDialog: () => Promise<string | null>;
                read: (folderPath: string) => Promise<any>;
                watch: (folderPath: string) => Promise<boolean>;
                unwatch: (folderPath: string) => Promise<boolean>;
                onChanged: (callback: (data: { event: string; path: string; folderPath: string }) => void) => void;
                createFile: (filePath: string) => Promise<{ success: boolean; path?: string; error?: string }>;
                createFolder: (folderPath: string) => Promise<{ success: boolean; path?: string; error?: string }>;
                rename: (oldPath: string, newPath: string) => Promise<{ success: boolean; error?: string }>;
                delete: (targetPath: string) => Promise<{ success: boolean; error?: string }>;
            };
            settings: {
                getAll: () => Promise<any>;
                get: (key: string) => Promise<any>;
                set: (key: string, value: any) => Promise<boolean>;
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
                newProjectFolder: (callback: () => void) => void;
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
                pluginManager: (callback: () => void) => void;
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
                init: (folderPath: string) => Promise<{ success: boolean; message?: string; error?: string }>;
                getStatus: (repoPath: string) => Promise<any>;
                getFileDiff: (repoPath: string, filePath: string) => Promise<any[]>;
                getFileFromHead: (repoPath: string, filePath: string) => Promise<{ success: boolean; content?: string; error?: string }>;
                stageFile: (repoPath: string, filePath: string) => Promise<{ success: boolean; error?: string }>;
                unstageFile: (repoPath: string, filePath: string) => Promise<{ success: boolean; error?: string }>;
                stageAll: (repoPath: string) => Promise<{ success: boolean; error?: string }>;
                commit: (repoPath: string, message: string) => Promise<{ success: boolean; message?: string; error?: string }>;
                push: (repoPath: string) => Promise<{ success: boolean; message?: string; error?: string }>;
                pull: (repoPath: string) => Promise<{ success: boolean; message?: string; error?: string }>;
                listBranches: (repoPath: string) => Promise<{ success: boolean; branches?: { name: string; current: boolean; isRemote: boolean }[]; error?: string }>;
                createBranch: (repoPath: string, branchName: string, checkout?: boolean) => Promise<{ success: boolean; message?: string; error?: string }>;
                checkout: (repoPath: string, branchName: string) => Promise<{ success: boolean; message?: string; error?: string }>;
            };
            plugins: {
                list: () => Promise<import('../shared/plugin-types').PluginInfo[]>;
                getInfo: (pluginId: string) => Promise<import('../shared/plugin-types').PluginInfo | undefined>;
                load: (pluginId: string) => Promise<{ success: boolean; error?: string }>;
                unload: (pluginId: string) => Promise<{ success: boolean; error?: string }>;
                enable: (pluginId: string) => Promise<boolean>;
                disable: (pluginId: string) => Promise<boolean>;
                reload: (pluginId: string) => Promise<{ success: boolean; error?: string }>;
                invokeMain: (pluginId: string, method: string, args: any[]) => Promise<any>;
                reportReady: (pluginId: string) => void;
                reportError: (pluginId: string, error: string) => void;
                onEvent: (callback: (pluginId: string, event: string, data: any) => void) => void;
            };
        };
    }
}

