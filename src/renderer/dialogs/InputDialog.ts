/**
 * Input Dialog
 * Promise-based text input modal — replacement for window.prompt(), which
 * Electron's renderer does not implement (it silently returns null).
 */

export interface InputDialogOptions {
    title: string;
    label?: string;
    defaultValue?: string;
    placeholder?: string;
    confirmText?: string;
}

let overlay: HTMLElement | null = null;

function ensureDialog(): HTMLElement {
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = 'input-dialog-overlay';
    overlay.className = 'modal-overlay hidden';
    overlay.innerHTML = `
        <div class="modal-dialog input-dialog">
            <div class="modal-header">
                <h2 class="input-dialog-title"></h2>
                <button class="icon-btn input-dialog-close">×</button>
            </div>
            <div class="modal-content">
                <label class="input-dialog-label"></label>
                <input type="text" class="input-dialog-field" />
            </div>
            <div class="modal-footer">
                <button class="text-btn input-dialog-cancel">Cancel</button>
                <button class="text-btn primary input-dialog-confirm">OK</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    return overlay;
}

/**
 * Show a text input modal and resolve with the entered value,
 * or null if the user cancels.
 */
export function showInputDialog(options: InputDialogOptions): Promise<string | null> {
    const dlg = ensureDialog();
    const titleEl = dlg.querySelector('.input-dialog-title') as HTMLElement;
    const labelEl = dlg.querySelector('.input-dialog-label') as HTMLElement;
    const input = dlg.querySelector('.input-dialog-field') as HTMLInputElement;
    const confirmBtn = dlg.querySelector('.input-dialog-confirm') as HTMLButtonElement;
    const cancelBtn = dlg.querySelector('.input-dialog-cancel') as HTMLButtonElement;
    const closeBtn = dlg.querySelector('.input-dialog-close') as HTMLButtonElement;

    titleEl.textContent = options.title;
    if (options.label) {
        labelEl.textContent = options.label;
        labelEl.style.display = '';
    } else {
        labelEl.style.display = 'none';
    }
    input.value = options.defaultValue || '';
    input.placeholder = options.placeholder || '';
    confirmBtn.textContent = options.confirmText || 'OK';

    dlg.classList.remove('hidden');
    input.focus();
    input.select();

    return new Promise<string | null>((resolve) => {
        const cleanup = (result: string | null) => {
            dlg.classList.add('hidden');
            confirmBtn.removeEventListener('click', onConfirm);
            cancelBtn.removeEventListener('click', onCancel);
            closeBtn.removeEventListener('click', onCancel);
            dlg.removeEventListener('click', onOverlayClick);
            input.removeEventListener('keydown', onKeydown);
            resolve(result);
        };
        const onConfirm = () => cleanup(input.value);
        const onCancel = () => cleanup(null);
        const onOverlayClick = (e: MouseEvent) => {
            if (e.target === dlg) onCancel();
        };
        const onKeydown = (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                onConfirm();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                onCancel();
            }
        };

        confirmBtn.addEventListener('click', onConfirm);
        cancelBtn.addEventListener('click', onCancel);
        closeBtn.addEventListener('click', onCancel);
        dlg.addEventListener('click', onOverlayClick);
        input.addEventListener('keydown', onKeydown);
    });
}
