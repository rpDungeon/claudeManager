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

let sidebarRef:
	| {
			refresh: () => Promise<void>;
	  }
	| undefined = $state();

let projectName = $state("");
let projectPath = $state("");
let layoutName = $state("");

function handleProjectChange(projectId: ProjectId | null) {
	selectedProjectId = projectId;
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
</script>

<svelte:head>
	<title>Dashboard | Claude Manager</title>
</svelte:head>

<div class="flex h-screen w-screen flex-col bg-bg-void">
	<div class="flex flex-1 overflow-hidden">
		<div class="w-64 border-r border-border-default">
			<DashboardSidebar
				bind:this={sidebarRef}
				bind:selectedProjectId
				bind:selectedLayoutId
				onProjectChange={handleProjectChange}
				onLayoutChange={handleLayoutChange}
				onProjectSettingsClick={handleProjectSettingsClick}
				onLayoutSettingsClick={handleLayoutSettingsClick}
			/>
		</div>
		<div class="flex-1 min-w-0 overflow-hidden">
			<DashboardLayout layoutId={selectedLayoutId} />
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
