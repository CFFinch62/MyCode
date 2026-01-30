/**
 * PluginLoader - Loads and activates plugins in the renderer process
 * Handles dynamic loading of plugin code and activation lifecycle
 */

import { PluginInfo, PluginModule, PluginAPI } from '../../shared/plugin-types';
import { createPluginContext, setEditorManager, setTabManager } from './PluginContext';
import { PluginRegistry } from './PluginRegistry';

export class PluginLoader {
    private registry: PluginRegistry;
    private loadedScripts: Map<string, HTMLScriptElement> = new Map();

    constructor(registry: PluginRegistry) {
        this.registry = registry;
    }

    /**
     * Initialize the loader with editor references
     */
    initialize(editorManager: any, tabManager: any): void {
        setEditorManager(editorManager);
        setTabManager(tabManager);
        console.log('[PluginLoader] Initialized with editor references');
    }

    /**
     * Load and activate a plugin
     */
    async loadPlugin(plugin: PluginInfo): Promise<void> {
        if (this.registry.isActive(plugin.id)) {
            console.warn(`[PluginLoader] Plugin already active: ${plugin.id}`);
            return;
        }

        console.log(`[PluginLoader] Loading plugin: ${plugin.manifest.displayName}`);

        try {
            // Load the renderer script
            const module = await this.loadRendererScript(plugin);
            
            if (!module) {
                throw new Error('Failed to load plugin module');
            }

            // Create plugin API context
            const api = createPluginContext(plugin.id);

            // Activate the plugin
            if (typeof module.activate === 'function') {
                await module.activate(api);
            }

            // Register in registry
            this.registry.register(plugin, module);

            // Report success to main process
            window.mycode.plugins.reportReady(plugin.id);

            console.log(`[PluginLoader] Activated: ${plugin.manifest.displayName}`);
        } catch (error: any) {
            console.error(`[PluginLoader] Failed to load plugin ${plugin.id}:`, error);
            window.mycode.plugins.reportError(plugin.id, error.message);
            throw error;
        }
    }

    /**
     * Unload a plugin
     */
    async unloadPlugin(pluginId: string): Promise<void> {
        const activePlugin = this.registry.get(pluginId);
        if (!activePlugin) {
            return;
        }

        console.log(`[PluginLoader] Unloading plugin: ${pluginId}`);

        try {
            // Call deactivate if available
            if (activePlugin.module && typeof activePlugin.module.deactivate === 'function') {
                await activePlugin.module.deactivate();
            }

            // Unregister from registry (this disposes all resources)
            this.registry.unregister(pluginId);

            // Remove script element
            const script = this.loadedScripts.get(pluginId);
            if (script) {
                script.remove();
                this.loadedScripts.delete(pluginId);
            }

            console.log(`[PluginLoader] Unloaded: ${pluginId}`);
        } catch (error) {
            console.error(`[PluginLoader] Error unloading plugin ${pluginId}:`, error);
        }
    }

    /**
     * Load a plugin's renderer script
     */
    private async loadRendererScript(plugin: PluginInfo): Promise<PluginModule | null> {
        const rendererEntry = plugin.manifest.mycode.renderer;
        const scriptPath = `${plugin.path}/${rendererEntry}`;

        return new Promise((resolve, reject) => {
            // For development, we'll use a simpler approach
            // In production, this would load the actual script file
            
            // Check if there's a global plugin registry (for bundled plugins)
            const globalPlugins = (window as any).__MYCODE_PLUGINS__;
            if (globalPlugins && globalPlugins[plugin.id]) {
                resolve(globalPlugins[plugin.id]);
                return;
            }

            // Try to load via script tag (for external plugins)
            const script = document.createElement('script');
            script.type = 'module';
            script.src = scriptPath;
            
            // Setup a global callback for the plugin to register itself
            const callbackName = `__plugin_${plugin.id.replace(/[^a-zA-Z0-9]/g, '_')}__`;
            (window as any)[callbackName] = (module: PluginModule) => {
                delete (window as any)[callbackName];
                resolve(module);
            };

            script.onerror = () => {
                delete (window as any)[callbackName];
                reject(new Error(`Failed to load script: ${scriptPath}`));
            };

            // Timeout for script loading
            const timeout = setTimeout(() => {
                if ((window as any)[callbackName]) {
                    delete (window as any)[callbackName];
                    reject(new Error(`Timeout loading plugin: ${plugin.id}`));
                }
            }, 10000);

            script.onload = () => {
                clearTimeout(timeout);
                // Give the module a moment to call the callback
                setTimeout(() => {
                    if ((window as any)[callbackName]) {
                        // If callback wasn't called, assume inline export
                        delete (window as any)[callbackName];
                        resolve(null);
                    }
                }, 100);
            };

            document.head.appendChild(script);
            this.loadedScripts.set(plugin.id, script);
        });
    }

    /**
     * Load all enabled plugins that match an activation event
     */
    async loadPluginsForEvent(event: string): Promise<void> {
        const plugins = await window.mycode.plugins.list();

        for (const plugin of plugins) {
            if (!plugin.enabled || this.registry.isActive(plugin.id)) {
                continue;
            }

            const shouldActivate = plugin.manifest.mycode.activationEvents.some(ae => {
                if (ae === event) return true;

                // Match patterns like onLanguage:javascript
                const [eventType, eventValue] = ae.split(':');
                const [matchType, matchValue] = event.split(':');

                if (eventType === matchType) {
                    if (eventValue === '*') return true;
                    return eventValue === matchValue;
                }

                return false;
            });

            if (shouldActivate) {
                try {
                    await this.loadPlugin(plugin);
                } catch (error) {
                    console.error(`[PluginLoader] Failed to activate plugin ${plugin.id}:`, error);
                }
            }
        }
    }

    /**
     * Load all plugins marked for onStartup
     */
    async loadStartupPlugins(): Promise<void> {
        await this.loadPluginsForEvent('onStartup');
    }

    /**
     * Get the registry
     */
    getRegistry(): PluginRegistry {
        return this.registry;
    }
}

