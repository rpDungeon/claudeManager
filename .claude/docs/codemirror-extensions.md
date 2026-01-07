# CodeMirror 6 Extensions Checklist

## Already Installed

- `@codemirror/autocomplete`
- `@codemirror/lang-css`
- `@codemirror/lang-html`
- `@codemirror/lang-javascript`
- `@codemirror/lang-json`
- `@codemirror/lang-markdown`
- `@codemirror/lint`
- `@codemirror/lsp-client`
- `@codemirror/state`
- `@codemirror/theme-one-dark`
- `@codemirror/view`
- `@replit/codemirror-lang-svelte`
- `@uiw/codemirror-themes`
- `codemirror`

---

## LSP & Intelligence

- [x] `@marimo-team/codemirror-languageserver` - Full LSP client with code actions, quick fixes, renaming, go-to-definition (better than @codemirror/lsp-client)

## AI Autocomplete

- [x] `codemirror-copilot` - GPT-powered autocomplete like GitHub Copilot
- [ ] `codemirror-codeium` - Codeium code completion (free Copilot alternative)

## Keybindings

- [ ] `@replit/codemirror-vim` - Full Vim keybindings with modes, yanking, macros
- [ ] `@replit/codemirror-emacs` - Emacs keybindings

## Navigation & Overview

- [x] `@replit/codemirror-minimap` - VS Code-style minimap with viewport overlay
- [ ] `codemirror-line-numbers-relative` - Vim-style relative line numbers

## Diff & Collaboration

- [x] `@codemirror/merge` - Side-by-side or unified diff view (official)
- [ ] `y-codemirror.next` - Yjs real-time collaborative editing with remote cursors
- [ ] `@convergencelabs/codemirror-collab-ext` - Remote cursors, selections, scrollbars

## Themes

- [ ] `@uiw/codemirror-themes-all` - All themes bundled (Dracula, Gruvbox, Nord, etc.)
- [ ] `cm6-themes` - Solarized, Material Dark, Nord, Gruvbox

## Language-Specific

//USERCOMMENT: only if needed, check what we have and if the lsp plugins covers them already
we need HTML, CSS, JS, TS, Python

- [ ] `codemirror-json-schema` - JSON Schema validation, autocomplete, hover tooltips
- [ ] `@emmetio/codemirror6-plugin` - Emmet support for HTML/CSS abbreviations
- [ ] `@replit/codemirror-lang-csharp` - C# syntax highlighting
- [ ] `@replit/codemirror-lang-solidity` - Solidity syntax highlighting
- [ ] `@uiw/codemirror-extensions-langs` - Load languages by file extension

## Visual Enhancements

- [x] `rainbowbrackets` - Rainbow brackets colored by depth
- [x] `@replit/codemirror-css-color-picker` - Inline color picker for CSS colors
- [x] `@uiw/codemirror-extensions-hyper-link` - Clickable URLs in editor
- [ ] `CM6-TextToLink` - Link icon next to valid URLs

## Search & Navigation

//is this not already included? is it just top right the popup? answer in the chat

- [ ] `codemirror-vscodeSearch` - VS Code-styled search/replace panel

## Markdown

- [ ] `@retronav/ixora` - Interactive markdown with live styling (WYSIWYG-ish)
- [ ] `codemirror-rich-markdoc` - Hybrid rich-text mode, hides syntax

## Spellcheck

- [ ] `WProofreader SDK` - Commercial multilingual spelling + grammar
- [ ] Custom spellcheck implementation (use lint API)

## Other

- [ ] `@uiw/codemirror-extensions-mentions` - @mentions support
- [ ] `@uiw/codemirror-extensions-basic-setup` - Configurable basicSetup fork

---

## Built-in (Enable via Code)

- [ ] Line Wrapping - `EditorView.lineWrapping`
- [x] Multiple Cursors - `allowMultipleSelections` extension
- [ ] Code Folding - `foldGutter()`, `foldKeymap` from `@codemirror/language`
- [x] Bracket Matching - `bracketMatching()` from `@codemirror/language`
- [ ] Go to Line - `gotoLine` command from `@codemirror/search` // dont we alreadyy have htis one?
- [ ] Breakpoints Gutter - Custom StateField implementation

---

## Notes

### LSP Client - No need for @marimo-team/codemirror-languageserver

The official `@codemirror/lsp-client` (already installed) supports almost everything:
- Rename Symbol (F2) - `renameSymbol`, `renameKeymap`
- Go to Definition (F12) - `jumpToDefinition`, `jumpToDefinitionKeymap`
- Go to Declaration - `jumpToDeclaration`
- Go to Type Definition - `jumpToTypeDefinition`
- Go to Implementation - `jumpToImplementation`
- Find References (Shift-F12) - `findReferences`, `findReferencesKeymap`
- Format Document (Shift-Alt-F) - `formatDocument`, `formatKeymap`
- Signature Help (Ctrl-Shift-Space) - `showSignatureHelp`, `signatureKeymap`
- Hover Tooltips - `hoverTooltips()`
- Completions - `serverCompletion()`
- Diagnostics - `serverDiagnostics()`

**Only thing marimo adds**: Code Actions (lightbulb quick fixes) - not critical.

To enable all features, add keymaps to editor extensions:
```typescript
import { renameKeymap, jumpToDefinitionKeymap, findReferencesKeymap, formatKeymap, signatureKeymap } from "@codemirror/lsp-client";
keymap.of([...renameKeymap, ...jumpToDefinitionKeymap, ...findReferencesKeymap, ...formatKeymap, ...signatureKeymap])
```
