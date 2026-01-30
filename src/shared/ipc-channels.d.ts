/**
 * IPC channel names for main<->renderer communication
 */
export declare const IPC_CHANNELS: {
    readonly FILE_OPEN: "file:open";
    readonly FILE_OPEN_DIALOG: "file:open-dialog";
    readonly FILE_SAVE: "file:save";
    readonly FILE_SAVE_AS: "file:save-as";
    readonly FILE_READ: "file:read";
    readonly FILE_EXISTS: "file:exists";
    readonly FILE_CHANGED: "file:changed";
    readonly FOLDER_OPEN: "folder:open";
    readonly FOLDER_OPEN_DIALOG: "folder:open-dialog";
    readonly FOLDER_READ: "folder:read";
    readonly FOLDER_WATCH: "folder:watch";
    readonly FOLDER_UNWATCH: "folder:unwatch";
    readonly FOLDER_CHANGED: "folder:changed";
    readonly SETTINGS_GET: "settings:get";
    readonly SETTINGS_SET: "settings:set";
    readonly SETTINGS_GET_ALL: "settings:get-all";
    readonly SETTINGS_SAVE: "settings:save";
    readonly WINDOW_MINIMIZE: "window:minimize";
    readonly WINDOW_MAXIMIZE: "window:maximize";
    readonly WINDOW_CLOSE: "window:close";
    readonly WINDOW_FULLSCREEN: "window:fullscreen";
    readonly WINDOW_STATE_CHANGED: "window:state-changed";
    readonly APP_QUIT: "app:quit";
    readonly APP_GET_PATH: "app:get-path";
    readonly MENU_NEW_TAB: "menu:new-tab";
    readonly MENU_OPEN_FILE: "menu:open-file";
    readonly MENU_OPEN_FOLDER: "menu:open-folder";
    readonly MENU_SAVE: "menu:save";
    readonly MENU_SAVE_AS: "menu:save-as";
    readonly MENU_CLOSE_TAB: "menu:close-tab";
    readonly MENU_FIND: "menu:find";
    readonly MENU_REPLACE: "menu:replace";
    readonly MENU_TOGGLE_SIDEBAR: "menu:toggle-sidebar";
    readonly MENU_PREFERENCES: "menu:preferences";
};
export type IpcChannel = typeof IPC_CHANNELS[keyof typeof IPC_CHANNELS];
//# sourceMappingURL=ipc-channels.d.ts.map