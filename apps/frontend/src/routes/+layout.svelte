<script lang="ts">
import { browser } from "$app/environment";
import { goto } from "$app/navigation";
import { page } from "$app/stores";
import { api } from "$lib/api/api.client";
import fontLicenseUrl from "$lib/assets/fonts/LICENSE.txt?url";
import "$lib/assets/fonts/blex-mono-nerd-font-mono.css";
import "./layout.css";
import favicon from "$lib/assets/favicon.svg";
import { onMount } from "svelte";
import { appViewportTrack } from "$lib/viewport/appViewport";

let { children } = $props();
let isCheckingAuth = $state(true);
let isAuthenticated = $state(false);

onMount(appViewportTrack);

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
	<link rel="license" href={fontLicenseUrl} />
</svelte:head>

<div class="app-viewport">
	{#if isCheckingAuth}
		<div class="flex h-full w-full min-w-0 items-center justify-center bg-bg-void">
			<div class="font-mono text-xs text-text-tertiary">Verifying session...</div>
		</div>
	{:else if isAuthenticated}
		{@render children()}
	{/if}
</div>
