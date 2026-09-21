# 10: Template import / export

**What to build:** Let coordinators share templates between machines by exporting a template to a JSON file and importing one from a file. Both actions are available from the Templates screen.

**Blocked by:** 03 — Template management

**Status:** ready-for-agent

- [ ] Templates screen has an Export button for each template; clicking it opens an Electron save dialog and writes the `Template` object to a JSON file
- [ ] Templates screen has an Import button; clicking it opens an Electron open dialog; reading a valid template JSON file adds it to the library (with a name-collision prompt if a template with the same name already exists)
- [ ] Imported template items preserve their order and names exactly as exported
- [ ] Invalid or corrupt JSON files show a user-friendly error message rather than crashing
- [ ] `templateStore` import/export round-trip test: export a template, import it into a fresh store, assert the imported template is equal to the original
