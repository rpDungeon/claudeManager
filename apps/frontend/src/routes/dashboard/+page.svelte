<!-- Review pending by Autumnlight -->
<script lang="ts">
import DashboardFileExplorer from "./DashboardFileExplorer.component.svelte";
import DashboardLayout from "./DashboardLayout.component.svelte";
import DashboardStatusBar from "./DashboardStatusBar.component.svelte";
</script>

<svelte:head>
	<title>Dashboard | Claude Manager</title>
</svelte:head>

<div class="flex h-screen w-screen flex-col bg-bg-void">
	<div class="flex flex-1 overflow-hidden">
		<div class="w-64 border-r border-border-default">
			<DashboardFileExplorer rootPath="/home/claude/dev/+vm/+ai/claudeManager/apps/experiments/test" />
			<!-- <DashboardFileExplorer rootPath="/home/claude/" /> -->
		</div>
		<div class="flex-1 min-w-0 overflow-hidden">
			<DashboardLayout />
		</div>
	</div>

	<DashboardStatusBar />
</div>
