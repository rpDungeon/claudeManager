export function fsPathNormalize(filePath: string, isDirectory: boolean): string {
	if (isDirectory && !filePath.endsWith("/")) {
		return `${filePath}/`;
	}
	if (!isDirectory && filePath.endsWith("/")) {
		return filePath.slice(0, -1);
	}
	return filePath;
}

export function fsPathEnsureTrailingSlash(dirPath: string): string {
	return dirPath.endsWith("/") ? dirPath : `${dirPath}/`;
}

export function fsPathRemoveTrailingSlash(filePath: string): string {
	return filePath.endsWith("/") ? filePath.slice(0, -1) : filePath;
}

export function fsPathParent(filePath: string): string {
	const normalized = fsPathRemoveTrailingSlash(filePath);
	const parentPath = normalized.substring(0, normalized.lastIndexOf("/"));
	return parentPath ? fsPathEnsureTrailingSlash(parentPath) : "";
}
