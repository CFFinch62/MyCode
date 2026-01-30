/**
 * MyCode - Renderer Process Entry Point
 * Exports the App class for external initialization
 */

import { App } from './App';

// Export for external use (Monaco loading happens in HTML)
export { App };

// Make App available globally for the HTML script
(window as any).MyCodeApp = App;
