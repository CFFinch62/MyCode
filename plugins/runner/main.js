/**
 * Runner Plugin — Main Process Module
 *
 * Runs in the Node.js main process where we can read environment variables
 * that are not accessible from the sandboxed renderer.
 *
 * Called from renderer.js via window.mycode.plugins.invokeMain().
 */

'use strict';

const path = require('path');

module.exports = {
    activate() {},
    deactivate() {},

    /**
     * Returns the directory containing the .AppImage file when running as an
     * AppImage on Linux (Electron sets APPIMAGE to the full path of the file).
     * Returns null in dev mode or on other platforms.
     */
    getAppImageDir() {
        const appImage = process.env.APPIMAGE;
        if (!appImage) return null;
        return path.dirname(appImage);
    },
};
