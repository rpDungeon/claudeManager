<!--
@component
name: Breadcrumbs
type: stupid
styleguide: 1.0.0
description: File path breadcrumbs for navigating to parent folders in the file explorer
usage: Place below editor tab to show file location and enable folder navigation
-->
<script lang="ts">
import { breadcrumbSegmentsFromPath, breadcrumbPathIsWithinProject, type BreadcrumbSegment } from "./breadcrumbs.lib";
import { breadcrumbsStore } from "./breadcrumbs.store.svelte";

interface Props {
	filePath: string;
	projectPath: string;
}

let { filePath, projectPath }: Props = $props();

const segments = $derived(breadcrumbSegmentsFromPath(filePath, projectPath));
const folderSegments = $derived(segments.filter((s) => !s.isFile));

function handleSegmentClick(segment: BreadcrumbSegment) {
	if (segment.isFile) return;

	if (!breadcrumbPathIsWithinProject(segment.path, projectPath)) {
		return;
	}

	breadcrumbsStore.requestExpand(segment.path);
}
</script>

{#if folderSegments.length > 0}
	<span class="flex items-center gap-0.5 overflow-hidden text-[9px]">
		{#each folderSegments as segment, _index (segment.path)}
			<button
				type="button"
				class="shrink-0 text-text-tertiary hover:text-terminal-green transition-colors"
				onclick={(e) => { e.stopPropagation(); handleSegmentClick(segment); }}
				title="Reveal in Explorer: {segment.path}"
			>
				{segment.name}
			</button>
			<span class="shrink-0 text-text-tertiary/50">›</span>
		{/each}
	</span>
{/if}
