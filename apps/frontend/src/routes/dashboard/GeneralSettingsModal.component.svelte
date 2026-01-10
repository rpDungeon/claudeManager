<!--
@component
name: GeneralSettingsModal
type: smart
styleguide: 1.0.0
description: Modal dialog for general application settings
usage: Use when user clicks settings gear icon in the status bar
-->
<script lang="ts">
import { Dialog } from "bits-ui";
import { X, Minus, Plus } from "lucide-svelte";
import { settings } from "$lib/settings/settings.service.svelte";
import { terminalInstancesSetFontSize } from "$lib/terminal/terminal.service.svelte";

interface Props {
	open?: boolean;
	onClose?: () => void;
}

let { open = $bindable(false), onClose }: Props = $props();

const MIN_FONT_SIZE = 6;
const MAX_FONT_SIZE = 24;

let fontSize = $state(settings.terminalFontSize);

$effect(() => {
	if (open) {
		fontSize = settings.terminalFontSize;
	}
});

function handleFontSizeChange(newSize: number) {
	const clampedSize = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, newSize));
	fontSize = clampedSize;
	settings.terminalFontSize = clampedSize;
	terminalInstancesSetFontSize(clampedSize);
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
				<Dialog.Title class="text-sm font-medium text-text-primary">Settings</Dialog.Title>
				<Dialog.Close
					class="rounded p-1 text-text-tertiary hover:bg-bg-elevated hover:text-text-secondary transition-colors"
					onclick={handleClose}
				>
					<X class="size-4" />
				</Dialog.Close>
			</div>

			<Dialog.Description class="sr-only">General application settings</Dialog.Description>

			<div class="flex flex-col gap-4">
				<div class="flex flex-col gap-1.5">
					<label for="terminal-font-size" class="text-[10px] uppercase tracking-wider text-text-tertiary">
						Terminal Zoom
					</label>
					<div class="flex items-center gap-3">
						<button
							type="button"
							onclick={() => handleFontSizeChange(fontSize - 1)}
							disabled={fontSize <= MIN_FONT_SIZE}
							class="flex size-7 items-center justify-center rounded border border-border-default bg-bg-void text-text-secondary hover:bg-bg-elevated hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
						>
							<Minus class="size-3.5" />
						</button>
						<input
							id="terminal-font-size"
							type="range"
							min={MIN_FONT_SIZE}
							max={MAX_FONT_SIZE}
							step="1"
							bind:value={fontSize}
							oninput={() => handleFontSizeChange(fontSize)}
							class="flex-1 h-1.5 appearance-none rounded bg-bg-void accent-terminal-green cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-terminal-green [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:size-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-terminal-green [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
						/>
						<button
							type="button"
							onclick={() => handleFontSizeChange(fontSize + 1)}
							disabled={fontSize >= MAX_FONT_SIZE}
							class="flex size-7 items-center justify-center rounded border border-border-default bg-bg-void text-text-secondary hover:bg-bg-elevated hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
						>
							<Plus class="size-3.5" />
						</button>
						<span class="w-8 text-right text-sm tabular-nums text-text-primary">{fontSize}px</span>
					</div>
				</div>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
