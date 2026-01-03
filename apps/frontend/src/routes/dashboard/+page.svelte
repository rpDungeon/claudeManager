<!-- Review pending by Autumnlight -->
<script lang="ts">
import { browser } from "$app/environment";
import type { LayoutId } from "@claude-manager/common/src/layout/layout.id";
import type { ProjectId } from "@claude-manager/common/src/project/project.id";
import { DEFAULT_SIDEBAR_WIDTH, tabStateLoad, tabStateSave } from "$lib/tabState/tabState.service.svelte";
import DashboardLayout from "./DashboardLayout.component.svelte";
import DashboardSidebar from "./DashboardSidebar.component.svelte";
import DashboardStatusBar from "./DashboardStatusBar.component.svelte";
import LayoutSettingsModal from "./LayoutSettingsModal.component.svelte";
import ProjectSettingsModal from "./ProjectSettingsModal.component.svelte";

const initialState = browser
	? tabStateLoad()
	: {
			layoutId: null,
			projectId: null,
			sidebarWidth: DEFAULT_SIDEBAR_WIDTH,
		};
let selectedProjectId = $state<ProjectId | null>(initialState.projectId);
let selectedLayoutId = $state<LayoutId | null>(initialState.layoutId);
let sidebarWidth = $state(initialState.sidebarWidth);

$effect(() => {
	if (browser) {
		tabStateSave({
			layoutId: selectedLayoutId,
			projectId: selectedProjectId,
			sidebarWidth,
		});
	}
});
let showProjectSettings = $state(false);
let showLayoutSettings = $state(false);
let isSidebarCollapsed = $state(false);
let isResizing = $state(false);

const MIN_SIDEBAR_WIDTH = 200;
const MAX_SIDEBAR_WIDTH = 500;

function handleResizeStart(event: MouseEvent) {
	event.preventDefault();
	isResizing = true;

	const startX = event.clientX;
	const startWidth = sidebarWidth;

	function onMouseMove(e: MouseEvent) {
		const delta = e.clientX - startX;
		const newWidth = Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, startWidth + delta));
		sidebarWidth = newWidth;
	}

	function onMouseUp() {
		isResizing = false;
		document.removeEventListener("mousemove", onMouseMove);
		document.removeEventListener("mouseup", onMouseUp);
	}

	document.addEventListener("mousemove", onMouseMove);
	document.addEventListener("mouseup", onMouseUp);
}

let sidebarRef:
	| {
			refresh: () => Promise<void>;
	  }
	| undefined = $state();

let layoutRef:
	| {
			openFile: (filePath: string, openToSide?: boolean) => void;
	  }
	| undefined = $state();

let projectName = $state("");
let projectPath = $state("");
let layoutName = $state("");

function handleProjectChange(projectId: ProjectId | null, path: string | null) {
	selectedProjectId = projectId;
	projectPath = path ?? "";
}

function handleLayoutChange(layoutId: LayoutId | null) {
	selectedLayoutId = layoutId;
}

function handleProjectSettingsClick(_projectId: ProjectId, name: string, path: string) {
	projectName = name;
	projectPath = path;
	showProjectSettings = true;
}

function handleLayoutSettingsClick(_layoutId: LayoutId, name: string) {
	layoutName = name;
	showLayoutSettings = true;
}

async function handleProjectSave() {
	await sidebarRef?.refresh();
}

async function handleProjectDelete() {
	selectedProjectId = null;
	await sidebarRef?.refresh();
}

async function handleLayoutSave() {
	await sidebarRef?.refresh();
}

async function handleLayoutDuplicate(newLayoutId: LayoutId) {
	await sidebarRef?.refresh();
	selectedLayoutId = newLayoutId;
}

async function handleLayoutDelete() {
	selectedLayoutId = null;
	await sidebarRef?.refresh();
}

function handleFileOpen(filePath: string, openToSide?: boolean) {
	layoutRef?.openFile(filePath, openToSide);
}
</script>

<svelte:head>
	<title>Dashboard | Claude Manager</title>
</svelte:head>

<div class="flex h-screen w-screen flex-col bg-bg-void">
	<div class="flex flex-1 overflow-hidden" class:select-none={isResizing}>
		<div class="relative flex-shrink-0">
			<div
				class="h-full overflow-hidden transition-[width] duration-200 ease-out"
				class:!transition-none={isResizing}
				class:w-0={isSidebarCollapsed}
				style:width={isSidebarCollapsed ? undefined : `${sidebarWidth}px`}
			>
				<div
					class="h-full border-r border-border-default transition-transform duration-200 ease-out"
					class:translate-x-0={!isSidebarCollapsed}
					class:-translate-x-full={isSidebarCollapsed}
					style:width="{sidebarWidth}px"
				>
					<DashboardSidebar
						bind:this={sidebarRef}
						bind:selectedProjectId
						bind:selectedLayoutId
						onProjectChange={handleProjectChange}
						onLayoutChange={handleLayoutChange}
						onProjectSettingsClick={handleProjectSettingsClick}
						onLayoutSettingsClick={handleLayoutSettingsClick}
						onFileOpen={handleFileOpen}
					/>
				</div>
			</div>
			<!-- Resize handle -->
			{#if !isSidebarCollapsed}
				<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
				<div
					role="separator"
					aria-orientation="vertical"
					aria-valuenow={sidebarWidth}
					aria-valuemin={MIN_SIDEBAR_WIDTH}
					aria-valuemax={MAX_SIDEBAR_WIDTH}
					tabindex="-1"
					class="absolute top-0 right-0 h-full w-1 cursor-col-resize hover:bg-terminal-green/30 transition-colors z-20 {isResizing ? 'bg-terminal-green/50' : ''}"
					onmousedown={handleResizeStart}
				></div>
			{/if}
			<button
				type="button"
				class="absolute top-2 left-full z-10 flex h-5 w-5 items-center justify-center text-[8px] text-text-tertiary hover:text-terminal-green hover:bg-bg-elevated transition-colors"
				class:text-terminal-green={!isSidebarCollapsed}
				class:bg-bg-elevated={!isSidebarCollapsed}
				onclick={() => (isSidebarCollapsed = !isSidebarCollapsed)}
				title="Toggle sidebar"
			>
				{isSidebarCollapsed ? '▶' : '◀'}
			</button>
		</div>
		<div class="flex-1 min-w-0 overflow-hidden">
			<DashboardLayout bind:this={layoutRef} layoutId={selectedLayoutId} {projectPath} />
		</div>
	</div>

	<DashboardStatusBar />
</div>

<ProjectSettingsModal
	bind:open={showProjectSettings}
	projectId={selectedProjectId}
	{projectName}
	{projectPath}
	onSave={handleProjectSave}
	onDelete={handleProjectDelete}
/>

<LayoutSettingsModal
	bind:open={showLayoutSettings}
	layoutId={selectedLayoutId}
	{layoutName}
	onSave={handleLayoutSave}
	onDuplicate={handleLayoutDuplicate}
	onDelete={handleLayoutDelete}
/>
