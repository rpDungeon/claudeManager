<!--
@component
name: TerminalFooter
type: stupid
styleguide: 1.0.0
description: Collapsible bottom bar for terminal panes with shortcut buttons
usage: Place below TerminalBody in the terminal flex layout for quick-access content
-->
<script lang="ts">
import type { TerminalShortcut } from "@claude-manager/common/src/terminal/shortcut/terminalShortcut.types";

interface Props {
	isExpanded?: boolean;
	shortcuts?: TerminalShortcut[];
	onToggle?: () => void;
	onShortcutClick?: (shortcut: TerminalShortcut) => void;
}

let { isExpanded = false, shortcuts = [], onToggle, onShortcutClick }: Props = $props();
</script>

{#if isExpanded}
	<div class="flex flex-wrap items-center gap-0 border-t border-border-default bg-bg-surface px-0.5 py-0.5">
		<button
			type="button"
			class="flex items-center justify-center size-[11px] text-[8px] text-terminal-green hover:bg-bg-elevated transition-colors shrink-0"
			onclick={onToggle}
			title="Collapse bar"
		>▼</button>
		{#each shortcuts as shortcut (shortcut.id)}
			<button
				type="button"
				class="px-1.5 py-0 text-[10px] leading-[18px] hover:bg-bg-elevated transition-colors truncate max-w-24"
				style:color={shortcut.color ?? undefined}
				class:text-text-secondary={!shortcut.color}
				onclick={() => onShortcutClick?.(shortcut)}
				title={shortcut.command}
			>{shortcut.label}</button>
		{/each}
	</div>
{:else}
	<button
		type="button"
		class="absolute bottom-0 left-0 z-10 flex items-center justify-center size-[11px] text-[8px] text-text-tertiary hover:text-terminal-green hover:bg-bg-elevated transition-colors"
		onclick={onToggle}
		title="Expand bar"
	>▲</button>
{/if}
