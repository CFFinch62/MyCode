/**
 * PluginRegistry - Tracks active plugins in the renderer process
 * Manages plugin contributions (commands, menus, sidebar panels, etc.)
 */

import { PluginInfo, PluginContributions, CommandContribution, Disposable } from '../../shared/plugin-types';

export interface ActivePlugin {
    info: PluginInfo;
    module: any;
    disposables: Disposable[];
}

export class PluginRegistry {
    private activePlugins: Map<string, ActivePlugin> = new Map();
    private contributions: {
        commands: Map<string, CommandContribution>;
        sidebarPanels: Map<string, HTMLElement>;
        bottomPanels: Map<string, HTMLElement>;
        statusBarItems: Map<string, HTMLElement>;
    } = {
        commands: new Map(),
        sidebarPanels: new Map(),
        bottomPanels: new Map(),
        statusBarItems: new Map(),
    };

    /**
     * Register an active plugin
     */
    register(info: PluginInfo, module: any): void {
        if (this.activePlugins.has(info.id)) {
            console.warn(`[PluginRegistry] Plugin already registered: ${info.id}`);
            return;
        }

        const activePlugin: ActivePlugin = {
            info,
            module,
            disposables: [],
        };

        this.activePlugins.set(info.id, activePlugin);
        
        // Register contributions from manifest
        if (info.manifest.mycode.contributes) {
            this.registerContributions(info.id, info.manifest.mycode.contributes);
        }

        console.log(`[PluginRegistry] Registered: ${info.manifest.displayName} (${info.id})`);
    }

    /**
     * Unregister a plugin
     */
    unregister(pluginId: string): void {
        const plugin = this.activePlugins.get(pluginId);
        if (!plugin) return;

        // Dispose all registered disposables
        for (const disposable of plugin.disposables) {
            try {
                disposable.dispose();
            } catch (error) {
                console.error(`[PluginRegistry] Error disposing: ${pluginId}`, error);
            }
        }

        // Remove contributions
        this.removeContributions(pluginId);

        this.activePlugins.delete(pluginId);
        console.log(`[PluginRegistry] Unregistered: ${pluginId}`);
    }

    /**
     * Get an active plugin by ID
     */
    get(pluginId: string): ActivePlugin | undefined {
        return this.activePlugins.get(pluginId);
    }

    /**
     * Get all active plugins
     */
    getAll(): ActivePlugin[] {
        return Array.from(this.activePlugins.values());
    }

    /**
     * Check if a plugin is active
     */
    isActive(pluginId: string): boolean {
        return this.activePlugins.has(pluginId);
    }

    /**
     * Add a disposable to a plugin's cleanup list
     */
    addDisposable(pluginId: string, disposable: Disposable): void {
        const plugin = this.activePlugins.get(pluginId);
        if (plugin) {
            plugin.disposables.push(disposable);
        }
    }

    /**
     * Register contributions from a plugin's manifest
     */
    private registerContributions(pluginId: string, contributions: PluginContributions): void {
        // Register commands
        if (contributions.commands) {
            for (const cmd of contributions.commands) {
                const fullId = cmd.id.includes('.') ? cmd.id : `${pluginId}.${cmd.id}`;
                this.contributions.commands.set(fullId, cmd);
            }
        }

        // Register sidebar panels
        if (contributions.sidebarPanels) {
            for (const panel of contributions.sidebarPanels) {
                const container = document.createElement('div');
                container.id = `sidebar-panel-${panel.id}`;
                container.className = 'plugin-sidebar-panel';
                container.setAttribute('data-plugin', pluginId);
                container.setAttribute('data-title', panel.title);
                this.contributions.sidebarPanels.set(panel.id, container);
            }
        }
    }

    /**
     * Remove contributions when a plugin is unregistered
     */
    private removeContributions(pluginId: string): void {
        // Remove commands for this plugin
        for (const [id, cmd] of this.contributions.commands) {
            if (id.startsWith(`${pluginId}.`)) {
                this.contributions.commands.delete(id);
            }
        }

        // Remove sidebar panels for this plugin
        for (const [id, panel] of this.contributions.sidebarPanels) {
            if (panel.getAttribute('data-plugin') === pluginId) {
                panel.remove();
                this.contributions.sidebarPanels.delete(id);
            }
        }

        // Remove bottom panels for this plugin
        for (const [id, panel] of this.contributions.bottomPanels) {
            if (panel.getAttribute('data-plugin') === pluginId) {
                panel.remove();
                this.contributions.bottomPanels.delete(id);
            }
        }
    }

    /**
     * Get all registered commands
     */
    getCommands(): Map<string, CommandContribution> {
        return this.contributions.commands;
    }
}

