<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import FileTreeItem from "./FileTreeItem.component.svelte";
import { FileTreeItemType, FileStatus } from "../fileTree.lib";

const { Story } = defineMeta({
	argTypes: {
		depth: {
			control: {
				max: 5,
				min: 0,
				type: "number",
			},
			description: "Indentation depth",
		},
		hasChildren: {
			control: "boolean",
			description: "Show chevron (for folders)",
		},
		isActive: {
			control: "boolean",
			description: "Pulsing indicator",
		},
		isExpanded: {
			control: "boolean",
			description: "Folder expanded state",
		},
		isLoading: {
			control: "boolean",
			description: "Show loading spinner",
		},
		isSelected: {
			control: "boolean",
			description: "Selected state",
		},
		meta: {
			control: "text",
			description: "Meta text (e.g., +24)",
		},
		name: {
			control: "text",
			description: "File or folder name",
		},
		status: {
			control: "select",
			description: "Git status",
			options: Object.values(FileStatus),
		},
		type: {
			control: "select",
			description: "Item type",
			options: Object.values(FileTreeItemType),
		},
	},
	component: FileTreeItem,
	parameters: {
		backgrounds: {
			default: "sidebar",
			values: [
				{
					name: "sidebar",
					value: "#0d0d14",
				},
			],
		},
	},
	tags: [
		"autodocs",
	],
	title: "FileTree/FileTreeItem",
});
</script>

{#snippet template(args: any)}
	<div class="w-[200px] bg-[#0d0d14] p-1">
		<FileTreeItem {...args} />
	</div>
{/snippet}

<Story
	name="File"
	args={{
		name: "scraper.ts",
		status: FileStatus.Clean,
		type: FileTreeItemType.File,
	}}
	{template}
/>

<Story
	name="FileModified"
	args={{
		isActive: true,
		meta: "+24",
		name: "fix-pagination.ts",
		status: FileStatus.Modified,
		type: FileTreeItemType.File,
	}}
	{template}
/>

<Story
	name="FileStaged"
	args={{
		meta: "+156",
		name: "add-retry-logic.ts",
		status: FileStatus.Staged,
		type: FileTreeItemType.File,
	}}
	{template}
/>

<Story
	name="FileUntracked"
	args={{
		name: "new-feature.ts",
		status: FileStatus.Untracked,
		type: FileTreeItemType.File,
	}}
	{template}
/>

<Story
	name="FileConflicted"
	args={{
		meta: "conflict",
		name: "merge-conflict.ts",
		status: FileStatus.Conflicted,
		type: FileTreeItemType.File,
	}}
	{template}
/>

<Story
	name="FolderCollapsed"
	args={{
		hasChildren: true,
		isExpanded: false,
		name: "web-scraper",
		status: FileStatus.Modified,
		type: FileTreeItemType.Folder,
	}}
	{template}
/>

<Story
	name="FolderExpanded"
	args={{
		hasChildren: true,
		isExpanded: true,
		name: "web-scraper",
		status: FileStatus.Modified,
		type: FileTreeItemType.Folder,
	}}
	{template}
/>

<Story
	name="FolderLoading"
	args={{
		isExpanded: true,
		isLoading: true,
		name: "api-backend",
		status: FileStatus.Clean,
		type: FileTreeItemType.Folder,
	}}
	{template}
/>

<Story
	name="Selected"
	args={{
		isSelected: true,
		meta: "+24",
		name: "fix-pagination.ts",
		status: FileStatus.Modified,
		type: FileTreeItemType.File,
	}}
	{template}
/>

<Story
	name="Nested"
	args={{
		depth: 2,
		name: "deeply-nested.ts",
		status: FileStatus.Staged,
		type: FileTreeItemType.File,
	}}
	{template}
/>
