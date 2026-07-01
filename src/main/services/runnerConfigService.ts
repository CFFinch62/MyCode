/**
 * Runner Configuration Service for MyCode
 * Manages per-extension compile/run command configurations.
 *
 * Configurations are persisted to runner-config.json in the Electron
 * userData directory and can be edited from the Preferences → Runner tab.
 *
 * Each entry maps a file extension to:
 *   label   – human-readable name (e.g. "Python", "BEAM")
 *   type    – "bundled" (resolved from runtimes/) or "system" (from PATH)
 *   compile – optional compile command with Geany-style placeholders
 *   run     – optional run command with Geany-style placeholders
 *
 * Placeholders:
 *   %f  – full file path       (e.g. /home/chuck/hello.py)
 *   %e  – filename without ext (e.g. hello)
 *   %d  – directory            (e.g. /home/chuck)
 *   %b  – basename with ext    (e.g. hello.py)
 */

import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

export interface RunnerEntry {
    label: string;
    type: 'bundled' | 'system';
    compile?: string;
    run?: string;
}

export interface RunnerConfig {
    runners: Record<string, RunnerEntry>;
}

// Default runner entries for the Fragillidae teaching languages.
// These are seeded on first run so existing behaviour is preserved.
const DEFAULT_RUNNERS: Record<string, RunnerEntry> = {
    '.bas':      { label: 'BEAM',  type: 'bundled', run: 'beam %f' },
    '.yab':      { label: 'BEAM',  type: 'bundled', run: 'beam %f' },
    '.ez':       { label: 'EZ',    type: 'bundled', run: 'ez %f' },
    '.fg':       { label: 'Forge', type: 'bundled', run: 'forge run %f' },
    '.plain':    { label: 'Plain', type: 'bundled', run: 'plain %f' },
    '.building': { label: 'Steps', type: 'bundled', run: 'steps run %d' },
    '.floor':    { label: 'Steps', type: 'bundled', run: 'steps run-step %f' },
    '.step':     { label: 'Steps', type: 'bundled', run: 'steps run-step %f' },
};

export class RunnerConfigService {
    private config: RunnerConfig;
    private configPath: string;

    constructor() {
        this.config = { runners: {} };
        this.configPath = path.join(app.getPath('userData'), 'runner-config.json');
    }

    /**
     * Load configuration from disk, seeding defaults on first run.
     */
    async load(): Promise<void> {
        try {
            if (fs.existsSync(this.configPath)) {
                const data = await fs.promises.readFile(this.configPath, 'utf-8');
                const loaded = JSON.parse(data) as RunnerConfig;
                this.config = { runners: { ...loaded.runners } };
            } else {
                // First run — seed the teaching language defaults
                this.config = { runners: { ...DEFAULT_RUNNERS } };
                await this.save();
                console.log('[RunnerConfig] Seeded default runner configurations');
            }
        } catch (error) {
            console.error('[RunnerConfig] Failed to load config:', error);
            this.config = { runners: { ...DEFAULT_RUNNERS } };
        }
    }

    /**
     * Persist current configuration to disk.
     */
    async save(): Promise<void> {
        try {
            const data = JSON.stringify(this.config, null, 2);
            await fs.promises.writeFile(this.configPath, data, 'utf-8');
        } catch (error) {
            console.error('[RunnerConfig] Failed to save config:', error);
        }
    }

    /**
     * Return all runner configurations.
     */
    getAll(): Record<string, RunnerEntry> {
        return { ...this.config.runners };
    }

    /**
     * Get the runner entry for a specific file extension.
     */
    get(ext: string): RunnerEntry | undefined {
        return this.config.runners[ext];
    }

    /**
     * Set (create or update) the runner entry for a file extension.
     */
    set(ext: string, entry: RunnerEntry): void {
        this.config.runners[ext] = entry;
    }

    /**
     * Delete the runner entry for a file extension.
     */
    delete(ext: string): void {
        delete this.config.runners[ext];
    }
}
