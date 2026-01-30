/**
 * PluginManager - Main process plugin lifecycle management
 * Discovers, loads, and manages plugins for MyCode editor
 */

import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';
import { PluginManifest, PluginInfo, PluginState } from '../../shared/plugin-types';

export interface PluginManagerEvents {
    'plugin:discovered': (info: PluginInfo) => void;
    'plugin:loaded': (info: PluginInfo) => void;
    'plugin:activated': (info: PluginInfo) => void;
    'plugin:deactivated': (info: PluginInfo) => void;
    'plugin:error': (id: string, error: Error) => void;
    'plugin:state-changed': (id: string, state: PluginState) => void;
}

export class PluginManager extends EventEmitter {
    private plugins: Map<string, PluginInfo> = new Map();
    private pluginPaths: string[] = [];
    private initialized: boolean = false;
    private pluginConfigPath: string = '';
    private disabledPlugins: Set<string> = new Set();

    constructor() {
        super();
        this.setupPluginPaths();
        this.loadPluginConfig();
    }

    /**
     * Load plugin enabled/disabled state from config file
     */
    private loadPluginConfig(): void {
        const userDataPath = app.getPath('userData');
        this.pluginConfigPath = path.join(userDataPath, 'plugin-config.json');

        try {
            if (fs.existsSync(this.pluginConfigPath)) {
                const data = fs.readFileSync(this.pluginConfigPath, 'utf-8');
                const config = JSON.parse(data);
                if (Array.isArray(config.disabledPlugins)) {
                    this.disabledPlugins = new Set(config.disabledPlugins);
                }
            }
        } catch (error) {
            console.error('[PluginManager] Failed to load plugin config:', error);
        }
    }

    /**
     * Save plugin enabled/disabled state to config file
     */
    private savePluginConfig(): void {
        try {
            const config = {
                disabledPlugins: Array.from(this.disabledPlugins)
            };
            fs.writeFileSync(this.pluginConfigPath, JSON.stringify(config, null, 2), 'utf-8');
        } catch (error) {
            console.error('[PluginManager] Failed to save plugin config:', error);
        }
    }

    /**
     * Setup plugin search paths
     */
    private setupPluginPaths(): void {
        const userDataPath = app.getPath('userData');
        
        // User plugins directory
        this.pluginPaths.push(path.join(userDataPath, 'plugins'));
        
        // Built-in plugins (in app resources)
        const appPath = app.getAppPath();
        this.pluginPaths.push(path.join(appPath, 'plugins'));
        
        // Development: local contrib plugins
        if (!app.isPackaged) {
            this.pluginPaths.push(path.join(appPath, 'src', 'renderer', 'plugins', 'contrib'));
        }
        
        // Ensure user plugins directory exists
        const userPluginsDir = path.join(userDataPath, 'plugins');
        if (!fs.existsSync(userPluginsDir)) {
            fs.mkdirSync(userPluginsDir, { recursive: true });
        }
    }

    /**
     * Initialize the plugin system
     */
    async initialize(): Promise<void> {
        if (this.initialized) return;
        
        console.log('[PluginManager] Initializing plugin system...');
        console.log('[PluginManager] Plugin paths:', this.pluginPaths);
        
        await this.discoverPlugins();
        this.initialized = true;
        
        console.log(`[PluginManager] Discovered ${this.plugins.size} plugins`);
    }

    /**
     * Discover all plugins in plugin paths
     */
    async discoverPlugins(): Promise<void> {
        for (const pluginPath of this.pluginPaths) {
            if (!fs.existsSync(pluginPath)) {
                continue;
            }

            const entries = fs.readdirSync(pluginPath, { withFileTypes: true });
            
            for (const entry of entries) {
                if (!entry.isDirectory()) continue;
                
                const pluginDir = path.join(pluginPath, entry.name);
                const manifestPath = path.join(pluginDir, 'package.json');
                
                if (!fs.existsSync(manifestPath)) continue;
                
                try {
                    const manifest = await this.loadManifest(manifestPath);
                    if (this.validateManifest(manifest)) {
                        // Respect disabled state from config
                        const isDisabled = this.disabledPlugins.has(manifest.name);
                        const info: PluginInfo = {
                            id: manifest.name,
                            manifest,
                            path: pluginDir,
                            enabled: !isDisabled,
                            activated: false,
                        };

                        this.plugins.set(manifest.name, info);
                        this.emit('plugin:discovered', info);
                        console.log(`[PluginManager] Discovered: ${manifest.displayName} (${manifest.name})${isDisabled ? ' [disabled]' : ''}`);
                    }
                } catch (error) {
                    console.error(`[PluginManager] Failed to load manifest: ${manifestPath}`, error);
                }
            }
        }
    }

    /**
     * Load and parse a plugin manifest
     */
    private async loadManifest(manifestPath: string): Promise<PluginManifest> {
        const content = fs.readFileSync(manifestPath, 'utf-8');
        return JSON.parse(content) as PluginManifest;
    }

    /**
     * Validate a plugin manifest has required fields
     */
    private validateManifest(manifest: any): manifest is PluginManifest {
        if (!manifest.name || typeof manifest.name !== 'string') {
            console.warn('[PluginManager] Invalid manifest: missing name');
            return false;
        }
        if (!manifest.version || typeof manifest.version !== 'string') {
            console.warn('[PluginManager] Invalid manifest: missing version');
            return false;
        }
        if (!manifest.mycode) {
            console.warn('[PluginManager] Invalid manifest: missing mycode field');
            return false;
        }
        if (!manifest.mycode.renderer || typeof manifest.mycode.renderer !== 'string') {
            console.warn('[PluginManager] Invalid manifest: missing mycode.renderer');
            return false;
        }
        return true;
    }

    /**
     * Get all discovered plugins
     */
    getPlugins(): PluginInfo[] {
        return Array.from(this.plugins.values());
    }

    /**
     * Get a specific plugin by ID
     */
    getPlugin(id: string): PluginInfo | undefined {
        return this.plugins.get(id);
    }

    /**
     * Enable a plugin
     */
    enablePlugin(id: string): boolean {
        const plugin = this.plugins.get(id);
        if (!plugin) return false;

        plugin.enabled = true;
        this.disabledPlugins.delete(id);
        this.savePluginConfig();
        this.emit('plugin:state-changed', id, 'discovered');
        return true;
    }

    /**
     * Disable a plugin
     */
    disablePlugin(id: string): boolean {
        const plugin = this.plugins.get(id);
        if (!plugin) return false;

        plugin.enabled = false;
        plugin.activated = false;
        this.disabledPlugins.add(id);
        this.savePluginConfig();
        this.emit('plugin:state-changed', id, 'disabled');
        return true;
    }

    /**
     * Mark a plugin as activated (called from renderer)
     */
    setPluginActivated(id: string, activated: boolean, error?: string): void {
        const plugin = this.plugins.get(id);
        if (!plugin) return;

        plugin.activated = activated;
        plugin.error = error;

        if (activated) {
            this.emit('plugin:activated', plugin);
        } else if (error) {
            this.emit('plugin:error', id, new Error(error));
        }
    }

    /**
     * Get plugins that match an activation event
     */
    getPluginsForEvent(event: string): PluginInfo[] {
        return this.getPlugins().filter(plugin => {
            if (!plugin.enabled) return false;

            return plugin.manifest.mycode.activationEvents.some(ae => {
                if (ae === event) return true;
                if (ae === 'onStartup') return event === 'onStartup';

                // Match patterns like onLanguage:javascript
                const [eventType, eventValue] = ae.split(':');
                const [matchType, matchValue] = event.split(':');

                if (eventType === matchType) {
                    // Wildcard match
                    if (eventValue === '*') return true;
                    // Exact match
                    return eventValue === matchValue;
                }

                return false;
            });
        });
    }

    /**
     * Get enabled plugins
     */
    getEnabledPlugins(): PluginInfo[] {
        return this.getPlugins().filter(p => p.enabled);
    }

    /**
     * Get activated plugins
     */
    getActivatedPlugins(): PluginInfo[] {
        return this.getPlugins().filter(p => p.activated);
    }

    /**
     * Reload a plugin (mark for reload on renderer side)
     */
    reloadPlugin(id: string): boolean {
        const plugin = this.plugins.get(id);
        if (!plugin) return false;

        plugin.activated = false;
        this.emit('plugin:state-changed', id, 'discovered');
        return true;
    }

    /**
     * Get plugin paths for the renderer to load from
     */
    getPluginPaths(): string[] {
        return this.pluginPaths;
    }
}

