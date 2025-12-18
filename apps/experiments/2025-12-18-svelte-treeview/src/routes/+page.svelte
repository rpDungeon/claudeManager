<script lang="ts">
import { Tree } from "@keenmate/svelte-treeview";
import "@keenmate/svelte-treeview/styles.scss";
import type { ContextMenuItem } from "@keenmate/svelte-treeview";

let searchText = $state("");

const fileSystemData = [
	{
		icon: "📁",
		name: "Documents",
		path: "1",
		type: "folder",
	},
	{
		icon: "📁",
		name: "Work",
		path: "1.1",
		type: "folder",
	},
	{
		icon: "📄",
		name: "Project Proposal.docx",
		path: "1.1.1",
		size: "24 KB",
		type: "file",
	},
	{
		icon: "📝",
		name: "Meeting Notes.md",
		path: "1.1.2",
		size: "8 KB",
		type: "file",
	},
	{
		icon: "📊",
		name: "Budget.xlsx",
		path: "1.1.3",
		size: "156 KB",
		type: "file",
	},
	{
		icon: "📁",
		name: "Personal",
		path: "1.2",
		type: "folder",
	},
	{
		icon: "📄",
		name: "Resume.pdf",
		path: "1.2.1",
		size: "89 KB",
		type: "file",
	},
	{
		icon: "🖼️",
		name: "Photos",
		path: "1.2.2",
		type: "folder",
	},
	{
		icon: "🏝️",
		name: "vacation.jpg",
		path: "1.2.2.1",
		size: "2.4 MB",
		type: "file",
	},
	{
		icon: "👨‍👩‍👧",
		name: "family.jpg",
		path: "1.2.2.2",
		size: "1.8 MB",
		type: "file",
	},
	{
		icon: "⬇️",
		name: "Downloads",
		path: "2",
		type: "folder",
	},
	{
		icon: "💿",
		name: "installer.exe",
		path: "2.1",
		size: "45 MB",
		type: "file",
	},
	{
		icon: "📝",
		name: "readme.txt",
		path: "2.2",
		size: "2 KB",
		type: "file",
	},
	{
		icon: "🎵",
		name: "Music",
		path: "3",
		type: "folder",
	},
	{
		icon: "⭐",
		name: "Favorites",
		path: "3.1",
		type: "folder",
	},
	{
		icon: "🎶",
		name: "song1.mp3",
		path: "3.1.1",
		size: "4.2 MB",
		type: "file",
	},
	{
		icon: "🎶",
		name: "song2.mp3",
		path: "3.1.2",
		size: "3.8 MB",
		type: "file",
	},
];

const dragSourceData = [
	{
		icon: "📦",
		isDraggable: true,
		name: "Drag Item 1",
		path: "src1",
	},
	{
		icon: "📦",
		isDraggable: true,
		name: "Drag Item 2",
		path: "src2",
	},
	{
		icon: "📦",
		isDraggable: true,
		name: "Drag Item 3",
		path: "src3",
	},
];

let dropTargetData = $state([
	{
		icon: "🎯",
		name: "Drop Zone",
		path: "target",
	},
	{
		icon: "📥",
		name: "Dropped items appear here",
		path: "target.1",
	},
]);

let selectedNode: (typeof fileSystemData)[0] | null = $state(null);
let contextMenuLog = $state<string[]>([]);

function handleNodeClick(node: { data: (typeof fileSystemData)[0] }) {
	selectedNode = node.data;
}

function handleDragStart(
	node: {
		data: (typeof dragSourceData)[0];
	},
	event: DragEvent,
) {
	console.log("Drag started:", node.data.name);
}

function handleDrop(
	dropNode: {
		data: (typeof dropTargetData)[0];
	},
	draggedNode: {
		data: (typeof dragSourceData)[0];
	},
	event: DragEvent,
) {
	const newPath = `target.${Date.now()}`;
	dropTargetData = [
		...dropTargetData,
		{
			icon: "✅",
			name: `Dropped: ${draggedNode.data.name}`,
			path: newPath,
		},
	];
}

function contextMenuCallback(node: { data: (typeof fileSystemData)[0] }): ContextMenuItem[] {
	return [
		{
			callback: () => {
				contextMenuLog = [
					...contextMenuLog,
					`Opened: ${node.data.name}`,
				];
			},
			icon: "📂",
			title: "Open",
		},
		{
			callback: () => {
				contextMenuLog = [
					...contextMenuLog,
					`Rename: ${node.data.name}`,
				];
			},
			icon: "✏️",
			title: "Rename",
		},
		{
			isDivider: true,
		},
		{
			callback: () => {
				contextMenuLog = [
					...contextMenuLog,
					`Copied path: ${node.data.path}`,
				];
			},
			icon: "📋",
			title: "Copy Path",
		},
		{
			callback: () => {
				contextMenuLog = [
					...contextMenuLog,
					`Delete: ${node.data.name}`,
				];
			},
			icon: "🗑️",
			title: "Delete",
		},
	];
}
</script>

<main>
	<h1>Svelte TreeView Demo</h1>

	<section>
		<h2>Basic Tree with Search</h2>
		<div class="demo-container">
			<input type="text" placeholder="Search files..." bind:value={searchText} class="search-input" />
			<div class="tree-wrapper">
				<Tree
					data={fileSystemData}
					idMember="path"
					pathMember="path"
					displayValueMember="name"
					shouldUseInternalSearchIndex={true}
					searchValueMember="name"
					bind:searchText
					onNodeClicked={handleNodeClick}
					contextMenuCallback={contextMenuCallback}
				>
					{#snippet nodeTemplate(node)}
						<div class="node-content">
							<span class="node-icon">{node.data.icon}</span>
							<span class="node-name">{node.data.name}</span>
							{#if node.data.size}
								<span class="node-size">({node.data.size})</span>
							{/if}
						</div>
					{/snippet}
				</Tree>
			</div>
			{#if selectedNode}
				<div class="selection-info">
					<strong>Selected:</strong>
					{selectedNode.name} ({selectedNode.type})
				</div>
			{/if}
		</div>
	</section>

	<section>
		<h2>Context Menu Log</h2>
		<div class="log-container">
			{#if contextMenuLog.length === 0}
				<p class="hint">Right-click on items above to see context menu</p>
			{:else}
				{#each contextMenuLog as log}
					<div class="log-entry">{log}</div>
				{/each}
			{/if}
		</div>
	</section>

	<section>
		<h2>Drag & Drop</h2>
		<div class="drag-drop-container">
			<div class="drag-source">
				<h3>Source</h3>
				<Tree
					data={dragSourceData}
					idMember="path"
					pathMember="path"
					displayValueMember="name"
					onNodeDragStart={handleDragStart}
				>
					{#snippet nodeTemplate(node)}
						<div class="node-content draggable">
							<span class="node-icon">{node.data.icon}</span>
							<span class="node-name">{node.data.name}</span>
						</div>
					{/snippet}
				</Tree>
			</div>
			<div class="drop-target">
				<h3>Target</h3>
				<Tree
					data={dropTargetData}
					idMember="path"
					pathMember="path"
					displayValueMember="name"
					dragOverNodeClass="drag-over"
					onNodeDrop={handleDrop}
				>
					{#snippet nodeTemplate(node)}
						<div class="node-content">
							<span class="node-icon">{node.data.icon}</span>
							<span class="node-name">{node.data.name}</span>
						</div>
					{/snippet}
				</Tree>
			</div>
		</div>
	</section>
</main>

<style>
	:global(body) {
		font-family: system-ui, -apple-system, sans-serif;
		margin: 0;
		padding: 20px;
		background: #1a1a2e;
		color: #eee;
	}

	main {
		max-width: 1200px;
		margin: 0 auto;
	}

	h1 {
		text-align: center;
		color: #00d9ff;
		margin-bottom: 40px;
	}

	h2 {
		color: #a855f7;
		border-bottom: 2px solid #a855f7;
		padding-bottom: 8px;
	}

	section {
		margin-bottom: 40px;
		background: #16213e;
		padding: 20px;
		border-radius: 12px;
	}

	.demo-container {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.search-input {
		padding: 12px 16px;
		font-size: 16px;
		border: 2px solid #333;
		border-radius: 8px;
		background: #0f0f23;
		color: #fff;
		outline: none;
		transition: border-color 0.2s;
	}

	.search-input:focus {
		border-color: #00d9ff;
	}

	.tree-wrapper {
		background: #0f0f23;
		border-radius: 8px;
		padding: 16px;
		min-height: 200px;
	}

	.node-content {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 4px 8px;
		border-radius: 4px;
		transition: background 0.15s;
	}

	.node-content:hover {
		background: rgba(168, 85, 247, 0.2);
	}

	.node-icon {
		font-size: 16px;
	}

	.node-name {
		color: #fff;
	}

	.node-size {
		color: #888;
		font-size: 12px;
	}

	.selection-info {
		padding: 12px;
		background: #0f0f23;
		border-radius: 8px;
		border-left: 4px solid #00d9ff;
	}

	.log-container {
		background: #0f0f23;
		border-radius: 8px;
		padding: 16px;
		max-height: 150px;
		overflow-y: auto;
	}

	.hint {
		color: #666;
		font-style: italic;
	}

	.log-entry {
		padding: 8px;
		margin: 4px 0;
		background: rgba(168, 85, 247, 0.1);
		border-radius: 4px;
		font-family: monospace;
	}

	.drag-drop-container {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 20px;
	}

	.drag-source,
	.drop-target {
		background: #0f0f23;
		border-radius: 8px;
		padding: 16px;
	}

	.drag-source h3,
	.drop-target h3 {
		margin-top: 0;
		color: #00d9ff;
	}

	.draggable {
		cursor: grab;
	}

	.draggable:active {
		cursor: grabbing;
	}

	:global(.drag-over) {
		background: rgba(0, 217, 255, 0.3) !important;
		border-radius: 4px;
	}

	:global(.ltree-node) {
		color: #fff;
	}

	:global(.ltree-selected) {
		background: rgba(168, 85, 247, 0.3);
		border-radius: 4px;
	}
</style>
