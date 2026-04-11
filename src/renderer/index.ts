/**
 * MyCode - Renderer Process Entry Point
 * Exports the App class for external initialization
 */

import { App } from './App';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';

// Export for external use (Monaco loading happens in HTML)
export { App };

// Make App available globally for the HTML script
(window as any).MyCodeApp = App;

// Expose xterm classes as globals so that plugin scripts (which cannot use
// ES module imports) can instantiate their own terminal instances.
(window as any).XTerm = XTerm;
(window as any).FitAddon = FitAddon;
