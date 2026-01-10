<!--
@component
name: GitPanel
type: stupid
styleguide: 1.0.0
description: Git panel displaying staged/unstaged changes with commit functionality
usage: Used by DashboardGitPanel to display git status and actions
-->
<script lang="ts">
import type { GitStatus } from "@claude-manager/common/src/git/git.types";
import GitStatusHeader from "./_GitStatusHeader.svelte";
import GitFileGroup from "./_GitFileGroup.svelte";
import GitCommitBox from "./_GitCommitBox.svelte";
import { GitFileArea, gitFilesGroupByArea, GIT_AREA_LABELS } from "./gitPanel.lib";

interface Props {
	status: GitStatus | null;
	isConnected?: boolean;
	isLoading?: boolean;
	error?: string | null;
	onStage?: (filePath: string) => void;
	onUnstage?: (filePath: string) => void;
	onCommit?: (message: string) => void;
	onFileClick?: (filePath: string, area: GitFileArea) => void;
}

let {
	status,
	isConnected = false,
	isLoading = false,
	error = null,
	onStage,
	onUnstage,
	onCommit,
	onFileClick,
}: Props = $props();

const groupedFiles = $derived(status ? gitFilesGroupByArea(status.files) : null);
const hasStagedChanges = $derived((groupedFiles?.[GitFileArea.Staged]?.length ?? 0) > 0);
</script>

<div class="flex h-full flex-col bg-bg-surface">
	<GitStatusHeader
		branch={status?.branch ?? null}
		ahead={status?.ahead ?? 0}
		behind={status?.behind ?? 0}
		{isConnected}
	/>

	<div class="flex-1 overflow-auto">
		{#if isLoading}
			<div class="flex h-full items-center justify-center text-text-tertiary text-[11px]">
				Loading...
			</div>
		{:else if error}
			<div class="flex h-full items-center justify-center text-terminal-red text-[11px] px-4 text-center">
				{error}
			</div>
		{:else if !status}
			<div class="flex h-full items-center justify-center text-text-tertiary text-[11px]">
				No repository detected
			</div>
		{:else if status.files.length === 0}
			<div class="flex h-full items-center justify-center text-text-tertiary text-[11px]">
				No changes
			</div>
		{:else if groupedFiles}
			<GitFileGroup
				title={GIT_AREA_LABELS[GitFileArea.Staged]}
				files={groupedFiles[GitFileArea.Staged]}
				area={GitFileArea.Staged}
				{onUnstage}
				{onFileClick}
			/>
			<GitFileGroup
				title={GIT_AREA_LABELS[GitFileArea.Unstaged]}
				files={groupedFiles[GitFileArea.Unstaged]}
				area={GitFileArea.Unstaged}
				{onStage}
				{onFileClick}
			/>
			<GitFileGroup
				title={GIT_AREA_LABELS[GitFileArea.Untracked]}
				files={groupedFiles[GitFileArea.Untracked]}
				area={GitFileArea.Untracked}
				{onStage}
				{onFileClick}
			/>
		{/if}
	</div>

	<GitCommitBox {onCommit} disabled={!hasStagedChanges} />
</div>
