/**
 * IPC channel names for main<->renderer communication
 */

export const IPC_CHANNELS = {
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
    FOLDER_CREATE_PROJECT_DIALOG: 'folder:create-project-dialog',
    FOLDER_READ: 'folder:read',
    FOLDER_WATCH: 'folder:watch',
    FOLDER_UNWATCH: 'folder:unwatch',
    FOLDER_CHANGED: 'folder:changed',
    FOLDER_CREATE_FILE: 'folder:create-file',
    FOLDER_CREATE_FOLDER: 'folder:create-folder',
    FOLDER_RENAME: 'folder:rename',
    FOLDER_DELETE: 'folder:delete',

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
    MENU_NEW_PROJECT_FOLDER: 'menu:new-project-folder',
    MENU_SAVE: 'menu:save',
    MENU_SAVE_AS: 'menu:save-as',
    MENU_CLOSE_TAB: 'menu:close-tab',
    MENU_FIND: 'menu:find',
    MENU_REPLACE: 'menu:replace',
    MENU_SELECT_ALL: 'menu:select-all',
    MENU_TOGGLE_SIDEBAR: 'menu:toggle-sidebar',
    MENU_TOGGLE_PREVIEW: 'menu:toggle-preview',
    MENU_TOGGLE_TERMINAL: 'menu:toggle-terminal',
    MENU_PREFERENCES: 'menu:preferences',

    // Terminal operations
    TERMINAL_CREATE: 'terminal:create',
    TERMINAL_DATA: 'terminal:data',
    TERMINAL_RESIZE: 'terminal:resize',
    TERMINAL_DESTROY: 'terminal:destroy',
    TERMINAL_DATA_FROM_PTY: 'terminal:data-from-pty',
    TERMINAL_EXIT: 'terminal:exit',

    // Git operations
    GIT_IS_REPO: 'git:is-repo',
    GIT_INIT: 'git:init',
    GIT_GET_STATUS: 'git:get-status',
    GIT_GET_FILE_DIFF: 'git:get-file-diff',
    GIT_GET_FILE_FROM_HEAD: 'git:get-file-from-head',
    GIT_STAGE_FILE: 'git:stage-file',
    GIT_UNSTAGE_FILE: 'git:unstage-file',
    GIT_STAGE_ALL: 'git:stage-all',
    GIT_COMMIT: 'git:commit',
    GIT_PUSH: 'git:push',
    GIT_PULL: 'git:pull',
    GIT_LIST_BRANCHES: 'git:list-branches',
    GIT_CREATE_BRANCH: 'git:create-branch',
    GIT_CHECKOUT: 'git:checkout',
    GIT_STATUS_CHANGED: 'git:status-changed',

    // Menu actions for Git
    MENU_GIT_COMMIT: 'menu:git-commit',
    MENU_GIT_PUSH: 'menu:git-push',
    MENU_GIT_PULL: 'menu:git-pull',

    // Menu actions for Plugins
    MENU_PLUGIN_MANAGER: 'menu:plugin-manager',

    // Plugin operations
    PLUGIN_LIST: 'plugin:list',
    PLUGIN_GET_INFO: 'plugin:get-info',
    PLUGIN_LOAD: 'plugin:load',
    PLUGIN_UNLOAD: 'plugin:unload',
    PLUGIN_ENABLE: 'plugin:enable',
    PLUGIN_DISABLE: 'plugin:disable',
    PLUGIN_RELOAD: 'plugin:reload',
    PLUGIN_GET_SETTINGS: 'plugin:get-settings',
    PLUGIN_SET_SETTINGS: 'plugin:set-settings',
    PLUGIN_INVOKE_MAIN: 'plugin:invoke-main',
    PLUGIN_INVOKE_RENDERER: 'plugin:invoke-renderer',
    PLUGIN_EVENT: 'plugin:event',
    PLUGIN_READY: 'plugin:ready',
    PLUGIN_ERROR: 'plugin:error',
} as const;

export type IpcChannel = typeof IPC_CHANNELS[keyof typeof IPC_CHANNELS];
