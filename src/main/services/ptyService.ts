/**
 * MyCode - PTY Service
 * Manages pseudo-terminal instances for the integrated terminal
 */

import * as pty from 'node-pty';
import { ipcMain, IpcMainEvent } from 'electron';
import * as os from 'os';
import { IPC_CHANNELS } from '../../shared/ipc-channels';

interface TerminalInstance {
    pty: pty.IPty;
    id: string;
}

class PtyService {
    private terminals: Map<string, TerminalInstance> = new Map();
    private webContents: Electron.WebContents | null = null;

    init(webContents: Electron.WebContents): void {
        this.webContents = webContents;
        this.setupIpcHandlers();
    }

    private setupIpcHandlers(): void {
        ipcMain.handle(IPC_CHANNELS.TERMINAL_CREATE, (event, options?: { cwd?: string; cols?: number; rows?: number }) => {
            return this.createTerminal(options?.cwd, options?.cols, options?.rows);
        });

        ipcMain.on(IPC_CHANNELS.TERMINAL_DATA, (event: IpcMainEvent, { id, data }: { id: string; data: string }) => {
            this.writeToTerminal(id, data);
        });

        ipcMain.on(IPC_CHANNELS.TERMINAL_RESIZE, (event: IpcMainEvent, { id, cols, rows }: { id: string; cols: number; rows: number }) => {
            this.resizeTerminal(id, cols, rows);
        });

        ipcMain.handle(IPC_CHANNELS.TERMINAL_DESTROY, (event, id: string) => {
            this.destroyTerminal(id);
        });
    }

    private createTerminal(cwd?: string, cols?: number, rows?: number): string {
        const id = `terminal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Determine shell based on OS
        const shell = os.platform() === 'win32'
            ? 'powershell.exe'
            : process.env.SHELL || '/bin/bash';

        const ptyProcess = pty.spawn(shell, [], {
            name: 'xterm-256color',
            cols: cols || 80,
            rows: rows || 24,
            cwd: cwd || os.homedir(),
            env: {
                ...process.env as { [key: string]: string },
                TERM: 'xterm-256color',
            },
        });

        ptyProcess.onData((data: string) => {
            if (this.webContents && !this.webContents.isDestroyed()) {
                this.webContents.send(IPC_CHANNELS.TERMINAL_DATA_FROM_PTY, { id, data });
            }
        });

        ptyProcess.onExit(({ exitCode, signal }) => {
            if (this.webContents && !this.webContents.isDestroyed()) {
                this.webContents.send(IPC_CHANNELS.TERMINAL_EXIT, { id, exitCode, signal });
            }
            this.terminals.delete(id);
        });

        this.terminals.set(id, { pty: ptyProcess, id });
        return id;
    }

    private writeToTerminal(id: string, data: string): void {
        const terminal = this.terminals.get(id);
        if (terminal) {
            terminal.pty.write(data);
        }
    }

    private resizeTerminal(id: string, cols: number, rows: number): void {
        const terminal = this.terminals.get(id);
        if (terminal) {
            terminal.pty.resize(cols, rows);
        }
    }

    private destroyTerminal(id: string): void {
        const terminal = this.terminals.get(id);
        if (terminal) {
            terminal.pty.kill();
            this.terminals.delete(id);
        }
    }

    cleanup(): void {
        for (const [id] of this.terminals) {
            this.destroyTerminal(id);
        }
    }
}

export const ptyService = new PtyService();
