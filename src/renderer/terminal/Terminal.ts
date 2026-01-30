/**
 * MyCode - Integrated Terminal Component
 * Provides a terminal panel at the bottom of the editor
 */

import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';

export class Terminal {
    private container: HTMLElement;
    private terminalPanel: HTMLElement | null = null;
    private xterm: XTerm | null = null;
    private fitAddon: FitAddon | null = null;
    private terminalId: string | null = null;
    private isVisible = false;
    private resizeObserver: ResizeObserver | null = null;

    private isResizing = false;
    private startY = 0;
    private startHeight = 0;

    constructor() {
        this.container = document.getElementById('main-content')!;
    }

    async toggle(cwd?: string): Promise<void> {
        if (this.isVisible) {
            this.hide();
        } else {
            await this.show(cwd);
        }
    }

    async show(cwd?: string): Promise<void> {
        if (this.isVisible) return;

        // Create terminal panel if it doesn't exist
        if (!this.terminalPanel) {
            this.createTerminalPanel();
        }

        this.terminalPanel!.classList.remove('hidden');
        this.isVisible = true;

        // Create PTY and xterm if not already created
        if (!this.terminalId) {
            await this.createTerminal(cwd);
        }

        // Fit terminal to container
        this.fit();
    }

    hide(): void {
        if (!this.isVisible) return;

        this.terminalPanel?.classList.add('hidden');
        this.isVisible = false;
    }

    private createTerminalPanel(): void {
        this.terminalPanel = document.createElement('div');
        this.terminalPanel.id = 'terminal-panel';
        this.terminalPanel.className = 'terminal-panel hidden';
        this.terminalPanel.innerHTML = `
            <div class="terminal-resizer"></div>
            <div class="terminal-header">
                <span class="terminal-title">Terminal</span>
                <button class="terminal-close" title="Close terminal">✕</button>
            </div>
            <div class="terminal-content" id="terminal-content"></div>
        `;

        // Add resize handler
        const resizer = this.terminalPanel.querySelector('.terminal-resizer') as HTMLElement;
        resizer.addEventListener('mousedown', (e) => {
            this.isResizing = true;
            this.startY = e.clientY;
            this.startHeight = this.terminalPanel!.offsetHeight;
            this.terminalPanel!.classList.add('resizing');

            // Add global listeners
            document.addEventListener('mousemove', this.handleResize);
            document.addEventListener('mouseup', this.handleResizeEnd);
            e.preventDefault();
        });

        // Add close button handler
        this.terminalPanel.querySelector('.terminal-close')?.addEventListener('click', () => {
            this.hide();
        });

        this.container.appendChild(this.terminalPanel);

        // Setup resize observer
        this.resizeObserver = new ResizeObserver(() => {
            if (!this.isResizing) {
                this.fit();
            }
        });
        const terminalContent = this.terminalPanel.querySelector('.terminal-content');
        if (terminalContent) {
            this.resizeObserver.observe(terminalContent);
        }
    }

    private async createTerminal(cwd?: string): Promise<void> {
        // Create xterm instance
        this.xterm = new XTerm({
            fontFamily: "'Fira Code', 'Droid Sans Mono', 'monospace', monospace",
            fontSize: 14,
            allowProposedApi: true,
            theme: {
                background: '#1e1e1e',
                foreground: '#d4d4d4',
                cursor: '#ffffff',
                selectionBackground: '#264f78',
            },
            cursorBlink: true,
            convertEol: true,
        });

        this.fitAddon = new FitAddon();
        this.xterm.loadAddon(this.fitAddon);

        // Mount to DOM
        const contentEl = this.terminalPanel?.querySelector('#terminal-content');
        if (contentEl) {
            this.xterm.open(contentEl as HTMLElement);
        }

        // Add clipboard selection support
        this.xterm.onSelectionChange(() => {
            if (this.xterm?.hasSelection()) {
                document.execCommand('copy');
            }
        });

        // Delay PTY creation slightly to allow DOM to settle and xterm to ready itself
        // This fixes the race condition where xterm/pty start with mismatched sizes
        setTimeout(async () => {
            // Calculate initial size
            let cols = 80;
            let rows = 24;

            if (this.fitAddon && this.isVisible) {
                try {
                    this.fitAddon.fit();
                    if (this.xterm?.cols && this.xterm?.rows) {
                        cols = this.xterm.cols;
                        rows = this.xterm.rows;
                    }
                } catch (e) {
                    // Ignore fit errors
                }
            }

            // Create PTY process via IPC with correct dimensions
            this.terminalId = await window.mycode.terminal.create(cwd, cols, rows);

            // Initial fit again to be sure
            this.fit();
        }, 100);

        // Handle data from xterm (user input)
        this.xterm.onData((data) => {
            if (this.terminalId) {
                window.mycode.terminal.write(this.terminalId, data);
            }
        });

        // Handle data from PTY
        window.mycode.terminal.onData((id: string, data: string) => {
            if (id === this.terminalId && this.xterm) {
                this.xterm.write(data);
            }
        });

        // Handle terminal exit
        window.mycode.terminal.onExit((id: string) => {
            if (id === this.terminalId) {
                this.xterm?.write('\r\n\x1b[90m[Process exited]\x1b[0m\r\n');
            }
        });

        // Initial fit
        this.fit();
    }

    private fit(): void {
        if (this.fitAddon && this.isVisible) {
            try {
                this.fitAddon.fit();
                // Send resize to PTY
                if (this.terminalId && this.xterm) {
                    window.mycode.terminal.resize(
                        this.terminalId,
                        this.xterm.cols,
                        this.xterm.rows
                    );
                }
            } catch (e) {
                // Ignore errors during initial setup
            }
        }
    }

    isTerminalVisible(): boolean {
        return this.isVisible;
    }

    async destroy(): Promise<void> {
        if (this.terminalId) {
            await window.mycode.terminal.destroy(this.terminalId);
            this.terminalId = null;
        }
        this.xterm?.dispose();
        this.xterm = null;
        this.resizeObserver?.disconnect();
    }

    private handleResize = (e: MouseEvent): void => {
        if (!this.isResizing || !this.terminalPanel) return;

        // Calculate new height (drag up increases height)
        const diff = this.startY - e.clientY;
        const newHeight = Math.max(100, Math.min(this.startHeight + diff, window.innerHeight - 100));

        this.terminalPanel.style.height = `${newHeight}px`;
        this.fit();
    };

    private handleResizeEnd = (): void => {
        this.isResizing = false;
        this.terminalPanel?.classList.remove('resizing');
        document.removeEventListener('mousemove', this.handleResize);
        document.removeEventListener('mouseup', this.handleResizeEnd);
        this.fit();
    };
}
