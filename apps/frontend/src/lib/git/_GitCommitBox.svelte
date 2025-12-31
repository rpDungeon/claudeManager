<script lang="ts">
import { Check } from "lucide-svelte";

interface Props {
	onCommit?: (message: string) => void;
	disabled?: boolean;
}

let { onCommit, disabled = false }: Props = $props();

let message = $state("");
let isSubmitting = $state(false);

async function handleSubmit() {
	if (!message.trim() || isSubmitting || disabled) return;
	isSubmitting = true;
	try {
		await onCommit?.(message.trim());
		message = "";
	} finally {
		isSubmitting = false;
	}
}

function handleKeydown(event: KeyboardEvent) {
	if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
		handleSubmit();
	}
}
</script>

<div class="flex flex-col gap-2 border-t border-border-default p-3">
	<textarea
		bind:value={message}
		onkeydown={handleKeydown}
		placeholder="Commit message..."
		disabled={disabled || isSubmitting}
		rows="3"
		class="w-full resize-none rounded border border-border-default bg-bg-elevated px-2 py-1.5 text-[11px] text-text-primary placeholder:text-text-tertiary focus:border-terminal-green focus:outline-none disabled:opacity-50"
	></textarea>
	<button
		type="button"
		onclick={handleSubmit}
		disabled={!message.trim() || disabled || isSubmitting}
		class="flex items-center justify-center gap-1.5 rounded border border-border-default bg-bg-elevated px-3 py-1.5 text-[11px] font-medium text-text-primary transition-colors hover:border-terminal-green hover:text-terminal-green disabled:cursor-not-allowed disabled:opacity-30"
	>
		<Check class="size-3.5" />
		{isSubmitting ? "Committing..." : "Commit"}
	</button>
	<span class="text-[9px] text-text-tertiary text-center">
		Ctrl+Enter to commit
	</span>
</div>
