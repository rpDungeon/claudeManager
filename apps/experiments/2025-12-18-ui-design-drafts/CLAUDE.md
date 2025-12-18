# UI Design Drafts Feedback

## FINAL DECISION

**Use these 3 drafts as reference for implementation:**

| Draft | File | Purpose |
|-------|------|---------|
| **28** | `draft-28-minimal-chrome.html` | Terminal CSS style, footer bar style, CRT aesthetic |
| **36** | `draft-36-tree-compact.html` | Tree sidebar with compact density |
| **40** | `draft-40-final-merge.html` | Overall layout, icon rail + flyout, dashboard toggle |

---

## Wave 1 + Wave 2 Results

### REALLY Liked (Core Direction)

**Draft 11 - tmux-style**
- Multiple windows tmux style
- Ability to add names to panes/sessions
- Bottom-right system stats (CPU, mem, sessions) - critical feature
- Consider merging with Draft 04

**Draft 04 - vscode-style**
- Multi-project support: two projects open side by side in realtime
- Layout system: "+" to add a layout
- Example: Tab 1 has Project A + B, Tab 2 has Project C
- State sync via WebSocket (receive-wise, minimal local state)
- Cross-device continuity: same layout on device A and device B

### Liked (Features to Incorporate)

**Draft 13 - IDE panels**
- Layout with bottom/right collapsible panels
- Activity monitor
- Problems panel
- Agent log
- Normal shells support (all shells are normal, just auto-start claude code command)

**Draft 17 - tabbed workspaces**
- Tab grouping feature

**Draft 03 - grid layout**
- Projects sidebar on the left

**Draft 07 - notification center**
- Activity feed on the right
- Could show Claude Code tool usage (via hooks to capture events)

### Not Selected (Can Be Ignored)

Drafts 1, 2, 5, 6, 8, 9, 10, 12, 14, 15, 16, 18, 19, 20
