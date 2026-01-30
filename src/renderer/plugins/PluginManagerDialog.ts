/**
 * PluginManagerDialog - Dialog for managing plugins
 * Allows users to view, enable, and disable plugins
 */

import { PluginInfo } from '../../shared/plugin-types';

export class PluginManagerDialog {
    private overlay: HTMLElement;
    private pluginList: HTMLElement;
    private plugins: PluginInfo[] = [];
    private onPluginStateChange: (pluginId: string, enabled: boolean) => void;

    constructor(onPluginStateChange: (pluginId: string, enabled: boolean) => void) {
        this.overlay = document.getElementById('plugin-manager-overlay')!;
        this.pluginList = document.getElementById('plugin-list')!;
        this.onPluginStateChange = onPluginStateChange;
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        // Close button
        document.getElementById('plugin-manager-close')?.addEventListener('click', () => this.hide());

        // Done button
        document.getElementById('plugin-manager-done')?.addEventListener('click', () => this.hide());

        // Close on overlay click (but not dialog)
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.hide();
        });

        // Handle toggle clicks via event delegation
        this.pluginList.addEventListener('click', (e) => {
            const toggle = (e.target as HTMLElement).closest('.plugin-toggle');
            if (toggle) {
                const pluginId = toggle.getAttribute('data-plugin-id');
                if (pluginId) {
                    this.togglePlugin(pluginId);
                }
            }
        });
    }

    async show(): Promise<void> {
        // Load plugins from main process
        await this.loadPlugins();
        this.renderPluginList();
        this.overlay.classList.remove('hidden');
    }

    hide(): void {
        this.overlay.classList.add('hidden');
    }

    private async loadPlugins(): Promise<void> {
        try {
            this.plugins = await window.mycode.plugins.list();
        } catch (error) {
            console.error('[PluginManager] Failed to load plugins:', error);
            this.plugins = [];
        }
    }

    private renderPluginList(): void {
        if (this.plugins.length === 0) {
            this.pluginList.innerHTML = `
                <div class="no-plugins">
                    <p>No plugins installed.</p>
                    <p style="font-size: 12px; margin-top: 8px;">
                        Place plugins in <code>~/.config/mycode/plugins/</code>
                    </p>
                </div>
            `;
            return;
        }

        this.pluginList.innerHTML = this.plugins.map(plugin => this.renderPluginItem(plugin)).join('');
    }

    private renderPluginItem(plugin: PluginInfo): string {
        const statusBadge = this.getStatusBadge(plugin);
        const icon = plugin.manifest.mycode?.icon || '🧩';

        return `
            <div class="plugin-item" data-plugin-id="${plugin.id}">
                <div class="plugin-icon">${icon}</div>
                <div class="plugin-info">
                    <div class="plugin-name">
                        ${this.escapeHtml(plugin.manifest.displayName)}
                        <span class="plugin-version">v${this.escapeHtml(plugin.manifest.version)}</span>
                    </div>
                    <div class="plugin-description">
                        ${this.escapeHtml(plugin.manifest.description || 'No description')}
                    </div>
                    <div class="plugin-status">
                        ${statusBadge}
                        ${plugin.error ? `<span style="color: #dc3545; font-size: 11px;">${this.escapeHtml(plugin.error)}</span>` : ''}
                    </div>
                </div>
                <div class="plugin-controls">
                    <div class="plugin-toggle ${plugin.enabled ? 'enabled' : ''}" 
                         data-plugin-id="${plugin.id}"
                         title="${plugin.enabled ? 'Click to disable' : 'Click to enable'}">
                    </div>
                </div>
            </div>
        `;
    }

    private getStatusBadge(plugin: PluginInfo): string {
        if (!plugin.enabled) {
            return '<span class="plugin-status-badge disabled">Disabled</span>';
        }
        if (plugin.activated) {
            return '<span class="plugin-status-badge active">Active</span>';
        }
        return '<span class="plugin-status-badge enabled">Enabled</span>';
    }

    private async togglePlugin(pluginId: string): Promise<void> {
        const plugin = this.plugins.find(p => p.id === pluginId);
        if (!plugin) return;

        const newEnabled = !plugin.enabled;

        try {
            if (newEnabled) {
                await window.mycode.plugins.enable(pluginId);
            } else {
                await window.mycode.plugins.disable(pluginId);
            }

            // Update local state
            plugin.enabled = newEnabled;
            if (!newEnabled) {
                plugin.activated = false;
            }

            // Re-render the list
            this.renderPluginList();

            // Notify about state change
            this.onPluginStateChange(pluginId, newEnabled);
        } catch (error) {
            console.error(`[PluginManager] Failed to toggle plugin ${pluginId}:`, error);
        }
    }

    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

