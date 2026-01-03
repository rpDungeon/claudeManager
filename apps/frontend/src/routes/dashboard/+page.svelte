<!-- Review pending by Autumnlight -->
<script lang="ts">
import type { LayoutId } from "@claude-manager/common/src/layout/layout.id";
import type { ProjectId } from "@claude-manager/common/src/project/project.id";
import DashboardLayout from "./DashboardLayout.component.svelte";
import DashboardSidebar from "./DashboardSidebar.component.svelte";
import DashboardStatusBar from "./DashboardStatusBar.component.svelte";
import LayoutSettingsModal from "./LayoutSettingsModal.component.svelte";
import ProjectSettingsModal from "./ProjectSettingsModal.component.svelte";

let selectedProjectId = $state<ProjectId | null>(null);
let selectedLayoutId = $state<LayoutId | null>(null);
let showProjectSettings = $state(false);
let showLayoutSettings = $state(false);
let isSidebarCollapsed = $state(false);

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
	<div class="flex flex-1 overflow-hidden">
		<div class="relative flex-shrink-0">
			<div
				class="h-full overflow-hidden transition-[width] duration-200 ease-out"
				class:w-64={!isSidebarCollapsed}
				class:w-0={isSidebarCollapsed}
			>
				<div
					class="w-64 h-full border-r border-border-default transition-transform duration-200 ease-out"
					class:translate-x-0={!isSidebarCollapsed}
					class:-translate-x-full={isSidebarCollapsed}
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
