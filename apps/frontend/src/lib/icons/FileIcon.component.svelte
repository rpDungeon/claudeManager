<!--
@component
name: FileIcon
type: stupid
styleguide: 1.0.0
description: Renders file/folder icon based on filename using VSCode Symbols theme
usage: Used in file trees and explorers to display appropriate icons for files and folders
-->
<script lang="ts">
import { fileIconResolve, fileIconPathGet } from "./fileIcon.resolver";

interface Props {
	filename: string;
	isFolder?: boolean;
	size?: number;
}

let { filename, isFolder = false, size = 16 }: Props = $props();

const iconId = $derived(fileIconResolve(filename, isFolder));
const iconPath = $derived(fileIconPathGet(iconId, isFolder));
</script>

<img src={iconPath} alt="" width={size} height={size} class="shrink-0" />
