/**
 * PluginIPC - IPC bridge for plugin communication between main and renderer
 */

import { ipcMain, BrowserWindow, IpcMainInvokeEvent } from 'electron';
import { IPC_CHANNELS } from '../../shared/ipc-channels';
import { PluginManager } from './PluginManager';
import { PluginLoader } from './PluginLoader';
import { PluginInfo } from '../../shared/plugin-types';

export class PluginIPC {
    private pluginManager: PluginManager;
    private pluginLoader: PluginLoader;

    constructor(pluginManager: PluginManager, pluginLoader: PluginLoader) {
        this.pluginManager = pluginManager;
        this.pluginLoader = pluginLoader;
    }

    /**
     * Setup all plugin IPC handlers
     */
    setup(): void {
        // List all discovered plugins
        ipcMain.handle(IPC_CHANNELS.PLUGIN_LIST, async () => {
            return this.pluginManager.getPlugins();
        });

        // Get info for a specific plugin
        ipcMain.handle(IPC_CHANNELS.PLUGIN_GET_INFO, async (_, pluginId: string) => {
            return this.pluginManager.getPlugin(pluginId);
        });

        // Load a plugin (activate main process part)
        ipcMain.handle(IPC_CHANNELS.PLUGIN_LOAD, async (event, pluginId: string) => {
            const plugin = this.pluginManager.getPlugin(pluginId);
            if (!plugin) {
                throw new Error(`Plugin not found: ${pluginId}`);
            }

            try {
                // Load main process module if it exists
                await this.pluginLoader.loadMainModule(plugin);
                await this.pluginLoader.activateMainModule(plugin, this.getStoragePath());
                return { success: true };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        // Unload a plugin
        ipcMain.handle(IPC_CHANNELS.PLUGIN_UNLOAD, async (_, pluginId: string) => {
            try {
                await this.pluginLoader.deactivateMainModule(pluginId);
                return { success: true };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        // Enable a plugin
        ipcMain.handle(IPC_CHANNELS.PLUGIN_ENABLE, async (_, pluginId: string) => {
            return this.pluginManager.enablePlugin(pluginId);
        });

        // Disable a plugin
        ipcMain.handle(IPC_CHANNELS.PLUGIN_DISABLE, async (_, pluginId: string) => {
            return this.pluginManager.disablePlugin(pluginId);
        });

        // Reload a plugin
        ipcMain.handle(IPC_CHANNELS.PLUGIN_RELOAD, async (event, pluginId: string) => {
            try {
                await this.pluginLoader.deactivateMainModule(pluginId);
                this.pluginManager.reloadPlugin(pluginId);
                
                const plugin = this.pluginManager.getPlugin(pluginId);
                if (plugin) {
                    await this.pluginLoader.loadMainModule(plugin);
                    await this.pluginLoader.activateMainModule(plugin, this.getStoragePath());
                }
                
                return { success: true };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        // Plugin reports it's ready (activated in renderer)
        ipcMain.on(IPC_CHANNELS.PLUGIN_READY, (_, pluginId: string) => {
            this.pluginManager.setPluginActivated(pluginId, true);
        });

        // Plugin reports an error
        ipcMain.on(IPC_CHANNELS.PLUGIN_ERROR, (_, pluginId: string, error: string) => {
            this.pluginManager.setPluginActivated(pluginId, false, error);
        });

        // Invoke a method on a main process plugin
        ipcMain.handle(IPC_CHANNELS.PLUGIN_INVOKE_MAIN, async (_, pluginId: string, method: string, args: any[]) => {
            const module = this.pluginLoader.getModule(pluginId);
            if (!module) {
                throw new Error(`Plugin main module not loaded: ${pluginId}`);
            }

            const fn = (module as any)[method];
            if (typeof fn !== 'function') {
                throw new Error(`Method not found: ${pluginId}.${method}`);
            }

            return fn.apply(module, args);
        });

        console.log('[PluginIPC] IPC handlers registered');
    }

    /**
     * Send an event to all renderer windows
     */
    broadcastToRenderer(channel: string, ...args: any[]): void {
        const windows = BrowserWindow.getAllWindows();
        for (const win of windows) {
            win.webContents.send(channel, ...args);
        }
    }

    /**
     * Get storage path for plugin data
     */
    private getStoragePath(): string {
        const { app } = require('electron');
        const path = require('path');
        return path.join(app.getPath('userData'), 'plugin-data');
    }
}

