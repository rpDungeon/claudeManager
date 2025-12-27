<!-- Review pending by Autumnlight -->
<!--
@component
name: LayoutSettingsModal
type: smart
styleguide: 1.0.0
description: Modal dialog for editing layout settings (name), duplicating, or deleting
usage: Use when user clicks settings button on layout selector
-->
<script lang="ts">
import type { LayoutId } from "@claude-manager/common/src/layout/layout.id";
import type { LayoutData } from "@claude-manager/common/src/layout/layout.types";
import { Dialog } from "bits-ui";
import { X, Trash2, Copy } from "lucide-svelte";
import { api } from "$lib/api/api.client";

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

interface Props {
	open?: boolean;
	layoutId: LayoutId | null;
	layoutName?: string;
	onClose?: () => void;
	onSave?: (data: { name: string }) => void;
	onDuplicate?: (newLayoutId: LayoutId) => void;
	onDelete?: () => void;
}

let { open = $bindable(false), layoutId, layoutName = "", onClose, onSave, onDuplicate, onDelete }: Props = $props();

let name = $state("");
let isSaving = $state(false);
let isDuplicating = $state(false);
let isDeleting = $state(false);
let showDeleteConfirm = $state(false);

$effect(() => {
	if (open) {
		name = layoutName ?? "";
		showDeleteConfirm = false;
	}
});

async function handleSave() {
	if (!(layoutId && name.trim())) return;

	isSaving = true;
	const response = await api
		.layouts({
			id: layoutId,
		})
		.patch({
			name: name.trim(),
		});

	if (!response.error) {
		onSave?.({
			name: name.trim(),
		});
		open = false;
		onClose?.();
	}
	isSaving = false;
}

async function handleDuplicate() {
	if (!layoutId) return;

	isDuplicating = true;

	const layoutResponse = await api
		.layouts({
			id: layoutId,
		})
		.get();
	if (layoutResponse.error || !layoutResponse.data) {
		isDuplicating = false;
		return;
	}

	const layout = layoutResponse.data;
	const response = await api.layouts.post({
		data: layout.data ?? defaultLayoutData,
		name: `${name.trim()} (Copy)`,
		projectId: layout.projectId,
	});

	if (!response.error && response.data) {
		onDuplicate?.(response.data.id as LayoutId);
		open = false;
		onClose?.();
	}
	isDuplicating = false;
}

async function handleDelete() {
	if (!layoutId) return;

	isDeleting = true;
	const response = await api
		.layouts({
			id: layoutId,
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
					Layout Settings
				</Dialog.Title>
				<Dialog.Close
					class="rounded p-1 text-text-tertiary hover:bg-bg-elevated hover:text-text-secondary transition-colors"
					onclick={handleClose}
				>
					<X class="size-4" />
				</Dialog.Close>
			</div>

			<Dialog.Description class="sr-only">
				Edit layout name, duplicate, or delete the layout
			</Dialog.Description>

			<div class="flex flex-col gap-4">
				<div class="flex flex-col gap-1.5">
					<label for="layout-name" class="text-[10px] uppercase tracking-wider text-text-tertiary">
						Name
					</label>
					<input
						id="layout-name"
						type="text"
						bind:value={name}
						class="w-full rounded border border-border-default bg-bg-void px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-terminal-green focus:outline-none"
						placeholder="Layout name"
					/>
				</div>

				<div class="flex flex-col gap-2">
					<button
						type="button"
						onclick={handleDuplicate}
						disabled={isDuplicating}
						class="flex items-center gap-2 rounded border border-border-default bg-bg-void px-3 py-2 text-xs text-text-secondary hover:bg-bg-elevated hover:text-text-primary disabled:opacity-50 transition-colors"
					>
						<Copy class="size-3.5" />
						{isDuplicating ? "Duplicating..." : "Duplicate Layout"}
					</button>
				</div>

				<div class="flex items-center justify-between pt-2 border-t border-border-default">
					{#if showDeleteConfirm}
						<div class="flex items-center gap-2">
							<span class="text-xs text-terminal-red">Delete this layout?</span>
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
							Delete Layout
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
								disabled={isSaving || !name.trim()}
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
