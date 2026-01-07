export interface BreadcrumbSegment {
	name: string;
	path: string;
	isFile: boolean;
}

export function breadcrumbSegmentsFromPath(filePath: string, projectPath: string): BreadcrumbSegment[] {
	const normalizedProjectPath = projectPath.endsWith("/") ? projectPath.slice(0, -1) : projectPath;

	if (!filePath.startsWith(normalizedProjectPath)) {
		return [];
	}

	const relativePath = filePath.slice(normalizedProjectPath.length);
	const parts = relativePath.split("/").filter(Boolean);

	if (parts.length === 0) {
		return [];
	}

	const segments: BreadcrumbSegment[] = [];
	let currentPath = normalizedProjectPath;

	for (let i = 0; i < parts.length; i++) {
		const part = parts[i];
		currentPath = `${currentPath}/${part}`;
		const isFile = i === parts.length - 1;

		segments.push({
			isFile,
			name: part,
			path: isFile ? currentPath : `${currentPath}/`,
		});
	}

	return segments;
}

export function breadcrumbPathIsWithinProject(path: string, projectPath: string): boolean {
	const normalizedProjectPath = projectPath.endsWith("/") ? projectPath.slice(0, -1) : projectPath;
	const normalizedPath = path.endsWith("/") ? path.slice(0, -1) : path;

	return normalizedPath.startsWith(normalizedProjectPath);
}
