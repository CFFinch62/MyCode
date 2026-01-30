/**
 * Diff Viewer Plugin - Compare files side-by-side
 * Provides options to compare any two files, or compare with git HEAD
 */

(function() {
    let sidebarPanel = null;
    let repoPath = null;

    /**
     * Get the current project/repo path
     */
    async function getRepoPath() {
        const filePath = window.mycode?.workspace?.getActiveFilePath?.() || '';
        if (!filePath) return null;
        
        try {
            const result = await window.mycode.git.isRepo(filePath);
            if (result.isRepo) {
                return result.repoRoot;
            }
        } catch (e) {
            console.error('[DiffViewer] Error checking repo:', e);
        }
        return null;
    }

    /**
     * Get file extension for language detection
     */
    function getLanguageFromPath(filePath) {
        const ext = filePath.split('.').pop()?.toLowerCase() || '';
        const langMap = {
            'js': 'javascript',
            'ts': 'typescript',
            'jsx': 'javascript',
            'tsx': 'typescript',
            'py': 'python',
            'rb': 'ruby',
            'rs': 'rust',
            'go': 'go',
            'java': 'java',
            'c': 'c',
            'cpp': 'cpp',
            'h': 'c',
            'hpp': 'cpp',
            'css': 'css',
            'scss': 'scss',
            'html': 'html',
            'json': 'json',
            'md': 'markdown',
            'yaml': 'yaml',
            'yml': 'yaml',
            'xml': 'xml',
            'sql': 'sql',
            'sh': 'shell',
            'bash': 'shell',
        };
        return langMap[ext] || 'plaintext';
    }

    /**
     * Compare any two files using file dialogs
     */
    async function compareAnyFiles(api) {
        try {
            // Open first file dialog
            api.ui.showNotification('Select the first file to compare...', 'info', 2000);
            const files1 = await window.mycode.file.openDialog();
            if (!files1 || files1.length === 0) return;
            
            // Open second file dialog
            api.ui.showNotification('Select the second file to compare...', 'info', 2000);
            const files2 = await window.mycode.file.openDialog();
            if (!files2 || files2.length === 0) return;

            const file1Path = files1[0];
            const file2Path = files2[0];

            // Read both files
            const [result1, result2] = await Promise.all([
                window.mycode.file.read(file1Path),
                window.mycode.file.read(file2Path)
            ]);

            if (!result1.success || !result2.success) {
                api.ui.showNotification('Failed to read one or both files', 'error', 3000);
                return;
            }

            // Get language from first file
            const language = getLanguageFromPath(file1Path);

            // Extract filenames for title
            const name1 = file1Path.split('/').pop();
            const name2 = file2Path.split('/').pop();

            // Show diff in editor area
            api.ui.showDiffInEditor(result1.content, result2.content, {
                title: `${name1} ↔ ${name2}`,
                language,
                readOnly: true
            });

        } catch (error) {
            console.error('[DiffViewer] Error comparing files:', error);
            api.ui.showNotification('Error comparing files: ' + error.message, 'error', 3000);
        }
    }

    /**
     * Compare current file with git HEAD
     */
    async function compareWithHead(api) {
        try {
            const currentPath = api.workspace.getActiveFilePath();
            if (!currentPath) {
                api.ui.showNotification('No file is currently open', 'warning', 3000);
                return;
            }

            // Get repo path
            const repoResult = await window.mycode.git.isRepo(currentPath);
            if (!repoResult.isRepo) {
                api.ui.showNotification('Current file is not in a git repository', 'warning', 3000);
                return;
            }

            // Get current content
            const currentContent = api.editor.getContent();

            // Get HEAD content
            const headResult = await window.mycode.git.getFileFromHead(repoResult.repoRoot, currentPath);
            if (!headResult.success) {
                api.ui.showNotification('File not found in git HEAD (new file?)', 'warning', 3000);
                return;
            }

            const language = getLanguageFromPath(currentPath);
            const fileName = currentPath.split('/').pop();

            // Show diff in editor area
            api.ui.showDiffInEditor(headResult.content, currentContent, {
                title: `${fileName}: HEAD ↔ Current`,
                language,
                readOnly: true
            });

        } catch (error) {
            console.error('[DiffViewer] Error comparing with HEAD:', error);
            api.ui.showNotification('Error comparing with HEAD: ' + error.message, 'error', 3000);
        }
    }

    const pluginModule = {
        activate(api) {
            console.log('[DiffViewer] Plugin activated!');

            // Create sidebar panel
            sidebarPanel = api.ui.registerSidebarPanel({
                id: 'diff-viewer',
                title: 'Diff Viewer',
                icon: '⇄'
            });

            // Add styles
            const style = document.createElement('style');
            style.textContent = `
                .diff-viewer-container {
                    padding: 12px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .diff-viewer-title {
                    font-size: 14px;
                    font-weight: 600;
                    margin-bottom: 4px;
                    color: var(--text-primary);
                }
                .diff-viewer-desc {
                    font-size: 11px;
                    color: var(--text-secondary);
                    margin-bottom: 12px;
                }
                .diff-option {
                    display: flex;
                    flex-direction: column;
                    padding: 12px;
                    background: var(--input-bg);
                    border: 1px solid var(--border-color);
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.15s ease;
                }
                .diff-option:hover {
                    background: var(--hover-bg);
                    border-color: var(--accent-color);
                }
                .diff-option-icon {
                    font-size: 24px;
                    margin-bottom: 8px;
                }
                .diff-option-title {
                    font-size: 13px;
                    font-weight: 500;
                    color: var(--text-primary);
                    margin-bottom: 4px;
                }
                .diff-option-desc {
                    font-size: 11px;
                    color: var(--text-secondary);
                }
            `;
            document.head.appendChild(style);

            // Setup panel content
            sidebarPanel.element.innerHTML = `
                <div class="diff-viewer-container">
                    <div>
                        <div class="diff-viewer-title">Compare Files</div>
                        <div class="diff-viewer-desc">Select a comparison mode below</div>
                    </div>

                    <div class="diff-option" id="diff-compare-any">
                        <span class="diff-option-icon">📂</span>
                        <span class="diff-option-title">Compare Any Two Files</span>
                        <span class="diff-option-desc">Select two files from your system to compare</span>
                    </div>

                    <div class="diff-option" id="diff-compare-head">
                        <span class="diff-option-icon">📜</span>
                        <span class="diff-option-title">Compare with Git HEAD</span>
                        <span class="diff-option-desc">Compare current file with last committed version</span>
                    </div>
                </div>
            `;

            // Attach event handlers
            setTimeout(() => {
                const compareAnyBtn = document.getElementById('diff-compare-any');
                if (compareAnyBtn) {
                    compareAnyBtn.onclick = () => compareAnyFiles(api);
                }

                const compareHeadBtn = document.getElementById('diff-compare-head');
                if (compareHeadBtn) {
                    compareHeadBtn.onclick = () => compareWithHead(api);
                }
            }, 100);

            // Register commands
            api.commands.register('diff-viewer.compareAnyFiles', () => compareAnyFiles(api));
            api.commands.register('diff-viewer.compareWithHead', () => compareWithHead(api));

            console.log('[DiffViewer] Activation complete');
        },

        deactivate() {
            console.log('[DiffViewer] Plugin deactivated');
            if (sidebarPanel) sidebarPanel.dispose();
        }
    };

    // Register the plugin globally
    window.__MYCODE_PLUGINS__ = window.__MYCODE_PLUGINS__ || {};
    window.__MYCODE_PLUGINS__['mycode-diff-viewer'] = pluginModule;

    const callbackName = '__plugin_mycode_diff_viewer__';
    if (window[callbackName]) {
        window[callbackName](pluginModule);
    }
})();

