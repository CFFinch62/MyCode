/**
 * MyCode - PTY Service
 * Manages pseudo-terminal instances for the integrated terminal
 */

import * as pty from 'node-pty';
import { ipcMain, IpcMainEvent } from 'electron';
import * as os from 'os';
import * as fs from 'fs';
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

        // Spawn a specific binary directly as the PTY process (no shell wrapper).
        // Used by the runner plugin so runtimes don't inherit AppImage env pollution.
        ipcMain.handle(IPC_CHANNELS.TERMINAL_CREATE_PROCESS, (event, options: {
            cmd: string; args?: string[]; cwd?: string; cols?: number; rows?: number;
        }) => {
            return this.createDirectProcess(options.cmd, options.args || [], options.cwd, options.cols, options.rows);
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

    // Resolve the shell to use for the integrated terminal.
    // Validates each candidate path actually exists before using it so that
    // an invalid $SHELL env var (common in AppImage environments) doesn't
    // cause execvp(3) to fail with ENOENT.
    private resolveShell(): string {
        if (os.platform() === 'win32') return 'powershell.exe';

        const candidates = [
            process.env.SHELL,
            '/bin/bash',
            '/usr/bin/bash',
            '/bin/sh',
            '/usr/bin/sh',
        ].filter(Boolean) as string[];

        for (const shell of candidates) {
            try {
                if (fs.existsSync(shell)) return shell;
            } catch (_) { /* keep trying */ }
        }
        return '/bin/sh'; // last-resort fallback
    }

    /**
     * Validate that a cwd path exists. Falls back to homedir if not.
     */
    private resolveCwd(cwd?: string): string {
        if (cwd) {
            try {
                if (fs.existsSync(cwd) && fs.statSync(cwd).isDirectory()) {
                    return cwd;
                }
            } catch (_) { /* fall through */ }
        }
        return os.homedir();
    }

    private createTerminal(cwd?: string, cols?: number, rows?: number): string {
        const id = `terminal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const shell = this.resolveShell();

        const env: { [key: string]: string } = {
            ...process.env as { [key: string]: string },
            TERM: 'xterm-256color',
        };
        // When running as an AppImage, Electron overrides LD_LIBRARY_PATH to
        // point to its own bundled libraries. Inheriting that path breaks
        // external binaries (runtimes) which are compiled against system libs.
        // Clear both so child processes resolve libraries from the system.
        delete env['LD_LIBRARY_PATH'];
        delete env['LD_PRELOAD'];

        const ptyProcess = pty.spawn(shell, [], {
            name: 'xterm-256color',
            cols: cols || 80,
            rows: rows || 24,
            cwd: this.resolveCwd(cwd),
            env,
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

    // Spawn a binary directly as the PTY — no shell, clean env, immediate output.
    private createDirectProcess(cmd: string, args: string[], cwd?: string, cols?: number, rows?: number): string {
        const id = `terminal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const env: { [key: string]: string } = {
            ...process.env as { [key: string]: string },
            TERM: 'xterm-256color',
        };
        delete env['LD_LIBRARY_PATH'];
        delete env['LD_PRELOAD'];

        const ptyProcess = pty.spawn(cmd, args, {
            name: 'xterm-256color',
            cols: cols || 80,
            rows: rows || 24,
            cwd: this.resolveCwd(cwd),
            env,
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
