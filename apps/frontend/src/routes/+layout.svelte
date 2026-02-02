<script lang="ts">
import { browser } from "$app/environment";
import { goto } from "$app/navigation";
import { page } from "$app/stores";
import { api } from "$lib/api/api.client";
import "$lib/assets/fonts/ibm-plex-mono.css";
import "./layout.css";
import favicon from "$lib/assets/favicon.svg";

let { children } = $props();
let isCheckingAuth = $state(true);
let isAuthenticated = $state(false);

$effect(() => {
	if (!browser) return;

	const currentPath = $page.url.pathname;
	if (currentPath === "/login") {
		isCheckingAuth = false;
		isAuthenticated = true;
		return;
	}

	const token = localStorage.getItem("auth_token");
	if (!token) {
		goto("/login");
		return;
	}

	api.auth.verify.get().then((response) => {
		if (response.error || !response.data?.authenticated) {
			localStorage.removeItem("auth_token");
			goto("/login");
		} else {
			isAuthenticated = true;
		}
		isCheckingAuth = false;
	});
});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if isCheckingAuth}
	<div class="flex h-[100dvh] w-screen items-center justify-center bg-bg-void">
		<div class="font-mono text-xs text-text-tertiary">Verifying session...</div>
	</div>
{:else if isAuthenticated}
	{@render children()}
{/if}
