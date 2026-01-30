"use strict";
/**
 * IPC channel names for main<->renderer communication
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPC_CHANNELS = void 0;
exports.IPC_CHANNELS = {
    // File operations
    FILE_OPEN: 'file:open',
    FILE_OPEN_DIALOG: 'file:open-dialog',
    FILE_SAVE: 'file:save',
    FILE_SAVE_AS: 'file:save-as',
    FILE_READ: 'file:read',
    FILE_EXISTS: 'file:exists',
    FILE_CHANGED: 'file:changed',
    // Folder operations
    FOLDER_OPEN: 'folder:open',
    FOLDER_OPEN_DIALOG: 'folder:open-dialog',
    FOLDER_READ: 'folder:read',
    FOLDER_WATCH: 'folder:watch',
    FOLDER_UNWATCH: 'folder:unwatch',
    FOLDER_CHANGED: 'folder:changed',
    // Settings
    SETTINGS_GET: 'settings:get',
    SETTINGS_SET: 'settings:set',
    SETTINGS_GET_ALL: 'settings:get-all',
    SETTINGS_SAVE: 'settings:save',
    // Window
    WINDOW_MINIMIZE: 'window:minimize',
    WINDOW_MAXIMIZE: 'window:maximize',
    WINDOW_CLOSE: 'window:close',
    WINDOW_FULLSCREEN: 'window:fullscreen',
    WINDOW_STATE_CHANGED: 'window:state-changed',
    // App
    APP_QUIT: 'app:quit',
    APP_GET_PATH: 'app:get-path',
    // Menu actions (from main to renderer)
    MENU_NEW_TAB: 'menu:new-tab',
    MENU_OPEN_FILE: 'menu:open-file',
    MENU_OPEN_FOLDER: 'menu:open-folder',
    MENU_SAVE: 'menu:save',
    MENU_SAVE_AS: 'menu:save-as',
    MENU_CLOSE_TAB: 'menu:close-tab',
    MENU_FIND: 'menu:find',
    MENU_REPLACE: 'menu:replace',
    MENU_TOGGLE_SIDEBAR: 'menu:toggle-sidebar',
    MENU_PREFERENCES: 'menu:preferences',
};
//# sourceMappingURL=ipc-channels.js.map