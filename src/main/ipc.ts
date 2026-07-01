/**
 * IPC Handlers for MyCode
 * Routes messages between main and renderer processes
 */

import { ipcMain, dialog, BrowserWindow } from 'electron';
import { IPC_CHANNELS } from '../shared/ipc-channels';
import { FileService } from './services/fileService';
import { SettingsService } from './services/settingsService';
import { GitService } from './services/gitService';
import { RunnerConfigService } from './services/runnerConfigService';

export function setupIpcHandlers(
    mainWindow: BrowserWindow,
    fileService: FileService,
    settingsService: SettingsService,
    gitService: GitService,
    runnerConfigService: RunnerConfigService
): void {

    // File operations
    ipcMain.handle(IPC_CHANNELS.FILE_READ, async (_event, filePath: string) => {
        return await fileService.readFile(filePath);
    });

    ipcMain.handle(IPC_CHANNELS.FILE_SAVE, async (_event, filePath: string, content: string) => {
        return await fileService.writeFile(filePath, content);
    });

    ipcMain.handle(IPC_CHANNELS.FILE_EXISTS, async (_event, filePath: string) => {
        return await fileService.fileExists(filePath);
    });

    ipcMain.handle(IPC_CHANNELS.FILE_OPEN_DIALOG, async () => {
        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ['openFile', 'multiSelections'],
        });
        return result.canceled ? null : result.filePaths;
    });

    ipcMain.handle(IPC_CHANNELS.FILE_SAVE_AS, async (_event, content: string, defaultPath?: string) => {
        const result = await dialog.showSaveDialog(mainWindow, {
            defaultPath,
            filters: [
                { name: 'All Files', extensions: ['*'] },
            ],
        });
        if (!result.canceled && result.filePath) {
            await fileService.writeFile(result.filePath, content);
            return result.filePath;
        }
        return null;
    });

    // Folder operations
    ipcMain.handle(IPC_CHANNELS.FOLDER_OPEN_DIALOG, async () => {
        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ['openDirectory'],
        });
        return result.canceled ? null : result.filePaths[0];
    });

    ipcMain.handle(IPC_CHANNELS.FOLDER_CREATE_PROJECT_DIALOG, async () => {
        const result = await dialog.showSaveDialog(mainWindow, {
            title: 'Create New Project Folder',
            buttonLabel: 'Create',
            properties: ['createDirectory', 'showOverwriteConfirmation'],
        });
        if (result.canceled || !result.filePath) {
            return null;
        }
        try {
            const fs = require('fs').promises;
            await fs.mkdir(result.filePath, { recursive: true });
            return result.filePath;
        } catch (error: any) {
            return null;
        }
    });

    ipcMain.handle(IPC_CHANNELS.FOLDER_READ, async (_event, folderPath: string) => {
        return await fileService.readDirectory(folderPath);
    });

    ipcMain.handle(IPC_CHANNELS.FOLDER_WATCH, async (_event, folderPath: string) => {
        fileService.watchFolder(folderPath, (event, path) => {
            mainWindow.webContents.send(IPC_CHANNELS.FOLDER_CHANGED, { event, path, folderPath });
        });
        return true;
    });

    ipcMain.handle(IPC_CHANNELS.FOLDER_UNWATCH, async (_event, folderPath: string) => {
        fileService.unwatchFolder(folderPath);
        return true;
    });

    ipcMain.handle(IPC_CHANNELS.FOLDER_CREATE_FILE, async (_event, filePath: string) => {
        try {
            await fileService.writeFile(filePath, '');
            return { success: true, path: filePath };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle(IPC_CHANNELS.FOLDER_CREATE_FOLDER, async (_event, folderPath: string) => {
        try {
            const fs = require('fs').promises;
            await fs.mkdir(folderPath, { recursive: true });
            return { success: true, path: folderPath };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle(IPC_CHANNELS.FOLDER_RENAME, async (_event, oldPath: string, newPath: string) => {
        try {
            const fs = require('fs').promises;
            await fs.rename(oldPath, newPath);
            return { success: true, oldPath, newPath };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle(IPC_CHANNELS.FOLDER_DELETE, async (_event, targetPath: string) => {
        try {
            const fs = require('fs').promises;
            const stat = await fs.stat(targetPath);
            if (stat.isDirectory()) {
                await fs.rm(targetPath, { recursive: true });
            } else {
                await fs.unlink(targetPath);
            }
            return { success: true, path: targetPath };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Settings
    ipcMain.handle(IPC_CHANNELS.SETTINGS_GET_ALL, () => {
        return settingsService.getAll();
    });

    ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, (_event, key: string) => {
        return settingsService.get(key as any);
    });

    ipcMain.handle(IPC_CHANNELS.SETTINGS_SET, async (_event, key: string, value: any) => {
        settingsService.set(key as any, value);
        await settingsService.save();
        return true;
    });

    // Window operations
    ipcMain.on(IPC_CHANNELS.WINDOW_MINIMIZE, () => {
        mainWindow.minimize();
    });

    ipcMain.on(IPC_CHANNELS.WINDOW_MAXIMIZE, () => {
        if (mainWindow.isMaximized()) {
            mainWindow.unmaximize();
        } else {
            mainWindow.maximize();
        }
    });

    ipcMain.on(IPC_CHANNELS.WINDOW_FULLSCREEN, () => {
        mainWindow.setFullScreen(!mainWindow.isFullScreen());
    });

    ipcMain.on(IPC_CHANNELS.WINDOW_CLOSE, () => {
        mainWindow.close();
    });

    ipcMain.on(IPC_CHANNELS.APP_QUIT, () => {
        require('electron').app.quit();
    });

    ipcMain.handle(IPC_CHANNELS.APP_GET_PATH, () => {
        return require('electron').app.getAppPath();
    });

    ipcMain.handle('app:get-appimage-dir', () => {
        const appImagePath = process.env.APPIMAGE;
        if (!appImagePath) return null;
        const path = require('path');
        return path.dirname(appImagePath);
    });

    // Git operations
    ipcMain.handle(IPC_CHANNELS.GIT_IS_REPO, async (_event, filePath: string) => {
        return await gitService.isGitRepository(filePath);
    });

    ipcMain.handle(IPC_CHANNELS.GIT_INIT, async (_event, folderPath: string) => {
        return await gitService.init(folderPath);
    });

    ipcMain.handle(IPC_CHANNELS.GIT_GET_STATUS, async (_event, repoPath: string) => {
        return await gitService.getStatus(repoPath);
    });

    ipcMain.handle(IPC_CHANNELS.GIT_GET_FILE_DIFF, async (_event, repoPath: string, filePath: string) => {
        return await gitService.getFileDiff(repoPath, filePath);
    });

    ipcMain.handle(IPC_CHANNELS.GIT_GET_FILE_FROM_HEAD, async (_event, repoPath: string, filePath: string) => {
        return await gitService.getFileFromHead(repoPath, filePath);
    });

    ipcMain.handle(IPC_CHANNELS.GIT_STAGE_FILE, async (_event, repoPath: string, filePath: string) => {
        return await gitService.stageFile(repoPath, filePath);
    });

    ipcMain.handle(IPC_CHANNELS.GIT_UNSTAGE_FILE, async (_event, repoPath: string, filePath: string) => {
        return await gitService.unstageFile(repoPath, filePath);
    });

    ipcMain.handle(IPC_CHANNELS.GIT_STAGE_ALL, async (_event, repoPath: string) => {
        return await gitService.stageAll(repoPath);
    });

    ipcMain.handle(IPC_CHANNELS.GIT_COMMIT, async (_event, repoPath: string, message: string) => {
        return await gitService.commit(repoPath, message);
    });

    ipcMain.handle(IPC_CHANNELS.GIT_PUSH, async (_event, repoPath: string) => {
        return await gitService.push(repoPath);
    });

    ipcMain.handle(IPC_CHANNELS.GIT_PULL, async (_event, repoPath: string) => {
        return await gitService.pull(repoPath);
    });

    ipcMain.handle(IPC_CHANNELS.GIT_LIST_BRANCHES, async (_event, repoPath: string) => {
        return await gitService.listBranches(repoPath);
    });

    ipcMain.handle(IPC_CHANNELS.GIT_CREATE_BRANCH, async (_event, repoPath: string, branchName: string, checkout: boolean = true) => {
        return await gitService.createBranch(repoPath, branchName, checkout);
    });

    ipcMain.handle(IPC_CHANNELS.GIT_CHECKOUT, async (_event, repoPath: string, branchName: string) => {
        return await gitService.checkout(repoPath, branchName);
    });

    // Runner configuration
    ipcMain.handle(IPC_CHANNELS.RUNNER_CONFIG_GET_ALL, () => {
        return runnerConfigService.getAll();
    });

    ipcMain.handle(IPC_CHANNELS.RUNNER_CONFIG_SET, async (_event, ext: string, entry: any) => {
        runnerConfigService.set(ext, entry);
        await runnerConfigService.save();
        return true;
    });

    ipcMain.handle(IPC_CHANNELS.RUNNER_CONFIG_DELETE, async (_event, ext: string) => {
        runnerConfigService.delete(ext);
        await runnerConfigService.save();
        return true;
    });
}

