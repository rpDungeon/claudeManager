<!-- Review pending by Autumnlight -->
<!--
@component
name: ProjectSettingsModal
type: smart
styleguide: 1.0.0
description: Modal dialog for editing project settings (name, path) or deleting
usage: Use when user clicks settings button on project selector
-->
<script lang="ts">
import type { ProjectId } from "@claude-manager/common/src/project/project.id";
import { Dialog } from "bits-ui";
import { X, Trash2 } from "lucide-svelte";
import { api } from "$lib/api/api.client";
import PathInput from "$lib/pathInput/PathInput.component.svelte";

interface Props {
	open?: boolean;
	projectId: ProjectId | null;
	projectName?: string;
	projectPath?: string;
	onClose?: () => void;
	onSave?: (data: { name: string; path: string }) => void;
	onDelete?: () => void;
}

let {
	open = $bindable(false),
	projectId,
	projectName = "",
	projectPath = "",
	onClose,
	onSave,
	onDelete,
}: Props = $props();

let name = $state("");
let path = $state("");
let isSaving = $state(false);
let isDeleting = $state(false);
let showDeleteConfirm = $state(false);
let isPathValid = $state(true);

$effect(() => {
	if (open) {
		name = projectName ?? "";
		path = projectPath ?? "";
		showDeleteConfirm = false;
		isPathValid = true;
	}
});

async function handleSave() {
	if (!(projectId && name.trim() && isPathValid)) return;

	isSaving = true;
	const response = await api
		.projects({
			id: projectId,
		})
		.patch({
			name: name.trim(),
			path: path.trim(),
		});

	if (!response.error) {
		onSave?.({
			name: name.trim(),
			path: path.trim(),
		});
		open = false;
		onClose?.();
	}
	isSaving = false;
}

async function handleDelete() {
	if (!projectId) return;

	isDeleting = true;
	const response = await api
		.projects({
			id: projectId,
		})
		.delete();

	if (!response.error) {
		onDelete?.();
		open = false;
		onClose?.();
	}
	isDeleting = false;
}

function handleClose() {
	open = false;
	onClose?.();
}
</script>

<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay
			class="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
		/>
		<Dialog.Content
			class="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 border border-border-default bg-bg-surface p-4 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
		>
			<div class="flex items-center justify-between mb-4">
				<Dialog.Title class="text-sm font-medium text-text-primary">
					Project Settings
				</Dialog.Title>
				<Dialog.Close
					class="rounded p-1 text-text-tertiary hover:bg-bg-elevated hover:text-text-secondary transition-colors"
					onclick={handleClose}
				>
					<X class="size-4" />
				</Dialog.Close>
			</div>

			<Dialog.Description class="sr-only">
				Edit project name and path, or delete the project
			</Dialog.Description>

			<div class="flex flex-col gap-4">
				<div class="flex flex-col gap-1.5">
					<label for="project-name" class="text-[10px] uppercase tracking-wider text-text-tertiary">
						Name
					</label>
					<input
						id="project-name"
						type="text"
						bind:value={name}
						class="w-full rounded border border-border-default bg-bg-void px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-terminal-green focus:outline-none"
						placeholder="Project name"
					/>
				</div>

				<div class="flex flex-col gap-1.5">
					<label for="project-path" class="text-[10px] uppercase tracking-wider text-text-tertiary">
						Root Path
					</label>
					<PathInput
						bind:value={path}
						placeholder="/path/to/project"
						onvalidchange={(valid) => (isPathValid = valid)}
					/>
				</div>

				<div class="flex items-center justify-between pt-2 border-t border-border-default">
					{#if showDeleteConfirm}
						<div class="flex items-center gap-2">
							<span class="text-xs text-terminal-red">Delete this project?</span>
							<button
								type="button"
								onclick={handleDelete}
								disabled={isDeleting}
								class="rounded bg-terminal-red/20 px-3 py-1.5 text-xs font-medium text-terminal-red hover:bg-terminal-red/30 disabled:opacity-50 transition-colors"
							>
								{isDeleting ? "Deleting..." : "Confirm"}
							</button>
							<button
								type="button"
								onclick={() => (showDeleteConfirm = false)}
								class="rounded bg-bg-elevated px-3 py-1.5 text-xs text-text-secondary hover:bg-bg-void transition-colors"
							>
								Cancel
							</button>
						</div>
					{:else}
						<button
							type="button"
							onclick={() => (showDeleteConfirm = true)}
							class="flex items-center gap-1.5 rounded px-2 py-1.5 text-xs text-terminal-red hover:bg-terminal-red/10 transition-colors"
						>
							<Trash2 class="size-3.5" />
							Delete Project
						</button>
					{/if}

					{#if !showDeleteConfirm}
						<div class="flex gap-2">
							<button
								type="button"
								onclick={handleClose}
								class="rounded bg-bg-elevated px-4 py-1.5 text-xs text-text-secondary hover:bg-bg-void transition-colors"
							>
								Cancel
							</button>
							<button
								type="button"
								onclick={handleSave}
								disabled={isSaving || !name.trim() || !isPathValid}
								class="rounded bg-terminal-green/20 px-4 py-1.5 text-xs font-medium text-terminal-green hover:bg-terminal-green/30 disabled:opacity-50 transition-colors"
							>
								{isSaving ? "Saving..." : "Save"}
							</button>
						</div>
					{/if}
				</div>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
