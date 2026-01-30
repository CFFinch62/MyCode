/**
 * Application Menu for MyCode
 * Implements Elementary Code keyboard shortcuts
 */

import { Menu, BrowserWindow, app, MenuItemConstructorOptions } from 'electron';
import { IPC_CHANNELS } from '../shared/ipc-channels';

export function createMenu(mainWindow: BrowserWindow): Menu {
    const isMac = process.platform === 'darwin';

    const template: MenuItemConstructorOptions[] = [
        // App menu (macOS only)
        ...(isMac ? [{
            label: app.name,
            submenu: [
                { role: 'about' as const },
                { type: 'separator' as const },
                {
                    label: 'Preferences...',
                    accelerator: 'Cmd+,',
                    click: () => mainWindow.webContents.send(IPC_CHANNELS.MENU_PREFERENCES),
                },
                { type: 'separator' as const },
                { role: 'services' as const },
                { type: 'separator' as const },
                { role: 'hide' as const },
                { role: 'hideOthers' as const },
                { role: 'unhide' as const },
                { type: 'separator' as const },
                { role: 'quit' as const },
            ],
        }] : []),

        // File menu
        {
            label: 'File',
            submenu: [
                {
                    label: 'New Tab',
                    accelerator: 'CmdOrCtrl+N',
                    click: () => mainWindow.webContents.send(IPC_CHANNELS.MENU_NEW_TAB),
                },
                { type: 'separator' },
                {
                    label: 'Open File...',
                    accelerator: 'CmdOrCtrl+O',
                    click: () => mainWindow.webContents.send(IPC_CHANNELS.MENU_OPEN_FILE),
                },
                {
                    label: 'Open Folder...',
                    accelerator: 'CmdOrCtrl+Shift+O',
                    click: () => mainWindow.webContents.send(IPC_CHANNELS.MENU_OPEN_FOLDER),
                },
                {
                    label: 'New Project Folder...',
                    accelerator: 'CmdOrCtrl+Shift+N',
                    click: () => mainWindow.webContents.send(IPC_CHANNELS.MENU_NEW_PROJECT_FOLDER),
                },
                { type: 'separator' },
                {
                    label: 'Save',
                    accelerator: 'CmdOrCtrl+S',
                    click: () => mainWindow.webContents.send(IPC_CHANNELS.MENU_SAVE),
                },
                {
                    label: 'Save As...',
                    accelerator: 'CmdOrCtrl+Shift+S',
                    click: () => mainWindow.webContents.send(IPC_CHANNELS.MENU_SAVE_AS),
                },
                { type: 'separator' },
                {
                    label: 'Close Tab',
                    accelerator: 'CmdOrCtrl+W',
                    click: () => mainWindow.webContents.send(IPC_CHANNELS.MENU_CLOSE_TAB),
                },
                { type: 'separator' },
                ...(isMac ? [] : [
                    {
                        label: 'Preferences',
                        accelerator: 'CmdOrCtrl+,',
                        click: () => mainWindow.webContents.send(IPC_CHANNELS.MENU_PREFERENCES),
                    },
                    { type: 'separator' as const },
                    {
                        label: 'Quit',
                        accelerator: 'CmdOrCtrl+Q',
                        click: () => app.quit(),
                    },
                ]),
            ],
        },

        // Edit menu
        {
            label: 'Edit',
            submenu: [
                { role: 'undo', accelerator: 'CmdOrCtrl+Z' },
                { role: 'redo', accelerator: 'CmdOrCtrl+Shift+Z' },
                { type: 'separator' },
                { role: 'cut', accelerator: 'CmdOrCtrl+X' },
                { role: 'copy', accelerator: 'CmdOrCtrl+C' },
                { role: 'paste', accelerator: 'CmdOrCtrl+V' },
                {
                    label: 'Select All',
                    accelerator: 'CmdOrCtrl+A',
                    click: () => mainWindow.webContents.send(IPC_CHANNELS.MENU_SELECT_ALL),
                },
                { type: 'separator' },
                {
                    label: 'Find',
                    accelerator: 'CmdOrCtrl+F',
                    click: () => mainWindow.webContents.send(IPC_CHANNELS.MENU_FIND),
                },
                {
                    label: 'Find and Replace',
                    accelerator: 'CmdOrCtrl+R',
                    click: () => mainWindow.webContents.send(IPC_CHANNELS.MENU_REPLACE),
                },
            ],
        },

        // View menu
        {
            label: 'View',
            submenu: [
                {
                    label: 'Toggle Sidebar',
                    accelerator: 'F9',
                    click: () => mainWindow.webContents.send(IPC_CHANNELS.MENU_TOGGLE_SIDEBAR),
                },
                {
                    label: 'Toggle Markdown Preview',
                    accelerator: 'CmdOrCtrl+Shift+M',
                    click: () => mainWindow.webContents.send(IPC_CHANNELS.MENU_TOGGLE_PREVIEW),
                },
                {
                    label: 'Toggle Terminal',
                    accelerator: 'CmdOrCtrl+`',
                    click: () => mainWindow.webContents.send(IPC_CHANNELS.MENU_TOGGLE_TERMINAL),
                },
                { type: 'separator' },
                { role: 'resetZoom', accelerator: 'CmdOrCtrl+0' },
                { role: 'zoomIn', accelerator: 'CmdOrCtrl+Plus' },
                { role: 'zoomOut', accelerator: 'CmdOrCtrl+-' },
                { type: 'separator' },
                { role: 'togglefullscreen', accelerator: 'F11' },
                { type: 'separator' },
                { role: 'toggleDevTools' },
            ],
        },

        // Git menu
        {
            label: 'Git',
            submenu: [
                {
                    label: 'Commit...',
                    accelerator: 'CmdOrCtrl+Shift+K',
                    click: () => mainWindow.webContents.send(IPC_CHANNELS.MENU_GIT_COMMIT),
                },
                { type: 'separator' },
                {
                    label: 'Push',
                    click: () => mainWindow.webContents.send(IPC_CHANNELS.MENU_GIT_PUSH),
                },
                {
                    label: 'Pull',
                    click: () => mainWindow.webContents.send(IPC_CHANNELS.MENU_GIT_PULL),
                },
            ],
        },

        // Help menu
        {
            label: 'Help',
            submenu: [
                {
                    label: 'About MyCode',
                    click: () => {
                        // Show about dialog
                        const { dialog } = require('electron');
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'About MyCode',
                            message: 'MyCode',
                            detail: 'A modern, cross-platform code editor\ninspired by Elementary Code.\n\nVersion 0.1.0\n\n© 2026 Chuck Finch - Fragillidae Software',
                        });
                    },
                },
            ],
        },
    ];

    return Menu.buildFromTemplate(template);
}
