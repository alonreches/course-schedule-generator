# 01: Project scaffold

**What to build:** A working Electron + React desktop application shell that runs on Windows as a portable folder. The window opens, shows a stub tab bar and a stub File menu (New, Open, Save, Save As — all no-op for now), and nothing crashes. This is the foundation every subsequent ticket builds on.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] Electron app bootstrapped with React, Vite, and TypeScript
- [x] Vitest configured and a passing smoke test exists
- [x] ESLint configured with no errors on the initial codebase
- [x] App opens a single BrowserWindow on launch
- [x] Tab bar stub renders (no tabs yet; just the bar)
- [x] File menu stub renders with New, Open, Save, Save As items (all no-op)
- [x] `npm run build` produces a portable Windows folder (via electron-builder, target: portable)
- [x] `npm test` runs and passes
