/**
 * MyCode - Preferences Dialog Component
 * Manages user preferences with a tabbed modal interface
 */

import { Settings } from '../../shared/types';
import { getThemeType } from '../editor/themes';

export class PreferencesDialog {
    private overlay: HTMLElement;
    private settings: Partial<Settings> = {};
    private onSave: (settings: Partial<Settings>) => void;
    private runnerConfigs: Record<string, { label: string; type: 'bundled' | 'system'; compile?: string; run?: string }> = {};
    private runnerDirty: boolean = false;

    constructor(onSave: (settings: Partial<Settings>) => void) {
        this.overlay = document.getElementById('preferences-overlay')!;
        this.onSave = onSave;
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        // Tab switching
        this.overlay.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.getAttribute('data-tab');
                if (tabName) this.switchTab(tabName);
            });
        });

        // Close button
        document.getElementById('prefs-close')?.addEventListener('click', () => this.hide());

        // Cancel button
        document.getElementById('prefs-cancel')?.addEventListener('click', () => this.hide());

        // Save button
        document.getElementById('prefs-save')?.addEventListener('click', () => this.save());

        // Close on overlay click (but not dialog)
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.hide();
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.overlay.classList.contains('hidden')) {
                this.hide();
            }
        });

        // Theme dropdown - apply preview on change
        document.getElementById('pref-editorTheme')?.addEventListener('change', () => {
            this.applyThemePreview();
        });

        // Follow system checkbox - apply preview on change
        document.getElementById('pref-followSystemStyle')?.addEventListener('change', () => {
            this.applyThemePreview();
            this.updateThemeDropdownState();
        });

        // Runner tab: Add Language button
        document.getElementById('runner-add-btn')?.addEventListener('click', () => {
            this.addRunnerEntry();
        });
    }

    private switchTab(tabName: string): void {
        // Update tab buttons
        this.overlay.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
        });

        // Update tab panels
        this.overlay.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `tab-${tabName}`);
        });
    }

    async show(): Promise<void> {
        // Load current settings
        this.settings = await window.mycode.settings.getAll();
        this.populateForm();
        this.updateThemeDropdownState();

        // Load runner configs
        try {
            this.runnerConfigs = await window.mycode.runnerConfig.getAll();
        } catch (e) {
            this.runnerConfigs = {};
        }
        this.runnerDirty = false;
        this.populateRunnerTab();

        this.overlay.classList.remove('hidden');
    }

    hide(): void {
        this.overlay.classList.add('hidden');
        // Reset theme preview if user cancelled
        this.restoreOriginalTheme();
    }

    private populateForm(): void {
        // Theme settings
        this.setCheckbox('pref-followSystemStyle', this.settings.followSystemStyle);
        this.setSelect('pref-editorTheme', this.settings.editorTheme || 'vs-dark');

        // Editor settings
        this.setCheckbox('pref-autosave', this.settings.autosave);
        this.setCheckbox('pref-smartCutCopy', this.settings.smartCutCopy);
        this.setCheckbox('pref-lineWrap', this.settings.lineWrap);
        this.setCheckbox('pref-highlightMatchingBrackets', this.settings.highlightMatchingBrackets);
        this.setCheckbox('pref-showMiniMap', this.settings.showMiniMap);
        this.setCheckbox('pref-spacesInsteadOfTabs', this.settings.spacesInsteadOfTabs);
        this.setCheckbox('pref-autoIndent', this.settings.autoIndent);
        this.setNumber('pref-indentWidth', this.settings.indentWidth);
        this.setCheckbox('pref-showRightMargin', this.settings.showRightMargin);
        this.setNumber('pref-rightMarginPosition', this.settings.rightMarginPosition);
        this.setSelect('pref-drawSpaces', this.settings.drawSpaces);

        // Font settings
        this.setCheckbox('pref-useSystemFont', this.settings.useSystemFont);
        this.setSelect('pref-font', this.settings.font || 'monospace');
        this.setNumber('pref-fontSize', this.settings.fontSize);

        // Search settings
        this.setCheckbox('pref-cyclicSearch', this.settings.cyclicSearch);
        this.setCheckbox('pref-wholeWordSearch', this.settings.wholeWordSearch);
        this.setCheckbox('pref-regexSearch', this.settings.regexSearch);
        this.setSelect('pref-caseSensitiveSearch', this.settings.caseSensitiveSearch);
    }

    private updateThemeDropdownState(): void {
        const followSystem = this.getCheckbox('pref-followSystemStyle');
        const themeDropdown = document.getElementById('pref-editorTheme') as HTMLSelectElement;
        if (themeDropdown) {
            themeDropdown.disabled = followSystem;
        }
    }

    private setCheckbox(id: string, value?: boolean): void {
        const el = document.getElementById(id) as HTMLInputElement;
        if (el) el.checked = value ?? false;
    }

    private setNumber(id: string, value?: number): void {
        const el = document.getElementById(id) as HTMLInputElement;
        if (el && value !== undefined) el.value = String(value);
    }

    private setSelect(id: string, value?: string): void {
        const el = document.getElementById(id) as HTMLSelectElement;
        if (el && value) el.value = value;
    }

    private getCheckbox(id: string): boolean {
        return (document.getElementById(id) as HTMLInputElement)?.checked ?? false;
    }

    private getNumber(id: string): number {
        return parseInt((document.getElementById(id) as HTMLInputElement)?.value, 10) || 0;
    }

    private getSelect(id: string): string {
        return (document.getElementById(id) as HTMLSelectElement)?.value ?? '';
    }

    private collectSettings(): Partial<Settings> {
        const editorTheme = this.getSelect('pref-editorTheme') || 'vs-dark';
        const followSystemStyle = this.getCheckbox('pref-followSystemStyle');

        // Determine preferDarkStyle based on selected theme for backwards compatibility
        const themeType = getThemeType(editorTheme);
        const preferDarkStyle = themeType === 'dark';

        return {
            // Theme
            editorTheme,
            followSystemStyle,
            preferDarkStyle,

            // Editor
            autosave: this.getCheckbox('pref-autosave'),
            smartCutCopy: this.getCheckbox('pref-smartCutCopy'),
            lineWrap: this.getCheckbox('pref-lineWrap'),
            highlightMatchingBrackets: this.getCheckbox('pref-highlightMatchingBrackets'),
            showMiniMap: this.getCheckbox('pref-showMiniMap'),
            spacesInsteadOfTabs: this.getCheckbox('pref-spacesInsteadOfTabs'),
            autoIndent: this.getCheckbox('pref-autoIndent'),
            indentWidth: this.getNumber('pref-indentWidth'),
            showRightMargin: this.getCheckbox('pref-showRightMargin'),
            rightMarginPosition: this.getNumber('pref-rightMarginPosition'),
            drawSpaces: this.getSelect('pref-drawSpaces') as Settings['drawSpaces'],

            // Fonts
            useSystemFont: this.getCheckbox('pref-useSystemFont'),
            font: this.getSelect('pref-font'),
            fontSize: this.getNumber('pref-fontSize'),

            // Search
            cyclicSearch: this.getCheckbox('pref-cyclicSearch'),
            wholeWordSearch: this.getCheckbox('pref-wholeWordSearch'),
            regexSearch: this.getCheckbox('pref-regexSearch'),
            caseSensitiveSearch: this.getSelect('pref-caseSensitiveSearch') as Settings['caseSensitiveSearch'],
        };
    }

    private async save(): Promise<void> {
        const newSettings = this.collectSettings();

        // Save each setting
        for (const [key, value] of Object.entries(newSettings)) {
            await window.mycode.settings.set(key as keyof Settings, value as any);
        }

        // Update local copy
        this.settings = { ...this.settings, ...newSettings };

        // Apply CSS theme (for UI chrome)
        this.applyCssTheme(newSettings.editorTheme!, newSettings.followSystemStyle!);

        // Save runner configs if dirty
        if (this.runnerDirty) {
            await this.saveRunnerConfigs();
        }

        // Notify parent to apply other settings (including Monaco theme)
        this.onSave(newSettings);

        // Close dialog
        this.overlay.classList.add('hidden');
    }

    private applyThemePreview(): void {
        const followSystem = this.getCheckbox('pref-followSystemStyle');
        const editorTheme = this.getSelect('pref-editorTheme') || 'vs-dark';

        this.applyCssTheme(editorTheme, followSystem);
    }

    private restoreOriginalTheme(): void {
        const theme = this.settings.editorTheme || 'vs-dark';
        const followSystem = this.settings.followSystemStyle ?? true;
        this.applyCssTheme(theme, followSystem);
    }

    private applyCssTheme(themeId: string, followSystem: boolean): void {
        const root = document.documentElement;

        if (followSystem) {
            // Remove forced theme, let CSS media query handle it
            root.removeAttribute('data-theme');
        } else {
            // Set theme based on whether the selected theme is light or dark
            const themeType = getThemeType(themeId);
            root.setAttribute('data-theme', themeType);
        }
    }

    // -----------------------------------------------------------------------
    // Runner Configuration Tab
    // -----------------------------------------------------------------------

    private populateRunnerTab(): void {
        const container = document.getElementById('runner-config-list');
        if (!container) return;
        container.innerHTML = '';

        const extensions = Object.keys(this.runnerConfigs).sort();
        if (extensions.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary); font-size: 12px; font-style: italic;">No runner configurations. Click "+ Add Language" to create one.</p>';
            return;
        }

        for (const ext of extensions) {
            const entry = this.runnerConfigs[ext];
            container.appendChild(this.createRunnerRow(ext, entry));
        }
    }

    private createRunnerRow(ext: string, entry: { label: string; type: 'bundled' | 'system'; compile?: string; run?: string }): HTMLElement {
        const row = document.createElement('div');
        row.className = 'runner-config-row';
        row.style.cssText = 'border: 1px solid var(--border-color); border-radius: 6px; padding: 10px 12px; margin-bottom: 8px; background: var(--bg-secondary);';

        // Header: ext + label + type + actions
        const header = document.createElement('div');
        header.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-bottom: 6px;';

        const extSpan = document.createElement('span');
        extSpan.textContent = ext;
        extSpan.style.cssText = 'font-weight: 600; font-family: monospace; min-width: 70px;';

        const labelSpan = document.createElement('span');
        labelSpan.textContent = entry.label;
        labelSpan.style.cssText = 'color: var(--text-secondary); flex: 1;';

        const typeBadge = document.createElement('span');
        typeBadge.textContent = entry.type;
        typeBadge.style.cssText = 'font-size: 10px; padding: 1px 6px; border-radius: 3px; background: var(--bg-tertiary, #333); color: var(--text-secondary);';

        const editBtn = document.createElement('button');
        editBtn.textContent = '✏️';
        editBtn.title = 'Edit';
        editBtn.className = 'icon-btn';
        editBtn.style.cssText = 'font-size: 12px; padding: 2px 4px;';
        editBtn.onclick = () => this.editRunnerEntry(ext, entry);

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '🗑';
        deleteBtn.title = 'Delete';
        deleteBtn.className = 'icon-btn';
        deleteBtn.style.cssText = 'font-size: 12px; padding: 2px 4px;';
        deleteBtn.onclick = () => this.deleteRunnerEntry(ext);

        header.appendChild(extSpan);
        header.appendChild(labelSpan);
        header.appendChild(typeBadge);
        header.appendChild(editBtn);
        header.appendChild(deleteBtn);
        row.appendChild(header);

        // Commands
        const cmds = document.createElement('div');
        cmds.style.cssText = 'font-size: 11px; font-family: monospace; color: var(--text-secondary);';
        if (entry.compile) {
            const compLine = document.createElement('div');
            compLine.innerHTML = '<span style="color: var(--text-primary);">Compile:</span> ' + this.escapeHtml(entry.compile);
            cmds.appendChild(compLine);
        }
        if (entry.run) {
            const runLine = document.createElement('div');
            runLine.innerHTML = '<span style="color: var(--text-primary);">Run:</span> ' + this.escapeHtml(entry.run);
            cmds.appendChild(runLine);
        }
        if (!entry.compile && !entry.run) {
            cmds.innerHTML = '<span style="font-style: italic;">No commands configured</span>';
        }
        row.appendChild(cmds);

        return row;
    }

    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    private addRunnerEntry(): void {
        this.showRunnerForm('', { label: '', type: 'system', compile: '', run: '' }, true);
    }

    private editRunnerEntry(ext: string, entry: { label: string; type: 'bundled' | 'system'; compile?: string; run?: string }): void {
        this.showRunnerForm(ext, { ...entry }, false);
    }

    private deleteRunnerEntry(ext: string): void {
        delete this.runnerConfigs[ext];
        this.runnerDirty = true;
        this.populateRunnerTab();
    }

    private showRunnerForm(ext: string, entry: { label: string; type: 'bundled' | 'system'; compile?: string; run?: string }, isNew: boolean): void {
        const container = document.getElementById('runner-config-list');
        if (!container) return;

        // Remove any existing form
        const existingForm = container.querySelector('.runner-edit-form');
        if (existingForm) existingForm.remove();

        const form = document.createElement('div');
        form.className = 'runner-edit-form';
        form.style.cssText = 'border: 2px solid var(--accent-color, #007acc); border-radius: 6px; padding: 12px; margin-bottom: 8px; background: var(--bg-secondary);';

        const title = document.createElement('h4');
        title.textContent = isNew ? 'Add Language' : 'Edit ' + ext;
        title.style.cssText = 'margin: 0 0 10px 0; font-size: 13px;';
        form.appendChild(title);

        const inputStyle = 'width: 100%; padding: 4px 8px; border: 1px solid var(--border-color); border-radius: 4px; ' +
            'background: var(--bg-primary); color: var(--text-primary); font-size: 12px; box-sizing: border-box;';
        const labelStyle = 'font-size: 11px; color: var(--text-secondary); display: block; margin-bottom: 2px; margin-top: 8px;';

        // Extension (only editable when adding)
        const extLabel = document.createElement('label');
        extLabel.textContent = 'Extension (e.g. .py)';
        extLabel.style.cssText = labelStyle + 'margin-top: 0;';
        const extInput = document.createElement('input');
        extInput.type = 'text';
        extInput.value = ext;
        extInput.placeholder = '.py';
        extInput.style.cssText = inputStyle;
        if (!isNew) extInput.disabled = true;
        form.appendChild(extLabel);
        form.appendChild(extInput);

        // Label
        const lblLabel = document.createElement('label');
        lblLabel.textContent = 'Label';
        lblLabel.style.cssText = labelStyle;
        const lblInput = document.createElement('input');
        lblInput.type = 'text';
        lblInput.value = entry.label;
        lblInput.placeholder = 'Python';
        lblInput.style.cssText = inputStyle;
        form.appendChild(lblLabel);
        form.appendChild(lblInput);

        // Type
        const typeLabel = document.createElement('label');
        typeLabel.textContent = 'Type';
        typeLabel.style.cssText = labelStyle;
        const typeSelect = document.createElement('select');
        typeSelect.style.cssText = inputStyle;
        typeSelect.innerHTML = '<option value="system">System (from PATH)</option><option value="bundled">Bundled (from runtimes/)</option>';
        typeSelect.value = entry.type;
        form.appendChild(typeLabel);
        form.appendChild(typeSelect);

        // Compile command
        const compLabel = document.createElement('label');
        compLabel.textContent = 'Compile command (optional)';
        compLabel.style.cssText = labelStyle;
        const compInput = document.createElement('input');
        compInput.type = 'text';
        compInput.value = entry.compile || '';
        compInput.placeholder = 'gcc %f -o %e';
        compInput.style.cssText = inputStyle + ' font-family: monospace;';
        form.appendChild(compLabel);
        form.appendChild(compInput);

        // Run command
        const runLabel = document.createElement('label');
        runLabel.textContent = 'Run command';
        runLabel.style.cssText = labelStyle;
        const runInput = document.createElement('input');
        runInput.type = 'text';
        runInput.value = entry.run || '';
        runInput.placeholder = 'python3 %f';
        runInput.style.cssText = inputStyle + ' font-family: monospace;';
        form.appendChild(runLabel);
        form.appendChild(runInput);

        // Buttons
        const btnRow = document.createElement('div');
        btnRow.style.cssText = 'display: flex; gap: 8px; justify-content: flex-end; margin-top: 12px;';

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.className = 'text-btn';
        cancelBtn.style.cssText = 'font-size: 12px;';
        cancelBtn.onclick = () => {
            form.remove();
            this.populateRunnerTab();
        };

        const saveBtn = document.createElement('button');
        saveBtn.textContent = isNew ? 'Add' : 'Update';
        saveBtn.className = 'text-btn primary';
        saveBtn.style.cssText = 'font-size: 12px;';
        saveBtn.onclick = () => {
            const newExt = extInput.value.trim().toLowerCase();
            if (!newExt || !newExt.startsWith('.')) {
                extInput.style.borderColor = '#e74c3c';
                return;
            }
            const newLabel = lblInput.value.trim();
            if (!newLabel) {
                lblInput.style.borderColor = '#e74c3c';
                return;
            }
            const newCompile = compInput.value.trim();
            const newRun = runInput.value.trim();
            if (!newCompile && !newRun) {
                runInput.style.borderColor = '#e74c3c';
                return;
            }

            // If editing and extension changed, remove old
            if (!isNew && newExt !== ext) {
                delete this.runnerConfigs[ext];
            }

            const newEntry: any = {
                label: newLabel,
                type: typeSelect.value as 'bundled' | 'system',
            };
            if (newCompile) newEntry.compile = newCompile;
            if (newRun) newEntry.run = newRun;

            this.runnerConfigs[newExt] = newEntry;
            this.runnerDirty = true;
            form.remove();
            this.populateRunnerTab();
        };

        btnRow.appendChild(cancelBtn);
        btnRow.appendChild(saveBtn);
        form.appendChild(btnRow);

        // Insert at the top of the list
        container.prepend(form);
        extInput.focus();
    }

    private async saveRunnerConfigs(): Promise<void> {
        if (!window.mycode?.runnerConfig) return;

        try {
            // Get current saved configs to find deletions
            const savedConfigs = await window.mycode.runnerConfig.getAll();

            // Delete entries that were removed
            for (const ext of Object.keys(savedConfigs)) {
                if (!(ext in this.runnerConfigs)) {
                    await window.mycode.runnerConfig.delete(ext);
                }
            }

            // Set all current entries
            for (const [ext, entry] of Object.entries(this.runnerConfigs)) {
                await window.mycode.runnerConfig.set(ext, entry);
            }

            // Tell the runner plugin to reload its configs
            try {
                const pluginModules = (window as any).__MYCODE_PLUGINS__;
                if (pluginModules && pluginModules['mycode-runner']) {
                    // The runner plugin registers 'runner.reloadConfigs' command
                    // We can trigger it via the global command registry if available
                }
            } catch (_) { /* best effort */ }

        } catch (error) {
            console.error('[PreferencesDialog] Failed to save runner configs:', error);
        }
    }
}

