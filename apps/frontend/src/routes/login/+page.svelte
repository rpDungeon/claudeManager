<script lang="ts">
import { goto } from "$app/navigation";
import { api } from "$lib/api/api.client";

let password = $state("");
let error = $state("");
let isLoading = $state(false);

async function handleSubmit(event: SubmitEvent) {
	event.preventDefault();
	error = "";
	isLoading = true;

	try {
		const response = await api.auth.login.post({
			password,
		});

		if (response.error) {
			error = "Invalid password";
			return;
		}

		if (response.data?.token) {
			localStorage.setItem("auth_token", response.data.token);
			await goto("/dashboard");
		}
	} catch {
		error = "Connection error";
	} finally {
		isLoading = false;
	}
}
</script>

<svelte:head>
	<title>Login | Claude Manager</title>
</svelte:head>

<div class="flex h-[100dvh] w-screen items-center justify-center bg-bg-void">
	<div class="w-full max-w-sm p-6">
		<div class="border border-border-default bg-bg-surface p-6">
			<div class="mb-6 border-b border-border-default pb-3">
				<h1 class="font-mono text-sm text-terminal-green">
					<span class="opacity-50">$</span> claude-manager
				</h1>
				<p class="mt-1 font-mono text-[10px] text-text-tertiary">
					Authentication required
				</p>
			</div>

			<form onsubmit={handleSubmit} class="space-y-4">
				<div>
					<label for="password" class="block font-mono text-[10px] text-text-secondary">
						MASTER_PASSWORD
					</label>
					<input
						id="password"
						type="password"
						bind:value={password}
						disabled={isLoading}
						autocomplete="current-password"
						class="mt-1 w-full border border-border-default bg-bg-void px-3 py-2 font-mono text-xs text-text-primary outline-none transition-colors focus:border-terminal-green disabled:opacity-50"
						placeholder="Enter password..."
					/>
				</div>

				{#if error}
					<div class="font-mono text-[10px] text-terminal-red">
						<span class="opacity-50">ERROR:</span> {error}
					</div>
				{/if}

				<button
					type="submit"
					disabled={isLoading || !password}
					class="w-full border border-terminal-green bg-terminal-green/10 px-4 py-2 font-mono text-xs text-terminal-green transition-colors hover:bg-terminal-green/20 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{isLoading ? "Authenticating..." : "Login"}
				</button>
			</form>

			<div class="mt-6 border-t border-border-default pt-3">
				<p class="font-mono text-[9px] text-text-tertiary">
					Session expires in 7 days
				</p>
			</div>
		</div>
	</div>
</div>
