<!--
@component
name: LayoutCreateModal
type: smart
styleguide: 1.0.0
description: Modal dialog for creating a new layout with name
usage: Use when user clicks + button on layout selector
-->
<script lang="ts">
import type { LayoutId } from "@claude-manager/common/src/layout/layout.id";
import type { LayoutData } from "@claude-manager/common/src/layout/layout.types";
import type { ProjectId } from "@claude-manager/common/src/project/project.id";
import { Dialog } from "bits-ui";
import { X } from "lucide-svelte";
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

interface Layout {
	id: LayoutId;
	name: string;
	projectId: ProjectId;
}

interface Props {
	open?: boolean;
	projectId: ProjectId | null;
	onClose?: () => void;
	onCreate?: (layout: Layout) => void;
}

let { open = $bindable(false), projectId, onClose, onCreate }: Props = $props();

let name = $state("");
let isCreating = $state(false);

$effect(() => {
	if (open) {
		name = "";
	}
});

async function handleCreate() {
	if (!(projectId && name.trim())) return;

	isCreating = true;
	const response = await api.layouts.post({
		data: defaultLayoutData,
		name: name.trim(),
		projectId,
	});

	if (!response.error && response.data) {
		const newLayout = response.data as Layout;
		onCreate?.(newLayout);
		open = false;
		onClose?.();
	}
	isCreating = false;
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
					New Layout
				</Dialog.Title>
				<Dialog.Close
					class="rounded p-1 text-text-tertiary hover:bg-bg-elevated hover:text-text-secondary transition-colors"
					onclick={handleClose}
				>
					<X class="size-4" />
				</Dialog.Close>
			</div>

			<Dialog.Description class="sr-only">
				Create a new layout with a name
			</Dialog.Description>

			<form
				class="flex flex-col gap-4"
				onsubmit={(e) => {
					e.preventDefault();
					handleCreate();
				}}
			>
				<div class="flex flex-col gap-1.5">
					<label for="layout-name" class="text-[10px] uppercase tracking-wider text-text-tertiary">
						Name
					</label>
					<input
						id="layout-name"
						type="text"
						bind:value={name}
						class="w-full rounded border border-border-default bg-bg-void px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-terminal-green focus:outline-none"
						placeholder="My Layout"
					/>
				</div>

				<div class="flex justify-end gap-2 pt-2 border-t border-border-default">
					<button
						type="button"
						onclick={handleClose}
						class="rounded bg-bg-elevated px-4 py-1.5 text-xs text-text-secondary hover:bg-bg-void transition-colors"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={isCreating || !name.trim()}
						class="rounded bg-terminal-green/20 px-4 py-1.5 text-xs font-medium text-terminal-green hover:bg-terminal-green/30 disabled:opacity-50 transition-colors"
					>
						{isCreating ? "Creating..." : "Create"}
					</button>
				</div>
			</form>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
