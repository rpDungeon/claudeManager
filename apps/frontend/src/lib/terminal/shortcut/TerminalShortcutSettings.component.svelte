<!--
@component
name: TerminalShortcutSettings
type: smart
styleguide: 1.0.0
description: Settings panel for managing terminal shortcut buttons with drag-and-drop reorder
usage: Embed in the settings modal under the Terminal Shortcuts category
-->
<script lang="ts">
import type { TerminalShortcutId } from "@claude-manager/common/src/terminal/shortcut/terminalShortcut.id";
import type { TerminalShortcut } from "@claude-manager/common/src/terminal/shortcut/terminalShortcut.types";
import { Plus, X, GripVertical } from "lucide-svelte";
import { onMount } from "svelte";
import {
	terminalShortcutsGet,
	terminalShortcutsLoad,
	terminalShortcutCreate,
	terminalShortcutUpdate,
	terminalShortcutDelete,
	terminalShortcutsReorder,
} from "./terminalShortcut.service.svelte";

const PRESET_COLORS = [
	null,
	"#00ff41",
	"#ffb000",
	"#00e5ff",
	"#ff3333",
	"#a855f7",
	"#ec4899",
	"#f97316",
];

const TOGGLE_ON_CTRLC =
	"px-1 py-0 text-[9px] font-mono rounded border border-terminal-amber text-terminal-amber bg-bg-elevated transition-all leading-tight";
const TOGGLE_OFF =
	"px-1 py-0 text-[9px] font-mono rounded border border-border-default text-text-tertiary transition-all leading-tight";
const TOGGLE_ON_ENTER =
	"px-1 py-0 text-[9px] font-mono rounded border border-terminal-green text-terminal-green bg-bg-elevated transition-all leading-tight";

let newLabel = $state("");
let newCommand = $state("");
let newColor = $state<string | null>(null);
let newSendCtrlC = $state(false);
let newSendEnter = $state(false);

let dragSourceId = $state<TerminalShortcutId | null>(null);
let dragOverId = $state<TerminalShortcutId | null>(null);

const shortcuts = $derived(terminalShortcutsGet());

onMount(() => {
	terminalShortcutsLoad();
});

async function handleAdd() {
	const label = newLabel.trim();
	const command = newCommand.trim();
	if (!(label && command)) return;
	await terminalShortcutCreate(label, command, newColor, newSendCtrlC, newSendEnter);
	newLabel = "";
	newCommand = "";
	newColor = null;
	newSendCtrlC = false;
	newSendEnter = false;
}

async function handleDelete(id: TerminalShortcutId) {
	await terminalShortcutDelete(id);
}

async function handleLabelChange(shortcut: TerminalShortcut, value: string) {
	const trimmed = value.trim();
	if (trimmed && trimmed !== shortcut.label) {
		await terminalShortcutUpdate(shortcut.id, {
			label: trimmed,
		});
	}
}

async function handleCommandChange(shortcut: TerminalShortcut, value: string) {
	const trimmed = value.trim();
	if (trimmed && trimmed !== shortcut.command) {
		await terminalShortcutUpdate(shortcut.id, {
			command: trimmed,
		});
	}
}

async function handleToggleCtrlC(shortcut: TerminalShortcut) {
	await terminalShortcutUpdate(shortcut.id, {
		sendCtrlC: !shortcut.sendCtrlC,
	});
}

async function handleToggleEnter(shortcut: TerminalShortcut) {
	await terminalShortcutUpdate(shortcut.id, {
		sendEnter: !shortcut.sendEnter,
	});
}

async function handleColorChange(shortcut: TerminalShortcut, color: string | null) {
	if (color !== shortcut.color) {
		await terminalShortcutUpdate(shortcut.id, {
			color,
		});
	}
}

function handleDragStart(id: TerminalShortcutId, event: DragEvent) {
	dragSourceId = id;
	if (event.dataTransfer) {
		event.dataTransfer.effectAllowed = "move";
		event.dataTransfer.setData("text/plain", id);
	}
}

function handleDragOver(id: TerminalShortcutId, event: DragEvent) {
	event.preventDefault();
	if (event.dataTransfer) {
		event.dataTransfer.dropEffect = "move";
	}
	dragOverId = id;
}

function handleDragLeave() {
	dragOverId = null;
}

async function handleDrop(targetId: TerminalShortcutId, event: DragEvent) {
	event.preventDefault();
	dragOverId = null;

	if (!(dragSourceId && dragSourceId !== targetId)) {
		dragSourceId = null;
		return;
	}

	const currentIds = shortcuts.map((s) => s.id);
	const sourceIndex = currentIds.indexOf(dragSourceId);
	const targetIndex = currentIds.indexOf(targetId);

	if (sourceIndex === -1 || targetIndex === -1) {
		dragSourceId = null;
		return;
	}

	const reordered = [
		...currentIds,
	];
	reordered.splice(sourceIndex, 1);
	reordered.splice(targetIndex, 0, dragSourceId);

	dragSourceId = null;
	await terminalShortcutsReorder(reordered);
}

function handleDragEnd() {
	dragSourceId = null;
	dragOverId = null;
}
</script>

<div class="flex flex-col gap-2">
	<span class="text-[10px] uppercase tracking-wider text-text-tertiary">
		Terminal Shortcuts
	</span>

	<div class="flex flex-col gap-1">
		{#each shortcuts as shortcut (shortcut.id)}
			<div
				class="flex items-center gap-1.5 rounded border border-border-default bg-bg-void px-1.5 py-1 transition-colors"
				class:border-terminal-green={dragOverId === shortcut.id}
				class:opacity-40={dragSourceId === shortcut.id}
				draggable="true"
				ondragstart={(e) => handleDragStart(shortcut.id, e)}
				ondragover={(e) => handleDragOver(shortcut.id, e)}
				ondragleave={handleDragLeave}
				ondrop={(e) => handleDrop(shortcut.id, e)}
				ondragend={handleDragEnd}
				role="listitem"
			>
				<span class="cursor-grab text-text-tertiary hover:text-text-secondary">
					<GripVertical class="size-3" />
				</span>
				<input
					type="text"
					value={shortcut.label}
					onblur={(e) => handleLabelChange(shortcut, e.currentTarget.value)}
					class="w-20 shrink-0 bg-transparent text-[11px] text-text-primary outline-none border-b border-transparent focus:border-border-active"
					placeholder="Label"
				/>
				<input
					type="text"
					value={shortcut.command}
					onblur={(e) => handleCommandChange(shortcut, e.currentTarget.value)}
					class="min-w-0 flex-1 bg-transparent text-[11px] text-text-secondary outline-none border-b border-transparent focus:border-border-active font-mono"
					placeholder="Command"
				/>
				<div class="flex items-center gap-1 shrink-0">
					<button
						type="button"
						class={shortcut.sendCtrlC ? TOGGLE_ON_CTRLC : TOGGLE_OFF}
						onclick={() => handleToggleCtrlC(shortcut)}
						title="Send Ctrl+C twice before command"
					>^C</button>
					<button
						type="button"
						class={shortcut.sendEnter ? TOGGLE_ON_ENTER : TOGGLE_OFF}
						onclick={() => handleToggleEnter(shortcut)}
						title="Send Enter after command"
					>{"\u23CE"}</button>
				</div>
				<div class="flex items-center gap-0.5 shrink-0">
					{#each PRESET_COLORS as color}
						<button
							type="button"
							class="size-3 rounded-full border transition-all"
							class:border-text-primary={shortcut.color === color}
							class:border-transparent={shortcut.color !== color}
							class:scale-125={shortcut.color === color}
							style:background-color={color ?? "#555555"}
							onclick={() => handleColorChange(shortcut, color)}
							title={color ?? "default"}
						></button>
					{/each}
				</div>
				<button
					type="button"
					onclick={() => handleDelete(shortcut.id)}
					class="ml-1 shrink-0 rounded p-0.5 text-text-tertiary hover:bg-bg-elevated hover:text-terminal-red transition-colors"
				>
					<X class="size-3" />
				</button>
			</div>
		{/each}
	</div>

	<div
		class="flex items-center gap-1.5 rounded border border-dashed border-border-default bg-bg-void px-1.5 py-1"
	>
		<span class="size-3"></span>
		<input
			type="text"
			bind:value={newLabel}
			class="w-20 shrink-0 bg-transparent text-[11px] text-text-primary outline-none border-b border-transparent focus:border-border-active"
			placeholder="Label"
			onkeydown={(e) => { if (e.key === "Enter") handleAdd(); }}
		/>
		<input
			type="text"
			bind:value={newCommand}
			class="min-w-0 flex-1 bg-transparent text-[11px] text-text-secondary outline-none border-b border-transparent focus:border-border-active font-mono"
			placeholder="Command"
			onkeydown={(e) => { if (e.key === "Enter") handleAdd(); }}
		/>
		<div class="flex items-center gap-1 shrink-0">
			<button
				type="button"
				class={newSendCtrlC ? TOGGLE_ON_CTRLC : TOGGLE_OFF}
				onclick={() => (newSendCtrlC = !newSendCtrlC)}
				title="Send Ctrl+C twice before command"
			>^C</button>
			<button
				type="button"
				class={newSendEnter ? TOGGLE_ON_ENTER : TOGGLE_OFF}
				onclick={() => (newSendEnter = !newSendEnter)}
				title="Send Enter after command"
			>{"\u23CE"}</button>
		</div>
		<div class="flex items-center gap-0.5 shrink-0">
			{#each PRESET_COLORS as color}
				<button
					type="button"
					class="size-3 rounded-full border transition-all"
					class:border-text-primary={newColor === color}
					class:border-transparent={newColor !== color}
					class:scale-125={newColor === color}
					style:background-color={color ?? "#555555"}
					onclick={() => (newColor = color)}
					title={color ?? "default"}
				></button>
			{/each}
		</div>
		<button
			type="button"
			onclick={handleAdd}
			disabled={!(newLabel.trim() && newCommand.trim())}
			class="ml-1 shrink-0 rounded p-0.5 text-text-tertiary hover:bg-bg-elevated hover:text-terminal-green disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
		>
			<Plus class="size-3" />
		</button>
	</div>
</div>
