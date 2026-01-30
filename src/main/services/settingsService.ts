/**
 * Settings Service for MyCode
 * Handles persistent JSON-based settings storage
 */

import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { Settings, DEFAULT_SETTINGS } from '../../shared/types';

export class SettingsService {
    private settings: Settings;
    private settingsPath: string;

    constructor() {
        this.settings = { ...DEFAULT_SETTINGS };
        this.settingsPath = path.join(app.getPath('userData'), 'settings.json');
    }

    /**
     * Load settings from disk
     */
    async load(): Promise<void> {
        try {
            if (fs.existsSync(this.settingsPath)) {
                const data = await fs.promises.readFile(this.settingsPath, 'utf-8');
                const loadedSettings = JSON.parse(data);
                // Merge with defaults to handle new settings
                this.settings = { ...DEFAULT_SETTINGS, ...loadedSettings };
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
            this.settings = { ...DEFAULT_SETTINGS };
        }
    }

    /**
     * Save settings to disk
     */
    async save(): Promise<void> {
        try {
            const data = JSON.stringify(this.settings, null, 2);
            await fs.promises.writeFile(this.settingsPath, data, 'utf-8');
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }

    /**
     * Get all settings
     */
    getAll(): Settings {
        return { ...this.settings };
    }

    /**
     * Get a specific setting
     */
    get<K extends keyof Settings>(key: K): Settings[K] {
        return this.settings[key];
    }

    /**
     * Set a specific setting
     */
    set<K extends keyof Settings>(key: K, value: Settings[K]): void {
        this.settings[key] = value;
    }

    /**
     * Reset all settings to defaults
     */
    reset(): void {
        this.settings = { ...DEFAULT_SETTINGS };
    }

    /**
     * Add a file to opened files list
     */
    addOpenedFile(uri: string, cursorPosition: number = 0): void {
        const existingIndex = this.settings.openedFiles.findIndex(f => f.uri === uri);
        if (existingIndex >= 0) {
            this.settings.openedFiles[existingIndex].cursorPosition = cursorPosition;
        } else {
            this.settings.openedFiles.push({ uri, cursorPosition });
        }
    }

    /**
     * Remove a file from opened files list
     */
    removeOpenedFile(uri: string): void {
        this.settings.openedFiles = this.settings.openedFiles.filter(f => f.uri !== uri);
    }

    /**
     * Add a folder to opened folders list
     */
    addOpenedFolder(folderPath: string): void {
        if (!this.settings.openedFolders.includes(folderPath)) {
            this.settings.openedFolders.push(folderPath);
        }
    }

    /**
     * Remove a folder from opened folders list
     */
    removeOpenedFolder(folderPath: string): void {
        this.settings.openedFolders = this.settings.openedFolders.filter(f => f !== folderPath);
    }
}
