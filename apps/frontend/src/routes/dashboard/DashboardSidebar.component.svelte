<!-- Review pending by Autumnlight -->
<!--
@component
name: DashboardSidebar
type: smart
styleguide: 1.0.0
description: Dashboard sidebar with project/layout selectors and file explorer
usage: Use as the left sidebar in the dashboard containing all navigation controls
-->
<script lang="ts">
import type { LayoutId } from "@claude-manager/common/src/layout/layout.id";
import type { LayoutData } from "@claude-manager/common/src/layout/layout.types";
import type { ProjectId } from "@claude-manager/common/src/project/project.id";
import { onMount } from "svelte";
import { api } from "$lib/api/api.client";
import DashboardFileExplorer from "./DashboardFileExplorer.component.svelte";
import DashboardGitPanel from "./DashboardGitPanel.component.svelte";
import DashboardSelector from "./DashboardSelector.component.svelte";

type SidebarTab = "files" | "git";

const defaultLayoutData: LayoutData = {
	desktop: {
		containers: {},
		rootId: null,
	},
	items: {},
	mobile: {
		containers: {},
		rootId: null,
	},
};

interface Project {
	id: ProjectId;
	name: string;
	path: string;
}

interface Layout {
	id: LayoutId;
	name: string;
	projectId: ProjectId;
}

interface Props {
	selectedProjectId?: ProjectId | null;
	selectedLayoutId?: LayoutId | null;
	onProjectChange?: (projectId: ProjectId | null, projectPath: string | null) => void;
	onLayoutChange?: (layoutId: LayoutId | null) => void;
	onProjectSettingsClick?: (projectId: ProjectId, name: string, path: string) => void;
	onLayoutSettingsClick?: (layoutId: LayoutId, name: string) => void;
	onFileOpen?: (filePath: string) => void;
}

let {
	selectedProjectId = $bindable(null),
	selectedLayoutId = $bindable(null),
	onProjectChange,
	onLayoutChange,
	onProjectSettingsClick,
	onLayoutSettingsClick,
	onFileOpen,
}: Props = $props();

export async function refresh() {
	await Promise.all([
		loadProjects(),
		loadLayouts(),
	]);
}

let projects = $state<Project[]>([]);
let layouts = $state<Layout[]>([]);
let isLoadingProjects = $state(true);
let isLoadingLayouts = $state(false);
let activeTab = $state<SidebarTab>("files");

const selectedProject = $derived(projects.find((p) => p.id === selectedProjectId));

const projectOptions = $derived(
	projects.map((p) => ({
		label: p.name,
		value: p.id,
	})),
);

const layoutOptions = $derived(
	layouts
		.filter((l) => l.projectId === selectedProjectId)
		.map((l) => ({
			label: l.name,
			value: l.id,
		})),
);

async function loadProjects() {
	isLoadingProjects = true;
	const response = await api.projects.get();
	if (!response.error && response.data) {
		projects = response.data as Project[];
		if (projects.length > 0 && !selectedProjectId) {
			selectedProjectId = projects[0].id;
			onProjectChange?.(projects[0].id, projects[0].path);
		}
	}
	isLoadingProjects = false;
}

async function loadLayouts() {
	isLoadingLayouts = true;
	const response = await api.layouts.get();
	if (!response.error && response.data) {
		layouts = response.data as Layout[];
		const projectLayouts = layouts.filter((l) => l.projectId === selectedProjectId);
		if (projectLayouts.length > 0 && !selectedLayoutId) {
			selectedLayoutId = projectLayouts[0].id;
			onLayoutChange?.(projectLayouts[0].id);
		}
	}
	isLoadingLayouts = false;
}

async function handleAddProject() {
	const response = await api.projects.post({
		name: `Project ${projects.length + 1}`,
		path: "/home/claude",
	});
	if (!response.error && response.data) {
		const newProject = response.data as Project;
		projects = [
			...projects,
			newProject,
		];
		selectedProjectId = newProject.id;
		onProjectChange?.(newProject.id, newProject.path);
	}
}

async function handleAddLayout() {
	if (!selectedProjectId) return;

	const projectLayouts = layouts.filter((l) => l.projectId === selectedProjectId);
	const response = await api.layouts.post({
		data: defaultLayoutData,
		name: `Layout ${projectLayouts.length + 1}`,
		projectId: selectedProjectId,
	});
	if (!response.error && response.data) {
		const newLayout = response.data as Layout;
		layouts = [
			...layouts,
			newLayout,
		];
		selectedLayoutId = newLayout.id;
		onLayoutChange?.(newLayout.id);
	}
}

function handleProjectChange(projectId: ProjectId) {
	selectedProjectId = projectId;
	const project = projects.find((p) => p.id === projectId);
	onProjectChange?.(projectId, project?.path ?? null);

	const projectLayouts = layouts.filter((l) => l.projectId === projectId);
	if (projectLayouts.length > 0) {
		selectedLayoutId = projectLayouts[0].id;
		onLayoutChange?.(projectLayouts[0].id);
	} else {
		selectedLayoutId = null;
		onLayoutChange?.(null);
	}
}

function handleLayoutChange(layoutId: LayoutId) {
	selectedLayoutId = layoutId;
	onLayoutChange?.(layoutId);
}

function handleProjectSettings() {
	if (selectedProjectId && selectedProject) {
		onProjectSettingsClick?.(selectedProjectId, selectedProject.name, selectedProject.path);
	}
}

function handleLayoutSettings() {
	if (selectedLayoutId) {
		const layout = layouts.find((l) => l.id === selectedLayoutId);
		if (layout) {
			onLayoutSettingsClick?.(selectedLayoutId, layout.name);
		}
	}
}

onMount(() => {
	void loadProjects().then(() => loadLayouts());
});
</script>

<div class="flex h-full flex-col">
	<div class="flex flex-col gap-1 border-b border-border-default py-2">
		<DashboardSelector
			bind:value={selectedProjectId}
			options={projectOptions}
			placeholder={isLoadingProjects ? "Loading..." : "Select project"}
			disabled={isLoadingProjects}
			onchange={handleProjectChange}
			onAddClick={handleAddProject}
			onSettingsClick={handleProjectSettings}
		/>
		<DashboardSelector
			bind:value={selectedLayoutId}
			options={layoutOptions}
			placeholder={isLoadingLayouts ? "Loading..." : "Select layout"}
			disabled={isLoadingLayouts || !selectedProjectId}
			onchange={handleLayoutChange}
			onAddClick={selectedProjectId ? handleAddLayout : undefined}
			onSettingsClick={handleLayoutSettings}
		/>
	</div>

	<div class="flex border-b border-border-default">
		<button
			type="button"
			onclick={() => (activeTab = "files")}
			class="flex-1 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider transition-colors
				{activeTab === 'files'
				? 'bg-bg-elevated border-b-2 border-terminal-green text-text-primary -mb-px'
				: 'text-text-tertiary hover:text-text-secondary'}"
		>
			Files
		</button>
		<button
			type="button"
			onclick={() => (activeTab = "git")}
			class="flex-1 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider transition-colors
				{activeTab === 'git'
				? 'bg-bg-elevated border-b-2 border-terminal-green text-text-primary -mb-px'
				: 'text-text-tertiary hover:text-text-secondary'}"
		>
			Git
		</button>
	</div>

	<div class="flex-1 overflow-hidden">
		{#if !selectedProject}
			<div class="flex h-full items-center justify-center text-[10px] text-text-tertiary">
				Select a project
			</div>
		{:else if activeTab === "files"}
			<DashboardFileExplorer rootPath={selectedProject.path} {onFileOpen} />
		{:else}
			<DashboardGitPanel rootPath={selectedProject.path} />
		{/if}
	</div>
</div>
