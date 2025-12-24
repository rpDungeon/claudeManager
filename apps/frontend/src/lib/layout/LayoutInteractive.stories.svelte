<!-- Review pending by Autumnlight -->
<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import LayoutInteractiveDemo from "./_LayoutInteractiveDemo.svelte";

const { Story } = defineMeta({
	component: LayoutInteractiveDemo,
	parameters: {
		backgrounds: {
			default: "void",
			values: [
				{
					name: "void",
					value: "#0a0a0a",
				},
			],
		},
		layout: "fullscreen",
	},
	tags: [
		"autodocs",
	],
	title: "Layout/Interactive Demo",
});
</script>

<Story name="Drag and Drop Tabs">
	<div class="h-screen w-screen">
		<LayoutInteractiveDemo />
	</div>
</Story>
