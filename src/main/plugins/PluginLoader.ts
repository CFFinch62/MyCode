/**
 * PluginLoader - Loads and validates plugin code for the main process
 * Handles main process plugin entry points (optional, for Node.js access)
 */

import * as fs from 'fs';
import * as path from 'path';
import { PluginManifest, PluginInfo } from '../../shared/plugin-types';

export interface MainPluginModule {
    activate?(context: MainPluginContext): void | Promise<void>;
    deactivate?(): void | Promise<void>;
}

export interface MainPluginContext {
    pluginPath: string;
    storagePath: string;
    log: {
        info: (message: string, ...args: any[]) => void;
        warn: (message: string, ...args: any[]) => void;
        error: (message: string, ...args: any[]) => void;
    };
}

export class PluginLoader {
    private loadedModules: Map<string, MainPluginModule> = new Map();
    private contexts: Map<string, MainPluginContext> = new Map();

    /**
     * Load a plugin's main process module (if it has one)
     */
    async loadMainModule(plugin: PluginInfo): Promise<MainPluginModule | null> {
        const mainEntry = plugin.manifest.mycode.main;
        if (!mainEntry) {
            return null; // No main process code
        }

        const mainPath = path.join(plugin.path, mainEntry);
        
        if (!fs.existsSync(mainPath)) {
            console.warn(`[PluginLoader] Main entry not found: ${mainPath}`);
            return null;
        }

        try {
            // Clear require cache for hot reloading
            delete require.cache[require.resolve(mainPath)];
            
            const module = require(mainPath) as MainPluginModule;
            this.loadedModules.set(plugin.id, module);
            
            console.log(`[PluginLoader] Loaded main module: ${plugin.id}`);
            return module;
        } catch (error) {
            console.error(`[PluginLoader] Failed to load main module: ${plugin.id}`, error);
            throw error;
        }
    }

    /**
     * Activate a plugin's main process module
     */
    async activateMainModule(plugin: PluginInfo, storagePath: string): Promise<void> {
        const module = this.loadedModules.get(plugin.id);
        if (!module || !module.activate) {
            return;
        }

        const context = this.createContext(plugin, storagePath);
        this.contexts.set(plugin.id, context);

        try {
            await module.activate(context);
            console.log(`[PluginLoader] Activated main module: ${plugin.id}`);
        } catch (error) {
            console.error(`[PluginLoader] Failed to activate main module: ${plugin.id}`, error);
            throw error;
        }
    }

    /**
     * Deactivate a plugin's main process module
     */
    async deactivateMainModule(pluginId: string): Promise<void> {
        const module = this.loadedModules.get(pluginId);
        if (!module || !module.deactivate) {
            return;
        }

        try {
            await module.deactivate();
            console.log(`[PluginLoader] Deactivated main module: ${pluginId}`);
        } catch (error) {
            console.error(`[PluginLoader] Failed to deactivate main module: ${pluginId}`, error);
        }

        this.loadedModules.delete(pluginId);
        this.contexts.delete(pluginId);
    }

    /**
     * Create a context for a main process plugin
     */
    private createContext(plugin: PluginInfo, storagePath: string): MainPluginContext {
        const pluginStoragePath = path.join(storagePath, plugin.id);
        
        // Ensure storage directory exists
        if (!fs.existsSync(pluginStoragePath)) {
            fs.mkdirSync(pluginStoragePath, { recursive: true });
        }

        return {
            pluginPath: plugin.path,
            storagePath: pluginStoragePath,
            log: {
                info: (message: string, ...args: any[]) => {
                    console.log(`[Plugin:${plugin.id}]`, message, ...args);
                },
                warn: (message: string, ...args: any[]) => {
                    console.warn(`[Plugin:${plugin.id}]`, message, ...args);
                },
                error: (message: string, ...args: any[]) => {
                    console.error(`[Plugin:${plugin.id}]`, message, ...args);
                },
            },
        };
    }

    /**
     * Unload all plugins
     */
    async unloadAll(): Promise<void> {
        for (const pluginId of this.loadedModules.keys()) {
            await this.deactivateMainModule(pluginId);
        }
    }

    /**
     * Check if a plugin has a main module loaded
     */
    hasMainModule(pluginId: string): boolean {
        return this.loadedModules.has(pluginId);
    }

    /**
     * Get loaded module for invoking methods
     */
    getModule(pluginId: string): MainPluginModule | undefined {
        return this.loadedModules.get(pluginId);
    }
}

