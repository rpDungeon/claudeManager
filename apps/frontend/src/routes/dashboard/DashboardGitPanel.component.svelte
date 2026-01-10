<!--
@component
name: DashboardGitPanel
type: smart
styleguide: 1.0.0
description: Git panel with WebSocket connection for real-time git status
usage: Place in dashboard sidebar to manage git changes
-->
<script lang="ts">
import { onMount } from "svelte";
import GitPanel from "$lib/git/GitPanel.component.svelte";
import { GitFileArea } from "$lib/git/gitPanel.lib";
import { gitStore } from "$lib/git/gitStore.svelte";
import { api } from "$lib/api/api.client";

interface Props {
	rootPath?: string;
	onDiffOpen?: (filePath: string, repoPath: string, staged: boolean) => void;
}

let { rootPath = "/home/claude/dev/+vm/+ai/claudeManager", onDiffOpen }: Props = $props();

const normalizedRepoPath = $derived(rootPath.endsWith("/") ? rootPath.slice(0, -1) : rootPath);

onMount(() => {
	gitStore.connect(normalizedRepoPath);

	return () => {
		gitStore.disconnect();
	};
});

async function handleStage(filePath: string) {
	try {
		await api.git.stage.post({
			files: [
				filePath,
			],
			path: normalizedRepoPath,
		});
	} catch (err) {
		console.error("[GitPanel] Failed to stage file:", err);
	}
}

async function handleUnstage(filePath: string) {
	try {
		await api.git.unstage.post({
			files: [
				filePath,
			],
			path: normalizedRepoPath,
		});
	} catch (err) {
		console.error("[GitPanel] Failed to unstage file:", err);
	}
}

async function handleCommit(message: string) {
	try {
		await api.git.commit.post({
			message,
			path: normalizedRepoPath,
		});
	} catch (err) {
		console.error("[GitPanel] Failed to commit:", err);
	}
}

function handleFileClick(filePath: string, area: GitFileArea) {
	if (area === GitFileArea.Untracked) {
		return;
	}

	const staged = area === GitFileArea.Staged;
	onDiffOpen?.(filePath, normalizedRepoPath, staged);
}
</script>

<GitPanel
	status={gitStore.rawStatus}
	isConnected={gitStore.isConnected}
	isLoading={gitStore.isLoading}
	error={gitStore.error}
	onStage={handleStage}
	onUnstage={handleUnstage}
	onCommit={handleCommit}
	onFileClick={handleFileClick}
/>
