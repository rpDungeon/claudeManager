<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import ContextMenu from "./ContextMenu.component.svelte";
import { ContextMenuItemType } from "./contextMenu.lib";

const { Story } = defineMeta({
	component: ContextMenu,
	parameters: {
		backgrounds: {
			default: "void",
			values: [
				{
					name: "void",
					value: "#0a0a0a",
				},
			],
		},
		layout: "fullscreen",
	},
	tags: [
		"autodocs",
	],
	title: "Common/ContextMenu",
});
</script>

<script lang="ts">
import type { ContextMenuItem } from "./contextMenu.lib";

let showHidden = $state(true);
let showExtensions = $state(false);

function handleAction(id: string) {
	console.log("Action:", id);
}

function handleToggle(id: string, checked: boolean) {
	console.log("Toggle:", id, checked);
	if (id === "show-hidden") showHidden = checked;
	if (id === "show-extensions") showExtensions = checked;
}

function handleClose() {
	console.log("Close menu");
}

const fileItems: ContextMenuItem[] = [
	{ type: ContextMenuItemType.Action, id: "new-file", label: "New File", shortcut: "⌘N" },
	{ type: ContextMenuItemType.Action, id: "new-folder", label: "New Folder", shortcut: "⇧⌘N" },
	{ type: ContextMenuItemType.Divider },
	{ type: ContextMenuItemType.Action, id: "rename", label: "Rename", shortcut: "Enter" },
	{ type: ContextMenuItemType.Action, id: "duplicate", label: "Duplicate" },
	{ type: ContextMenuItemType.Divider },
	{ type: ContextMenuItemType.Action, id: "delete", label: "Delete", shortcut: "⌘⌫", danger: true },
];

const viewItems = $derived<ContextMenuItem[]>([
	{ type: ContextMenuItemType.Toggle, id: "show-hidden", label: "Show Hidden Files", checked: showHidden },
	{ type: ContextMenuItemType.Toggle, id: "show-extensions", label: "Show Extensions", checked: showExtensions },
	{ type: ContextMenuItemType.Divider },
	{ type: ContextMenuItemType.Action, id: "refresh", label: "Refresh", shortcut: "⌘R" },
	{ type: ContextMenuItemType.Action, id: "collapse-all", label: "Collapse All" },
]);

const terminalItems: ContextMenuItem[] = [
	{ type: ContextMenuItemType.Action, id: "copy", label: "Copy", shortcut: "⌘C" },
	{ type: ContextMenuItemType.Action, id: "paste", label: "Paste", shortcut: "⌘V" },
	{ type: ContextMenuItemType.Action, id: "select-all", label: "Select All", shortcut: "⌘A" },
	{ type: ContextMenuItemType.Divider },
	{ type: ContextMenuItemType.Action, id: "clear", label: "Clear Terminal", shortcut: "⌘K" },
	{ type: ContextMenuItemType.Action, id: "reset", label: "Reset Terminal", disabled: true },
	{ type: ContextMenuItemType.Divider },
	{ type: ContextMenuItemType.Action, id: "kill", label: "Kill Process", shortcut: "⌃C", danger: true },
];
</script>

{#snippet fileMenuTemplate(_args: any)}
	<div class="relative h-[300px] w-full">
		<ContextMenu
			items={fileItems}
			position={{ x: 100, y: 50 }}
			onAction={handleAction}
			onClose={handleClose}
		/>
	</div>
{/snippet}

<Story name="FileMenu" args={{}} template={fileMenuTemplate} />

{#snippet viewMenuTemplate(_args: any)}
	<div class="relative h-[300px] w-full">
		<ContextMenu
			items={viewItems}
			position={{ x: 100, y: 50 }}
			onAction={handleAction}
			onToggle={handleToggle}
			onClose={handleClose}
		/>
	</div>
{/snippet}

<Story name="ViewMenu" args={{}} template={viewMenuTemplate} />

{#snippet terminalMenuTemplate(_args: any)}
	<div class="relative h-[350px] w-full">
		<ContextMenu
			items={terminalItems}
			position={{ x: 100, y: 50 }}
			onAction={handleAction}
			onClose={handleClose}
		/>
	</div>
{/snippet}

<Story name="TerminalMenu" args={{}} template={terminalMenuTemplate} />
