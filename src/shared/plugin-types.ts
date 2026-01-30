/**
 * MyCode Plugin System - Type Definitions
 * Shared types for plugin manifest, API, and communication
 */

// ============================================================================
// Disposable Pattern
// ============================================================================

export interface Disposable {
    dispose(): void;
}

// ============================================================================
// Position and Selection Types
// ============================================================================

export interface Position {
    line: number;
    column: number;
}

export interface Selection {
    start: Position;
    end: Position;
}

export interface Range {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
}

// ============================================================================
// Plugin Manifest Types
// ============================================================================

export interface PluginManifest {
    name: string;
    version: string;
    displayName: string;
    description?: string;
    author?: string;
    license?: string;
    repository?: string;

    mycode: {
        activationEvents: ActivationEvent[];
        main?: string;          // Main process entry (optional)
        renderer: string;       // Renderer process entry (required)
        contributes?: PluginContributions;
    };
}

export type ActivationEvent =
    | 'onStartup'
    | `onLanguage:${string}`
    | `onFileOpen:${string}`
    | `onCommand:${string}`
    | `onView:${string}`;

export interface PluginContributions {
    commands?: CommandContribution[];
    menus?: MenuContribution[];
    sidebarPanels?: SidebarPanelContribution[];
    settings?: SettingContribution[];
    languages?: LanguageContribution[];
    formatters?: FormatterContribution[];
    linters?: LinterContribution[];
}

export interface CommandContribution {
    id: string;
    title: string;
    keybinding?: string;
    when?: string;
    icon?: string;
}

export interface MenuContribution {
    command: string;
    group: 'file' | 'edit' | 'view' | 'tools' | 'git' | 'help' | 'context';
    when?: string;
}

export interface SidebarPanelContribution {
    id: string;
    title: string;
    icon?: string;
    position?: 'top' | 'bottom';
}

export interface SettingContribution {
    id: string;
    type: 'boolean' | 'string' | 'number' | 'select';
    default: any;
    title: string;
    description?: string;
    options?: Array<{ value: any; label: string }>;
}

export interface LanguageContribution {
    id: string;
    extensions: string[];
    aliases?: string[];
    configuration?: string;
}

export interface FormatterContribution {
    languages: string[];
    command: string;
}

export interface LinterContribution {
    languages: string[];
    command: string;
}

// ============================================================================
// Plugin State
// ============================================================================

export interface PluginInfo {
    id: string;
    manifest: PluginManifest;
    path: string;
    enabled: boolean;
    activated: boolean;
    error?: string;
}

export type PluginState = 'discovered' | 'loading' | 'activated' | 'error' | 'disabled';

// ============================================================================
// UI Types
// ============================================================================

export interface QuickPickItem {
    label: string;
    description?: string;
    detail?: string;
    value?: any;
    picked?: boolean;
}

export interface InputBoxOptions {
    prompt?: string;
    placeholder?: string;
    value?: string;
    password?: boolean;
    validateInput?: (value: string) => string | null | undefined;
}

export interface StatusBarItemOptions {
    id: string;
    text: string;
    tooltip?: string;
    command?: string;
    alignment?: 'left' | 'right';
    priority?: number;
}

export interface StatusBarItem extends StatusBarItemOptions {
    show(): void;
    hide(): void;
    dispose(): void;
    update(options: Partial<StatusBarItemOptions>): void;
}

export interface SidebarPanelOptions {
    id: string;
    title: string;
    icon?: string;
    position?: 'top' | 'bottom';
}

export interface SidebarPanel {
    id: string;
    title: string;
    element: any; // HTMLElement in renderer context
    show(): void;
    hide(): void;
    dispose(): void;
}

export interface BottomPanelOptions {
    id: string;
    title: string;
    icon?: string;
}

export interface BottomPanel {
    id: string;
    title: string;
    element: any; // HTMLElement in renderer context
    show(): void;
    hide(): void;
    dispose(): void;
}

export interface DiffOptions {
    title?: string;
    originalTitle?: string;
    modifiedTitle?: string;
    language?: string;
    readOnly?: boolean;
}

export type NotificationType = 'info' | 'warning' | 'error' | 'success';

// ============================================================================
// Event Context Types
// ============================================================================

export interface SaveContext {
    filePath: string;
    content: string;
    language: string;
}

export interface FileContext {
    filePath: string;
    language: string;
}

export interface PasteContext {
    content: string;
    filePath: string | null;
    language: string;
}

export interface ContentChangeEvent {
    content: string;
    changes: Array<{
        range: Range;
        text: string;
    }>;
}

export interface CursorChangeEvent {
    position: Position;
    selections: Selection[];
}

export interface LanguageChangeEvent {
    language: string;
    previousLanguage: string;
}

export interface FileEvent {
    filePath: string;
    language: string;
}

export interface WillSaveEvent {
    filePath: string;
    content: string;
    language: string;
    waitUntil(promise: Promise<string | void>): void;
}


// ============================================================================
// Plugin API Interface
// ============================================================================

export interface PluginAPI {
    editor: EditorAPI;
    workspace: WorkspaceAPI;
    ui: UIAPI;
    commands: CommandsAPI;
    menus: MenusAPI;
    settings: SettingsAPI;
    languages: LanguagesAPI;
    hooks: HooksAPI;
    utils: UtilsAPI;
}

export interface EditorAPI {
    getContent(): string;
    setContent(content: string): void;
    getSelection(): Selection;
    setSelection(selection: Selection): void;
    getSelectedText(): string;
    replaceSelection(text: string): void;
    getCursorPosition(): Position;
    setCursorPosition(position: Position): void;
    getLanguage(): string;
    setLanguage(language: string): void;
    addDecoration(options: DecorationOptions): Disposable;
    onDidChangeContent(callback: (e: ContentChangeEvent) => void): Disposable;
    onDidChangeCursorPosition(callback: (e: CursorChangeEvent) => void): Disposable;
    onDidChangeLanguage(callback: (e: LanguageChangeEvent) => void): Disposable;
    getMonacoEditor(): any;
    getMonaco(): any;
    focus(): void;
    revealLine(line: number): void;
}

export interface DecorationOptions {
    range: Range;
    className?: string;
    hoverMessage?: string;
    glyphMarginClassName?: string;
    isWholeLine?: boolean;
    inlineClassName?: string;
}

export interface WorkspaceAPI {
    getActiveFilePath(): string | null;
    getOpenFiles(): string[];
    openFile(path: string): Promise<void>;
    saveFile(path?: string): Promise<void>;
    readFile(path: string): Promise<string>;
    writeFile(path: string, content: string): Promise<void>;
    getOpenFolders(): string[];
    onDidOpenFile(callback: (e: FileEvent) => void): Disposable;
    onDidSaveFile(callback: (e: FileEvent) => void): Disposable;
    onDidCloseFile(callback: (e: FileEvent) => void): Disposable;
    onWillSaveFile(callback: (e: WillSaveEvent) => void): Disposable;
}

export interface UIAPI {
    showNotification(message: string, type?: NotificationType, duration?: number): void;
    showQuickPick(items: QuickPickItem[], options?: { placeholder?: string }): Promise<QuickPickItem | undefined>;
    showInputBox(options: InputBoxOptions): Promise<string | undefined>;
    createStatusBarItem(options: StatusBarItemOptions): StatusBarItem;
    registerSidebarPanel(options: SidebarPanelOptions): SidebarPanel;
    registerBottomPanel(options: BottomPanelOptions): BottomPanel;
    showDiff(original: string, modified: string, options?: DiffOptions): void;
    showDiffInEditor(original: string, modified: string, options?: DiffOptions): Disposable;
}

export interface CommandsAPI {
    register(id: string, handler: (...args: any[]) => any): Disposable;
    execute<T = any>(id: string, ...args: any[]): Promise<T>;
    getCommands(): string[];
}

export interface MenusAPI {
    registerMenuItem(options: MenuItemOptions): Disposable;
    registerContextMenuItem(options: ContextMenuItemOptions): Disposable;
}

export interface MenuItemOptions {
    id: string;
    label: string;
    command: string;
    group: 'file' | 'edit' | 'view' | 'tools' | 'git' | 'help';
    accelerator?: string;
    when?: string;
}

export interface ContextMenuItemOptions {
    label: string;
    command: string;
    when?: string;
    group?: string;
}

export interface SettingsAPI {
    get<T>(key: string, defaultValue?: T): T;
    set(key: string, value: any): Promise<void>;
    onDidChange(key: string, callback: (value: any) => void): Disposable;
}

export interface LanguagesAPI {
    registerCompletionProvider(language: string, provider: any): Disposable;
    registerHoverProvider(language: string, provider: any): Disposable;
    registerDefinitionProvider(language: string, provider: any): Disposable;
    registerDocumentSymbolProvider(language: string, provider: any): Disposable;
    registerCodeActionProvider(language: string, provider: any): Disposable;
    registerDocumentFormatter(language: string, formatter: DocumentFormatter): Disposable;
    registerRangeFormatter(language: string, formatter: RangeFormatter): Disposable;
    registerLinter(language: string, linter: Linter): Disposable;
}

export interface DocumentFormatter {
    provideDocumentFormattingEdits(content: string, options: FormattingOptions): Promise<TextEdit[]>;
}

export interface RangeFormatter {
    provideDocumentRangeFormattingEdits(content: string, range: Range, options: FormattingOptions): Promise<TextEdit[]>;
}

export interface Linter {
    provideDiagnostics(content: string, filePath: string): Promise<Diagnostic[]>;
}

export interface Diagnostic {
    range: Range;
    message: string;
    severity: DiagnosticSeverity;
    source?: string;
    code?: string | number;
}

export enum DiagnosticSeverity {
    Error = 1,
    Warning = 2,
    Info = 3,
    Hint = 4
}

export interface FormattingOptions {
    tabSize: number;
    insertSpaces: boolean;
}

export interface TextEdit {
    range: Range;
    newText: string;
}

export interface HooksAPI {
    /** Register a callback for any hook event */
    register(event: string, callback: (...args: any[]) => any): Disposable;
    onBeforeSave(callback: (context: SaveContext) => Promise<string | void>): Disposable;
    onAfterSave(callback: (context: SaveContext) => void): Disposable;
    onFileOpen(callback: (context: FileContext) => void): Disposable;
    onFilePaste(callback: (context: PasteContext) => Promise<string | void>): Disposable;
}

export interface UtilsAPI {
    log: LogAPI;
    path: PathAPI;
}

export interface LogAPI {
    info(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
    debug(message: string, ...args: any[]): void;
}

export interface PathAPI {
    join(...paths: string[]): string;
    dirname(path: string): string;
    basename(path: string, ext?: string): string;
    extname(path: string): string;
}

// ============================================================================
// Plugin Module Interface (what plugins export)
// ============================================================================

export interface PluginModule {
    activate(api: PluginAPI): void | Promise<void>;
    deactivate?(): void | Promise<void>;
}

// ============================================================================
// IPC Message Types
// ============================================================================

export interface PluginIPCMessage {
    pluginId: string;
    type: string;
    payload?: any;
}

export interface PluginListResponse {
    plugins: PluginInfo[];
}

export interface PluginLoadRequest {
    pluginId: string;
}

export interface PluginSettingsRequest {
    pluginId: string;
    key?: string;
}

export interface PluginSettingsResponse {
    settings: Record<string, any>;
}

export interface PluginInvokeRequest {
    pluginId: string;
    method: string;
    args: any[];
}

