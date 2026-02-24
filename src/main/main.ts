/**
 * MyCode - Main Process Entry Point
 * Handles application lifecycle, window management, and IPC
 */

import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron';
import * as path from 'path';
import { FileService } from './services/fileService';
import { SettingsService } from './services/settingsService';
import { GitService } from './services/gitService';
import { createMenu } from './menu';
import { setupIpcHandlers } from './ipc';
import { Settings } from '../shared/types';
import { PluginManager, PluginLoader, PluginIPC } from './plugins';

// Keep a global reference of the window object
let mainWindow: BrowserWindow | null = null;
let fileService: FileService;
let settingsService: SettingsService;
let gitService: GitService;
let pluginManager: PluginManager;
let pluginLoader: PluginLoader;
let pluginIPC: PluginIPC;

async function createWindow(): Promise<void> {
    // Initialize services
    settingsService = new SettingsService();
    await settingsService.load();
    fileService = new FileService();
    gitService = new GitService();

    // Initialize plugin system
    pluginManager = new PluginManager();
    pluginLoader = new PluginLoader();
    pluginIPC = new PluginIPC(pluginManager, pluginLoader);

    await pluginManager.initialize();
    pluginIPC.setup();

    // Initialize PTY service
    const { ptyService } = require('./services/ptyService');
    // We defer pty init until window is ready so we have webContents


    const settings = settingsService.getAll();

    // Determine icon path (different for dev vs production)
    const getIconPath = () => {
        if (app.isPackaged) {
            // In production, icon is in resources
            return path.join(process.resourcesPath, 'icon.png');
        } else {
            // In development, icon is in build folder
            return path.join(__dirname, '../../build/icon.png');
        }
    };

    // Create the browser window
    mainWindow = new BrowserWindow({
        width: settings.windowSize.width,
        height: settings.windowSize.height,
        minWidth: 600,
        minHeight: 400,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
        },
        show: false, // Don't show until ready
        backgroundColor: settings.preferDarkStyle ? '#1e1e1e' : '#ffffff',
        titleBarStyle: 'default',
        icon: getIconPath(),
    });

    // Load the index.html
    mainWindow.loadFile(path.join(__dirname, '../../renderer/index.html'));

    // Show window when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();

        // Initialize PTY service with webContents
        const { ptyService } = require('./services/ptyService');
        if (mainWindow) {
            ptyService.init(mainWindow.webContents);
        }

        // Apply saved window state
        if (settings.windowState === 'Maximized') {
            mainWindow?.maximize();
        } else if (settings.windowState === 'Fullscreen') {
            mainWindow?.setFullScreen(true);
        }
    });

    // Save window state on close
    mainWindow.on('close', async () => {
        if (mainWindow) {
            const bounds = mainWindow.getBounds();
            const isMaximized = mainWindow.isMaximized();
            const isFullScreen = mainWindow.isFullScreen();

            settingsService.set('windowSize', { width: bounds.width, height: bounds.height });
            settingsService.set('windowState', isFullScreen ? 'Fullscreen' : isMaximized ? 'Maximized' : 'Normal');
            await settingsService.save();
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Create application menu
    const menu = createMenu(mainWindow);
    Menu.setApplicationMenu(menu);

    // Setup IPC handlers
    setupIpcHandlers(mainWindow, fileService, settingsService, gitService);

    // Open DevTools in development
    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
    }
}

// This method will be called when Electron has finished initialization
app.whenReady().then(createWindow);

// Quit when all windows are closed
app.on('window-all-closed', () => {
    // On macOS, it's common for applications to stay open until the user quits explicitly
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On macOS, re-create window when dock icon is clicked and no other windows are open
    if (mainWindow === null) {
        createWindow();
    }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
});

export { mainWindow, fileService, settingsService, gitService, pluginManager, pluginLoader };
