# Build & Release Notes

Practical notes on building, packaging, and releasing MyCode — especially
gotchas hit when developing inside the Nix flake dev shell on a machine
that isn't NixOS (e.g. a regular Ubuntu box with Nix installed on top).

## Setting up a new machine

```bash
curl --proto '=https' --tlsv1.2 -sSf -L https://install.determinate.systems/nix | sh -s -- install
# open a new terminal, then:
cd MyCode
nix develop     # or `direnv allow` if you have direnv installed
npm install
```

`flake.nix` pins `nodejs_22` (Node 20 was dropped from nixpkgs-unstable
after its EOL on 2026-04-30 — if a future `nix develop` fails with
`Node.js support was removed given upstream End-of-Life`, bump the
`nodejs_NN` version in `flake.nix` to whatever's current).

## The `node-pty` / glibc gotcha (read this before packaging a release)

**Symptom:** the app window never appears. Running from a terminal shows:

```
UnhandledPromiseRejectionWarning: Error: Failed to load native module: pty.node, ...
```

or, if it's already packaged, the same error appears when running the
AppImage/deb.

**Root cause:** `node-pty` is a native addon and must be compiled for
Electron's exact ABI. Two different toolchains are in play on this kind
of machine:

- **Nix's toolchain** (`gcc`, from `flake.nix`'s `buildInputs`) links
  against Nix's own glibc, which on `nixpkgs-unstable` is often *newer*
  than the host system's glibc (e.g. requires `GLIBC_2.42` when the
  system only has `2.39`).
- **Electron itself** is a plain binary downloaded via npm — it uses the
  **system's** dynamic linker/glibc, not Nix's.

If `node-pty` gets compiled with Nix's `gcc` (which happens by default
any time you're inside `nix develop`, since Nix's `gcc` is first on
`PATH`), the resulting `pty.node` requires glibc symbols the system
Electron binary's runtime doesn't have → silent failure. `main.ts`'s
`createWindow()` does a synchronous `require('node-pty')` before
creating the `BrowserWindow`, and since `createWindow()` is `async` with
no `.catch()`, that throw kills window creation with no dialog — just
the unhandled-rejection log line above.

**Fix — always rebuild `node-pty` with the *system* compiler**, not
Nix's, by putting `/usr/bin` first on `PATH` for just that command:

```bash
nix develop
PATH=/usr/bin:/usr/local/bin:$PATH npx electron-rebuild -f -w node-pty
```

Verify it worked (should show glibc versions well under what the system
provides — check yours with `ldd --version`):

```bash
objdump -T node_modules/node-pty/build/Release/pty.node 2>/dev/null \
  | grep -o 'GLIBC_[0-9.]*' | sort -Vu | tail -5
```

**When this bites you again:**
- Any fresh `npm install` reruns the `postinstall` hook
  (`electron-builder install-app-deps`), which rebuilds `node-pty` with
  whatever's on `PATH` at that moment — redo the rebuild above afterward
  if you ran `npm install` from inside `nix develop`.
- Packaging (`npm run dist*`) used to *also* silently rebuild native
  deps via `electron-builder`'s `npmRebuild` option (default `true`) —
  this is why the bug once made it all the way into a shipped
  AppImage/deb, not just the local dev build. **Fixed properly**: added
  `"npmRebuild": false` under `build` in `package.json`, so packaging
  now trusts whatever's already in `node_modules` instead of silently
  recompiling it. This means the manual rebuild step above is the
  *only* place `node-pty` gets compiled — do it after every
  `npm install`, and packaging will no longer be able to reintroduce
  the bug on its own.

## Build vs. package — they're different steps

```bash
npm run build        # compiles/bundles source into dist/ only — NOT a release
npm run dist:linux    # packages dist/ into release/*.AppImage, *.deb, *.tar.gz
```

`npm run dist` (no suffix) packages for whatever OS you're running on;
`dist:linux` / `dist:win` / `dist:mac` are explicit per-platform variants.
Always `npm run build` first — `electron-builder` just packages
whatever is already in `dist/`, it doesn't build it for you.

`package.json`'s version field (currently `0.1.0`) is what names the
output files in `release/`. Packaging again at the same version
overwrites the existing files in place; bump the version first if you
want a distinguishable new release.

## Testing a build without a full package

Playwright's `_electron` launcher can drive the real (unpackaged)
`dist/` build headlessly for smoke-testing UI changes, using the
project's own `node_modules/electron/dist/electron` binary as
`executablePath`. Two gotchas specific to this setup:

- **`ELECTRON_RUN_AS_NODE=1`** — if inherited from a parent process (e.g.
  VS Code's extension host, which is itself Electron-based), any nested
  Electron binary you launch runs as plain Node instead of opening a
  window. `unset ELECTRON_RUN_AS_NODE` before launching if things silently
  no-op or `--version` prints a Node-style version string instead of
  Electron's.
- **Never point a throwaway/test run at your real
  `~/.config/mycode/settings.json`.** Launch with
  `--user-data-dir=/some/scratch/path` and seed a minimal
  `settings.json` there (e.g. `{"openedFolders": ["/scratch/test-dir"]}`)
  instead — this keeps test runs from clobbering your real opened
  folders/preferences.
