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
}
