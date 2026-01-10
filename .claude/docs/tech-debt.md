# Tech Debt Log

## 2026-01-10: Inconsistent resize implementations

**Issue**: Two different approaches for resizable panes exist in the codebase.

1. **Custom mousedown/mousemove/mouseup** - Used for sidebar resize
   - Location: `apps/frontend/src/routes/dashboard/+page.svelte` (lines 95-116)
   - Simple, no dependencies

2. **Paneforge library** - Used for split pane layout
   - Location: `apps/frontend/src/lib/layout/container/LayoutContainerSplit.component.svelte`
   - Adds dependency: `paneforge@1.0.2`

**Decision needed**: Either remove paneforge and use custom implementation everywhere, or migrate sidebar to paneforge for consistency.
